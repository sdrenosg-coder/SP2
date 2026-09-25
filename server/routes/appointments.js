import express from 'express';
import { db } from '../db/index.js';
import { appointments, appointmentItems, clients } from '../db/schema.js';
import { eq, and, gte, lte } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';
import { createAppointment, cancelAppointment, rescheduleAppointment } from '../services/bookingService.js';
import { appointmentCreateSchema } from '../utils/validation.js';

const router = express.Router();

router.get('/', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const { status, date } = req.query;
    let query = db.select().from(appointments).where(eq(appointments.businessId, req.businessId));
    if (status) query = query.where(eq(appointments.status, status));
    if (date) {
      const start = new Date(date + 'T00:00:00Z');
      const end = new Date(date + 'T23:59:59Z');
      query = query.innerJoin(appointmentItems, eq(appointments.id, appointmentItems.appointmentId))
        .where(and(gte(appointmentItems.startAt, start.toISOString()), lte(appointmentItems.endAt, end.toISOString())));
    }
    const list = await query;
    const enriched = await Promise.all(list.map(async (appt) => {
      const items = await db.select().from(appointmentItems).where(eq(appointmentItems.appointmentId, appt.id));
      const client = await db.select().from(clients).where(eq(clients.id, appt.clientId)).limit(1);
      return { ...appt, items, client: client[0] };
    }));
    res.json({ appointments: enriched });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = appointmentCreateSchema.parse(req.body);
    if (!req.businessId) return res.status(400).json({ error: 'businessId required' });
    const appointment = await createAppointment({ businessId: req.businessId, ...data });
    res.status(201).json({ appointment });
  } catch (err) { next(err); }
});

router.get('/:id', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const appt = await db.select().from(appointments).where(eq(appointments.id, req.params.id)).limit(1);
    if (!appt.length || appt[0].businessId !== req.businessId) return res.status(404).json({ error: 'Not found' });
    const items = await db.select().from(appointmentItems).where(eq(appointmentItems.appointmentId, appt[0].id));
    res.json({ appointment: { ...appt[0], items } });
  } catch (err) { next(err); }
});

router.patch('/:id/status', authRequired, resolveBusinessFromUser, requireRole('owner','manager','staff','receptionist'), async (req, res, next) => {
  try {
    const { status } = req.body;
    await db.update(appointments).set({ status, updatedAt: new Date() }).where(and(eq(appointments.id, req.params.id), eq(appointments.businessId, req.businessId)));
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/cancel', authRequired, resolveBusinessFromUser, requireRole('owner','manager','staff'), async (req, res, next) => {
  try {
    await cancelAppointment(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/reschedule', authRequired, resolveBusinessFromUser, requireRole('owner','manager','staff'), async (req, res, next) => {
  try {
    const { newStartAt, newStaffId } = req.body;
    await rescheduleAppointment(req.params.id, newStartAt, newStaffId);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
