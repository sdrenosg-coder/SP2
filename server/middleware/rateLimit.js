const buckets = new Map();
export function rateLimit(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    if (!buckets.has(key)) buckets.set(key, []);
    const timestamps = buckets.get(key).filter(t => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    timestamps.push(now);
    buckets.set(key, timestamps);
    next();
  };
}
