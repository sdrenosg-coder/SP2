// server/routes/queue.js (modified – added QR code generation)
import express from 'express';
import { db } from '../db/index.js';
import { walkInQueue } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';
import QRCode from 'qrcode';

const router = express.Router();

router.get('/', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const list = await db.select().from(walkInQueue).where(eq(walkInQueue.businessId, req.businessId));
    res.json({ queue: list });
  } catch (err) { next(err); }
});

router.post('/', authRequired, resolveBusinessFromUser, requireRole('receptionist','owner','manager'), async (req, res, next) => {
  try {
    const { client_name, phone, service_id, estimated_wait_minutes } = req.body;
    const result = await db.insert(walkInQueue).values({
      businessId: req.businessId, clientName: client_name, phone, serviceId: service_id, estimatedWaitMinutes: estimated_wait_minutes,
    }).returning();
    res.status(201).json({ entry: result[0] });
  } catch (err) { next(err); }
});

// New endpoint: generate QR code for walk-in join link
router.get('/qr', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
    const joinUrl = `${baseUrl}/walk-in/${req.businessId}`;
    const qrDataUrl = await QRCode.toDataURL(joinUrl);
    res.json({ qrDataUrl, joinUrl });
  } catch (err) { next(err); }
});

router.patch('/:id', authRequired, resolveBusinessFromUser, requireRole('receptionist','owner','manager'), async (req, res, next) => {
  try {
    const { status, estimated_wait_minutes } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (estimated_wait_minutes !== undefined) updateData.estimatedWaitMinutes = estimated_wait_minutes;
    await db.update(walkInQueue).set(updateData).where(and(eq(walkInQueue.id, req.params.id), eq(walkInQueue.businessId, req.businessId)));
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
