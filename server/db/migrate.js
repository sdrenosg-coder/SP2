import { readFileSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { pool } from './index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(here, 'migrations');

// Postgres "already exists" error codes: duplicate table/column/object/index/function
const ALREADY_EXISTS = new Set(['42P07', '42701', '42710', '42P06', '42723', '42P16']);

export async function runMigrations({ log = console.log } = {}) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Base schema: apply only on a fresh database.
  const { rows: base } = await pool.query(`SELECT to_regclass('public.users') AS t`);
  if (!base[0].t) {
    log('Applying base schema.sql');
    await pool.query(readFileSync(path.join(here, 'schema.sql'), 'utf8'));
  }
  await pool.query(
    `INSERT INTO schema_migrations (name) VALUES ('schema.sql') ON CONFLICT DO NOTHING`
  );

  const { rows } = await pool.query('SELECT name FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      await client.query('COMMIT');
      log(`Applied migration ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      if (ALREADY_EXISTS.has(err.code)) {
        // Previously applied outside the tracker (e.g. old applyGrowthMigration.js).
        await pool.query(
          'INSERT INTO schema_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
          [file]
        );
        log(`Migration ${file} already present (${err.message}); marked as applied`);
      } else {
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    } finally {
      client.release();
    }
  }
  log('Database schema up to date.');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    await runMigrations();
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
