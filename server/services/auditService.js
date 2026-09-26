import { q } from '../db/featuresPool.js';

export async function audit({ businessId = null, actor = 'system', action, entity = null, entityId = null, meta = {} }) {
  try {
    await q(
      'INSERT INTO audit_logs (business_id, actor, action, entity, entity_id, meta) VALUES ($1,$2,$3,$4,$5,$6)',
      [businessId, actor, action, entity, entityId == null ? null : String(entityId), meta]
    );
  } catch (e) {
    console.error('audit failed', e.message);
  }
}

export const listAudit = (businessId, limit = 100) =>
  q('SELECT * FROM audit_logs WHERE business_id=$1 ORDER BY created_at DESC LIMIT $2', [businessId, limit]);
