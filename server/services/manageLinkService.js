import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function createManageToken(appointmentId, businessId, days = 30) {
  return jwt.sign({ a: appointmentId, b: businessId, t: 'manage' }, SECRET, { expiresIn: `${days}d` });
}

export function verifyManageToken(token) {
  const p = jwt.verify(token, SECRET);
  if (p.t !== 'manage') throw new Error('Invalid token');
  return { appointmentId: p.a, businessId: p.b };
}

export function manageUrl(token) {
  const base = process.env.PUBLIC_URL || '';
  return `${base}/manage/${token}`;
}
