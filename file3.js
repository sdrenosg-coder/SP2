// server/routes/chainBooking.js (new)
import express from 'express';
import { getChainSlots } from '../services/availabilityEngine.js';
import { db } from '../db/index.js';
import { businesses } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// POST /api/chain-booking/availability
// Body: { businessSlug, services: [{serviceId, staffId?}], date }
router.post('/availability', async (req, res, next) => {
  try {
    const { businessSlug, services, date } = req.body;
    if (!businessSlug || !services?.length || !date) {
      return res.status(400).json({ error: 'businessSlug, services, and date are required' });
    }
    const bizRows = await db.select().from(businesses).where(eq(businesses.slug, businessSlug)).limit(1);
    if (!bizRows.length) return res.status(404).json({ error: 'Business not found' });
    const business = bizRows[0];
    if (business.suspended) return res.status(403).json({ error: 'Business suspended' });

    const candidates = await getChainSlots({
      businessId: business.id,
      services,
      date,
      timezone: business.timezone,
    });
    res.json({ candidates });
  } catch (err) { next(err); }
});

export default router;
