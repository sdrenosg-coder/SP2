import express from 'express';
import { db } from '../db/index.js';
import { users, businesses, appointments, clients } from '../db/schema.js';
import { eq, count, desc } from 'drizzle-orm';
import { requireSuperAdmin } from '../middleware/admin.js';

const router = express.Router();

router.use(requireSuperAdmin);

router.get('/stats', async (req, res, next) => {
  try {
    const [userCount, businessCount, apptCount, clientCount] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(businesses),
      db.select({ count: count() }).from(appointments),
      db.select({ count: count() }).from(clients),
    ]);
    res.json({
      users: Number(userCount[0].count),
      businesses: Number(businessCount[0].count),
      appointments: Number(apptCount[0].count),
      clients: Number(clientCount[0].count),
    });
  } catch (err) { next(err); }
});

router.get('/businesses', async (req, res, next) => {
  try {
    const list = await db.select().from(businesses).orderBy(desc(businesses.createdAt));
    res.json({ businesses: list });
  } catch (err) { next(err); }
});

router.patch('/businesses/:id', async (req, res, next) => {
  try {
    const { plan, suspended } = req.body;
    const updateData = {};
    if (plan !== undefined) updateData.plan = plan;
    if (suspended !== undefined) updateData.suspended = suspended;
    await db.update(businesses).set(updateData).where(eq(businesses.id, req.params.id));
    const updated = await db.select().from(businesses).where(eq(businesses.id, req.params.id)).limit(1);
    res.json({ business: updated[0] });
  } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  try {
    const list = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json({ users: list });
  } catch (err) { next(err); }
});

router.patch('/users/:id', async (req, res, next) => {
  try {
    const { role_global, is_active } = req.body;
    const updateData = {};
    if (role_global !== undefined) updateData.role_global = role_global;
    if (is_active !== undefined) updateData.is_active = is_active;
    await db.update(users).set(updateData).where(eq(users.id, req.params.id));
    const updated = await db.select().from(users).where(eq(users.id, req.params.id)).limit(1);
    res.json({ user: updated[0] });
  } catch (err) { next(err); }
});

export default router;
