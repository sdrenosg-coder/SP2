import express from 'express';
import { db } from '../db/index.js';
import { appointments, appointmentItems, businesses, services } from '../db/schema.js';
import { eq, and, asc, sql } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';
import * as giftCardService from '../services/giftCardService.js';
import { listAudit, audit } from '../services/auditService.js';
import { createManageToken, verifyManageToken } from '../services/manageLinkService.js';
import { canChange, computeNoShowFee } from '../services/depositService.js';

const router = express.Router();

// Business-scoped routes below are session-authenticated: req.businessId comes from the
// logged-in user's own membership (resolveBusinessFromUser), never from the URL, so a
// caller can never read or mutate another tenant's gift cards or audit log by editing :bid.
router.use('/businesses/:bid', authRequired, resolveBusinessFromUser, (req, res, next) => {
  if (String(req.businessId) !== String(req.params.bid)) {
    return res.status(403).json({ error: 'Business mismatch' });
  }
  next();
});

router.get('/businesses/:bid/gift-cards', async (req, res, next) => {
  try {
    res.json(await giftCardService.listGiftCards(req.businessId));
  } catch (err) { next(err); }
});

router.post('/businesses/:bid/gift-cards', requireRole('owner', 'manager', 'receptionist'), async (req, res, next) => {
  try {
    const { amount, purchaserEmail, recipientEmail, expiresAt } = req.body ?? {};
    const card = await giftCardService.issueGiftCard({ businessId: req.businessId, amount, purchaserEmail, recipientEmail, expiresAt });
    await audit({ businessId: req.businessId, actor: req.user.email, action: 'gift_card.issue', entity: 'gift_card', entityId: card.id, meta: { amount } });
    res.status(201).json(card);
  } catch (err) { next(err.status ? Object.assign(err, {}) : err); }
});

router.get('/businesses/:bid/gift-cards/:code', async (req, res, next) => {
  try {
    const card = await giftCardService.getGiftCard(req.businessId, req.params.code.trim().toUpperCase());
    if (!card) return res.status(404).json({ error: 'Gift card not found' });
    res.json(card);
  } catch (err) { next(err); }
});

router.post('/businesses/:bid/gift-cards/:code/redeem', requireRole('owner', 'manager', 'staff', 'receptionist'), async (req, res, next) => {
  try {
    const { amount, appointmentId } = req.body ?? {};
    const result = await giftCardService.redeemGiftCard({
      businessId: req.businessId, code: req.params.code.trim().toUpperCase(), amount, appointmentId,
    });
    await audit({ businessId: req.businessId, actor: req.user.email, action: 'gift_card.redeem', entity: 'gift_card', meta: { code: req.params.code, amount: result.applied } });
    res.json(result);
  } catch (err) { next(err); }
});

router.get('/businesses/:bid/audit-logs', requireRole('owner', 'manager'), async (req, res, next) => {
  try {
    res.json(await listAudit(req.businessId));
  } catch (err) { next(err); }
});

router.post('/businesses/:bid/appointments/:id/manage-link', requireRole('owner', 'manager', 'staff', 'receptionist'), async (req, res, next) => {
  try {
    const appointmentId = Number(req.params.id);
    const [appt] = await db.select({ id: appointments.id }).from(appointments)
      .where(and(eq(appointments.id, appointmentId), eq(appointments.businessId, req.businessId))).limit(1);
    if (!appt) return res.status(404).json({ error: 'Appointment not found' });
    const token = await createManageToken(appointmentId, req.businessId);
    res.status(201).json({ token, url: `/manage/${token}` });
  } catch (err) { next(err); }
});

// --- Public, token-scoped self-service manage/reschedule/cancel ---

async function loadAppointmentContext(appointmentId, businessId) {
  const [appt] = await db.select().from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.businessId, businessId))).limit(1);
  if (!appt) return null;
  const [business] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  const items = await db.select().from(appointmentItems)
    .where(eq(appointmentItems.appointmentId, appointmentId)).orderBy(asc(appointmentItems.startAt));
  const startAt = items[0]?.startAt ?? null;
  return { appt, business, items, startAt };
}

