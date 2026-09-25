import { readFileSync } from 'fs';
import { pool } from './index.js';

const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
await pool.query(sql);
console.log('Database schema initialized.');
await pool.end();
