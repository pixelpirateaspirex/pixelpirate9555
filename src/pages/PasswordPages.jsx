// src/pages/PasswordPages.jsx  — Animated & Production-Ready
//
//  Exports two pages:
//   1. ForgotPasswordPage  → /forgot-password
//   2. ResetPasswordPage   → /reset-password?oobCode=<firebase_code>  OR  ?token=<backend_jwt>

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../config/firebase';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ── Password strength ─────────────────────────────────────────── */
function strengthOf(pass) {
  if (!pass) return { score:0, label:'', color:'transparent', pct:'0%' };
  let score = 0;
  if (pass.length >= 8)          score++;
  if (pass.length >= 12)         score++;
  if (/[A-Z]/.test(pass))        score++;
  if (/[0-9]/.test(pass))        score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;
  if (score <= 1) return { score, label:'Weak',   color:'#ef4444', pct:'25%'  };
  if (score <= 2) return { score, label:'Fair',   color:'#f59e0b', pct:'50%'  };
  if (score <= 3) return { score, label:'Good',   color:'#10b981', pct:'75%'  };
  return             { score, label:'Strong', color:'#3b82f6', pct:'100%' };
}

/* ── Floating orbs background ──────────────────────────────────── */
function PwdBg() {
  return (
    <div className="pwd-bg" aria-hidden>
      <div className="pwd-bg-glow" />
      <div className="pwd-orb pwd-orb-1" />
      <div className="pwd-orb pwd-orb-2" />
      <div className="pwd-orb pwd-orb-3" />
    </div>
  );
}

/* ── Animated success checkmark ───────────────────────────────── */
function SuccessCheck({ emoji }) {
  return (
    <div className="success-check-wrap" aria-hidden>
      <div className="success-ring" />
      <div className="success-check">{emoji}</div>
    </div>
  );
}

/* ── Eye toggle button ──────────────────────────────────────────── */
function EyeBtn({ show, onToggle }) {
  return (
    <button
      type="button"
      className="eye-btn2"
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      <span className={`eye-icon${show ? ' eye-open' : ''}`}>
        {show ? '👁️' : '🙈'}
      </span>
    </button>
  );
}

/* ── Spinner ────────────────────────────────────────────────────── */
function Spinner() {
  return <span className="pwd-spinner" aria-hidden="true" />;
}

/* ══════════════════════════════════════════════════════════════
   1.  FORGOT PASSWORD PAGE
   ══════════════════════════════════════════════════════════════ */
