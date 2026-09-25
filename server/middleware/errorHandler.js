export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate value' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}
