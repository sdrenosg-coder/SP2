import express from 'express';
import { getAvailableSlots } from '../services/availabilityEngine.js';
import { db } from '../db/index.js';
import { businesses } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.get('/:businessSlug', async (req, res, next) => {
  try {
    const { businessSlug } = req.params;
    const bizRows = await db.select().from(businesses).where(eq(businesses.slug, businessSlug)).limit(1);
    if (!bizRows.length) return res.status(404).json({ error: 'Business not found' });
    const business = bizRows[0];
    const { serviceId, staffId, date } = req.query;
    if (!serviceId || !date) return res.status(400).json({ error: 'serviceId and date are required' });
    const slots = await getAvailableSlots({
      businessId: business.id,
      serviceId: parseInt(serviceId),
      staffId: staffId ? parseInt(staffId) : null,
      date,
      timezone: business.timezone,
    });
    res.json({ slots });
  } catch (err) { next(err); }
});

export default router;
