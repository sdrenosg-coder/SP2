import { Router } from 'express';
import { z } from 'zod';
import { q } from '../db/featuresPool.js';
import { computeDeposit, canChange } from '../services/depositService.js';
import { createManageToken, verifyManageToken, manageUrl } from '../services/manageLinkService.js';
import { issueGiftCard, getGiftCard, redeemGiftCard, listGiftCards } from '../services/giftCardService.js';
import { audit, listAudit } from '../services/auditService.js';

const r = Router();
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const bad = (res, status, error) => res.status(status).json({ error });

async function loadAppt(id) {
  const [row] = await q(
    `SELECT a.*, row_to_json(b.*) AS business, s.price, s.deposit_required
       FROM appointments a
       JOIN businesses b ON b.id = a.business_id
       LEFT JOIN services s ON s.id = a.service_id
      WHERE a.id=$1`, [id]);
  return row;
}

// ---- Deposits ----
r.get('/appointments/:id/deposit-quote', wrap(async (req, res) => {
  const a = await loadAppt(req.params.id);
  if (!a) return bad(res, 404, 'Not found');
  const riskScore = Number(req.query.riskScore || 0);
  res.json(computeDeposit({ price: a.price, depositRequired: a.deposit_required, riskScore, business: a.business }));
}));

// ---- Self-service manage links ----
r.post('/appointments/:id/manage-link', wrap(async (req, res) => {
  const a = await loadAppt(req.params.id);
  if (!a) return bad(res, 404, 'Not found');
  const token = createManageToken(a.id, a.business_id);
  res.json({ token, url: manageUrl(token) });
}));

const tokenAppt = async (req, res) => {
  try {
    const { appointmentId } = verifyManageToken(req.params.token);
    const a = await loadAppt(appointmentId);
    if (!a) { bad(res, 404, 'Not found'); return null; }
    return a;
  } catch {
    bad(res, 401, 'Link invalid or expired');
    return null;
  }
};

r.get('/manage/:token', wrap(async (req, res) => {
  const a = await tokenAppt(req, res); if (!a) return;
  res.json({
    appointment: { id: a.id, startAt: a.start_at, endAt: a.end_at, status: a.status },
    business: { name: a.business.name, slug: a.business.slug },
    policy: canChange({ startAt: a.start_at, business: a.business }),
  });
}));

r.post('/manage/:token/reschedule', wrap(async (req, res) => {
  const a = await tokenAppt(req, res); if (!a) return;
  const body = z.object({ startAt: z.string().datetime() }).parse(req.body);
  if (['cancelled', 'completed', 'no_show'].includes(a.status)) return bad(res, 400, 'Cannot reschedule');
  if (!canChange({ startAt: a.start_at, business: a.business }).allowed) return bad(res, 400, 'Too late to reschedule');
  const duration = new Date(a.end_at) - new Date(a.start_at);
  const start = new Date(body.startAt);
  const end = new Date(start.getTime() + duration);
  const clash = await q(
    `SELECT 1 FROM appointments WHERE staff_id=$1 AND id<>$2 AND status NOT IN ('cancelled','no_show')
       AND start_at < $4 AND end_at > $3 LIMIT 1`, [a.staff_id, a.id, start, end]);
  if (clash.length) return bad(res, 409, 'Slot no longer available');
  await q('UPDATE appointments SET start_at=$1, end_at=$2, reschedule_count=COALESCE(reschedule_count,0)+1 WHERE id=$3',
    [start, end, a.id]);
  await audit({ businessId: a.business_id, actor: 'client', action: 'appointment.rescheduled', entity: 'appointment', entityId: a.id, meta: { from: a.start_at, to: start } });
  res.json({ ok: true, startAt: start, endAt: end });
}));

r.post('/manage/:token/cancel', wrap(async (req, res) => {
  const a = await tokenAppt(req, res); if (!a) return;
  if (a.status === 'cancelled') return res.json({ ok: true });
  const policy = canChange({ startAt: a.start_at, business: a.business });
  await q(`UPDATE appointments SET status='cancelled' WHERE id=$1`, [a.id]);
  await audit({ businessId: a.business_id, actor: 'client', action: 'appointment.cancelled', entity: 'appointment', entityId: a.id, meta: { lateCancel: !policy.allowed } });
  res.json({ ok: true, lateCancel: !policy.allowed, depositForfeited: !policy.allowed && Number(a.deposit_amount) > 0 });
}));

// ---- Gift cards ----
r.get('/businesses/:bid/gift-cards', wrap(async (req, res) => res.json(await listGiftCards(req.params.bid))));

r.post('/businesses/:bid/gift-cards', wrap(async (req, res) => {
  const body = z.object({
    amount: z.coerce.number().positive(),
    purchaserEmail: z.string().email().optional(),
    recipientEmail: z.string().email().optional(),
    expiresAt: z.string().optional(),
  }).parse(req.body);
  const card = await issueGiftCard({ businessId: req.params.bid, ...body });
  await audit({ businessId: Number(req.params.bid), actor: req.user?.email || 'staff', action: 'giftcard.issued', entity: 'gift_card', entityId: card.id });
  res.status(201).json(card);
}));

r.get('/businesses/:bid/gift-cards/:code', wrap(async (req, res) => {
  const card = await getGiftCard(req.params.bid, req.params.code);
  card ? res.json(card) : bad(res, 404, 'Not found');
}));

r.post('/businesses/:bid/gift-cards/:code/redeem', wrap(async (req, res) => {
  const body = z.object({ amount: z.coerce.number().positive(), appointmentId: z.coerce.number().optional() }).parse(req.body);
  res.json(await redeemGiftCard({ businessId: req.params.bid, code: req.params.code, ...body }));
}));

// ---- Audit ----
r.get('/businesses/:bid/audit-logs', wrap(async (req, res) => res.json(await listAudit(req.params.bid, 200))));

r.use((err, req, res, next) => {
  if (err instanceof z.ZodError) return bad(res, 400, err.errors.map((e) => e.message).join(', '));
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

export default r;
