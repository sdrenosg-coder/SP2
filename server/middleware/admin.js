export function requireSuperAdmin(req, res, next) {
  if (req.user?.roleGlobal !== 'superadmin') {
    return res.status(403).json({ error: 'Superadmin access required' });
  }
  next();
}
