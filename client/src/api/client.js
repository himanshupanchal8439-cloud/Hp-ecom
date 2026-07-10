const API = import.meta.env.VITE_API_BASE || '/api';

let token = localStorage.getItem('token') || null;
let onUnauthorized = () => {};

export function setToken(next) {
  token = next;
  if (next) localStorage.setItem('token', next);
  else localStorage.removeItem('token');
}

export function getToken() {
  return token;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function api(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) {
    onUnauthorized();
  }
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
