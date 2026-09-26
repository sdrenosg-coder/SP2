// Deprecated: migrations are now handled by migrate.js. Kept as a shim for old scripts.
import { runMigrations } from './migrate.js';
import { pool } from './index.js';

try {
  await runMigrations();
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
