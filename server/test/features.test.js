// Run: node --test server/test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canChange, computeDeposit, computeNoShowFee } from '../services/depositService.js';

test('cancel policy allows early changes', () => {
  const now = new Date('2024-01-01T00:00:00Z');
  assert.equal(canChange({ startAt: '2024-01-02T00:00:00Z', business: null, now }).allowed, true);
  assert.equal(canChange({ startAt: '2024-01-01T10:00:00Z', business: null, now }).allowed, false);
});

test('deposit required only when service or risk policy triggers it', () => {
  assert.equal(computeDeposit({ price: 100, depositRequired: false, riskScore: 10 }).amount, 0);
  assert.equal(computeDeposit({ price: 100, depositRequired: true, riskScore: 10 }).amount, 20);
  assert.equal(computeDeposit({ price: 100, depositRequired: false, riskScore: 90 }).amount, 50);
});

test('no-show fee is a percentage of price', () => {
  assert.equal(computeNoShowFee({ price: 100, business: null }), 50);
});
