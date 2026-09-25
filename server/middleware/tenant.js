import { db } from '../db/index.js';
import { businesses, businessUsers } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function resolveBusinessFromUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const membership = await db.select().from(businessUsers).where(eq(businessUsers.userId, req.user.id)).limit(1);
    if (!membership.length) return res.status(403).json({ error: 'No business assigned' });
    const [business] = await db.select({ id: businesses.id, suspended: businesses.suspended })
      .from(businesses).where(eq(businesses.id, membership[0].businessId)).limit(1);
    if (!business) return res.status(404).json({ error: 'Business not found' });
    if (business.suspended) return res.status(403).json({ error: 'Business suspended' });
    req.businessId = business.id;
    req.userRole = membership[0].role;
    next();
  } catch (err) { next(err); }
}

export async function resolveBusinessFromSlug(req, res, next) {
  try {
    const { slug } = req.params;
    if (!slug) return next();
    const result = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
    if (!result.length) return res.status(404).json({ error: 'Business not found' });
    if (result[0].suspended) return res.status(403).json({ error: 'Business suspended' });
    req.businessId = result[0].id;
    req.business = result[0];
    next();
  } catch (err) { next(err); }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
