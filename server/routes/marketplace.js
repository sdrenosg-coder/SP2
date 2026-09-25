import express from 'express';
import { db } from '../db/index.js';
import { businesses, services } from '../db/schema.js';
import { eq, ilike } from 'drizzle-orm';

const router = express.Router();

router.get('/search', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    let query = db.select().from(businesses);
    if (q) query = query.where(ilike(businesses.name, `%${q}%`));
    if (category) query = query.where(eq(businesses.category, category));
    const list = await query;
    res.json({ businesses: list });
  } catch (err) { next(err); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const biz = await db.select().from(businesses).where(eq(businesses.slug, req.params.slug)).limit(1);
    if (!biz.length) return res.status(404).json({ error: 'Business not found' });
    const serviceList = await db.select().from(services).where(eq(services.businessId, biz[0].id));
    res.json({ business: biz[0], services: serviceList });
  } catch (err) { next(err); }
});

export default router;
