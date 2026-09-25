import express from 'express';
import { db } from '../db/index.js';
import { businesses, services } from '../db/schema.js';
import { and, eq, ilike } from 'drizzle-orm';

const router = express.Router();

router.get('/search', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const filters = [eq(businesses.suspended, false)];
    if (typeof q === 'string' && q.trim()) filters.push(ilike(businesses.name, `%${q.trim()}%`));
    if (typeof category === 'string' && category.trim()) filters.push(eq(businesses.category, category.trim()));
    const list = await db.select().from(businesses).where(and(...filters));
    res.json({ businesses: list });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const biz = await db.select().from(businesses).where(eq(businesses.slug, req.params.slug)).limit(1);
    if (!biz.length) return res.status(404).json({ error: 'Business not found' });
    if (biz[0].suspended) return res.status(403).json({ error: 'Business suspended' });
    const serviceList = await db.select().from(services).where(eq(services.businessId, biz[0].id));
    res.json({ business: biz[0], services: serviceList });
  } catch (err) { next(err); }
});

export default router;
