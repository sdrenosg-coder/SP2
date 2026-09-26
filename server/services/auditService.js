import { db } from '../db/index.js';
import { auditLogs } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export async function audit({ businessId = null, actor = 'system', action, entity = null, entityId = null, meta = {} }) {
  try {
    await db.insert(auditLogs).values({
      businessId, actor, action, entity,
      entityId: entityId == null ? null : String(entityId),
      meta,
    });
  } catch (err) {
    // Auditing must never block the primary action.
    console.error('audit failed', err.message);
  }
}

export function listAudit(businessId, limit = 200) {
  return db.select().from(auditLogs)
    .where(eq(auditLogs.businessId, businessId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
