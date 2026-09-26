const BASE = '/api/features';

async function req(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

export const featuresApi = {
  getManage: (token) => req(`/manage/${token}`),
  reschedule: (token, startAt) => req(`/manage/${token}/reschedule`, { method: 'POST', body: { startAt } }),
  cancel: (token) => req(`/manage/${token}/cancel`, { method: 'POST' }),
  listGiftCards: (bid) => req(`/businesses/${bid}/gift-cards`),
  issueGiftCard: (bid, body) => req(`/businesses/${bid}/gift-cards`, { method: 'POST', body }),
  getGiftCard: (bid, code) => req(`/businesses/${bid}/gift-cards/${encodeURIComponent(code)}`),
  redeemGiftCard: (bid, code, body) =>
    req(`/businesses/${bid}/gift-cards/${encodeURIComponent(code)}/redeem`, { method: 'POST', body }),
  listAudit: (bid) => req(`/businesses/${bid}/audit`),
};

export const resolveBusinessId = (prop) => prop ?? localStorage.getItem('businessId');
export const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');
export const money = (n) => `$${Number(n || 0).toFixed(2)}`;
