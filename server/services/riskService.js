import { db } from '../db/index.js';
import { clients, appointments } from '../db/schema.js';
import { eq, and, count } from 'drizzle-orm';

export async function getClientRiskScore(businessId, clientId) {
  const client = await db.select().from(clients).where(and(eq(clients.id, clientId), eq(clients.businessId, businessId))).limit(1);
  if (!client.length) return 0;
  const c = client[0];
  const noShowWeight = Math.min(c.noShowCount * 30, 60);
  const completedAppts = await db.select({ count: count() })
    .from(appointments)
    .where(and(eq(appointments.clientId, clientId), eq(appointments.status, 'completed')));
  const isFirstVisit = completedAppts[0].count === 0 ? 15 : 0;
  const score = Math.min(noShowWeight + isFirstVisit, 100);
  return Math.round(score);
}
