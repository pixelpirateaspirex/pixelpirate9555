// src/pages/LoginPage.jsx  — Animated & Responsive (Production Ready)
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

/* ── Firebase error → human message ─────────────────────────────────────── */
function fbMsg(code) {
  const map = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/email-already-in-use": "This email is already registered. Try signing in.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
    "auth/network-request-failed": "Network error. Please check your connection.",
  };
  return map[code] || "Authentication failed. Please try again.";
}

/* ── Google SVG ──────────────────────────────────────────────────────────── */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.09 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

/* ── Eye toggle ──────────────────────────────────────────────────────────── */
function EyeBtn({ show, onToggle }) {
  return (
    <button type="button" className="lp-eye-btn" onClick={onToggle} tabIndex={-1} aria-label={show ? "Hide password" : "Show password"}>
      {show ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
      )}
    </button>
  );
}

/* ── Floating Particles Background ──────────────────────────────────────── */
function FloatingParticles() {
  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 18 + 10,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.4 + 0.1,
  }));

  return (
    <div className="lp-particles" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="lp-particle"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: p.opacity,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated Form Field ─────────────────────────────────────────────────── */
function FormField({ id, label, type, placeholder, value, onChange, required, autoComplete, delay = 0, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="lp-form-group" style={{ animationDelay: `${delay}ms` }}>
      <label htmlFor={id} className={`lp-label ${focused || value ? "lp-label--up" : ""}`}>
        {label}
      </label>
      <div className={`lp-input-wrap ${focused ? "lp-input-wrap--focused" : ""}`}>
        {children ? (
          children({ onFocus: () => setFocused(true), onBlur: () => setFocused(false) })
        ) : (
          <input
            id={id}
            type={type}
            className="lp-input"
            placeholder={focused ? placeholder : ""}
            autoComplete={autoComplete}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            required={required}
          />
        )}
        <span className="lp-input-line" />
      </div>
    </div>
  );
}

/* ── Sign In form ────────────────────────────────────────────────────────── */
function SignInForm({ onForgot, visible }) {
  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await login(email.trim(), pass);
      success("Welcome back, matey! 🏴‍☠️");
      navigate(from, { replace: true });
    } catch (ex) {
      if (["auth/invalid-credential","auth/user-not-found","auth/wrong-password"].includes(ex.code)) {
        setErr("Email not registered or incorrect password. Please check and try again.");
      } else {
        setErr(fbMsg(ex.code));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`lp-form ${visible ? "lp-form--visible" : ""}`} onSubmit={handleSubmit} noValidate>
      <FormField id="si-email" label="Email address" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required delay={50} />
      <FormField id="si-pass" label="Password" type="text" placeholder="Your password" autoComplete="current-password" value={pass} onChange={() => {}} required delay={120}>
        {({ onFocus, onBlur }) => (
          <div className="lp-eye-wrap">
            <input
              id="si-pass"
              type={showPass ? "text" : "password"}
              className="lp-input"
              placeholder=""
              autoComplete="current-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onFocus={onFocus}
              onBlur={onBlur}
              required
            />
            <EyeBtn show={showPass} onToggle={() => setShowPass((v) => !v)} />
          </div>
        )}
      </FormField>

      {err && (
        <div className="lp-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {err}
        </div>
      )}

      <button type="submit" className="lp-btn-primary" disabled={loading} style={{ animationDelay: "190ms" }}>
        {loading ? (
          <span className="lp-btn-inner">
            <span className="lp-spinner" />
            Signing in…
          </span>
        ) : (
          <span className="lp-btn-inner">
            Sign In
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </span>
        )}
        <span className="lp-btn-shine" />
      </button>

      <button type="button" className="lp-forgot" onClick={onForgot} style={{ animationDelay: "230ms" }}>
        Forgot your password?
      </button>
    </form>
  );
}

