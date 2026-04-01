// src/pages/PremiumPage.jsx — Animated & Responsive (Production Ready)
//
//  Flow:
//  1. /premium          → Plan selection + "Get Premium" button
//  2. Click → POST /api/payment/create-checkout-session → Stripe Checkout
//  3. Stripe redirects:
//       /premium/success?session_id=XXX → PaymentSuccess component
//       /premium/cancel                 → PaymentCancel component

import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  motion, AnimatePresence,
} from 'framer-motion';
import api from '../utils/api';
import { useAuth }  from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ease = [0.22, 1, 0.36, 1];

const FEATURES = [
  { icon: '🧠', text: 'Unlimited AI-powered quizzes',      color: '#6366f1' },
  { icon: '🎯', text: 'Personalized recommendations',       color: '#f5c542' },
  { icon: '🚫', text: 'Ad-free experience',                color: '#e50914' },
  { icon: '⚡', text: 'Early access to new features',      color: '#3b82f6' },
  { icon: '💬', text: 'Priority chat support',             color: '#10b981' },
  { icon: '📊', text: 'Advanced stats & history tracking', color: '#8b5cf6' },
];

const FAQS = [
  ['What payment methods are accepted?',  'We accept all major credit/debit cards, UPI, and net banking via Stripe.'],
  ['Can I cancel my subscription?',       'Yes — cancel any time from your account settings. No hidden fees.'],
  ['Is there a free trial?',              'Get a free month by scoring 10/10 on the AI Quiz on your first attempt!'],
  ['Is my payment data safe?',            'Pixel Pirates never stores card details. All payments are processed by Stripe (PCI-DSS compliant).'],
];

