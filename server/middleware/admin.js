import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { authRequired } from './auth.js';

export async function requireSuperAdmin(req, res, next) {
  await authRequired(req, res, async () => {
    const userRows = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    if (!userRows.length || userRows[0].role_global !== 'superadmin') {
      return res.status(403).json({ error: 'Superadmin access required' });
    }
    next();
  });
}
