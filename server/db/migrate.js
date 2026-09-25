import { readFileSync } from 'fs';
import { pool } from './index.js';

const schemaSql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
const migrationSql = readFileSync(new URL('./migrations/002_add_role_global.sql', import.meta.url), 'utf8');
await pool.query(schemaSql);
await pool.query(migrationSql);
console.log('Database schema initialized.');
await pool.end();
