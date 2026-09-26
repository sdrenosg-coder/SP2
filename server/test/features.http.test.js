// Integration smoke test against a running server.
// Run: BASE_URL=http://localhost:3000 node --test server/test
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL;

test('invalid manage token is rejected', { skip: !BASE && 'BASE_URL not set' }, async () => {
  const r = await fetch(`${BASE}/api/features/manage/not-a-real-token`);
  assert.ok(r.status >= 400 && r.status < 500);
});

test('gift cards require auth', { skip: !BASE && 'BASE_URL not set' }, async () => {
  const r = await fetch(`${BASE}/api/features/businesses/1/gift-cards`);
  assert.ok([401, 403].includes(r.status));
});
