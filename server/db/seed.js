import { readFileSync } from 'fs';
import bcrypt from 'bcryptjs';
import { pool } from './index.js';

const schemaSql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
await pool.query(schemaSql);

// Idempotent: exit if demo data already exists
const existingDemo = await pool.query(`SELECT id FROM users WHERE email = 'owner@bookly.demo'`);
if (existingDemo.rows.length === 0) {
  const passwordHash = await bcrypt.hash('password123', 10);
  const userRes = await pool.query(
    `INSERT INTO users (email, password_hash, name, phone, role_global) VALUES ('owner@bookly.demo', $1, 'Ava Owner', '555-0100', 'user') RETURNING id`,
    [passwordHash],
  );
  const userId = userRes.rows[0].id;

  const bizRes = await pool.query(
    `INSERT INTO businesses (slug, name, category, timezone, currency, policies, plan, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    ['glow-studio', 'Glow Studio', 'Hair & Beauty', 'America/New_York', 'USD',
     '{ "cancellation_hours": 24, "no_show_fee": 20, "deposit_percent": 20 }', 'pro', userId],
  );
  const businessId = bizRes.rows[0].id;

  await pool.query(
    `INSERT INTO business_users (business_id, user_id, role) VALUES ($1, $2, 'owner')`,
    [businessId, userId],
  );

  const locRes = await pool.query(
    `INSERT INTO locations (business_id, name, address, timezone, opening_hours)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [businessId, 'Main Location', '123 Main St, New York, NY', 'America/New_York',
     '{"monday":[{"open":"09:00","close":"18:00"}],"tuesday":[{"open":"09:00","close":"18:00"}],"wednesday":[{"open":"09:00","close":"18:00"}],"thursday":[{"open":"09:00","close":"18:00"}],"friday":[{"open":"09:00","close":"18:00"}],"saturday":[{"open":"10:00","close":"16:00"}],"sunday":[]}'],
  );
  const locationId = locRes.rows[0].id;

  const staffData = [
    ['Anna Smith', 'Stylist', '#7c3aed', 0.5],
    ['Ben Johnson', 'Colorist', '#3b82f6', 0.5],
    ['Cara Lee', 'Nail Tech', '#10b981', 0.4],
  ];
  const staffIds = [];
  for (const [name, title, color, comm] of staffData) {
    const r = await pool.query(
      `INSERT INTO staff (business_id, name, title, color, commission_rate) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [businessId, name, title, color, comm],
    );
    staffIds.push(r.rows[0].id);
  }

  for (const staffId of staffIds) {
    for (let day = 1; day <= 5; day++) {
      await pool.query(
        `INSERT INTO staff_shifts (staff_id, location_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, '09:00', '18:00')`,
        [staffId, locationId, day],
      );
    }
    await pool.query(
      `INSERT INTO staff_shifts (staff_id, location_id, day_of_week, start_time, end_time) VALUES ($1, $2, 6, '10:00', '16:00')`,
      [staffId, locationId],
    );
  }

  const servicesData = [
    ['Women\'s Haircut', 'Classic cut and style', 60, 65.00, 'Hair', 35, false, 5, 5],
    ['Men\'s Haircut', 'Clipper or scissor cut', 45, 45.00, 'Hair', 28, false, 0, 0],
    ['Full Color', 'All-over color application', 120, 140.00, 'Color', 42, true, 10, 10],
    ['Manicure', 'Basic nail care', 45, 40.00, 'Nails', 21, false, 0, 0],
    ['Pedicure', 'Relaxing foot treatment', 60, 55.00, 'Nails', 28, false, 0, 0],
  ];
  const serviceIds = [];
  for (const [name, desc, dur, price, cat, rebook, deposit, bufBefore, bufAfter] of servicesData) {
    const r = await pool.query(
      `INSERT INTO services (business_id, name, description, duration_minutes, price, category, rebook_interval_days, deposit_required, buffer_before, buffer_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [businessId, name, desc, dur, price, cat, rebook, deposit, bufBefore, bufAfter],
    );
    serviceIds.push(r.rows[0].id);
  }

  const assignments = [
    [staffIds[0], serviceIds[0]], [staffIds[0], serviceIds[1]],
    [staffIds[1], serviceIds[2]],
    [staffIds[2], serviceIds[3]], [staffIds[2], serviceIds[4]],
  ];
  for (const [sid, svc] of assignments) {
    await pool.query(
      `INSERT INTO staff_services (staff_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [sid, svc],
    );
  }

  const clientData = [
    ['Sarah', 'Connor', 'sarah@example.com', '555-1001', 'Prefers short hair', '["vip"]', null, 0, 120],
    ['John', 'Doe', 'john@example.com', '555-1002', '', '[]', 'None', 1, 50],
    ['Emily', 'Clark', 'emily@example.com', '555-1003', 'Allergic to nail polish', '[]', 'Nail polish', 0, 0],
  ];
  for (const [first, last, email, phone, notes, tags, allergies, noShow, points] of clientData) {
    await pool.query(
      `INSERT INTO clients (business_id, first_name, last_name, email, phone, notes, tags, allergies, no_show_count, loyalty_points)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [businessId, first, last, email, phone, notes, tags, allergies, noShow, points],
    );
  }

  await pool.query(
    `INSERT INTO pricing_rules (business_id, name, days_of_week, start_time, end_time, discount_percent, service_ids)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [businessId, 'Weekday Morning -15%', JSON.stringify([1,2,3,4,5]), '09:00', '12:00', 15, JSON.stringify(serviceIds)],
  );
}

// Seed superadmin
const existingAdmin = await pool.query(`SELECT id FROM users WHERE email = 'admin@bookly.demo'`);
if (existingAdmin.rows.length === 0) {
  const adminHash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO users (email, password_hash, name, phone, role_global) VALUES ('admin@bookly.demo', $1, 'Platform Admin', '555-0000', 'superadmin')`,
    [adminHash],
  );
  console.log('Superadmin created: admin@bookly.demo / admin123');
}

console.log('Seed complete.');
await pool.end();
