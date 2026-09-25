import { db } from '../db/index.js';
import { appointments, appointmentItems, services, messageLog } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { sendRebookNudge } from '../services/notificationService.js';

export async function runRebookNudges() {
  const candidates = await db.select({
    appointmentId: appointments.id,
    businessId: appointments.businessId,
    clientId: appointments.clientId,
    serviceId: appointmentItems.serviceId,
    rebookInterval: services.rebookIntervalDays,
  })
  .from(appointments)
  .innerJoin(appointmentItems, eq(appointments.id, appointmentItems.appointmentId))
  .innerJoin(services, eq(appointmentItems.serviceId, services.id))
  .where(and(
    eq(appointments.status, 'completed'),
    sql`${services.rebookIntervalDays} IS NOT NULL`,
    sql`${appointments.updatedAt} <= now() - (${services.rebookIntervalDays} || ' days')::interval`,
  ));

  for (const c of candidates) {
    const log = await db.select().from(messageLog).where(and(
      eq(messageLog.appointmentId, c.appointmentId),
      eq(messageLog.type, 'rebook_nudge')
    )).limit(1);
    if (log.length === 0) {
      await sendRebookNudge({ businessId: c.businessId, clientId: c.clientId, appointmentId: c.appointmentId });
    }
  }
}
