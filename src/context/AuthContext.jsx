// src/context/AuthContext.jsx
import {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import api, { setToken, clearToken, getToken } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [fbUser,  setFbUser]  = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Sync Firebase user → backend, get JWT + onboarding status ─────────────
  const syncWithBackend = useCallback(async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken(true);
      const { data } = await api.post('/auth/firebase', { idToken });

      // ✅ FIX: Store token FIRST before any subsequent calls
      setToken(data.token);

      // ✅ FIX: Pass token explicitly in header to avoid race condition
      //         where localStorage hasn't been read yet by the interceptor
      let onboarded = false;
      try {
        const prefRes = await api.get('/preferences', {
          headers: { Authorization: `Bearer ${data.token}` },
        });
        onboarded = prefRes.data?.preferences?.onboarded || false;
      } catch (prefErr) {
        // 404 = no preferences yet (new user) — not onboarded, that's fine
        // 401 = token issue — non-fatal, treat as not onboarded
        if (prefErr.response?.status !== 404 && prefErr.response?.status !== 401) {
          console.warn('Unexpected preferences error:', prefErr.message);
        }
      }

      const enrichedUser = { ...data.user, onboarded };
      setUser(enrichedUser);
      return enrichedUser;
    } catch (err) {
      console.error('Backend sync failed:', err.message);
      const fallback = {
        uid:       firebaseUser.uid,
        email:     firebaseUser.email,
        name:      firebaseUser.displayName || firebaseUser.email,
        photoURL:  firebaseUser.photoURL || null,
        provider:  'firebase',
        onboarded: false,
      };
      setUser(fallback);
      return fallback;
    }
  }, []);

  // ── Firebase auth state listener ───────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setFbUser(fbUser);
      if (fbUser) {
        await syncWithBackend(fbUser);
      } else {
        setUser(null);
        clearToken();
      }
      setLoading(false);
    });
    return unsub;
  }, [syncWithBackend]);

  // ── Listen for token expiry from Axios interceptor ─────────────────────────
  useEffect(() => {
    const handler = () => {
      setUser(null);
      setFbUser(null);
      clearToken();
    };
    window.addEventListener('pp:auth:expired', handler);
    return () => window.removeEventListener('pp:auth:expired', handler);
  }, []);

  // ── Re-hydrate if JWT exists but Firebase session is missing ───────────────
  useEffect(() => {
    const token = getToken();
    if (token && !user && !loading) {
      api.get('/auth/me')
        .then(async ({ data }) => {
          let onboarded = false;
          try {
            const prefRes = await api.get('/preferences');
            onboarded = prefRes.data?.preferences?.onboarded || false;
          } catch {}
          setUser({ ...data.user, onboarded });
        })
        .catch(() => clearToken());
    }
  }, [loading]); // eslint-disable-line

  // ── Public actions ─────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return syncWithBackend(cred.user);
  }, [syncWithBackend]);

  const register = useCallback(async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    return syncWithBackend(cred.user);
  }, [syncWithBackend]);

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    return syncWithBackend(cred.user);
  }, [syncWithBackend]);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setFbUser(null);
    clearToken();
    Object.keys(localStorage)
      .filter((k) => k.startsWith('pp_') && k !== 'pp_theme' && k !== 'pp_ui')
      .forEach((k) => localStorage.removeItem(k));
  }, []);

  const forgotPassword = useCallback(async (email) => {
    const actionCodeSettings = {
      url: `${window.location.origin}/reset-password`,
      handleCodeInApp: false,
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
  }, []);

  const updateDisplayName = useCallback(async (name) => {
    if (fbUser) await updateProfile(fbUser, { displayName: name });
    try {
      const { data } = await api.patch('/auth/me', { name });
      setUser((prev) => ({ ...prev, ...data.user }));
    } catch {}
  }, [fbUser]);

  const markOnboarded = useCallback(() => {
    setUser((prev) => prev ? { ...prev, onboarded: true } : prev);
  }, []);

  const value = {
    user,
    fbUser,
    loading,
    isLoggedIn:  !!user,
    login,
    register,
    loginWithGoogle,
    logout,
    forgotPassword,
    updateDisplayName,
    markOnboarded,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
