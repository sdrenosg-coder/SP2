import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config.js';

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes('neon') ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool);
export { pool };
