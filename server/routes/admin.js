import express from 'express';
import { db } from '../db/index.js';
import { users, businesses, appointments, clients } from '../db/schema.js';
import { eq, count, desc, and, sql } from 'drizzle-orm';
import { authRequired } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/admin.js';

const router = express.Router();
router.use(authRequired, requireSuperAdmin);

const userFields = {
  id: users.id, email: users.email, name: users.name, phone: users.phone,
  roleGlobal: users.roleGlobal, isActive: users.isActive, createdAt: users.createdAt,
};

function parseId(req, res) {
  const id = Number(req.params.id);
  if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return null;
  }
  return id;
}

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
  const id = parseId(req, res);
  if (id === null) return;
  const { plan, suspended } = req.body ?? {};
  if ((plan !== undefined && !['free', 'pro', 'business'].includes(plan))
      || (suspended !== undefined && typeof suspended !== 'boolean')
      || (plan === undefined && suspended === undefined)) {
    return res.status(400).json({ error: 'Provide a valid plan or suspended status' });
  }
  try {
    const [business] = await db.update(businesses)
      .set({ ...(plan !== undefined ? { plan } : {}), ...(suspended !== undefined ? { suspended } : {}) })
      .where(eq(businesses.id, id)).returning();
    if (!business) return res.status(404).json({ error: 'Business not found' });
    res.json({ business });
  } catch (err) { next(err); }
});

router.get('/users', async (req, res, next) => {
  try {
    const list = await db.select(userFields).from(users).orderBy(desc(users.createdAt));
    res.json({ users: list });
  } catch (err) { next(err); }
});

router.patch('/users/:id', async (req, res, next) => {
  const id = parseId(req, res);
  if (id === null) return;
  const { role_global: roleGlobal, is_active: isActive } = req.body ?? {};
  if ((roleGlobal !== undefined && !['user', 'superadmin', 'support'].includes(roleGlobal))
      || (isActive !== undefined && typeof isActive !== 'boolean')
      || (roleGlobal === undefined && isActive === undefined)) {
    return res.status(400).json({ error: 'Provide a valid role or active status' });
  }
  try {
    const result = await db.transaction(async (tx) => {
      // Serialize role updates so two admins cannot deactivate each other at once.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(924875)`);
      const [target] = await tx.select(userFields).from(users).where(eq(users.id, id)).limit(1);
      if (!target) return { status: 404, error: 'User not found' };
      const removesAdmin = target.roleGlobal === 'superadmin'
        && ((roleGlobal !== undefined && roleGlobal !== 'superadmin') || isActive === false);
      if (id === req.user.id && removesAdmin) {
        return { status: 400, error: 'You cannot remove your own admin access' };
      }
      if (target.isActive && removesAdmin) {
        const [adminCount] = await tx.select({ count: count() }).from(users)
          .where(and(eq(users.roleGlobal, 'superadmin'), eq(users.isActive, true)));
        if (Number(adminCount.count) <= 1) {
          return { status: 400, error: 'At least one active superadmin is required' };
        }
      }
      const [user] = await tx.update(users)
        .set({ ...(roleGlobal !== undefined ? { roleGlobal } : {}), ...(isActive !== undefined ? { isActive } : {}) })
        .where(eq(users.id, id)).returning(userFields);
      return { user };
    });
    if (result.error) return res.status(result.status).json({ error: result.error });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;