/* ── Sign Up form ────────────────────────────────────────────────────────── */
function SignUpForm({ onSuccess, visible }) {
  const { register } = useAuth();
  const { success } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk(false);
    if (!name.trim()) return setErr("Full name is required.");
    if (pass.length < 6) return setErr("Password must be at least 6 characters.");
    if (pass !== confirm) return setErr("Passwords do not match.");
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), pass);
      setOk(true);
      success("Account created! Welcome aboard! 🏴‍☠️", 3500);
      setTimeout(() => onSuccess?.(), 1200);
    } catch (ex) {
      setErr(fbMsg(ex.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`lp-form ${visible ? "lp-form--visible" : ""}`} onSubmit={handleSubmit} noValidate>
      <FormField id="su-name" label="Full Name" type="text" placeholder="Captain Jack Sparrow" value={name} onChange={(e) => setName(e.target.value)} required delay={50} />
      <FormField id="su-email" label="Email address" type="email" placeholder="you@example.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required delay={110} />
      <FormField id="su-pass" label="Password" type="text" placeholder="Min 6 characters" autoComplete="new-password" value={pass} onChange={() => {}} required delay={170}>
        {({ onFocus, onBlur }) => (
          <div className="lp-eye-wrap">
            <input
              id="su-pass"
              type={showPass ? "text" : "password"}
              className="lp-input"
              placeholder=""
              autoComplete="new-password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onFocus={onFocus}
              onBlur={onBlur}
              required
            />
            <EyeBtn show={showPass} onToggle={() => setShowPass((v) => !v)} />
          </div>
        )}
      </FormField>
      <FormField id="su-confirm" label="Confirm Password" type="password" placeholder="Re-enter password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required delay={230} />

      {err && (
        <div className="lp-error" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {err}
        </div>
      )}
      {ok && (
        <div className="lp-success" role="status">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Account created! Signing you in…
        </div>
      )}

      <button type="submit" className="lp-btn-primary" disabled={loading} style={{ animationDelay: "290ms" }}>
        {loading ? (
          <span className="lp-btn-inner"><span className="lp-spinner" />Creating account…</span>
        ) : (
          <span className="lp-btn-inner">
            Create Account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </span>
        )}
        <span className="lp-btn-shine" />
      </button>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN LoginPage                                                           */
/* ══════════════════════════════════════════════════════════════════════════ */
export default function LoginPage() {
  const { isLoggedIn, loginWithGoogle } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [tab, setTab] = useState("signin");
  const [gLoading, setGLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [switching, setSwitching] = useState(false);
  const from = location.state?.from || "/";

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (isLoggedIn) navigate(from, { replace: true });
  }, [isLoggedIn, navigate, from]);

  const switchTab = (next) => {
    if (next === tab) return;
    setSwitching(true);
    setTimeout(() => {
      setTab(next);
      setSwitching(false);
    }, 200);
  };

  const handleGoogle = async () => {
    setGLoading(true);
    try {
      await loginWithGoogle();
      success("Signed in with Google! 🏴‍☠️");
      navigate(from, { replace: true });
    } catch (ex) {
      error(fbMsg(ex.code));
    } finally {
      setGLoading(false);
    }
  };

  const goForgot = () => navigate("/forgot-password");

  return (
    <div className={`lp-page ${mounted ? "lp-page--in" : ""}`}>
      {/* ── Layered animated background ──────────────────────────────── */}
      <div className="lp-bg" aria-hidden>
        <div className="lp-bg-mesh" />
        <div className="lp-bg-orb lp-bg-orb--1" />
        <div className="lp-bg-orb lp-bg-orb--2" />
        <div className="lp-bg-orb lp-bg-orb--3" />
        <div className="lp-bg-grid" />
        <FloatingParticles />
      </div>

      {/* ── Card ─────────────────────────────────────────────────────── */}
      <div className={`lp-card ${mounted ? "lp-card--in" : ""}`}>
        {/* Glowing border accent */}
        <div className="lp-card-glow" aria-hidden />

        {/* Close */}
        <button className="lp-close" onClick={() => navigate(-1)} aria-label="Go back">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="lp-head">
          <Link to="/" className="lp-logo" aria-label="Home">
            <span className="lp-logo-icon">⚓</span>
            <div className="lp-logo-ring" aria-hidden />
          </Link>
          <h1 className="lp-title">
            <span>Welcome to</span>
            <span className="lp-title-brand"> Pixel Pirates</span>
          </h1>
          <p className="lp-sub">
            {["Movies","Music","Books","Games","Events"].map((item, i) => (
              <span key={item} className="lp-sub-item" style={{ animationDelay: `${600 + i * 80}ms` }}>
                {item}{i < 4 ? <span className="lp-sub-dot">·</span> : null}
              </span>
            ))}
          </p>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────── */}
        <div className="lp-tabs" role="tablist">
          <div
            className="lp-tab-indicator"
            style={{ transform: `translateX(${tab === "signin" ? "0%" : "100%"})` }}
            aria-hidden
          />
          <button
            role="tab"
            aria-selected={tab === "signin"}
            className={`lp-tab ${tab === "signin" ? "lp-tab--active" : ""}`}
            onClick={() => switchTab("signin")}
          >
            Sign In
          </button>
          <button
            role="tab"
            aria-selected={tab === "signup"}
            className={`lp-tab ${tab === "signup" ? "lp-tab--active" : ""}`}
            onClick={() => switchTab("signup")}
          >
            Sign Up
          </button>
        </div>

        {/* ── Forms ────────────────────────────────────────────────── */}
        <div className={`lp-form-stage ${switching ? "lp-form-stage--exit" : "lp-form-stage--enter"}`}>
          {tab === "signin" ? (
            <SignInForm onForgot={goForgot} visible={!switching} />
          ) : (
            <SignUpForm onSuccess={() => switchTab("signin")} visible={!switching} />
          )}
        </div>

        {/* ── Footer links ─────────────────────────────────────────── */}
        <div className="lp-footer">
          <p className="lp-footer-switch">
            {tab === "signin" ? (
              <>New here?{" "}<button className="lp-text-link" onClick={() => switchTab("signup")}>Create account</button></>
            ) : (
              <>Already have one?{" "}<button className="lp-text-link" onClick={() => switchTab("signin")}>Sign in</button></>
            )}
          </p>
          <p className="lp-badge">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Secured by Firebase Authentication
          </p>
        </div>
      </div>

      {/* ══════════════ ALL STYLES ══════════════ */}
      <style>{`
        /* ── Reset & base ─────────────────────────────────────────────── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Page ─────────────────────────────────────────────────────── */
        .lp-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(1rem, 4vw, 2.5rem) 1rem;
          position: relative;
          overflow: hidden;
          opacity: 0;
          transition: opacity 0.4s ease;
        }
        .lp-page--in { opacity: 1; }

        /* ── Background layers ────────────────────────────────────────── */
        .lp-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background: var(--bg, #07101f);
        }
        .lp-bg-mesh {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 20% 20%, rgba(245,197,66,0.04) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99,179,237,0.04) 0%, transparent 60%);
        }
        .lp-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          will-change: transform;
        }
        .lp-bg-orb--1 {
          width: 600px; height: 600px;
          top: -200px; left: -150px;
          background: radial-gradient(circle, rgba(245,197,66,0.07) 0%, transparent 70%);
          animation: lpOrbDrift1 20s ease-in-out infinite alternate;
        }
        .lp-bg-orb--2 {
          width: 500px; height: 500px;
          bottom: -150px; right: -100px;
          background: radial-gradient(circle, rgba(99,179,237,0.06) 0%, transparent 70%);
          animation: lpOrbDrift2 25s ease-in-out infinite alternate;
        }
        .lp-bg-orb--3 {
          width: 300px; height: 300px;
          top: 40%; left: 60%;
          background: radial-gradient(circle, rgba(245,197,66,0.04) 0%, transparent 70%);
          animation: lpOrbDrift3 18s ease-in-out infinite alternate;
        }
        .lp-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        /* ── Particles ────────────────────────────────────────────────── */
        .lp-particles { position: absolute; inset: 0; overflow: hidden; }
        .lp-particle {
          position: absolute;
          border-radius: 50%;
          background: #f5c542;
          animation: lpParticleFloat linear infinite;
          will-change: transform;
        }

        /* ── Card ─────────────────────────────────────────────────────── */
        .lp-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 440px;
          background: rgba(10, 20, 40, 0.82);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid rgba(245,197,66,0.12);
          border-radius: 24px;
          padding: clamp(1.75rem, 5vw, 2.75rem) clamp(1.5rem, 5vw, 2.25rem);
          box-shadow:
            0 32px 80px rgba(0,0,0,0.7),
            0 0 0 1px rgba(245,197,66,0.05),
            inset 0 1px 0 rgba(255,255,255,0.06);
          transform: translateY(40px) scale(0.96);
          opacity: 0;
          transition: transform 0.6s cubic-bezier(0.22,1,0.36,1), opacity 0.5s ease;
          overflow: hidden;
        }
        .lp-card--in {
          transform: translateY(0) scale(1);
          opacity: 1;
        }
        .lp-card-glow {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245,197,66,0.6), transparent);
          animation: lpGlowPulse 3s ease-in-out infinite;
        }

        /* ── Close button ─────────────────────────────────────────────── */
        .lp-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 2;
        }
        .lp-close:hover {
          background: rgba(245,197,66,0.1);
          border-color: rgba(245,197,66,0.3);
          color: #f5c542;
          transform: rotate(90deg) scale(1.1);
        }

        /* ── Header ───────────────────────────────────────────────────── */
        .lp-head {
          text-align: center;
          margin-bottom: 2rem;
          animation: lpFadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.15s both;
        }
        .lp-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin-bottom: 1rem;
          text-decoration: none;
        }
        .lp-logo-icon {
          font-size: 2.6rem;
          display: block;
          filter: drop-shadow(0 0 16px rgba(245,197,66,0.5));
          animation: lpAnchorBob 3s ease-in-out infinite;
          position: relative;
          z-index: 1;
        }
        .lp-logo-ring {
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          border: 1px solid rgba(245,197,66,0.2);
          animation: lpRingPulse 2.5s ease-in-out infinite;
        }
        .lp-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.25rem, 4vw, 1.55rem);
          font-weight: 800;
          line-height: 1.2;
          margin-bottom: 0.5rem;
          letter-spacing: -0.5px;
        }
        .lp-title span:first-child { color: rgba(255,255,255,0.7); font-weight: 400; font-size: 0.85em; display: block; margin-bottom: 0.1rem; }
        .lp-title-brand {
          background: linear-gradient(120deg, #f5c542 20%, #ffd97a 50%, #f5c542 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: lpShimmer 3s linear infinite;
        }
        .lp-sub {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.15rem;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.35);
          letter-spacing: 0.5px;
        }
        .lp-sub-item {
          display: flex;
          align-items: center;
          gap: 0.15rem;
          opacity: 0;
          animation: lpFadeIn 0.4s ease both;
        }
        .lp-sub-dot { color: rgba(245,197,66,0.4); margin: 0 0.1rem; }

        /* ── Tabs ─────────────────────────────────────────────────────── */
        .lp-tabs {
          position: relative;
          display: flex;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 50px;
          padding: 4px;
          margin-bottom: 1.75rem;
          animation: lpFadeUp 0.5s ease 0.25s both;
        }
        .lp-tab-indicator {
          position: absolute;
          top: 4px; left: 4px;
          width: calc(50% - 4px);
          height: calc(100% - 8px);
          background: linear-gradient(135deg, #f5c542, #e6b030);
          border-radius: 50px;
          transition: transform 0.35s cubic-bezier(0.34,1.2,0.64,1);
          box-shadow: 0 2px 12px rgba(245,197,66,0.3);
        }
        .lp-tab {
          flex: 1;
          position: relative;
          z-index: 1;
          padding: 0.5rem 0.75rem;
          border: none;
          background: transparent;
          font-family: 'Outfit', 'Syne', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          cursor: pointer;
          border-radius: 50px;
          transition: color 0.3s ease;
          letter-spacing: 0.2px;
        }
        .lp-tab--active { color: #07101f; }
        .lp-tab:not(.lp-tab--active):hover { color: rgba(255,255,255,0.7); }

        /* ── Form stage (transition wrapper) ─────────────────────────── */
        .lp-form-stage {
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        .lp-form-stage--exit {
          opacity: 0;
          transform: translateY(-6px) scale(0.98);
        }
        .lp-form-stage--enter {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        /* ── Form ─────────────────────────────────────────────────────── */
        .lp-form {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        /* ── Form Group (floating label) ──────────────────────────────── */
        .lp-form-group {
          position: relative;
          margin-bottom: 1rem;
          opacity: 0;
          animation: lpFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        .lp-form--visible .lp-form-group { animation-play-state: running; }

        .lp-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: rgba(255,255,255,0.45);
          margin-bottom: 0.4rem;
          letter-spacing: 0.3px;
          transition: color 0.2s ease;
        }
        .lp-input-wrap {
          position: relative;
        }
        .lp-input {
          width: 100%;
          padding: 0.72rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 12px;
          color: rgba(255,255,255,0.9);
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
        }
        .lp-input::placeholder { color: rgba(255,255,255,0.2); }
        .lp-input:focus {
          border-color: rgba(245,197,66,0.5);
          background: rgba(245,197,66,0.04);
          box-shadow: 0 0 0 3px rgba(245,197,66,0.08), 0 1px 8px rgba(0,0,0,0.3);
        }
        .lp-input-wrap--focused .lp-label { color: #f5c542; }

        .lp-input-line {
          position: absolute;
          bottom: 0; left: 50%;
          width: 0; height: 2px;
          background: linear-gradient(90deg, #f5c542, #ffd97a);
          border-radius: 1px;
          transition: width 0.3s ease, left 0.3s ease;
          transform: translateX(-50%);
        }
        .lp-input-wrap--focused .lp-input-line { width: calc(100% - 24px); }

        /* ── Eye wrap ─────────────────────────────────────────────────── */
        .lp-eye-wrap { position: relative; }
        .lp-eye-wrap .lp-input { padding-right: 3rem; }
        .lp-eye-btn {
          position: absolute;
          right: 0.9rem; top: 50%;
          transform: translateY(-50%);
          background: none; border: none;
          color: rgba(255,255,255,0.3);
          cursor: pointer;
          display: flex; align-items: center;
          padding: 0.2rem;
          border-radius: 4px;
          transition: color 0.2s ease;
        }
        .lp-eye-btn:hover { color: rgba(245,197,66,0.8); }

        /* ── Error / Success messages ─────────────────────────────────── */
        .lp-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.9rem;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 10px;
          color: #fca5a5;
          font-size: 0.78rem;
          margin-bottom: 0.5rem;
          animation: lpShakeIn 0.35s ease;
        }
        .lp-success {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 0.9rem;
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.25);
          border-radius: 10px;
          color: #86efac;
          font-size: 0.78rem;
          margin-bottom: 0.5rem;
          animation: lpFadeUp 0.3s ease;
        }

        /* ── Primary button ───────────────────────────────────────────── */
        .lp-btn-primary {
          position: relative;
          overflow: hidden;
          width: 100%;
          padding: 0.82rem 1.5rem;
          background: linear-gradient(135deg, #f5c542 0%, #e6b030 100%);
          border: none;
          border-radius: 12px;
          color: #07101f;
          font-family: 'Outfit', 'Syne', sans-serif;
          font-size: 0.92rem;
          font-weight: 700;
          letter-spacing: 0.3px;
          cursor: pointer;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
          opacity: 0;
          animation: lpFadeUp 0.4s cubic-bezier(0.22,1,0.36,1) both;
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
          box-shadow: 0 4px 20px rgba(245,197,66,0.25);
        }
        .lp-btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(245,197,66,0.4);
          filter: brightness(1.06);
        }
        .lp-btn-primary:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 2px 12px rgba(245,197,66,0.2);
        }
        .lp-btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .lp-btn-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          position: relative;
          z-index: 1;
        }
        .lp-btn-shine {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .lp-btn-primary:hover .lp-btn-shine { transform: translateX(100%); }

        /* ── Spinner ──────────────────────────────────────────────────── */
        .lp-spinner {
          display: inline-block;
          width: 15px; height: 15px;
          border: 2px solid rgba(7,16,31,0.25);
          border-top-color: #07101f;
          border-radius: 50%;
          animation: lpSpin 0.65s linear infinite;
        }

        /* ── Forgot link ──────────────────────────────────────────────── */
        .lp-forgot {
          background: none; border: none;
          color: rgba(255,255,255,0.35);
          font-size: 0.78rem;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          text-align: center;
          padding: 0.3rem;
          opacity: 0;
          animation: lpFadeIn 0.4s ease both;
          transition: color 0.2s ease;
        }
        .lp-forgot:hover { color: #f5c542; text-decoration: underline; }

        /* ── Footer ───────────────────────────────────────────────────── */
        .lp-footer {
          text-align: center;
          margin-top: 1.25rem;
          animation: lpFadeIn 0.5s ease 0.5s both;
        }
        .lp-footer-switch {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.35);
          margin-bottom: 0.6rem;
        }
        .lp-text-link {
          background: none; border: none;
          color: #f5c542;
          font-size: inherit;
          font-family: inherit;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s ease, text-shadow 0.2s ease;
        }
        .lp-text-link:hover {
          color: #ffd97a;
          text-shadow: 0 0 12px rgba(245,197,66,0.4);
        }
        .lp-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.65rem;
          color: rgba(255,255,255,0.2);
          letter-spacing: 0.3px;
        }

        /* ════════════════ KEYFRAMES ════════════════ */

        @keyframes lpFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lpFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lpShakeIn {
          0%   { transform: translateX(0); opacity: 0; }
          15%  { transform: translateX(-6px); opacity: 1; }
          30%  { transform: translateX(5px); }
          45%  { transform: translateX(-4px); }
          60%  { transform: translateX(3px); }
          75%  { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }
        @keyframes lpSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes lpShimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes lpAnchorBob {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50%       { transform: translateY(-6px) rotate(3deg); }
        }
        @keyframes lpRingPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.7; transform: scale(1.15); }
        }
        @keyframes lpGlowPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
        @keyframes lpOrbDrift1 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(60px, 40px) scale(1.15); }
        }
        @keyframes lpOrbDrift2 {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-50px, -60px) scale(1.1); }
        }
        @keyframes lpOrbDrift3 {
          0%   { transform: translate(0, 0); }
          100% { transform: translate(-40px, 30px); }
        }
        @keyframes lpParticleFloat {
          0%   { transform: translateY(0) translateX(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-120vh) translateX(40px); opacity: 0; }
        }

        /* ════════ RESPONSIVE ════════ */
        @media (max-width: 480px) {
          .lp-card {
            border-radius: 20px;
          }
          .lp-title { font-size: 1.3rem; }
          .lp-input { font-size: 16px; /* prevents iOS zoom */ }
        }
        @media (max-width: 360px) {
          .lp-sub { font-size: 0.68rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .lp-particle, .lp-bg-orb, .lp-logo-icon,
          .lp-logo-ring, .lp-card-glow, .lp-title-brand {
            animation: none !important;
          }
          .lp-card { transition: none; }
          .lp-tab-indicator { transition: transform 0.15s ease; }
        }
      `}</style>
    </div>
  );
}
