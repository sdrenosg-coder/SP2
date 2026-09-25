import express from 'express';
import { db } from '../db/index.js';
import { reviews, appointments, businesses } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

router.get('/business/:slug', async (req, res, next) => {
  try {
    const biz = await db.select().from(businesses).where(eq(businesses.slug, req.params.slug)).limit(1);
    if (!biz.length) return res.status(404).json({ error: 'Business not found' });
    if (biz[0].suspended) return res.status(403).json({ error: 'Business suspended' });
    const list = await db.select().from(reviews).where(eq(reviews.businessId, biz[0].id));
    res.json({ reviews: list });
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { businessId, clientId, appointmentId, rating, text } = req.body;
    const appt = await db.select().from(appointments).where(and(eq(appointments.id, appointmentId), eq(appointments.clientId, clientId), eq(appointments.status, 'completed'))).limit(1);
    if (!appt.length) return res.status(400).json({ error: 'Only completed bookings can be reviewed' });
    const result = await db.insert(reviews).values({ businessId, clientId, appointmentId, rating, text }).returning();
    res.status(201).json({ review: result[0] });
  } catch (err) { next(err); }
});

export default router;
