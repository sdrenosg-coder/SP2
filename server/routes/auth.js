import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users, businesses } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { registerSchema, loginSchema } from '../utils/validation.js';
import { generateAccessToken } from '../utils/tokens.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (existing.length) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(data.password, 10);
    const result = await db.insert(users).values({ email: data.email, passwordHash, name: data.name, phone: data.phone }).returning();
    const user = result[0];
    const token = generateAccessToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
      .status(201).json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) { next(err); }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const userRows = await db.select().from(users).where(eq(users.email, data.email)).limit(1);
    if (!userRows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = userRows[0];
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = generateAccessToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
      .json({ user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) { next(err); }
});

router.get('/me', authRequired, async (req, res, next) => {
  try {
    const userRows = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    if (!userRows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ user: userRows[0] });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => res.clearCookie('token').json({ success: true }));

// Public endpoint to check if demo data exists (no credentials exposed)
router.get('/demo-status', async (req, res, next) => {
  try {
    const demoUser = await db.select().from(users).where(eq(users.email, 'owner@bookly.demo')).limit(1);
    const demoBusiness = await db.select().from(businesses).where(eq(businesses.slug, 'glow-studio')).limit(1);
    res.json({ available: demoUser.length > 0 && demoBusiness.length > 0 });
  } catch (err) { next(err); }
});

export default router;