router.get('/manage/:token', async (req, res, next) => {
  try {
    const { appointmentId, businessId } = await verifyManageToken(req.params.token);
    const ctx = await loadAppointmentContext(appointmentId, businessId);
    if (!ctx || !ctx.business || ctx.business.suspended) return res.status(404).json({ error: 'Not found' });
    const policy = canChange({ startAt: ctx.startAt, business: ctx.business });
    res.json({
      appointment: { id: ctx.appt.id, status: ctx.appt.status, startAt: ctx.startAt, rescheduleCount: ctx.appt.rescheduleCount },
      business: { name: ctx.business.name },
      policy,
    });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Invalid link' });
  }
});

router.post('/manage/:token/reschedule', async (req, res, next) => {
  try {
    const { appointmentId, businessId } = await verifyManageToken(req.params.token);
    const ctx = await loadAppointmentContext(appointmentId, businessId);
    if (!ctx || !ctx.business || ctx.business.suspended) return res.status(404).json({ error: 'Not found' });
    if (['cancelled', 'completed', 'no_show'].includes(ctx.appt.status)) {
      return res.status(400).json({ error: 'This appointment can no longer be changed' });
    }
    const policy = canChange({ startAt: ctx.startAt, business: ctx.business });
    if (!policy.allowed) return res.status(400).json({ error: 'Too close to the appointment time to reschedule' });
    const newStart = new Date(req.body?.newStartAt);
    if (!req.body?.newStartAt || Number.isNaN(newStart.getTime()) || newStart <= new Date()) {
      return res.status(400).json({ error: 'Provide a valid future date/time' });
    }
    const shiftMs = newStart - new Date(ctx.startAt);
    await db.transaction(async (tx) => {
      for (const item of ctx.items) {
        await tx.update(appointmentItems).set({
          startAt: new Date(new Date(item.startAt).getTime() + shiftMs),
          endAt: new Date(new Date(item.endAt).getTime() + shiftMs),
        }).where(eq(appointmentItems.id, item.id));
      }
      await tx.update(appointments).set({
        status: 'booked', rescheduleCount: sql`${appointments.rescheduleCount} + 1`, updatedAt: new Date(),
      }).where(eq(appointments.id, appointmentId));
    });
    await audit({ businessId, actor: 'customer', action: 'appointment.reschedule', entity: 'appointment', entityId: appointmentId });
    res.json({ success: true });
  } catch (err) {
    if (err.message?.includes('Link invalid')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.post('/manage/:token/cancel', async (req, res, next) => {
  try {
    const { appointmentId, businessId } = await verifyManageToken(req.params.token);
    const ctx = await loadAppointmentContext(appointmentId, businessId);
    if (!ctx || !ctx.business || ctx.business.suspended) return res.status(404).json({ error: 'Not found' });
    if (['cancelled', 'completed', 'no_show'].includes(ctx.appt.status)) {
      return res.status(400).json({ error: 'This appointment can no longer be changed' });
    }
    const policy = canChange({ startAt: ctx.startAt, business: ctx.business });
    let depositForfeited = false;
    if (!policy.allowed && Number(ctx.appt.depositAmount) > 0 && ctx.appt.depositStatus === 'paid') {
      depositForfeited = true;
    }
    await db.update(appointments).set({
      status: 'cancelled',
      depositStatus: depositForfeited ? 'forfeited' : ctx.appt.depositStatus,
      updatedAt: new Date(),
    }).where(eq(appointments.id, appointmentId));
    await audit({ businessId, actor: 'customer', action: 'appointment.cancel', entity: 'appointment', entityId: appointmentId, meta: { lateCancel: !policy.allowed, depositForfeited } });
    res.json({ success: true, lateCancel: !policy.allowed, depositForfeited });
  } catch (err) {
    if (err.message?.includes('Link invalid')) return res.status(400).json({ error: err.message });
    next(err);
  }
});

router.get('/businesses/:bid/deposit-quote', async (req, res, next) => {
  try {
    const serviceId = Number(req.query.serviceId);
    const [service] = await db.select().from(services)
      .where(and(eq(services.id, serviceId), eq(services.businessId, req.businessId))).limit(1);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    const [business] = await db.select().from(businesses).where(eq(businesses.id, req.businessId)).limit(1);
    const noShowFee = computeNoShowFee({ price: service.price, business });
    res.json({ depositRequired: service.depositRequired, noShowFee });
  } catch (err) { next(err); }
});

export default router;
