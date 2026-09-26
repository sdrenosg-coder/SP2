// Run: node --test server/test
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Pure policy helpers mirrored from manageLinkService/giftCardService semantics.
export function cancelPolicy(startAt, minCancelHours, now = new Date()) {
  const hoursLeft = (new Date(startAt) - now) / 36e5;
  return { allowed: hoursLeft >= minCancelHours, hoursLeft };
}

export function applyGiftCard(balance, amount) {
  const bal = Number(balance), amt = Number(amount);
  if (!(amt > 0)) throw new Error('Invalid amount');
  const applied = Math.min(bal, amt);
  return { applied, balance: +(bal - applied).toFixed(2) };
}

export function depositFor(riskScore, price, { threshold = 50, pct = 0.25 } = {}) {
  return riskScore >= threshold ? +(Number(price) * pct).toFixed(2) : 0;
}

test('cancel policy allows early changes', () => {
  const now = new Date('2024-01-01T00:00:00Z');
  assert.equal(cancelPolicy('2024-01-02T00:00:00Z', 24, now).allowed, true);
  assert.equal(cancelPolicy('2024-01-01T10:00:00Z', 24, now).allowed, false);
});

test('gift card redemption caps at balance', () => {
  assert.deepEqual(applyGiftCard(20, 50), { applied: 20, balance: 0 });
  assert.deepEqual(applyGiftCard(100, 30.5), { applied: 30.5, balance: 69.5 });
  assert.throws(() => applyGiftCard(10, 0));
});

test('deposit required only for risky clients', () => {
  assert.equal(depositFor(80, 100), 25);
  assert.equal(depositFor(10, 100), 0);
});
