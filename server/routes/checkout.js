import express from 'express';
import { db } from '../db/index.js';
import { payments, invoices, invoiceLines, appointmentItems, clients, loyaltyTransactions } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';

const router = express.Router();

router.post('/', authRequired, resolveBusinessFromUser, requireRole('owner', 'manager', 'staff', 'receptionist'), async (req, res, next) => {
  const { appointmentId, tip = 0, method = 'cash', usePoints = 0 } = req.body ?? {};
  if (!Number.isSafeInteger(appointmentId) || appointmentId <= 0
      || typeof tip !== 'number' || !Number.isFinite(tip) || tip < 0 || tip > 1000000
      || Math.abs(tip * 100 - Math.round(tip * 100)) > 0.000001
      || !Number.isSafeInteger(usePoints) || usePoints < 0 || method !== 'cash') {
    return res.status(400).json({ error: 'Provide a valid appointment, cash method, nonnegative tip and whole loyalty points' });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // Lock the appointment and client so parallel checkouts cannot double-spend points or pay twice.
      const appointmentResult = await tx.execute(sql`
        SELECT id, client_id, business_id FROM appointments WHERE id = ${appointmentId} FOR UPDATE
      `);
      const appointment = appointmentResult.rows[0];
      if (!appointment || appointment.business_id !== req.businessId) {
        return { status: 404, error: 'Appointment not found' };
      }
      const [paid] = await tx.select({ id: invoices.id }).from(invoices)
        .where(eq(invoices.appointmentId, appointmentId)).limit(1);
      if (paid) return { status: 409, error: 'Appointment has already been checked out' };

      const items = await tx.select().from(appointmentItems)
        .where(eq(appointmentItems.appointmentId, appointmentId));
      if (!items.length) return { status: 400, error: 'Appointment has no billable services' };
      const serviceCents = items.reduce((sum, item) =>
        sum + Math.round(Number(item.price) * 100) - Math.round(Number(item.discountApplied ?? 0) * 100), 0);
      if (!Number.isSafeInteger(serviceCents) || serviceCents < 0) {
        return { status: 400, error: 'Appointment prices are invalid' };
      }
      const totalCents = serviceCents + Math.round(tip * 100);
      const redeemedCents = usePoints * 100;
      if (redeemedCents > totalCents) return { status: 400, error: 'Loyalty points exceed the amount due' };

      const clientResult = await tx.execute(sql`
        SELECT id, loyalty_points FROM clients
        WHERE id = ${appointment.client_id} AND business_id = ${req.businessId} FOR UPDATE
      `);
      const client = clientResult.rows[0];
      if (!client) return { status: 404, error: 'Client not found' };
      if (usePoints > (client.loyalty_points ?? 0)) {
        return { status: 400, error: 'Insufficient loyalty points' };
      }

      const finalTotal = ((totalCents - redeemedCents) / 100).toFixed(2);
      const [invoice] = await tx.insert(invoices).values({
        businessId: req.businessId, appointmentId, total: finalTotal, tip: tip.toFixed(2), status: 'paid',
      }).returning();
      await tx.insert(invoiceLines).values({
        invoiceId: invoice.id, description: 'Services', amount: (serviceCents / 100).toFixed(2),
      });
      if (usePoints) {
        await tx.insert(invoiceLines).values({
          invoiceId: invoice.id, description: 'Loyalty points redeemed', amount: (-usePoints).toFixed(2),
        });
        await tx.insert(loyaltyTransactions).values({
          businessId: req.businessId, clientId: client.id, appointmentId,
          points: -usePoints, reason: 'Checkout redemption',
        });
      }
      const [payment] = await tx.insert(payments).values({
        businessId: req.businessId, appointmentId, amount: finalTotal, status: 'completed', method,
      }).returning();
      // Award points only for services paid without loyalty credit, never for tips or redeemed value.
      const earnedPoints = Math.floor(Math.max(0, serviceCents - redeemedCents) / 100);
      if (earnedPoints > 0) {
        await tx.insert(loyaltyTransactions).values({
          businessId: req.businessId, clientId: client.id, appointmentId,
          points: earnedPoints, reason: 'Appointment completed',
        });
      }
      await tx.update(clients).set({
        loyaltyPoints: (client.loyalty_points ?? 0) - usePoints + earnedPoints,
      }).where(eq(clients.id, client.id));
      return { invoice, payment };
    });
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.status(201).json(result);
  } catch (err) { next(err); }
});

export default router;