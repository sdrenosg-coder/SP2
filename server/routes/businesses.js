import express from 'express';
import { db } from '../db/index.js';
import { businesses, businessUsers } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';
import { businessSchema } from '../utils/validation.js';
import { generateSlug } from '../utils/helpers.js';

const router = express.Router();

router.post('/', authRequired, async (req, res, next) => {
  try {
    const data = businessSchema.parse(req.body);
    const slug = data.slug || generateSlug(data.name);
    const existing = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
    if (existing.length) return res.status(409).json({ error: 'Slug already taken' });
    const result = await db.insert(businesses).values({ ...data, slug, createdBy: req.user.id }).returning();
    const biz = result[0];
    await db.insert(businessUsers).values({ businessId: biz.id, userId: req.user.id, role: 'owner' });
    res.status(201).json({ business: biz });
  } catch (err) { next(err); }
});

router.get('/current', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const biz = await db.select().from(businesses).where(eq(businesses.id, req.businessId)).limit(1);
    if (!biz.length) return res.status(404).json({ error: 'Business not found' });
    res.json({ business: biz[0], role: req.userRole });
  } catch (err) { next(err); }
});

router.put('/:id', authRequired, resolveBusinessFromUser, requireRole('owner'), async (req, res, next) => {
  try {
    if (req.params.id != req.businessId) return res.status(403).json({ error: 'Access denied' });
    const data = businessSchema.partial().parse(req.body);
    await db.update(businesses).set(data).where(eq(businesses.id, req.businessId));
    const updated = await db.select().from(businesses).where(eq(businesses.id, req.businessId)).limit(1);
    res.json({ business: updated[0] });
  } catch (err) { next(err); }
});

router.get('/slug/:slug', async (req, res, next) => {
  try {
    const biz = await db.select().from(businesses).where(eq(businesses.slug, req.params.slug)).limit(1);
    if (!biz.length) return res.status(404).json({ error: 'Business not found' });
    if (biz[0].suspended) return res.status(403).json({ error: 'Business suspended' });
    res.json({ business: biz[0] });
  } catch (err) { next(err); }
});

export default router;
