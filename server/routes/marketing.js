import express from 'express';
import { db } from '../db/index.js';
import { campaigns, automationRules } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';

const router = express.Router();

router.get('/campaigns', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const list = await db.select().from(campaigns).where(eq(campaigns.businessId, req.businessId));
    res.json({ campaigns: list });
  } catch (err) { next(err); }
});

router.post('/campaigns', authRequired, resolveBusinessFromUser, requireRole('owner','manager'), async (req, res, next) => {
  try {
    const { name, type, config } = req.body;
    const result = await db.insert(campaigns).values({ businessId: req.businessId, name, type, config }).returning();
    res.status(201).json({ campaign: result[0] });
  } catch (err) { next(err); }
});

router.get('/automations', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const list = await db.select().from(automationRules).where(eq(automationRules.businessId, req.businessId));
    res.json({ automations: list });
  } catch (err) { next(err); }
});

router.post('/automations', authRequired, resolveBusinessFromUser, requireRole('owner','manager'), async (req, res, next) => {
  try {
    const { name, trigger_type, config } = req.body;
    const result = await db.insert(automationRules).values({ businessId: req.businessId, name, triggerType: trigger_type, config }).returning();
    res.status(201).json({ automation: result[0] });
  } catch (err) { next(err); }
});

export default router;
