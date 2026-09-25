import express from 'express';
import { db } from '../db/index.js';
import { businesses, services, staff } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.get('/:slug/config', async (req, res, next) => {
  try {
    const biz = await db.select().from(businesses).where(eq(businesses.slug, req.params.slug)).limit(1);
    if (!biz.length) return res.status(404).json({ error: 'Business not found' });
    if (biz[0].suspended) return res.status(403).json({ error: 'Business suspended' });
    const serviceList = await db.select().from(services).where(eq(services.businessId, biz[0].id));
    const staffList = await db.select().from(staff).where(eq(staff.businessId, biz[0].id));
    res.json({ business: biz[0], services: serviceList, staff: staffList });
  } catch (err) { next(err); }
});

export default router;
