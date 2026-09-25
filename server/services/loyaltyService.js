import { db } from '../db/index.js';
import { loyaltyTransactions, clients } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function awardPoints({ businessId, clientId, points, reason, appointmentId = null }) {
  await db.insert(loyaltyTransactions).values({ businessId, clientId, points, reason, appointmentId });
  const client = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
  if (client.length) {
    await db.update(clients).set({ loyaltyPoints: client[0].loyaltyPoints + points }).where(eq(clients.id, clientId));
  }
  return { success: true };
}

export async function redeemPoints({ businessId, clientId, points, reason }) {
  await awardPoints({ businessId, clientId, points: -points, reason: `Redeemed: ${reason}` });
}
