// src/App.jsx
import {
  BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate,
} from 'react-router-dom';
import { useEffect } from 'react';

import { ToastProvider }  from './context/ToastContext';
import { AuthProvider }   from './context/AuthContext';
import { ListsProvider }  from './context/ListsContext';
import { useAuth }        from './context/AuthContext';

import Navbar  from './components/Navbar';
import ChatBot from './components/ChatBot';

/* ── Auth pages (no Navbar) ─────────────────────────────────────────────── */
import LoginPage from './pages/LoginPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordPages';

/* ── Onboarding ──────────────────────────────────────────────────────────── */
import WelcomePage from './pages/WelcomePage';

/* ── App pages ───────────────────────────────────────────────────────────── */
import HomePage       from './pages/HomePage';
import MoviesPage     from './pages/MoviesPage';
import SongsPage      from './pages/SongsPage';
import BooksPage      from './pages/BooksPage';
import GamesPage      from './pages/GamesPage';
import EventsPage     from './pages/EventsPage';
import MyListsPage    from './pages/MyListsPage';
import RecommendPage  from './pages/RecommendPage';
import QuizPage       from './pages/QuizPage';
import TeamPage       from './pages/TeamPage';
import PodcastsPage   from './pages/PodcastsPage';
import AudiobooksPage from './pages/AudiobooksPage';
import PremiumPage, { PaymentSuccess, PaymentCancel } from './pages/PremiumPage';
import { AboutPage, ContactPage } from './pages/AboutPage';

// ════════════════════════════════════════════════════════════════════════════
//  GUARDS
// ════════════════════════════════════════════════════════════════════════════

/**
 * ProtectedRoute — requires login.
 * If logged in but NOT onboarded, silently redirects to /welcome FIRST.
 * The /welcome route itself must not trigger this (it IS the onboarding page).
 */
function ProtectedRoute({ children, skipOnboardingCheck = false }) {
  const { isLoggedIn, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  // Redirect to onboarding if not yet completed (and this isn't the welcome page itself)
  if (!skipOnboardingCheck && user && user.onboarded === false) {
    return <Navigate to="/welcome" replace />;
  }

  return children;
}

/**
 * WelcomeGuard — only accessible when logged in AND not yet onboarded.
 * If already onboarded, redirect to /recommendations.
 */
function WelcomeGuard({ children }) {
  const { isLoggedIn, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user?.onboarded) return <Navigate to="/recommendations" replace />;
  return children;
}

// ════════════════════════════════════════════════════════════════════════════
//  LAYOUT  &  LOADER
// ════════════════════════════════════════════════════════════════════════════
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: '1rem',
    }}>
      <div className="spinner" style={{ width: '2.5rem', height: '2.5rem' }} />
      <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>Loading Pixel Pirates…</p>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <footer style={{
        textAlign: 'center', padding: '2rem 1.5rem',
        color: 'var(--text2)', borderTop: '1px solid var(--border)', fontSize: '0.83rem',
      }}>
        © 2026 Pixel Pirates. All rights reserved. 🏴‍☠️
      </footer>
      <ChatBot />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ROUTE TREE
// ════════════════════════════════════════════════════════════════════════════
function AppRoutes() {
  return (
    <Routes>
      {/* ── Auth — no Navbar ─────────────────────────────────────────────── */}
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />

      {/* ── Onboarding — no Navbar, shown once after first login ─────────── */}
      <Route path="/welcome" element={
  <ProtectedRoute skipOnboardingCheck={true}><WelcomePage /></ProtectedRoute>
      } />

      {/* ── Public pages ─────────────────────────────────────────────────── */}
      <Route path="/"         element={<Layout><HomePage /></Layout>} />
      <Route path="/movies"   element={<Layout><MoviesPage /></Layout>} />
      <Route path="/songs"    element={<Layout><SongsPage /></Layout>} />
      <Route path="/books"    element={<Layout><BooksPage /></Layout>} />
      <Route path="/games"    element={<Layout><GamesPage /></Layout>} />
      <Route path="/events"   element={<Layout><EventsPage /></Layout>} />
      <Route path="/podcasts"   element={<Layout><PodcastsPage /></Layout>} />
      <Route path="/audiobooks" element={<Layout><AudiobooksPage /></Layout>} />
      <Route path="/team"     element={<Layout><TeamPage /></Layout>} />
      <Route path="/about"    element={<Layout><AboutPage /></Layout>} />
      <Route path="/contact"  element={<Layout><ContactPage /></Layout>} />
      <Route path="/premium"  element={<Layout><PremiumPage /></Layout>} />
      <Route path="/premium/success" element={<Layout><PaymentSuccess /></Layout>} />
      <Route path="/premium/cancel"  element={<Layout><PaymentCancel /></Layout>} />

      {/* ── Protected pages — require login + onboarding ─────────────────── */}
      <Route path="/lists" element={
        <Layout><ProtectedRoute><MyListsPage /></ProtectedRoute></Layout>
      } />
      <Route path="/quiz" element={
        <Layout><ProtectedRoute><QuizPage /></ProtectedRoute></Layout>
      } />

      {/* ── Recommendations — protected + premium gate inside the page ────── */}
      <Route path="/recommendations" element={
        <Layout>
          <ProtectedRoute><RecommendPage /></ProtectedRoute>
        </Layout>
      } />

      {/* ── 404 ──────────────────────────────────────────────────────────── */}
      <Route path="*" element={
        <Layout>
          <div style={{
            minHeight: '70vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text2)',
          }}>
            <div style={{ fontSize: '5rem' }}>🏴‍☠️</div>
            <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: '2rem', color: 'var(--text)' }}>
              404 — Buried at Sea
            </h2>
            <p>This page was swallowed by the ocean.</p>
            <a href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>⚓ Back to Port</a>
          </div>
        </Layout>
      } />
    </Routes>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  ROOT
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <ListsProvider>
            <AppRoutes />
          </ListsProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
