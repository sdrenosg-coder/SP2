const DEFAULTS = { depositPercent: 20, highRiskDepositPercent: 50, noShowFeePercent: 50, minCancelHours: 24, depositForHighRisk: true };

export function policyOf(business) {
  return { ...DEFAULTS, ...(business?.policies || {}) };
}

/** riskScore: 0-100 (from riskService). Returns amount to collect up front. */
export function computeDeposit({ price, depositRequired, riskScore = 0, business }) {
  const p = policyOf(business);
  const amount = Number(price) || 0;
  let pct = 0;
  let reason = 'none';
  if (depositRequired) { pct = p.depositPercent; reason = 'service_policy'; }
  if (p.depositForHighRisk && riskScore >= 70) {
    if (p.highRiskDepositPercent > pct) { pct = p.highRiskDepositPercent; reason = 'high_risk'; }
  }
  return { amount: Math.round(amount * pct) / 100, percent: pct, reason };
}

export function computeNoShowFee({ price, business }) {
  const p = policyOf(business);
  return Math.round((Number(price) || 0) * p.noShowFeePercent) / 100;
}

export function canChange({ startAt, business, now = new Date() }) {
  const p = policyOf(business);
  const hours = (new Date(startAt) - now) / 36e5;
  return { allowed: hours >= p.minCancelHours, hoursUntil: hours, minCancelHours: p.minCancelHours };
}
