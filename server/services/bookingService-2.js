import { db, pool } from '../db/index.js';
import { appointments, appointmentItems, clients, services, staff, businesses } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { sendBookingConfirmation } from './notificationService.js';
import { getClientRiskScore } from './riskService.js';

export async function createAppointment({ businessId, clientId, serviceId, staffId, startAt, source = 'widget', addOns = [] }) {
  const business = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  if (!business.length) throw new Error('Business not found');
  const timezone = business[0].timezone;

  const client = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.businessId, businessId))).limit(1);
  if (!client.length) throw new Error('Client not found');

  const service = await db.select().from(services).where(eq(services.id, serviceId)).limit(1);
  if (!service.length) throw new Error('Service not found');
  const srv = service[0];

  const selectedStaff = await db.select().from(staff).where(and(eq(staff.id, staffId), eq(staff.businessId, businessId))).limit(1);
  if (!selectedStaff.length) throw new Error('Staff not found');

  const startUtc = DateTime.fromISO(startAt, { zone: timezone }).toUTC();
  const endUtc = startUtc.plus({ minutes: srv.durationMinutes });

  const conflict = await db.select().from(appointmentItems).where(and(
    eq(appointmentItems.staffId, staffId),
    sql`tstzrange(${startUtc.toISO()}, ${endUtc.toISO()}) && tstzrange(start_at, end_at)`
  ));
  if (conflict.length > 0) throw new Error('Slot is no longer available');

  const riskScore = await getClientRiskScore(businessId, clientId);
  const needsDeposit = riskScore >= 70 && srv.depositRequired;

  const clientConn = await pool.connect();
  try {
    await clientConn.query('BEGIN');
    const apptRes = await clientConn.query(
      `INSERT INTO appointments (business_id, location_id, client_id, status, source)
       VALUES ($1, (SELECT id FROM locations WHERE business_id = $1 LIMIT 1), $2, 'booked', $3) RETURNING id`,
      [businessId, clientId, source],
    );
    const appointmentId = apptRes.rows[0].id;
    await clientConn.query(
      `INSERT INTO appointment_items (appointment_id, service_id, staff_id, start_at, end_at, price, add_ons)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [appointmentId, serviceId, staffId, startUtc.toISO(), endUtc.toISO(), srv.price, JSON.stringify(addOns)],
    );
    await clientConn.query('COMMIT');
    clientConn.release();

    await sendBookingConfirmation({ businessId, clientId, appointmentId });
    return { appointmentId, startAt: startUtc.toISO(), endAt: endUtc.toISO(), needsDeposit };
  } catch (err) {
    await clientConn.query('ROLLBACK');
    clientConn.release();
    throw err;
  }
}

export async function cancelAppointment(appointmentId) {
  await db.update(appointments).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(appointments.id, appointmentId));
}

export async function rescheduleAppointment(appointmentId, newStartAt, newStaffId) {
  const item = await db.select().from(appointmentItems).where(eq(appointmentItems.appointmentId, appointmentId)).limit(1);
  if (!item.length) throw new Error('Appointment not found');
  const srv = await db.select().from(services).where(eq(services.id, item[0].serviceId)).limit(1);
  const newStartUtc = DateTime.fromISO(newStartAt).toUTC();
  const newEndUtc = newStartUtc.plus({ minutes: srv[0].durationMinutes });
  await db.update(appointmentItems)
    .set({ startAt: newStartUtc.toISO(), endAt: newEndUtc.toISO(), staffId: newStaffId })
    .where(eq(appointmentItems.id, item[0].id));
  return { success: true };
}
