import express from 'express';
import { db } from '../db/index.js';
import { payments, invoices, invoiceLines, appointments, clients, appointmentItems } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';
import { awardPoints } from '../services/loyaltyService.js';

const router = express.Router();

router.post('/', authRequired, resolveBusinessFromUser, requireRole('owner','manager','staff','receptionist'), async (req, res, next) => {
  try {
    const { appointmentId, tip = 0, method = 'cash', usePoints = 0 } = req.body;
    const appt = await db.select().from(appointments).where(eq(appointments.id, appointmentId)).limit(1);
    if (!appt.length || appt[0].businessId !== req.businessId) return res.status(404).json({ error: 'Appointment not found' });
    const items = await db.select().from(appointmentItems).where(eq(appointmentItems.appointmentId, appointmentId));
    const total = items.reduce((sum, item) => sum + parseFloat(item.price), 0) + tip;
    const finalTotal = Math.max(0, total - usePoints);
    if (usePoints > 0) {
      const client = await db.select().from(clients).where(eq(clients.id, appt[0].clientId)).limit(1);
      if (client.length && client[0].loyaltyPoints >= usePoints) {
        await db.update(clients).set({ loyaltyPoints: client[0].loyaltyPoints - usePoints }).where(eq(clients.id, client[0].id));
      }
    }
    const inv = await db.insert(invoices).values({ businessId: req.businessId, appointmentId, total: finalTotal, tip, status: 'paid' }).returning();
    await db.insert(invoiceLines).values({ invoiceId: inv[0].id, description: 'Services', amount: total });
    const paymentResult = await db.insert(payments).values({ businessId: req.businessId, appointmentId, amount: finalTotal, status: 'completed', method }).returning();
    await awardPoints({ businessId: req.businessId, clientId: appt[0].clientId, points: Math.floor(total), reason: 'Appointment completed' });
    res.status(201).json({ invoice: inv[0], payment: paymentResult[0] });
  } catch (err) { next(err); }
});

export default router;