/* ── Confetti burst ─────────────────────────────────────────────────────── */
function Confetti() {
  const colors = ['#f5c542','#ffd97a','#10b981','#3b82f6','#ef4444','#8b5cf6','#f97316'];
  const pieces = Array.from({ length: 52 }, (_, i) => ({
    id: i,
    left:  Math.random() * 100,
    bg:    colors[i % colors.length],
    w:     6 + Math.random() * 9,
    h:     6 + Math.random() * 9,
    round: Math.random() > 0.5,
    dur:   2.2 + Math.random() * 2.2,
    delay: Math.random() * 0.8,
    drift: (Math.random() - 0.5) * 120,
  }));
  return (
    <div className="pp-confetti" aria-hidden>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="pp-conf-piece"
          style={{ left: `${p.left}%`, width: p.w, height: p.h, background: p.bg, borderRadius: p.round ? '50%' : '3px' }}
          initial={{ y: -20, opacity: 1, rotate: 0, x: 0 }}
          animate={{ y: '105vh', opacity: [1, 1, 0], rotate: 720 + Math.random() * 360, x: p.drift }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

/* ── Floating orbs background ────────────────────────────────────────────── */
function PremBg() {
  return (
    <div className="pp-bg" aria-hidden>
      <motion.div className="pp-orb pp-orb--gold"
        animate={{ scale: [1, 1.18, 1], x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div className="pp-orb pp-orb--blue"
        animate={{ scale: [1, 1.12, 1], x: [0, -25, 0], y: [0, 25, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="pp-bg-grid" />
      <div className="pp-rays" />
    </div>
  );
}

/* ── Animated feature row ────────────────────────────────────────────────── */
function FeatureRow({ icon, text, color, index }) {
  return (
    <motion.div
      className="pp-feature"
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.45, ease }}
      whileHover={{ x: 5, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="pp-feat-icon"
        style={{ background: `${color}18`, border: `1px solid ${color}35` }}
        whileHover={{ scale: 1.25, rotate: [-5, 5, 0], transition: { duration: 0.3 } }}
      >
        {icon}
      </motion.div>
      <span className="pp-feat-text">{text}</span>
      <motion.div
        className="pp-feat-check"
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 + index * 0.07, type: 'spring', stiffness: 300, damping: 18 }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
      </motion.div>
    </motion.div>
  );
}

/* ── FAQ accordion ───────────────────────────────────────────────────────── */
function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className={`pp-faq-item ${open ? 'pp-faq-item--open' : ''}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.45, ease }}
    >
      <button className="pp-faq-q" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>{q}</span>
        <motion.span className="pp-faq-arrow" animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="pp-faq-a"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease }}
          >
            <div className="pp-faq-a-inner">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Pulsing crown ───────────────────────────────────────────────────────── */
function PulsingCrown() {
  return (
    <div className="pp-crown-wrap">
      {[...Array(3)].map((_, i) => (
        <motion.div key={i} className="pp-crown-ring"
          animate={{ scale: [1, 2.2], opacity: [0.35, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
        />
      ))}
      <motion.div className="pp-crown-icon"
        animate={{ y: [0, -10, 0], rotate: [-3, 3, -3] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        👑
      </motion.div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SUCCESS PAGE   /premium/success
══════════════════════════════════════════════════════════════════════════ */
export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id') || '';
  const { success } = useToast();
  const [show, setShow]         = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    success('🎉 Payment successful! Welcome to Premium!', 4000);
    requestAnimationFrame(() => setShow(true));

    // FIX: Use the correct verify-session route (webhook already activated premium,
    // this is just a UI confirmation check — not re-processing the payment).
    if (sessionId) {
      api.get(`/payment/verify-session?session_id=${sessionId}`)
        .then(() => setVerified(true))
        .catch(() => setVerified(true)); // show success UI regardless
    } else {
      setVerified(true);
    }
  }, []); // eslint-disable-line

  const orderId = sessionId
    ? `PP-${sessionId.slice(-8).toUpperCase()}`
    : `PP-${Date.now().toString(36).toUpperCase()}`;

  return (
    <div className={`pp-page pp-page--center ${show ? 'pp-page--in' : ''}`}>
      <Confetti />
      <PremBg />
      <motion.div
        className="pp-card pp-success-card"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.15 }}
      >
        <div className="pp-card-glow-border" />
        <motion.div className="pp-success-emoji"
          initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.3 }}
        >🎉</motion.div>
        <motion.h1 className="pp-title"
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.55, ease }}
        >Payment Successful!</motion.h1>
        <motion.p className="pp-desc"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
        >
          Welcome to Pixel Pirates Premium!<br />Your subscription is now active.
        </motion.p>
        <motion.div className="pp-order-id"
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.62, type: 'spring', stiffness: 250, damping: 20 }}
        >
          Order #{orderId}
        </motion.div>
        <motion.div className="pp-perk-list"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.7 } } }}
          initial="hidden" animate="visible"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.text} className="pp-perk"
              variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } }}
            >
              <span className="pp-perk-icon">{f.icon}</span>
              <span>{f.text}</span>
              <span className="pp-perk-check">✓</span>
            </motion.div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
          <Link to="/" className="pp-cta-btn">
            <motion.span whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.4 }} style={{ display: 'inline-block' }}>⚓</motion.span>
            {' '}Start Exploring
          </Link>
        </motion.div>
      </motion.div>
      <style>{styles}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CANCEL PAGE  /premium/cancel
══════════════════════════════════════════════════════════════════════════ */
export function PaymentCancel() {
  return (
    <div className="pp-page pp-page--center pp-page--in">
      <PremBg />
      <motion.div className="pp-card" style={{ textAlign: 'center', maxWidth: 440 }}
        initial={{ scale: 0.88, opacity: 0, y: 36 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        <div className="pp-card-glow-border" />
        <motion.div style={{ fontSize: '3.8rem', marginBottom: '1rem', display: 'block' }}
          initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.2 }}
        >😕</motion.div>
        <motion.h2 className="pp-title"
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        >Payment Cancelled</motion.h2>
        <motion.p className="pp-desc" style={{ marginBottom: '1.75rem' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
        >No charge was made. You can upgrade any time you're ready.</motion.p>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Link to="/premium" className="btn btn-primary">← Back to Plans</Link>
        </motion.div>
      </motion.div>
      <style>{styles}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ALREADY SUBSCRIBED
══════════════════════════════════════════════════════════════════════════ */
function AlreadyPremium() {
  return (
    <div className="pp-page pp-page--center pp-page--in">
      <PremBg />
      <motion.div className="pp-card" style={{ textAlign: 'center', maxWidth: 480 }}
        initial={{ scale: 0.88, opacity: 0, y: 36 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        <div className="pp-card-glow-border" />
        <PulsingCrown />
        <motion.h2 className="pp-title"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        >You're Already Premium!</motion.h2>
        <motion.p className="pp-desc"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
        >Enjoy all the exclusive features of Pixel Pirates Premium.</motion.p>
        <motion.div className="pp-perk-list"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.55 } } }}
          initial="hidden" animate="visible"
          style={{ marginTop: '1rem', marginBottom: '1.5rem' }}
        >
          {FEATURES.map((f) => (
            <motion.div key={f.text} className="pp-perk"
              variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } }}
            >
              <span className="pp-perk-icon">{f.icon}</span>
              <span>{f.text}</span>
              <span className="pp-perk-check">✓</span>
            </motion.div>
          ))}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
          <Link to="/" className="btn btn-primary">← Go to Home</Link>
        </motion.div>
      </motion.div>
      <style>{styles}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PREMIUM PAGE  /premium
══════════════════════════════════════════════════════════════════════════ */
export default function PremiumPage() {
  const { isLoggedIn } = useAuth();
  const { error }      = useToast();
  const [loading,    setLoading]    = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    if (!isLoggedIn) return;

    // FIX: Use the correct status route and check subscription subdocument
    api.get('/payment/status')
      .then(({ data }) => {
        if (data.data?.isActive) setSubscribed(true);
      })
      .catch(() => {});
  }, [isLoggedIn]);

  const handleCheckout = async () => {
    if (!isLoggedIn) { window.location.href = '/login?from=/premium'; return; }
    setLoading(true);
    try {
      // FIX: Correct route — was '/payments/create-session', now '/payment/create-checkout-session'
      const { data } = await api.post('/payment/create-checkout-session');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not start checkout. Please try again.';
      error(msg);
      setLoading(false);
    }
  };

  if (subscribed) return <AlreadyPremium />;

  return (
    <div className={`pp-page ${mounted ? 'pp-page--in' : ''}`}>
      <PremBg />
      <div className="pp-container">

        {/* ══ HERO ══ */}
        <motion.div className="pp-hero" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <PulsingCrown />
          <motion.h1 className="pp-hero-title"
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.65, ease }}
          >
            Upgrade to <span className="pp-title-accent">Premium</span>
          </motion.h1>
          <motion.p className="pp-hero-sub"
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.55, ease }}
          >Unlock the full Pixel Pirates experience</motion.p>
          <motion.div className="pp-trust-row"
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          >
            {['🔒 Stripe Secured', '⚡ Instant Access', '↩️ Cancel Anytime'].map((badge, i) => (
              <motion.span key={badge} className="pp-trust-badge"
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.08, type: 'spring', stiffness: 260, damping: 18 }}
              >{badge}</motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* ══ LAYOUT ══ */}
        <div className="pp-layout">

          {/* Plan card */}
          <motion.div className="pp-plan-card pp-card"
            initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.65, ease }}
            whileHover={{ y: -6, boxShadow: '0 32px 80px rgba(245,197,66,0.2)', transition: { type: 'spring', stiffness: 240, damping: 22 } }}
          >
            <div className="pp-card-glow-border" />
            <motion.div className="pp-badge"
              animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >⭐ Most Popular</motion.div>
            <div className="pp-plan-name">Premium Monthly</div>
            <motion.div className="pp-price"
              initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 240, damping: 18 }}
            >
              <span className="pp-price-currency">₹</span>
              <span className="pp-price-amount">199</span>
              <span className="pp-price-period">/month</span>
            </motion.div>
            <div className="pp-features-list">
              {FEATURES.map((f, i) => <FeatureRow key={f.text} {...f} index={i} />)}
            </div>
            <motion.button className="pp-pay-btn" onClick={handleCheckout} disabled={loading}
              whileHover={!loading ? { scale: 1.03, y: -3, boxShadow: '0 14px 40px rgba(245,197,66,0.5)', transition: { type: 'spring', stiffness: 300, damping: 20 } } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
            >
              <span className="pp-pay-btn-shine" />
              {loading ? (
                <span className="pp-btn-inner"><span className="pp-spinner" />Redirecting to Stripe…</span>
              ) : (
                <span className="pp-btn-inner">
                  <motion.span animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }} style={{ display: 'inline-block' }}>🚀</motion.span>
                  Get Premium – ₹199/month
                </span>
              )}
            </motion.button>
            <motion.p className="pp-secure-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              🔒 Secured by Stripe · Cancel any time
            </motion.p>
            <div className="pp-plan-corner-glow" />
          </motion.div>

          {/* FAQ column */}
          <motion.div className="pp-faq-col"
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35, duration: 0.65, ease }}
          >
            <motion.h3 className="pp-faq-heading"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            >Common Questions</motion.h3>
            <div className="pp-faq-list">
              {FAQS.map(([q, a], i) => <FaqItem key={q} q={q} a={a} index={i} />)}
            </div>
            <motion.div className="pp-social-proof"
              initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.3 }}
            >
              <div className="pp-avatars">
                {['😊','🧑‍💻','👩‍🎤','🎮','📚'].map((a, i) => (
                  <motion.div key={i} className="pp-avatar"
                    initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.07, type: 'spring', stiffness: 280, damping: 18 }}
                  >{a}</motion.div>
                ))}
              </div>
              <div className="pp-proof-text"><strong>10,000+ users</strong> already enjoying Premium</div>
            </motion.div>
          </motion.div>

        </div>
      </div>
      <style>{styles}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STYLES  (unchanged from original)
══════════════════════════════════════════════════════════════════════════ */
const styles = `
  .pp-page { min-height:100vh; position:relative; overflow-x:hidden; opacity:0; transition:opacity 0.4s ease; }
  .pp-page--in  { opacity:1; }
  .pp-page--center { display:flex; align-items:center; justify-content:center; padding:2rem 1rem; }
  .pp-bg { position:fixed; inset:0; pointer-events:none; z-index:0; background:var(--bg,#07101f); }
  .pp-orb { position:absolute; border-radius:50%; filter:blur(90px); will-change:transform; }
  .pp-orb--gold { width:700px; height:500px; top:-200px; left:-150px; background:radial-gradient(circle,rgba(245,197,66,0.08),transparent 70%); }
  .pp-orb--blue { width:500px; height:500px; bottom:-150px; right:-100px; background:radial-gradient(circle,rgba(59,130,246,0.07),transparent 70%); }
  .pp-bg-grid { position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px); background-size:50px 50px; mask-image:radial-gradient(ellipse 80% 80% at 50% 40%,black 20%,transparent 100%); }
  .pp-rays { position:absolute; top:0; left:50%; transform:translateX(-50%); width:600px; height:300px; background:radial-gradient(ellipse at top,rgba(245,197,66,0.07),transparent 70%); pointer-events:none; }
  .pp-confetti { position:fixed; inset:0; pointer-events:none; z-index:10; overflow:hidden; }
  .pp-conf-piece { position:absolute; top:-20px; }
  .pp-container { position:relative; z-index:1; max-width:960px; margin:0 auto; padding:clamp(2rem,5vw,4rem) clamp(1rem,4vw,2rem) 4rem; }
  .pp-hero { text-align:center; margin-bottom:3rem; }
  .pp-crown-wrap { position:relative; display:inline-flex; align-items:center; justify-content:center; margin-bottom:1.25rem; }
  .pp-crown-ring { position:absolute; width:60px; height:60px; border-radius:50%; border:2px solid rgba(245,197,66,0.35); }
  .pp-crown-icon { font-size:clamp(2.8rem,6vw,3.8rem); display:block; filter:drop-shadow(0 0 20px rgba(245,197,66,0.5)); position:relative; z-index:1; }
  .pp-hero-title { font-family:'Syne',sans-serif; font-size:clamp(1.9rem,5vw,2.8rem); font-weight:800; letter-spacing:-1px; line-height:1.15; margin-bottom:0.6rem; color:var(--text); }
  .pp-title-accent { background:linear-gradient(120deg,#f5c542 20%,#ffd97a 50%,#f5c542 80%); background-size:200% auto; -webkit-background-clip:text; background-clip:text; color:transparent; animation:ppShimmer 3.5s linear infinite; }
  .pp-hero-sub { color:var(--text2); font-size:clamp(0.95rem,2vw,1.08rem); margin-bottom:1.25rem; }
  .pp-trust-row { display:flex; justify-content:center; gap:0.6rem; flex-wrap:wrap; }
  .pp-trust-badge { font-size:0.75rem; font-weight:600; padding:0.3rem 0.85rem; border-radius:2rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); color:var(--text2); letter-spacing:0.2px; }
  .pp-layout { display:grid; grid-template-columns:1fr 1fr; gap:2rem; align-items:start; }
  .pp-card { position:relative; overflow:hidden; background:rgba(10,20,40,0.85); backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); border:1px solid rgba(245,197,66,0.2); border-radius:22px; padding:clamp(1.75rem,4vw,2.5rem) clamp(1.5rem,4vw,2.25rem); box-shadow:0 24px 60px rgba(0,0,0,0.55),0 0 0 1px rgba(245,197,66,0.05),inset 0 1px 0 rgba(255,255,255,0.06); }
  .pp-card-glow-border { position:absolute; top:0; left:50%; transform:translateX(-50%); width:65%; height:1px; background:linear-gradient(90deg,transparent,rgba(245,197,66,0.7),transparent); animation:ppGlowPulse 3s ease-in-out infinite; pointer-events:none; }
  .pp-plan-corner-glow { position:absolute; bottom:-40px; right:-40px; width:200px; height:200px; background:radial-gradient(circle,rgba(245,197,66,0.1),transparent 70%); border-radius:50%; pointer-events:none; }
  .pp-badge { display:inline-block; background:linear-gradient(120deg,#f5c542,#ffd97a); color:#07101f; font-size:0.7rem; font-weight:800; padding:0.25rem 0.85rem; border-radius:2rem; margin-bottom:1.1rem; text-transform:uppercase; letter-spacing:0.6px; box-shadow:0 3px 12px rgba(245,197,66,0.35); }
  .pp-plan-name { font-family:'Syne',sans-serif; font-size:1.18rem; font-weight:700; margin-bottom:0.5rem; color:var(--text); }
  .pp-price { display:flex; align-items:baseline; gap:0.15rem; margin-bottom:1.75rem; }
  .pp-price-currency { font-family:'Syne',sans-serif; font-size:1.4rem; font-weight:700; color:var(--accent,#f5c542); margin-top:0.4rem; }
  .pp-price-amount { font-family:'Syne',sans-serif; font-size:clamp(2.4rem,5vw,3rem); font-weight:900; color:var(--accent,#f5c542); line-height:1; filter:drop-shadow(0 0 12px rgba(245,197,66,0.35)); }
  .pp-price-period { font-size:1rem; color:var(--text2); font-weight:400; margin-left:0.15rem; }
  .pp-features-list { display:flex; flex-direction:column; gap:0.55rem; margin-bottom:1.75rem; }
  .pp-feature { display:flex; align-items:center; gap:0.65rem; font-size:0.88rem; color:var(--text); cursor:default; }
  .pp-feat-icon { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:8px; font-size:1rem; flex-shrink:0; cursor:default; }
  .pp-feat-text { flex:1; }
  .pp-feat-check { width:20px; height:20px; display:flex; align-items:center; justify-content:center; border-radius:50%; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.35); color:#10b981; font-size:0.7rem; flex-shrink:0; }
  .pp-pay-btn { position:relative; overflow:hidden; width:100%; padding:0.95rem 1.5rem; background:linear-gradient(135deg,#f5c542 0%,#ffd97a 50%,#e6b030 100%); background-size:200% auto; border:none; border-radius:14px; color:#07101f; font-family:'Syne','Outfit',sans-serif; font-size:1rem; font-weight:800; letter-spacing:0.2px; cursor:pointer; box-shadow:0 6px 24px rgba(245,197,66,0.35); transition:background-position 0.4s ease,opacity 0.2s; animation:ppBtnGlow 3s ease-in-out infinite; }
  .pp-pay-btn:hover:not(:disabled) { background-position:right center; }
  .pp-pay-btn:disabled { opacity:0.55; cursor:not-allowed; animation:none; }
  .pp-pay-btn-shine { position:absolute; inset:0; background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.3) 50%,transparent 65%); transform:translateX(-100%); transition:transform 0.55s ease; pointer-events:none; }
  .pp-pay-btn:hover .pp-pay-btn-shine { transform:translateX(100%); }
  .pp-btn-inner { display:flex; align-items:center; justify-content:center; gap:0.5rem; position:relative; z-index:1; }
  .pp-secure-note { text-align:center; font-size:0.71rem; color:var(--text2); margin-top:0.85rem; opacity:0.7; }
  .pp-spinner { display:inline-block; width:15px; height:15px; border:2px solid rgba(7,16,31,0.25); border-top-color:#07101f; border-radius:50%; animation:ppSpin 0.65s linear infinite; }
  .pp-faq-col { display:flex; flex-direction:column; gap:0; padding-top:0.25rem; }
  .pp-faq-heading { font-family:'Syne',sans-serif; font-size:1.15rem; font-weight:700; margin-bottom:1rem; color:var(--text); }
  .pp-faq-list { display:flex; flex-direction:column; gap:0.55rem; margin-bottom:1.75rem; }
  .pp-faq-item { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:12px; overflow:hidden; transition:border-color 0.25s ease,background 0.25s ease; }
  .pp-faq-item--open { border-color:rgba(245,197,66,0.22); background:rgba(245,197,66,0.03); }
  .pp-faq-q { width:100%; display:flex; align-items:center; justify-content:space-between; gap:0.75rem; padding:0.9rem 1.1rem; background:none; border:none; color:var(--text); font-family:'Outfit',sans-serif; font-size:0.87rem; font-weight:600; cursor:pointer; text-align:left; transition:color 0.2s ease; }
  .pp-faq-item--open .pp-faq-q { color:var(--accent,#f5c542); }
  .pp-faq-arrow { color:var(--text2); flex-shrink:0; }
  .pp-faq-a { overflow:hidden; }
  .pp-faq-a-inner { padding:0 1.1rem 0.9rem; font-size:0.82rem; color:var(--text2); line-height:1.7; }
  .pp-social-proof { display:flex; align-items:center; gap:0.9rem; padding:1rem 1.25rem; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; }
  .pp-avatars { display:flex; }
  .pp-avatar { width:34px; height:34px; border-radius:50%; background:rgba(245,197,66,0.1); border:2px solid var(--bg,#07101f); font-size:1rem; display:flex; align-items:center; justify-content:center; margin-left:-8px; }
  .pp-avatar:first-child { margin-left:0; }
  .pp-proof-text { font-size:0.8rem; color:var(--text2); }
  .pp-proof-text strong { color:var(--text); }
  .pp-success-card { max-width:500px; width:100%; text-align:center; margin:2rem auto; }
  .pp-success-emoji { font-size:4.5rem; display:block; margin-bottom:1rem; filter:drop-shadow(0 0 20px rgba(245,197,66,0.4)); }
  .pp-title { font-family:'Syne',sans-serif; font-size:clamp(1.5rem,4vw,1.9rem); font-weight:800; margin-bottom:0.6rem; }
  .pp-desc { color:var(--text2); font-size:0.95rem; line-height:1.7; margin-bottom:1rem; }
  .pp-order-id { display:inline-block; font-family:monospace; font-size:0.75rem; color:var(--text2); padding:0.3rem 0.9rem; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:2rem; margin-bottom:1.4rem; letter-spacing:0.5px; }
  .pp-perk-list { text-align:left; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:14px; padding:1rem 1.25rem; display:flex; flex-direction:column; gap:0.6rem; margin-bottom:1.5rem; }
  .pp-perk { display:flex; align-items:center; gap:0.65rem; font-size:0.87rem; }
  .pp-perk-icon { font-size:1rem; flex-shrink:0; }
  .pp-perk-check { margin-left:auto; color:#10b981; font-size:0.85rem; font-weight:700; }
  .pp-cta-btn { display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; width:100%; padding:0.88rem; background:linear-gradient(135deg,#f5c542,#e6b030); border-radius:12px; color:#07101f; font-family:'Syne',sans-serif; font-size:0.95rem; font-weight:800; text-decoration:none; transition:transform 0.2s ease,box-shadow 0.2s ease; box-shadow:0 4px 18px rgba(245,197,66,0.3); }
  .pp-cta-btn:hover { transform:translateY(-2px); box-shadow:0 10px 32px rgba(245,197,66,0.45); }
  @keyframes ppShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
  @keyframes ppGlowPulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
  @keyframes ppBtnGlow { 0%,100%{box-shadow:0 6px 24px rgba(245,197,66,0.35)} 50%{box-shadow:0 6px 36px rgba(245,197,66,0.55)} }
  @keyframes ppSpin { to{transform:rotate(360deg)} }
  @media (max-width:720px) { .pp-layout{grid-template-columns:1fr} .pp-hero{margin-bottom:2rem} }
  @media (max-width:480px) { .pp-trust-row{gap:0.4rem} .pp-trust-badge{font-size:0.68rem;padding:0.25rem 0.65rem} .pp-card{border-radius:16px} .pp-pay-btn{font-size:0.9rem} }
  @media (prefers-reduced-motion:reduce) { .pp-orb,.pp-crown-ring,.pp-crown-icon,.pp-title-accent,.pp-pay-btn,.pp-card-glow-border{animation:none!important} }
`;
