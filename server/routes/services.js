import express from 'express';
import { db } from '../db/index.js';
import { services, serviceAddOns, addOns } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';
import { serviceSchema } from '../utils/validation.js';

const router = express.Router();

router.get('/', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const list = await db.select().from(services).where(eq(services.businessId, req.businessId));
    res.json({ services: list });
  } catch (err) { next(err); }
});

router.post('/', authRequired, resolveBusinessFromUser, requireRole('owner','manager'), async (req, res, next) => {
  try {
    const data = serviceSchema.parse(req.body);
    const result = await db.insert(services).values({ ...data, businessId: req.businessId }).returning();
    res.status(201).json({ service: result[0] });
  } catch (err) { next(err); }
});

router.put('/:id', authRequired, resolveBusinessFromUser, requireRole('owner','manager'), async (req, res, next) => {
  try {
    const data = serviceSchema.partial().parse(req.body);
    await db.update(services).set(data).where(and(eq(services.id, req.params.id), eq(services.businessId, req.businessId)));
    const updated = await db.select().from(services).where(eq(services.id, req.params.id)).limit(1);
    res.json({ service: updated[0] });
  } catch (err) { next(err); }
});

router.delete('/:id', authRequired, resolveBusinessFromUser, requireRole('owner'), async (req, res, next) => {
  try {
    await db.delete(services).where(and(eq(services.id, req.params.id), eq(services.businessId, req.businessId)));
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get('/:serviceId/addons', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const mappings = await db.select().from(serviceAddOns).where(eq(serviceAddOns.serviceId, req.params.serviceId));
    const addonIds = mappings.map(m => m.addOnId);
    const addonsList = addonIds.length ? await db.select().from(addOns).where(and(eq(addOns.businessId, req.businessId), eq(addOns.id, addonIds))) : [];
    res.json({ addons: addonsList });
  } catch (err) { next(err); }
});

export default router;
