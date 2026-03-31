import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
});

// ── Request: inject stored JWT ────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pp_jwt');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: handle 401 ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const url      = original?.url || '';

    // Never fire pp:auth:expired during auth calls themselves —
    // a failed /auth/firebase or /auth/login must NOT wipe the user.
    const isAuthCall = url.includes('/auth/');

    if (err.response?.status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      localStorage.removeItem('pp_jwt');
      window.dispatchEvent(new CustomEvent('pp:auth:expired'));
    }
    return Promise.reject(err);
  }
);

export default api;

// ── Helpers ───────────────────────────────────────────────────────────────────
export const setToken   = (token) => localStorage.setItem('pp_jwt', token);
export const clearToken = ()      => localStorage.removeItem('pp_jwt');
export const getToken   = ()      => localStorage.getItem('pp_jwt');