const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
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
  getUsers: () => request('/users'),
  getUser: (id) => request(`/users/${id}`),
  createUser: (name) => request('/users', { method: 'POST', body: JSON.stringify({ name }) }),

  getUserApps: (userId) => request(`/apps/user/${userId}`),
  getAppHistory: (appId) => request(`/apps/${appId}/history`),
  createApp: (data) => request('/apps', { method: 'POST', body: JSON.stringify(data) }),
  deleteApp: (id) => request(`/apps/${id}`, { method: 'DELETE' }),

  logTime: (data) => request('/snapshots', { method: 'POST', body: JSON.stringify(data) }),
  logTimeBatch: (data) => request('/snapshots/batch', { method: 'POST', body: JSON.stringify(data) }),

  getMarket: (id) => request(`/markets/${id}`),
  getUserMarkets: (userId) => request(`/markets/user/${userId}`),
  createMarket: (data) => request('/markets', { method: 'POST', body: JSON.stringify(data) }),
  joinMarket: (data) => request('/markets/join', { method: 'POST', body: JSON.stringify(data) }),
};
