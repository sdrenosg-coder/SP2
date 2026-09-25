import { db } from '../db/index.js';
import { appointments, appointmentItems, messageLog } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { sendReminder } from '../services/notificationService.js';
import { DateTime } from 'luxon';

export async function runReminderChecks() {
  const now = DateTime.now().toUTC();
  const twoHoursFromNow = now.plus({ hours: 2 }).toISO();
  const twentyFourHoursFromNow = now.plus({ hours: 24 }).toISO();

  const dueAppointments = await db.select({
    appointmentId: appointments.id,
    businessId: appointments.businessId,
    clientId: appointments.clientId,
    startAt: appointmentItems.startAt,
  })
  .from(appointmentItems)
  .innerJoin(appointments, eq(appointmentItems.appointmentId, appointments.id))
  .where(and(
    eq(appointments.status, 'booked'),
    sql`(${appointmentItems.startAt} BETWEEN ${now.toISO()} AND ${twoHoursFromNow} OR ${appointmentItems.startAt} BETWEEN ${now.toISO()} AND ${twentyFourHoursFromNow})`
  ));

  for (const appt of dueAppointments) {
    const hoursBefore = Math.round(DateTime.fromISO(appt.startAt).diff(now, 'hours').hours);
    if (hoursBefore === 2 || hoursBefore === 24) {
      const log = await db.select().from(messageLog).where(and(
        eq(messageLog.appointmentId, appt.appointmentId),
        eq(messageLog.type, `reminder_${hoursBefore}h`)
      )).limit(1);
      if (log.length === 0) {
        await sendReminder({ businessId: appt.businessId, clientId: appt.clientId, appointmentId: appt.appointmentId, hoursBefore });
      }
    }
  }
}
