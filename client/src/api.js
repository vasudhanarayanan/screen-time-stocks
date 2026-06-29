const BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('sts_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: getAuthHeaders(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  loginGoogle: (credential) => request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  loginDemo: (name) => request('/auth/demo', { method: 'POST', body: JSON.stringify({ name }) }),
  getMe: () => request('/auth/me'),
  regenerateApiKey: () => request('/auth/api-key', { method: 'POST' }),

  // Users
  getUsers: () => request('/users'),
  getUser: (id) => request(`/users/${id}`),
  createUser: (name) => request('/users', { method: 'POST', body: JSON.stringify({ name }) }),

  // Apps
  getUserApps: (userId) => request(`/apps/user/${userId}`),
  getAppHistory: (appId) => request(`/apps/${appId}/history`),
  createApp: (data) => request('/apps', { method: 'POST', body: JSON.stringify(data) }),
  deleteApp: (id) => request(`/apps/${id}`, { method: 'DELETE' }),

  // Snapshots
  logTime: (data) => request('/snapshots', { method: 'POST', body: JSON.stringify(data) }),
  logTimeBatch: (data) => request('/snapshots/batch', { method: 'POST', body: JSON.stringify(data) }),

  // Markets
  getMarket: (id) => request(`/markets/${id}`),
  getUserMarkets: (userId) => request(`/markets/user/${userId}`),
  createMarket: (data) => request('/markets', { method: 'POST', body: JSON.stringify(data) }),
  joinMarket: (data) => request('/markets/join', { method: 'POST', body: JSON.stringify(data) }),
};
