import { db } from '../db/index.js';
import { waitlistEntries } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { sendWaitlistOffer } from './notificationService.js';

export async function addToWaitlist({ businessId, clientId, serviceId, preferredStart, preferredEnd, priority = 100 }) {
  const expiresAt = DateTime.now().plus({ hours: 24 }).toUTC().toISO();
  const result = await db.insert(waitlistEntries).values({
    businessId, clientId, serviceId,
    preferredStart: preferredStart ? new Date(preferredStart) : null,
    preferredEnd: preferredEnd ? new Date(preferredEnd) : null,
    priority, expiresAt: new Date(expiresAt),
  }).returning();
  return result[0];
}

export async function offerSlotToWaitlist(businessId, slot) {
  const entries = await db.select().from(waitlistEntries).where(and(
    eq(waitlistEntries.businessId, businessId),
    eq(waitlistEntries.status, 'waiting'),
    eq(waitlistEntries.serviceId, slot.serviceId),
    gte(waitlistEntries.preferredStart, new Date(slot.startAt)),
    lte(waitlistEntries.preferredEnd, new Date(slot.endAt)),
  )).orderBy(waitlistEntries.priority);

  for (const entry of entries.slice(0, 5)) {
    await db.update(waitlistEntries).set({ status: 'offered', expiresAt: new Date(Date.now() + 3600_000) }).where(eq(waitlistEntries.id, entry.id));
    await sendWaitlistOffer({ businessId, clientId: entry.clientId, claimToken: entry.claimToken, expiresAt: entry.expiresAt });
  }
}
