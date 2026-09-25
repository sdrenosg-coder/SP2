import express from 'express';
import { db } from '../db/index.js';
import { staff, staffShifts, staffTimeOff, staffServices } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';
import { staffSchema } from '../utils/validation.js';

const router = express.Router();

router.get('/', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const list = await db.select().from(staff).where(eq(staff.businessId, req.businessId));
    res.json({ staff: list });
  } catch (err) { next(err); }
});

router.post('/', authRequired, resolveBusinessFromUser, requireRole('owner','manager'), async (req, res, next) => {
  try {
    const data = staffSchema.parse(req.body);
    const result = await db.insert(staff).values({ ...data, businessId: req.businessId }).returning();
    res.status(201).json({ staff: result[0] });
  } catch (err) { next(err); }
});

router.put('/:id', authRequired, resolveBusinessFromUser, requireRole('owner','manager'), async (req, res, next) => {
  try {
    const data = staffSchema.partial().parse(req.body);
    await db.update(staff).set(data).where(and(eq(staff.id, req.params.id), eq(staff.businessId, req.businessId)));
    const updated = await db.select().from(staff).where(eq(staff.id, req.params.id)).limit(1);
    res.json({ staff: updated[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', authRequired, resolveBusinessFromUser, requireRole('owner'), async (req, res, next) => {
  try {
    await db.delete(staff).where(and(eq(staff.id, req.params.id), eq(staff.businessId, req.businessId)));
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/:staffId/shifts', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const shifts = await db.select().from(staffShifts).where(eq(staffShifts.staffId, req.params.staffId));
    res.json({ shifts });
  } catch (err) { next(err); }
});

router.post('/:staffId/shifts', authRequired, resolveBusinessFromUser, requireRole('owner','manager'), async (req, res, next) => {
  try {
    const { day_of_week, start_time, end_time, location_id } = req.body;
    const result = await db.insert(staffShifts).values({
      staffId: req.params.staffId, dayOfWeek: day_of_week, startTime: start_time, endTime: end_time, locationId: location_id,
    }).returning();
    res.status(201).json({ shift: result[0] });
  } catch (err) { next(err); }
});

router.get('/:staffId/timeoff', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const list = await db.select().from(staffTimeOff).where(eq(staffTimeOff.staffId, req.params.staffId));
    res.json({ timeOff: list });
  } catch (err) { next(err); }
});

router.post('/:staffId/timeoff', authRequired, resolveBusinessFromUser, requireRole('owner','manager'), async (req, res, next) => {
  try {
    const { start_at, end_at, reason } = req.body;
    const result = await db.insert(staffTimeOff).values({
      staffId: req.params.staffId, startAt: new Date(start_at), endAt: new Date(end_at), reason,
    }).returning();
    res.status(201).json({ timeOff: result[0] });
  } catch (err) { next(err); }
});

router.get('/:staffId/services', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const list = await db.select().from(staffServices).where(eq(staffServices.staffId, req.params.staffId));
    res.json({ services: list });
  } catch (err) { next(err); }
});

router.post('/
