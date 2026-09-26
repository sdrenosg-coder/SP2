import api from './client.js';

export const fmtDate = (d) => (d ? new Date(d).toLocaleString() : '—');
export const money = (v) => `$${Number(v ?? 0).toFixed(2)}`;

export const featuresApi = {
  listGiftCards: (bid) => api.get(`/features/businesses/${bid}/gift-cards`),
  issueGiftCard: (bid, data) => api.post(`/features/businesses/${bid}/gift-cards`, data),
  getGiftCard: (bid, code) => api.get(`/features/businesses/${bid}/gift-cards/${encodeURIComponent(code)}`),
  redeemGiftCard: (bid, code, data) => api.post(`/features/businesses/${bid}/gift-cards/${encodeURIComponent(code)}/redeem`, data),
  listAudit: (bid) => api.get(`/features/businesses/${bid}/audit-logs`),
  createManageLink: (bid, appointmentId) => api.post(`/features/businesses/${bid}/appointments/${appointmentId}/manage-link`),
  getManage: (token) => api.get(`/features/manage/${token}`),
  reschedule: (token, newStartAt) => api.post(`/features/manage/${token}/reschedule`, { newStartAt }),
  cancel: (token) => api.post(`/features/manage/${token}/cancel`),
};
