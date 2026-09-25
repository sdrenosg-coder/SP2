import express from 'express';
import { db } from '../db/index.js';
import { clients, appointments } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authRequired, resolveBusinessFromUser, requireRole } from '../middleware/index.js';
import { clientSchema } from '../utils/validation.js';
import { getClientRiskScore } from '../services/riskService.js';

const router = express.Router();

router.get('/', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const list = await db.select().from(clients).where(eq(clients.businessId, req.businessId));
    const enriched = await Promise.all(list.map(async (c) => {
      const risk = await getClientRiskScore(req.businessId, c.id);
      const lastAppt = await db.select().from(appointments).where(eq(appointments.clientId, c.id)).orderBy(appointments.updatedAt, 'desc').limit(1);
      return { ...c, riskScore: risk, lastAppointment: lastAppt[0] || null };
    }));
    res.json({ clients: enriched });
  } catch (err) { next(err); }
});

router.post('/', authRequired, resolveBusinessFromUser, requireRole('owner','manager','receptionist'), async (req, res, next) => {
  try {
    const data = clientSchema.parse(req.body);
    const result = await db.insert(clients).values({ ...data, businessId: req.businessId }).returning();
    res.status(201).json({ client: result[0] });
  } catch (err) { next(err); }
});

router.get('/:id', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const c = await db.select().from(clients).where(and(eq(clients.id, req.params.id), eq(clients.businessId, req.businessId))).limit(1);
    if (!c.length) return res.status(404).json({ error: 'Client not found' });
    const risk = await getClientRiskScore(req.businessId, c[0].id);
    const appointmentsList = await db.select().from(appointments).where(eq(appointments.clientId, c[0].id));
    res.json({ client: { ...c[0], riskScore: risk }, appointments: appointmentsList });
  } catch (err) { next(err); }
});

router.put('/:id', authRequired, resolveBusinessFromUser, requireRole('owner','manager','receptionist'), async (req, res, next) => {
  try {
    const data = clientSchema.partial().parse(req.body);
    await db.update(clients).set(data).where(and(eq(clients.id, req.params.id), eq(clients.businessId, req.businessId)));
    const updated = await db.select().from(clients).where(eq(clients.id, req.params.id)).limit(1);
    res.json({ client: updated[0] });
  } catch (err) { next(err); }
});

export default router;
