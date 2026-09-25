import { db } from '../db/index.js';
import { businesses, businessUsers } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function resolveBusinessFromUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  const membership = await db.select().from(businessUsers).where(eq(businessUsers.user_id, req.user.id)).limit(1);
  if (!membership.length) return res.status(403).json({ error: 'No business assigned' });
  req.businessId = membership[0].business_id;
  req.userRole = membership[0].role;
  next();
}

export async function resolveBusinessFromSlug(req, res, next) {
  const { slug } = req.params;
  if (!slug) return next();
  const result = await db.select().from(businesses).where(eq(businesses.slug, slug)).limit(1);
  if (!result.length) return res.status(404).json({ error: 'Business not found' });
  req.businessId = result[0].id;
  req.business = result[0];
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
