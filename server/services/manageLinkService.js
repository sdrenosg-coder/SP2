import crypto from 'crypto';
import { db } from '../db/index.js';
import { appointmentManageTokens } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const hash = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Random opaque tokens hashed at rest, rather than a signed JWT with a fallback
// secret: a leaked database row can't be used to mint new tokens, and rotating
// the app's signing secret can't silently invalidate live customer links.
export async function createManageToken(appointmentId, businessId, days = 30) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await db.insert(appointmentManageTokens).values({
    tokenHash: hash(token), appointmentId, businessId, expiresAt,
  });
  return token;
}

export async function verifyManageToken(token) {
  if (!token || typeof token !== 'string') throw new Error('Invalid token');
  const [row] = await db.select().from(appointmentManageTokens)
    .where(eq(appointmentManageTokens.tokenHash, hash(token))).limit(1);
  if (!row || new Date(row.expiresAt) < new Date()) throw new Error('Link invalid or expired');
  return { appointmentId: row.appointmentId, businessId: row.businessId };
}

export function manageUrl(token) {
  const base = process.env.PUBLIC_URL || '';
  return `${base}/manage/${token}`;
}
