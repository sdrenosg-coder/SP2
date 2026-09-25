const API_BASE = '/api';

async function request(method, url, data) {
  const options = { method, headers: { 'Content-Type': 'application/json' }, credentials: 'include' };
  if (data && method !== 'GET') options.body = JSON.stringify(data);
  const res = await fetch(`${API_BASE}${url}`, options);
  const contentType = res.headers.get('content-type');
  const body = contentType?.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) throw new Error(body.error || 'Request failed');
  return body;
}

const api = {
  get: (url) => request('GET', url),
  post: (url, data) => request('POST', url, data),
  put: (url, data) => request('PUT', url, data),
  patch: (url, data) => request('PATCH', url, data),
  delete: (url) => request('DELETE', url),
};

export default api;
