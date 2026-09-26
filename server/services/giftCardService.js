import crypto from 'crypto';
import { pool, q } from '../db/featuresPool.js';

const genCode = () => crypto.randomBytes(6).toString('hex').toUpperCase().match(/.{4}/g).join('-');

export async function issueGiftCard({ businessId, amount, purchaserEmail, recipientEmail, expiresAt }) {
  if (!(Number(amount) > 0)) throw Object.assign(new Error('Amount must be positive'), { status: 400 });
  const [card] = await q(
    `INSERT INTO gift_cards (business_id, code, initial_amount, balance, purchaser_email, recipient_email, expires_at)
     VALUES ($1,$2,$3,$3,$4,$5,$6) RETURNING *`,
    [businessId, genCode(), amount, purchaserEmail || null, recipientEmail || null, expiresAt || null]
  );
  await q('INSERT INTO gift_card_transactions (gift_card_id, amount, type) VALUES ($1,$2,$3)', [card.id, amount, 'issue']);
  return card;
}

export async function getGiftCard(businessId, code) {
  const [card] = await q('SELECT * FROM gift_cards WHERE business_id=$1 AND code=$2', [businessId, code]);
  return card || null;
}

export async function redeemGiftCard({ businessId, code, amount, appointmentId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT * FROM gift_cards WHERE business_id=$1 AND code=$2 FOR UPDATE', [businessId, code]);
    const card = rows[0];
    const fail = (m) => { throw Object.assign(new Error(m), { status: 400 }); };
    if (!card || card.status !== 'active') fail('Gift card not valid');
    if (card.expires_at && new Date(card.expires_at) < new Date()) fail('Gift card expired');
    const use = Math.min(Number(amount), Number(card.balance));
    if (!(use > 0)) fail('No balance available');
    const balance = Number(card.balance) - use;
    await client.query('UPDATE gift_cards SET balance=$1, status=$2 WHERE id=$3',
      [balance, balance === 0 ? 'depleted' : 'active', card.id]);
    await client.query(
      'INSERT INTO gift_card_transactions (gift_card_id, appointment_id, amount, type) VALUES ($1,$2,$3,$4)',
      [card.id, appointmentId || null, -use, 'redeem']);
    await client.query('COMMIT');
    return { applied: use, balance };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export const listGiftCards = (businessId) =>
  q('SELECT * FROM gift_cards WHERE business_id=$1 ORDER BY created_at DESC', [businessId]);