export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const { success, error } = useToast();

  const [email,   setEmail]   = useState('');
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState('');
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      setTimeout(() => inputRef.current?.focus(), 400);
    }, 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await forgotPassword(email.trim());
      try { await api.post('/auth/forgot-password', { email: email.trim() }); } catch {}
      setSent(true);
      success('Reset link sent! Check your inbox 📧', 4000);
    } catch (ex) {
      const msg =
        ex.code === 'auth/user-not-found'  ? 'No account found with this email.'        :
        ex.code === 'auth/invalid-email'   ? 'Please enter a valid email address.'      :
        'Failed to send reset link. Please try again.';
      setErr(msg); error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="pwd-page">
      <PwdBg />
      <div className={`pwd-card${mounted ? ' pwd-card-visible' : ''}`}>

        {sent ? (
          <div className="success-panel">
            <SuccessCheck emoji="📧" />
            <h2 className="pwd-title">Check your inbox!</h2>
            <p className="pwd-sub">
              We sent a reset link to <strong className="pwd-email-highlight">{email}</strong>.<br />
              It may take a few minutes to arrive.
            </p>
            <button
              className="btn btn-primary pwd-submit"
              onClick={() => { setSent(false); setEmail(''); }}
            >
              Send to a different email
            </button>
            <Link to="/login" className="pwd-back">← Back to Sign In</Link>
          </div>
        ) : (
          <>
            <div className="pwd-icon-wrap">
              <span className="pwd-icon">🔑</span>
            </div>
            <h1 className="pwd-title">Forgot Password?</h1>
            <p className="pwd-sub">Enter your email and we'll send you a reset link.</p>

            <form onSubmit={handleSubmit} noValidate className="pwd-form">
              <div className="form-group">
                <label htmlFor="fp-email">Email Address</label>
                <input
                  ref={inputRef}
                  id="fp-email" type="email" className="form-control pwd-input"
                  placeholder="you@example.com" autoComplete="email"
                  value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }}
                  required
                />
              </div>

              {err && (
                <p className="form-error pwd-err-animate" role="alert">{err}</p>
              )}

              <button
                type="submit"
                className="btn btn-primary pwd-submit"
                disabled={loading || !email.trim()}
              >
                {loading ? <><Spinner /> Sending…</> : '📨 Send Reset Link'}
              </button>
            </form>

            <Link to="/login" className="pwd-back">← Back to Sign In</Link>
          </>
        )}
      </div>

      <style>{pwdStyles}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   2.  RESET PASSWORD PAGE
   ══════════════════════════════════════════════════════════════ */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const { success, error } = useToast();

  const oobCode      = searchParams.get('oobCode');
  const backendToken = searchParams.get('token');

  const [pass,     setPass]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [done,     setDone]     = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState('');
  const [mounted,  setMounted]  = useState(false);

  const strength = strengthOf(pass);
  const passMatch = confirm.length > 0 && pass === confirm;
  const passMismatch = confirm.length > 0 && pass !== confirm;

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr('');
    if (pass.length < 6)  return setErr('Password must be at least 6 characters.');
    if (pass !== confirm) return setErr('Passwords do not match.');
    setLoading(true);
    try {
      if (oobCode) {
        await verifyPasswordResetCode(auth, oobCode);
        await confirmPasswordReset(auth, oobCode, pass);
      } else if (backendToken) {
        await api.post('/auth/reset-password', { token: backendToken, newPassword: pass });
      } else {
        throw new Error('Invalid or missing reset link. Please request a new one.');
      }
      setDone(true);
      success('Password reset successfully! 🎉');
    } catch (ex) {
      const msg =
        ex.code === 'auth/expired-action-code' ? 'This reset link has expired. Please request a new one.'  :
        ex.code === 'auth/invalid-action-code'  ? 'This reset link is invalid. Please request a new one.'  :
        ex.message || 'Failed to reset password. Please try again.';
      setErr(msg); error(msg);
    } finally { setLoading(false); }
  };

  /* Invalid / missing link */
  if (!oobCode && !backendToken) {
    return (
      <div className="pwd-page">
        <PwdBg />
        <div className={`pwd-card${mounted ? ' pwd-card-visible' : ''}`}>
          <div className="success-panel">
            <SuccessCheck emoji="⚠️" />
            <h2 className="pwd-title">Invalid Link</h2>
            <p className="pwd-sub">This reset link is missing or malformed.<br />Please request a new one.</p>
            <Link to="/forgot-password" className="btn btn-primary pwd-submit" style={{ textAlign:'center', textDecoration:'none' }}>
              Get New Link
            </Link>
          </div>
        </div>
        <style>{pwdStyles}</style>
      </div>
    );
  }

  return (
    <div className="pwd-page">
      <PwdBg />
      <div className={`pwd-card${mounted ? ' pwd-card-visible' : ''}`}>

        {done ? (
          <div className="success-panel">
            <SuccessCheck emoji="✅" />
            <h2 className="pwd-title">Password Updated!</h2>
            <p className="pwd-sub">Your new password is active.<br />You can now sign in.</p>
            <button
              className="btn btn-primary pwd-submit"
              onClick={() => navigate('/login')}
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <>
            <div className="pwd-icon-wrap">
              <span className="pwd-icon">🔐</span>
            </div>
            <h1 className="pwd-title">Set New Password</h1>
            <p className="pwd-sub">Choose a strong password for your Pixel Pirates account.</p>

            <form onSubmit={handleSubmit} noValidate className="pwd-form">
              {/* New password */}
              <div className="form-group">
                <label htmlFor="rp-pass">New Password</label>
                <div className="input-eye">
                  <input
                    id="rp-pass"
                    type={showPass ? 'text' : 'password'}
                    className="form-control pwd-input"
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    value={pass}
                    onChange={(e) => { setPass(e.target.value); setErr(''); }}
                    required
                  />
                  <EyeBtn show={showPass} onToggle={() => setShowPass(v => !v)} />
                </div>

                {/* Strength bar */}
                {pass && (
                  <div className="strength-wrap" aria-label={`Password strength: ${strength.label}`}>
                    <div className="strength-track">
                      <div
                        className="strength-fill"
                        style={{ width: strength.pct, background: strength.color }}
                      />
                    </div>
                    <span className="strength-label">
                      Strength: <strong style={{ color: strength.color }}>{strength.label}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="form-group">
                <label htmlFor="rp-confirm">Confirm Password</label>
                <div className="input-eye">
                  <input
                    id="rp-confirm"
                    type="password"
                    className={`form-control pwd-input${passMatch ? ' pwd-input-ok' : passMismatch ? ' pwd-input-err' : ''}`}
                    placeholder="Re-enter new password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setErr(''); }}
                    required
                  />
                  {passMatch && <span className="pwd-match-icon" aria-label="Passwords match">✓</span>}
                </div>
                {passMismatch && (
                  <p className="form-error pwd-err-animate" style={{ marginTop:'0.3rem' }} role="alert">
                    Passwords don't match.
                  </p>
                )}
              </div>

              {err && <p className="form-error pwd-err-animate" role="alert">{err}</p>}

              <button
                type="submit"
                className="btn btn-primary pwd-submit"
                disabled={loading || !pass || !confirm}
              >
                {loading ? <><Spinner /> Updating…</> : '🔐 Reset Password'}
              </button>
            </form>
            <Link to="/forgot-password" className="pwd-back">← Request new link</Link>
          </>
        )}
      </div>

      <style>{pwdStyles}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SHARED STYLES
   ══════════════════════════════════════════════════════════════ */
const pwdStyles = `
  /* ── Page layout ── */
  .pwd-page {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    padding: 2rem 1rem; position: relative; overflow: hidden;
  }

  /* ── Background ── */
  .pwd-bg {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background: var(--bg);
  }
  .pwd-bg-glow {
    position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 700px; height: 400px;
    background: radial-gradient(ellipse, rgba(245,197,66,0.06) 0%, transparent 65%);
    animation: pwd-glow-breathe 6s ease-in-out infinite;
  }
  @keyframes pwd-glow-breathe {
    0%,100% { opacity:1; transform:translateX(-50%) scale(1); }
    50%      { opacity:0.6; transform:translateX(-50%) scale(1.1); }
  }
  .pwd-orb {
    position: absolute; border-radius: 50%;
    filter: blur(60px); pointer-events: none;
    animation: pwd-orb-drift ease-in-out infinite;
  }
  .pwd-orb-1 { width:300px; height:300px; top:-80px;  left:-60px;  background:rgba(245,197,66,0.04); animation-duration:14s; }
  .pwd-orb-2 { width:200px; height:200px; bottom:10%; right:-40px; background:rgba(59,130,246,0.04); animation-duration:18s; animation-delay:-4s; }
  .pwd-orb-3 { width:150px; height:150px; top:40%;    left:5%;     background:rgba(245,197,66,0.03); animation-duration:12s; animation-delay:-8s; }
  @keyframes pwd-orb-drift {
    0%,100% { transform:translateY(0); }
    50%      { transform:translateY(-25px); }
  }

  /* ── Card ── */
  .pwd-card {
    position: relative; z-index: 1;
    background: var(--modal-bg, var(--surface)); border: 1px solid var(--border);
    border-radius: 20px; padding: 2.5rem 2rem;
    max-width: 420px; width: 100%;
    box-shadow: 0 24px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(245,197,66,0.06);
    opacity: 0; transform: translateY(28px) scale(0.96);
    transition: opacity 0.5s cubic-bezier(.22,1,.36,1), transform 0.5s cubic-bezier(.22,1,.36,1);
  }
  .pwd-card.pwd-card-visible { opacity:1; transform:translateY(0) scale(1); }

  /* Top accent line */
  .pwd-card::before {
    content: '';
    position: absolute; top: 0; left: 2rem; right: 2rem; height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    border-radius: 2px;
    opacity: 0; transition: opacity 0.5s ease 0.3s;
  }
  .pwd-card.pwd-card-visible::before { opacity:1; }

  /* ── Icon ── */
  .pwd-icon-wrap {
    text-align: center; margin-bottom: 0.75rem;
  }
  .pwd-icon {
    font-size: 3rem; display: inline-block;
    animation: pwd-icon-float 3s ease-in-out infinite;
  }
  @keyframes pwd-icon-float {
    0%,100% { transform:translateY(0) rotate(0deg); }
    40%      { transform:translateY(-6px) rotate(-8deg); }
    70%      { transform:translateY(-3px) rotate(5deg); }
  }

  /* ── Typography ── */
  .pwd-title {
    font-family: 'Syne', sans-serif; font-size: 1.55rem; font-weight: 800;
    text-align: center; letter-spacing: -0.5px; margin-bottom: 0.4rem;
    color: var(--text);
  }
  .pwd-sub {
    font-size: 0.86rem; color: var(--text2); text-align: center;
    line-height: 1.6; margin-bottom: 1.8rem;
  }
  .pwd-email-highlight { color: var(--accent); word-break: break-all; }

  /* ── Form ── */
  .pwd-form { display: flex; flex-direction: column; gap: 0; }
  .pwd-input {
    transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
  }
  .pwd-input:focus {
    border-color: var(--accent) !important;
    box-shadow: 0 0 0 3px rgba(245,197,66,0.18) !important;
    outline: none;
  }
  .pwd-input-ok  { border-color: var(--success, #10b981) !important; }
  .pwd-input-err { border-color: var(--danger, #ef4444) !important; }

  /* Eye button */
  .input-eye { position: relative; }
  .input-eye .form-control { padding-right: 2.8rem; }
  .eye-btn2 {
    position: absolute; right: 0.9rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    font-size: 0.95rem; line-height: 1; padding: 0.2rem;
    transition: transform 0.2s;
  }
  .eye-btn2:hover { transform: translateY(-50%) scale(1.2); }
  .eye-icon { display:inline-block; transition:transform 0.3s; }
  .eye-icon.eye-open { transform:rotate(0deg); }

  /* Match icon */
  .pwd-match-icon {
    position: absolute; right: 0.9rem; top: 50%; transform: translateY(-50%);
    color: var(--success, #10b981); font-size: 0.9rem; font-weight: 700;
    animation: pwd-match-pop 0.3s cubic-bezier(.34,1.56,.64,1) both;
    pointer-events: none;
  }
  @keyframes pwd-match-pop { from{transform:translateY(-50%) scale(0)} to{transform:translateY(-50%) scale(1)} }

  /* Error message */
  .pwd-err-animate { animation: pwd-shake 0.35s cubic-bezier(.36,.07,.19,.97) both; }
  @keyframes pwd-shake {
    10%,90%  { transform:translateX(-2px); }
    20%,80%  { transform:translateX(4px); }
    30%,50%,70% { transform:translateX(-4px); }
    40%,60%  { transform:translateX(4px); }
  }

  /* Submit button */
  .pwd-submit {
    width: 100%; margin-top: 0.3rem; padding: 0.78rem;
    font-size: 0.95rem; border-radius: 12px !important;
    display: flex; align-items: center; justify-content: center; gap: 0.4rem;
    transition: transform 0.15s, box-shadow 0.2s, background 0.2s;
  }
  .pwd-submit:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(245,197,66,0.3);
  }
  .pwd-submit:active:not(:disabled) { transform: scale(0.98); }
  .pwd-submit:disabled { opacity: 0.55; cursor: not-allowed; }

  /* Back link */
  .pwd-back {
    display: flex; align-items: center; justify-content: center;
    gap: 0.35rem; margin-top: 1.2rem; font-size: 0.82rem; color: var(--text2);
    text-decoration: none; transition: color 0.15s, transform 0.15s;
  }
  .pwd-back:hover { color: var(--accent); transform: translateX(-2px); }

  /* Spinner */
  .pwd-spinner {
    display: inline-block; width: 14px; height: 14px;
    border: 2px solid rgba(7,16,31,0.3); border-top-color: #07101f;
    border-radius: 50%; animation: pwd-spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  @keyframes pwd-spin { to { transform: rotate(360deg); } }

  /* ── Strength bar ── */
  .strength-wrap { margin-top: 0.5rem; }
  .strength-track {
    height: 4px; background: var(--border); border-radius: 4px;
    overflow: hidden; margin-bottom: 0.3rem;
  }
  .strength-fill {
    height: 100%; border-radius: 4px;
    transition: width 0.4s cubic-bezier(.22,1,.36,1), background 0.3s;
  }
  .strength-label { font-size: 0.72rem; color: var(--text2); }

  /* ── Success panel ── */
  .success-panel {
    text-align: center; padding: 1.5rem 0;
    display: flex; flex-direction: column; align-items: center; gap: 0.8rem;
  }
  .success-check-wrap {
    position: relative; display: inline-flex;
    align-items: center; justify-content: center;
    width: 72px; height: 72px;
  }
  .success-ring {
    position: absolute; inset: 0; border-radius: 50%;
    border: 2px solid var(--accent); opacity: 0;
    animation: pwd-ring-expand 0.6s cubic-bezier(.22,1,.36,1) both 0.2s;
  }
  @keyframes pwd-ring-expand {
    from { transform:scale(0.5); opacity:0.8; }
    to   { transform:scale(1);   opacity:0.3; }
  }
  .success-check {
    font-size: 3rem; display: inline-block;
    animation: pwd-success-pop 0.5s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes pwd-success-pop {
    from { transform:scale(0.2) rotate(-20deg); opacity:0; }
    to   { transform:scale(1)   rotate(0deg);   opacity:1; }
  }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .pwd-card { padding: 2rem 1.4rem; border-radius: 16px; }
    .pwd-title { font-size: 1.35rem; }
  }
  @media (max-width: 360px) {
    .pwd-card { padding: 1.6rem 1.1rem; }
  }
`;
