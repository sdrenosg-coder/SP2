import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db, pool } from './index.js';
import { users } from './schema.js';
import { eq } from 'drizzle-orm';

const email = process.env.ADMIN_EMAIL || (process.env.NODE_ENV === 'production' ? null : 'admin@bookly.demo');
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Set ADMIN_EMAIL to a valid address before setting up a production admin.');
  process.exitCode = 1;
} else {
  try {
    const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing && existing.roleGlobal !== 'superadmin') {
      throw new Error('That email already belongs to a non-admin account. Choose another email.');
    }
    const password = randomBytes(24).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 12);
    if (existing) {
      await db.update(users).set({ passwordHash, isActive: true }).where(eq(users.id, existing.id));
    } else {
      await db.insert(users).values({ email, passwordHash, name: 'Platform Admin', roleGlobal: 'superadmin' });
    }
    console.log(`Admin ready for ${email}. One-time password: ${password}`);
    console.log('Copy the password now; it is not stored in plaintext. Run this command again to rotate it.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
await pool.end();