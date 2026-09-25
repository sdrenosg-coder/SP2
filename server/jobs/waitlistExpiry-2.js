import { db } from '../db/index.js';
import { waitlistEntries } from '../db/schema.js';
import { eq, and, lte } from 'drizzle-orm';

export async function runWaitlistExpiry() {
  const now = new Date();
  await db.update(waitlistEntries)
    .set({ status: 'expired' })
    .where(and(eq(waitlistEntries.status, 'offered'), lte(waitlistEntries.expiresAt, now)));
}
