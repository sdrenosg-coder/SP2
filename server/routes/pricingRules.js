import express from 'express';
import { db } from '../db/index.js';
import { pricingRules } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';
import { pricingRuleSchema } from '../utils/validation.js';

const router = express.Router();

router.get('/', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const list = await db.select().from(pricingRules).where(eq(pricingRules.businessId, req.businessId));
    res.json({ rules: list });
  } catch (err) { next(err); }
});

router.post('/', authRequired, resolveBusinessFromUser, requireRole('owner','manager'), async (req, res, next) => {
  try {
    const data = pricingRuleSchema.parse(req.body);
    const result = await db.insert(pricingRules).values({
      businessId: req.businessId,
      name: data.name,
      daysOfWeek: data.days_of_week,
      startTime: data.start_time,
      endTime: data.end_time,
      discountPercent: data.discount_percent,
      serviceIds: data.service_ids || [],
    }).returning();
    res.status(201).json({ rule: result[0] });
  } catch (err) { next(err); }
});

router.put('/:id', authRequired, resolveBusinessFromUser, requireRole('owner','manager'), async (req, res, next) => {
  try {
    const data = pricingRuleSchema.partial().parse(req.body);
    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.days_of_week) updateData.daysOfWeek = data.days_of_week;
    if (data.start_time) updateData.startTime = data.start_time;
    if (data.end_time) updateData.endTime = data.end_time;
    if (data.discount_percent) updateData.discountPercent = data.discount_percent;
    if (data.service_ids) updateData.serviceIds = data.service_ids;
    if (data.is_active !== undefined) updateData.isActive = data.is_active;
    await db.update(pricingRules).set(updateData).where(and(eq(pricingRules.id, req.params.id), eq(pricingRules.businessId, req.businessId)));
    const updated = await db.select().from(pricingRules).where(eq(pricingRules.id, req.params.id)).limit(1);
    res.json({ rule: updated[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', authRequired, resolveBusinessFromUser, requireRole('owner'), async (req, res, next) => {
  try {
    await db.delete(pricingRules).where(and(eq(pricingRules.id, req.params.id), eq(pricingRules.businessId, req.businessId)));
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
