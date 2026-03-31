import axios from 'axios';

// FIX: VITE_API_URL MUST be set in your Vercel environment variables.
// Without it the fallback '/api' is a relative URL that points to Vercel
// (your frontend host) instead of your Render backend — causing all API
// calls to silently 404.
//
// In Vercel dashboard → Settings → Environment Variables, add:
//   VITE_API_URL = https://your-backend.onrender.com/api
//
// Note: the baseURL already includes /api, so call routes without it:
//   api.get('/recommend/movies')  →  https://your-backend.onrender.com/api/recommend/movies ✅
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  // FIX: Increased from 20s → 35s.
  // The Node backend waits up to 30s for the Python service (cold start /
  // model download from Google Drive). The frontend must wait longer than
  // the backend, otherwise the frontend cancels the request before the
  // backend gets a chance to respond.
  timeout: 35000,
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
