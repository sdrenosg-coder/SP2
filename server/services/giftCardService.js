import crypto from 'crypto';
import { db } from '../db/index.js';
import { giftCards, giftCardTransactions } from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

const genCode = () => crypto.randomBytes(6).toString('hex').toUpperCase().match(/.{4}/g).join('-');

export async function issueGiftCard({ businessId, amount, purchaserEmail, recipientEmail, expiresAt }) {
  if (!(Number(amount) > 0) || !Number.isFinite(Number(amount))) {
    throw Object.assign(new Error('Amount must be a positive number'), { status: 400 });
  }
  const value = Number(amount).toFixed(2);
  // Retry on the rare code collision within a business.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = genCode();
    try {
      const [card] = await db.insert(giftCards).values({
        businessId, code, balance: value, initialBalance: value,
        purchaserEmail: purchaserEmail || null, recipientEmail: recipientEmail || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }).returning();
      await db.insert(giftCardTransactions).values({ giftCardId: card.id, amount: value, type: 'issue' });
      return card;
    } catch (err) {
      if (err.code === '23505' && attempt < 4) continue; // unique violation on (business_id, code)
      throw err;
    }
  }
  throw new Error('Could not generate a unique gift card code');
}

export function listGiftCards(businessId) {
  return db.select().from(giftCards).where(eq(giftCards.businessId, businessId)).orderBy(desc(giftCards.createdAt));
}

export async function getGiftCard(businessId, code) {
  const [card] = await db.select().from(giftCards)
    .where(and(eq(giftCards.businessId, businessId), eq(giftCards.code, code))).limit(1);
  return card || null;
}

export async function redeemGiftCard({ businessId, code, amount, appointmentId }) {
  const requested = Number(amount);
  if (!(requested > 0) || !Number.isFinite(requested)) {
    throw Object.assign(new Error('Amount must be a positive number'), { status: 400 });
  }
  return db.transaction(async (tx) => {
    const lockResult = await tx.execute(sql`
      SELECT id, balance, status, expires_at FROM gift_cards
      WHERE business_id = ${businessId} AND code = ${code} FOR UPDATE
    `);
    const card = lockResult.rows[0];
    const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
    if (!card || card.status !== 'active') fail(400, 'Gift card not valid');
    if (card.expires_at && new Date(card.expires_at) < new Date()) fail(400, 'Gift card expired');
    const balanceBefore = Number(card.balance);
    const use = Math.min(requested, balanceBefore);
    if (!(use > 0)) fail(400, 'No balance available');
    const balance = +(balanceBefore - use).toFixed(2);
    await tx.update(giftCards).set({ balance, status: balance === 0 ? 'depleted' : 'active' })
      .where(eq(giftCards.id, card.id));
    await tx.insert(giftCardTransactions).values({
      giftCardId: card.id, appointmentId: appointmentId || null, amount: (-use).toFixed(2), type: 'redeem',
    });
    return { applied: use, balance };
  });
}
