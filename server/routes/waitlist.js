import express from 'express';
import { db } from '../db/index.js';
import { waitlistEntries } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';
import { addToWaitlist, offerSlotToWaitlist } from '../services/waitlistService.js';
import { waitlistCreateSchema } from '../utils/validation.js';

const router = express.Router();

router.get('/', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const list = await db.select().from(waitlistEntries).where(eq(waitlistEntries.businessId, req.businessId));
    res.json({ waitlist: list });
  } catch (err) { next(err); }
});

router.post('/', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const data = waitlistCreateSchema.parse(req.body);
    const entry = await addToWaitlist({ businessId: req.businessId, ...data });
    res.status(201).json({ entry });
  } catch (err) { next(err); }
});

router.post('/offer', authRequired, resolveBusinessFromUser, requireRole('owner','manager','receptionist'), async (req, res, next) => {
  try {
    const { slot } = req.body;
    await offerSlotToWaitlist(req.businessId, slot);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.post('/:id/claim', async (req, res, next) => {
  try {
    const { token } = req.body;
    const entry = await db.select().from(waitlistEntries).where(eq(waitlistEntries.id, req.params.id)).limit(1);
    if (!entry.length || entry[0].claimToken !== token || entry[0].status !== 'offered') {
      return res.status(400).json({ error: 'Invalid or expired claim' });
    }
    await db.update(waitlistEntries).set({ status: 'claimed' }).where(eq(waitlistEntries.id, req.params.id));
    res.json({ success: true, entry: entry[0] });
  } catch (err) { next(err); }
});

export default router;
