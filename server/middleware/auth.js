import { verifyToken, getCredentialVersion } from '../utils/tokens.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function authRequired(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  try {
    const [user] = await db.select({
      id: users.id, email: users.email, name: users.name,
      phone: users.phone, roleGlobal: users.roleGlobal, isActive: users.isActive,
      passwordHash: users.passwordHash,
    }).from(users).where(eq(users.id, payload.id)).limit(1);
    if (!user || !user.isActive || payload.credentialVersion !== getCredentialVersion(user.passwordHash)) {
      return res.status(401).json({ error: 'Account unavailable' });
    }
    const { isActive, passwordHash, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) { next(err); }
}

export async function optionalAuth(req, res, next) {
  const token = req.cookies?.token;
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      try {
        const [user] = await db.select({
          id: users.id, email: users.email, name: users.name, phone: users.phone,
          roleGlobal: users.roleGlobal, isActive: users.isActive, passwordHash: users.passwordHash,
        })
          .from(users).where(eq(users.id, payload.id)).limit(1);
        if (user?.isActive && payload.credentialVersion === getCredentialVersion(user.passwordHash)) {
          const { isActive, passwordHash, ...safeUser } = user;
          req.user = safeUser;
        }
      } catch (err) { return next(err); }
    }
  }
  next();
}
