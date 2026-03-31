// src/pages/AboutPage.jsx  — Animated & Responsive (Production Ready)
import { useState, useRef, useEffect } from 'react';
import {
  motion, useInView, useMotionValue, useTransform,
  useSpring, AnimatePresence, useScroll, useVelocity,
  useAnimationFrame
} from 'framer-motion';
import { useToast } from '../context/ToastContext';

/* ── Shared easing ─────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1];

/* ══════════════════════════════════════════════════════════════
   SCROLL VELOCITY BANNER (parallax ticker)
══════════════════════════════════════════════════════════════ */
function VelocityTicker({ items }) {
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 400 });
  const x = useMotionValue(0);
  const factor = useTransform(smoothVelocity, [-1000, 0, 1000], [-1, 0, 1]);
  const directionFactor = useRef(1);

  useAnimationFrame((_, delta) => {
    let moveBy = directionFactor.current * -1.5 * (delta / 1000) * 60;
    if (factor.get() < 0) directionFactor.current = -1;
    if (factor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * factor.get();
    x.set(x.get() + moveBy);
  });

  const repeated = [...items, ...items, ...items];
  return (
    <div className="ap-ticker" aria-hidden>
      <motion.div className="ap-ticker-inner" style={{ x }}>
        {repeated.map((item, i) => (
          <span key={i} className="ap-ticker-item">
            <span className="ap-ticker-dot">·</span> {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ── Reusable scroll-reveal wrapper ───────────────────────── */
function Reveal({ children, variant = 'up', delay = 0, className = '' }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const variants = {
    up:    { hidden: { opacity: 0, y: 48 },       visible: { opacity: 1, y: 0 } },
    left:  { hidden: { opacity: 0, x: -56 },      visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: 56 },       visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.82 }, visible: { opacity: 1, scale: 1 } },
    blur:  { hidden: { opacity: 0, filter: 'blur(12px)', y: 24 }, visible: { opacity: 1, filter: 'blur(0px)', y: 0 } },
  };

  const v = variants[variant] || variants.up;
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={v}
      transition={{ duration: 0.72, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated counter ──────────────────────────────────────── */
function CountUp({ value }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState('0');
  const ranRef = useRef(false);

  if (inView && !ranRef.current) {
    ranRef.current = true;
    const raw    = value.replace(/\D/g, '');
    const suffix = value.replace(/[\d]/g, '');
    const end    = parseInt(raw, 10);
    if (!isNaN(end)) {
      let start = 0;
      const dur  = 1800;
      const step = (end / dur) * 16;
      const timer = setInterval(() => {
        start += step;
        if (start >= end) { setDisplay(end + suffix); clearInterval(timer); }
        else setDisplay(Math.floor(start) + suffix);
      }, 16);
    }
  }
  return <span ref={ref}>{inView ? display : '0'}</span>;
}

/* ── 3-D tilt card ─────────────────────────────────────────── */
function TiltCard({ children, className = '', glowColor = 'rgba(245,197,66,0.2)' }) {
  const ref = useRef(null);
  const mx  = useMotionValue(0);
  const my  = useMotionValue(0);
  const rx  = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]),  { stiffness: 260, damping: 26 });
  const ry  = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]),  { stiffness: 260, damping: 26 });

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      onMouseMove={(e) => {
        const r = ref.current.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width  - 0.5);
        my.set((e.clientY - r.top)  / r.height - 0.5);
      }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      whileHover={{ boxShadow: `0 28px 60px ${glowColor}`, y: -8, transition: { type: 'spring', stiffness: 280, damping: 22 } }}
    >
      {children}
    </motion.div>
  );
}

/* ── Section heading with animated underline ──────────────── */
function SectionHeading({ icon, children, delay = 0, spin = false }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      className="ap-section-head"
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease }}
    >
      <div className="section-title">
        <motion.span
          className="icon"
          animate={spin ? { rotate: [0, 360] } : { rotate: [0, -10, 10, -10, 0] }}
          transition={spin
            ? { duration: 6, repeat: Infinity, ease: 'linear' }
            : { duration: 2.5, repeat: Infinity, repeatDelay: 2.5 }
          }
          style={{ display: 'inline-block' }}
        >
          {icon}
        </motion.span>{' '}
        {children}
      </div>
      <motion.div
        className="ap-head-line"
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.7, delay: delay + 0.15, ease }}
      />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   ABOUT PAGE
══════════════════════════════════════════════════════════════ */
export function AboutPage() {
  const stats = [
    { num: '10K+', label: 'Active Users',    icon: '👥', color: '#f5c542' },
    { num: '50K+', label: 'Movies Listed',   icon: '🎬', color: '#e50914' },
    { num: '1M+',  label: 'Songs Previewed', icon: '🎵', color: '#1db954' },
    { num: '99%',  label: 'Uptime',          icon: '⚡', color: '#3b82f6' },
  ];

  const pillars = [
    { icon: '🎬', title: 'Movies & Shows',    body: 'Thousands of films with real-time streaming links, ratings, and cast info — in every language.' },
    { icon: '🎵', title: 'Music Discovery',   body: 'Preview tracks from pop, Bollywood, K-Pop, jazz and beyond. Build playlists you actually love.' },
    { icon: '📚', title: 'Books & Reading',   body: 'Millions of titles, smart genre filters, and a reading list that travels with you everywhere.' },
    { icon: '🧠', title: 'AI-Powered Quiz',   body: 'Test your entertainment IQ. Score 80%+ on your first try to unlock Premium — forever.' },
    { icon: '🎮', title: 'Games Explorer',    body: 'Curated top-rated games across 8 genres via RAWG. Find your next obsession instantly.' },
    { icon: '📅', title: 'Live Events',       body: 'India concerts, e-sports, festivals and live shows near you — all in one calendar view.' },
  ];

  const values = [
    { icon: '🔭', title: 'Vision',  color: '#6366f1', desc: 'A world where great content is never more than one click away, powered by AI that genuinely understands your taste.' },
    { icon: '🎯', title: 'Mission', color: '#f5c542', desc: 'To be the single destination for entertainment discovery — making it effortless, rewarding, and endlessly fun.' },
    { icon: '⚓', title: 'Our Aim', color: '#e50914', desc: 'Bridge curiosity and content. Support indie films, underground music and hidden-gem books. Keep it free for everyone.' },
  ];

  const tickerItems = ['Movies', 'Music', 'Books', 'Games', 'Events', 'Podcasts', 'Audiobooks', 'Anime', 'K-Drama', 'Esports'];

  return (
    <motion.div
      className="ap-page page-pad"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      {/* ── Atmospheric background ── */}
      <div className="ap-bg" aria-hidden>
        <div className="ap-bg-orb ap-bg-orb--1" />
        <div className="ap-bg-orb ap-bg-orb--2" />
        <div className="ap-bg-orb ap-bg-orb--3" />
        <div className="ap-bg-grid" />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

        {/* ══ HERO SECTION ══════════════════════════════════════════ */}
        <div className="ap-hero">
          <Reveal variant="blur">
            <SectionHeading icon="ℹ️">About Us</SectionHeading>
          </Reveal>

          <motion.div
            className="ap-hero-body"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          >
            <motion.p
              className="ap-hero-text"
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }}
            >
              <strong>Pixel Pirates</strong> is a creative studio merging entertainment and technology.
              We curate the best movies, music, and books while offering personalized AI recommendations,
              real-time streaming links, and gamified experiences.
            </motion.p>
            <motion.p
              className="ap-hero-text"
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } } }}
            >
              Our mission: to make discovery magical — one pixel at a time.{' '}
              <motion.span
                animate={{ rotate: [0, -12, 12, -12, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                style={{ display: 'inline-block' }}
              >
                🏴‍☠️
              </motion.span>
            </motion.p>
          </motion.div>
        </div>

        {/* ── Velocity ticker ── */}
        <VelocityTicker items={tickerItems} />

        {/* ══ STATS ══════════════════════════════════════════════════ */}
        <motion.div
          className="ap-stats"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={{
                hidden: { opacity: 0, y: 40, scale: 0.88 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 220, damping: 20 } }
              }}
            >
              <TiltCard className="ap-stat-card" glowColor={`${s.color}33`}>
                {/* Glowing top border */}
                <div className="ap-stat-bar" style={{ background: s.color }} />
                <motion.div
                  className="ap-stat-icon"
                  animate={{ y: [0, -6, 0], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3 + Math.random(), repeat: Infinity, ease: 'easeInOut' }}
                >
                  {s.icon}
                </motion.div>
                <div className="ap-stat-num" style={{ color: s.color }}>
                  <CountUp value={s.num} />
                </div>
                <div className="ap-stat-label">{s.label}</div>
                {/* Subtle glow spot */}
                <div className="ap-stat-glow" style={{ background: `radial-gradient(circle at 50% 80%, ${s.color}18, transparent 70%)` }} />
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>

        {/* ══ WHAT WE OFFER ══════════════════════════════════════════ */}
        <SectionHeading icon="⚡" spin delay={0.05} style={{ marginTop: '3rem' }}>
          What We Offer
        </SectionHeading>

        <motion.div
          className="ap-pillars"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {pillars.map((p, i) => (
            <motion.div
              key={p.title}
              variants={{
                hidden: { opacity: 0, y: 32, scale: 0.94 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease } }
              }}
            >
              <motion.div
                className="ap-pillar-card card"
                whileHover={{
                  y: -8,
                  boxShadow: '0 24px 50px rgba(245,197,66,0.13)',
                  borderColor: 'rgba(245,197,66,0.32)',
                  transition: { type: 'spring', stiffness: 300, damping: 22 }
                }}
              >
                {/* Hover spotlight */}
                <div className="ap-pillar-spot" />

                <motion.div
                  className="ap-pillar-icon"
                  whileHover={{ scale: 1.3, rotate: [-6, 6, -6, 0], transition: { duration: 0.4 } }}
                >
                  {p.icon}
                </motion.div>
                <div className="ap-pillar-num">0{i + 1}</div>
                <div className="ap-pillar-title">{p.title}</div>
                <div className="ap-pillar-body">{p.body}</div>

                {/* Bottom accent line on hover */}
                <motion.div
                  className="ap-pillar-line"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.35, ease }}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* ══ VALUES ═════════════════════════════════════════════════ */}
        <SectionHeading icon="🏴‍☠️" delay={0.05}>
          Our Values
        </SectionHeading>

        <motion.div
          className="ap-values"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              className="ap-value-card card"
              variants={{
                hidden: { opacity: 0, y: 36 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } }
              }}
              whileHover={{
                y: -10,
                boxShadow: `0 24px 60px ${v.color}28`,
                transition: { type: 'spring', stiffness: 260, damping: 20 }
              }}
            >
              <motion.div
                className="ap-value-bar"
                style={{ background: `linear-gradient(90deg, ${v.color}, ${v.color}66)` }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.13, ease }}
              />
              <motion.div
                className="ap-value-icon"
                animate={{ y: [0, -7, 0] }}
                transition={{ duration: 2.6 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
              >
                {v.icon}
              </motion.div>
              <div
                className="ap-value-number"
                style={{ color: `${v.color}40` }}
              >
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="ap-value-title" style={{ color: v.color }}>{v.title}</h3>
              <p className="ap-value-desc">{v.desc}</p>

              {/* Corner glow */}
              <div className="ap-value-glow" style={{ background: `radial-gradient(circle at 100% 100%, ${v.color}15, transparent 65%)` }} />
            </motion.div>
          ))}
        </motion.div>

        {/* ══ BUILT BY BANNER ════════════════════════════════════════ */}
        <Reveal variant="scale" delay={0.05}>
          <motion.div
            className="ap-banner card"
            whileHover={{ scale: 1.015, boxShadow: '0 20px 60px rgba(245,197,66,0.18)', transition: { type: 'spring', stiffness: 200, damping: 22 } }}
          >
            {/* Animated background gradient */}
            <motion.div
              className="ap-banner-bg"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />

            <motion.div
              className="ap-banner-glow"
              animate={{ scale: [1, 1.4, 1], opacity: [0.35, 0.7, 0.35] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="ap-banner-inner">
              <motion.div
                className="ap-banner-anchor"
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}
              >
                ⚓
              </motion.div>
              <div className="ap-banner-text">
                <div className="ap-banner-title">Built by Pixel Pirates Studio</div>
                <div className="ap-banner-sub">In partnership with UIT-RGPV, Bhopal · Engineering &amp; Creative Technology</div>
              </div>
              <motion.div
                className="ap-banner-badge"
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                🏴‍☠️ Est. 2026
              </motion.div>
            </div>
          </motion.div>
        </Reveal>

      </div>

      {/* ════════════════════ STYLES ════════════════════ */}
      <style>{`
        /* ── Page shell ── */
        .ap-page { position: relative; min-height: 100vh; }

        /* ── Atmosphere ── */
        .ap-bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
        .ap-bg-orb {
          position: absolute; border-radius: 50%;
          filter: blur(100px); will-change: transform;
        }
        .ap-bg-orb--1 {
          width: 700px; height: 700px; top: -200px; left: -200px;
          background: radial-gradient(circle, rgba(245,197,66,0.055) 0%, transparent 70%);
          animation: apOrb1 22s ease-in-out infinite alternate;
        }
        .ap-bg-orb--2 {
          width: 500px; height: 500px; bottom: -150px; right: -100px;
          background: radial-gradient(circle, rgba(99,102,241,0.055) 0%, transparent 70%);
          animation: apOrb2 28s ease-in-out infinite alternate;
        }
        .ap-bg-orb--3 {
          width: 350px; height: 350px; top: 50%; left: 55%;
          background: radial-gradient(circle, rgba(229,9,20,0.04) 0%, transparent 70%);
          animation: apOrb3 20s ease-in-out infinite alternate;
        }
        .ap-bg-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px);
          background-size: 52px 52px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 40%, black 20%, transparent 100%);
        }

        /* ── Hero ── */
        .ap-hero { margin-bottom: 2rem; }
        .ap-hero-body { max-width: 700px; }
        .ap-hero-text {
          color: var(--text2);
          font-size: clamp(0.92rem, 2.2vw, 1.05rem);
          line-height: 1.9;
          margin-bottom: 0.8rem;
        }
        .ap-hero-text strong { color: var(--text); font-weight: 700; }

        /* ── Section heading ── */
        .ap-section-head { margin-bottom: 1.75rem; }
        .ap-head-line {
          height: 2px;
          width: 60px;
          background: linear-gradient(90deg, var(--accent, #f5c542), transparent);
          border-radius: 2px;
          margin-top: 0.4rem;
          transform-origin: left;
        }

        /* ── Ticker ── */
        .ap-ticker {
          overflow: hidden;
          padding: 0.7rem 0;
          margin: 0 -1rem 2.5rem;
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.015);
          white-space: nowrap;
        }
        .ap-ticker-inner { display: flex; will-change: transform; }
        .ap-ticker-item {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0 1.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
        }
        .ap-ticker-dot { color: var(--accent, #f5c542); opacity: 0.6; }

        /* ── Stats ── */
        .ap-stats {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1.1rem;
          margin-bottom: 3rem;
          perspective: 1200px;
        }
        .ap-stat-card {
          position: relative;
          overflow: hidden;
          padding: 1.75rem 1rem 1.5rem;
          text-align: center;
          cursor: default;
          border-radius: var(--card-radius, 14px);
          background: var(--surface, rgba(255,255,255,0.04));
          border: 1px solid var(--border, rgba(255,255,255,0.07));
        }
        .ap-stat-bar {
          position: absolute; top: 0; left: 0; right: 0;
          height: 3px; border-radius: 2px 2px 0 0;
        }
        .ap-stat-icon { font-size: 1.8rem; margin-bottom: 0.5rem; }
        .ap-stat-num {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.4rem);
          font-weight: 800;
          line-height: 1;
          margin-bottom: 0.3rem;
        }
        .ap-stat-label { font-size: 0.76rem; color: var(--text2); }
        .ap-stat-glow {
          position: absolute; inset: 0; pointer-events: none;
        }

        /* ── Pillars ── */
        .ap-pillars {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1.25rem;
          margin-bottom: 3rem;
          perspective: 1200px;
        }
        .ap-pillar-card {
          position: relative;
          overflow: hidden;
          padding: 1.75rem 1.5rem 1.5rem;
          cursor: default;
          transition: border-color 0.3s ease;
        }
        .ap-pillar-spot {
          position: absolute; inset: 0;
          background: radial-gradient(circle at 50% 0%, rgba(245,197,66,0.06), transparent 60%);
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
        }
        .ap-pillar-card:hover .ap-pillar-spot { opacity: 1; }
        .ap-pillar-icon {
          font-size: 2.2rem;
          display: inline-block;
          margin-bottom: 0.5rem;
          cursor: default;
        }
        .ap-pillar-num {
          font-family: 'Syne', sans-serif;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 2px;
          color: rgba(245,197,66,0.35);
          margin-bottom: 0.35rem;
          text-transform: uppercase;
        }
        .ap-pillar-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 0.55rem;
          color: var(--text);
        }
        .ap-pillar-body {
          font-size: 0.86rem;
          color: var(--text2);
          line-height: 1.75;
        }
        .ap-pillar-line {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--accent, #f5c542), transparent);
          transform-origin: left;
        }

        /* ── Values ── */
        .ap-values {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
          perspective: 1200px;
        }
        .ap-value-card {
          position: relative;
          overflow: hidden;
          padding: 2.25rem 1.75rem 1.75rem;
          cursor: default;
          transition: border-color 0.3s ease;
        }
        .ap-value-bar {
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          transform-origin: left;
        }
        .ap-value-icon { font-size: 2.4rem; margin-bottom: 0.6rem; }
        .ap-value-number {
          font-family: 'Syne', sans-serif;
          font-size: 3.5rem;
          font-weight: 900;
          line-height: 1;
          position: absolute;
          top: 1rem; right: 1.25rem;
          pointer-events: none;
          user-select: none;
        }
        .ap-value-title {
          font-family: 'Syne', sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 0.65rem;
        }
        .ap-value-desc {
          font-size: 0.88rem;
          color: var(--text2);
          line-height: 1.8;
          position: relative;
          z-index: 1;
        }
        .ap-value-glow {
          position: absolute; inset: 0; pointer-events: none;
        }

        /* ── Built-by banner ── */
        .ap-banner {
          position: relative;
          overflow: hidden;
          padding: clamp(1.5rem, 4vw, 2.25rem) clamp(1.25rem, 4vw, 2.5rem);
          margin-bottom: 1.5rem;
          transition: border-color 0.3s ease;
        }
        .ap-banner-bg {
          position: absolute; inset: 0;
          background: linear-gradient(120deg,
            rgba(245,197,66,0.03) 0%,
            rgba(99,102,241,0.03) 50%,
            rgba(245,197,66,0.03) 100%
          );
          background-size: 300% 300%;
          pointer-events: none;
        }
        .ap-banner-glow {
          position: absolute; top: -60px; right: -60px;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(245,197,66,0.14), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .ap-banner-inner {
          position: relative; z-index: 1;
          display: flex; align-items: center;
          gap: 1.5rem; flex-wrap: wrap;
        }
        .ap-banner-anchor {
          font-size: 2.4rem;
          filter: drop-shadow(0 0 12px rgba(245,197,66,0.45));
          flex-shrink: 0;
        }
        .ap-banner-text { flex: 1; }
        .ap-banner-title {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: clamp(1rem, 2.5vw, 1.15rem);
          margin-bottom: 0.3rem;
        }
        .ap-banner-sub { font-size: 0.82rem; color: var(--text2); }
        .ap-banner-badge {
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.4rem 1rem;
          border-radius: 2rem;
          background: rgba(245,197,66,0.1);
          border: 1px solid rgba(245,197,66,0.2);
          color: var(--accent, #f5c542);
          white-space: nowrap;
        }

        /* ════ KEYFRAMES ════ */
        @keyframes apOrb1 {
          0%   { transform: translate(0,0) scale(1); }
          100% { transform: translate(80px, 60px) scale(1.2); }
        }
        @keyframes apOrb2 {
          0%   { transform: translate(0,0); }
          100% { transform: translate(-70px,-80px) scale(1.15); }
        }
        @keyframes apOrb3 {
          0%   { transform: translate(0,0); }
          100% { transform: translate(-50px,40px); }
        }

        /* ════ RESPONSIVE ════ */
        @media (max-width: 768px) {
          .ap-stats    { grid-template-columns: repeat(2, 1fr); }
          .ap-values   { grid-template-columns: 1fr; }
          .ap-pillars  { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); }
          .ap-banner-inner { gap: 1rem; }
          .ap-banner-badge { display: none; }
        }
        @media (max-width: 480px) {
          .ap-stats   { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .ap-pillars { grid-template-columns: 1fr; }
          .ap-ticker  { margin: 0 -0.5rem 2rem; }
        }
        @media (prefers-reduced-motion: reduce) {
          .ap-bg-orb, .ap-ticker-inner { animation: none !important; }
          .ap-banner-bg { animation: none !important; }
        }
      `}</style>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CONTACT PAGE
══════════════════════════════════════════════════════════════ */
export function ContactPage() {
  const { success, error } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent]     = useState(false);
  const [focused, setFocused] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, message } = form;
    if (!name || !email || !message) { error('Please fill all fields.'); return; }
    setSubmitting(true);
    const sub  = encodeURIComponent(`[Pixel Pirates] Message from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
    window.open(`https://mail.google.com/mail/?view=cm&to=pixelpirateaspirex@gmail.com&su=${sub}&body=${body}`, '_blank');
    setSent(true);
    success('Gmail compose opened! ✉️', 3000);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => { setSent(false); setSubmitting(false); }, 5000);
  };

  const socials = [
    { href: 'https://x.com/__pixelpirates',             label: '𝕏 Twitter',   color: '#1da1f2' },
    { href: 'https://www.instagram.com/__pixelpirates', label: '📸 Instagram', color: '#e1306c' },
    { href: 'https://github.com/pixelpirateaspirex',    label: '🐙 GitHub',    color: '#8b5cf6' },
  ];

  const contactItems = [
    { icon: '📍', text: 'UIT-RGPV, Bhopal, Madhya Pradesh' },
    { icon: '📞', text: '+91 98765 43210' },
    { icon: '📧', text: 'pixelpirateaspirex@gmail.com' },
  ];

  const fields = [
    { key: 'name',  label: 'Your Name',     type: 'text',  placeholder: 'Captain Jack Sparrow' },
    { key: 'email', label: 'Email Address', type: 'email', placeholder: 'you@example.com'      },
  ];

  return (
    <motion.div
      className="cp-page page-pad"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

        <Reveal variant="blur">
          <div className="ap-section-head" style={{ marginBottom: '2rem' }}>
            <div className="section-title">
              <motion.span
                className="icon"
                animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                style={{ display: 'inline-block' }}
              >✉️</motion.span>{' '}
              Contact Us
            </div>
            <div className="ap-head-line" />
          </div>
        </Reveal>

        <div className="cp-grid">

          {/* ── Info ── */}
          <Reveal variant="left" delay={0.1}>
            <div className="cp-info">
              {contactItems.map((item, i) => (
                <motion.div
                  key={item.text}
                  className="cp-ci-item"
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 + i * 0.09, duration: 0.5, ease }}
                  whileHover={{ x: 6, color: 'var(--accent)' }}
                >
                  <span className="cp-ci-dot">{item.icon}</span>
                  <span>{item.text}</span>
                </motion.div>
              ))}

              <motion.div
                className="cp-socials"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {socials.map((s) => (
                  <motion.a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cp-social-link"
                    variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } } }}
                    whileHover={{ scale: 1.08, y: -3, borderColor: s.color, color: s.color, background: `${s.color}15` }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {s.label}
                  </motion.a>
                ))}
              </motion.div>

              <motion.div
                className="cp-map"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6, ease }}
              >
                <iframe
                  title="Pixel Pirates Location"
                  width="100%" height="220"
                  style={{ border: 0, borderRadius: '12px', display: 'block' }}
                  loading="lazy"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3664.1542250416237!2d77.36167189999999!3d23.3101625!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x397c663a2f02fc89%3A0x12a6b478bbd192f1!2sUniversity%20Institute%20of%20Technology%20RGPV!5e0!3m2!1sen!2sin!4v1774774519577!5m2!1sen!2sin"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </motion.div>
            </div>
          </Reveal>

          {/* ── Form ── */}
          <Reveal variant="right" delay={0.15}>
            <motion.form
              className="cp-form card"
              onSubmit={handleSubmit}
              noValidate
            >
              <div className="cp-form-glow" aria-hidden />

              {fields.map((field, i) => (
                <motion.div
                  key={field.key}
                  className="cp-field"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.12 + i * 0.09, duration: 0.5, ease }}
                >
                  <label className="cp-label">{field.label}</label>
                  <motion.input
                    className="cp-input form-control"
                    type={field.type}
                    placeholder={field.placeholder}
                    value={form[field.key]}
                    onChange={set(field.key)}
                    onFocus={() => setFocused(field.key)}
                    onBlur={() => setFocused('')}
                    animate={{
                      boxShadow: focused === field.key
                        ? '0 0 0 3px rgba(245,197,66,0.18)'
                        : '0 0 0 0px rgba(245,197,66,0)',
                      borderColor: focused === field.key
                        ? 'rgba(245,197,66,0.5)'
                        : 'var(--border)'
                    }}
                    transition={{ duration: 0.2 }}
                    required
                  />
                </motion.div>
              ))}

              <motion.div
                className="cp-field"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5, ease }}
              >
                <label className="cp-label">Message</label>
                <motion.textarea
                  className="cp-input form-control"
                  rows={5}
                  placeholder="Your message…"
                  value={form.message}
                  onChange={set('message')}
                  onFocus={() => setFocused('message')}
                  onBlur={() => setFocused('')}
                  animate={{
                    boxShadow: focused === 'message'
                      ? '0 0 0 3px rgba(245,197,66,0.18)'
                      : '0 0 0 0px rgba(245,197,66,0)',
                    borderColor: focused === 'message'
                      ? 'rgba(245,197,66,0.5)'
                      : 'var(--border)'
                  }}
                  transition={{ duration: 0.2 }}
                  required
                  style={{ resize: 'vertical' }}
                />
              </motion.div>

              <AnimatePresence>
                {sent && (
                  <motion.div
                    className="cp-success"
                    initial={{ opacity: 0, y: -12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  >
                    ✅ Gmail compose opened! Send the pre-filled email.
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                type="submit"
                className="btn btn-primary cp-submit"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5, ease }}
                whileHover={{ scale: 1.03, y: -3, boxShadow: '0 10px 32px rgba(245,197,66,0.35)' }}
                whileTap={{ scale: 0.96 }}
                disabled={submitting}
              >
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2 }}
                  style={{ display: 'inline-block' }}
                >✈️</motion.span>{' '}
                Send Message
              </motion.button>
            </motion.form>
          </Reveal>

        </div>
      </div>

      <style>{`
        .cp-page { min-height: 100vh; }

        .cp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
          margin-top: 0.5rem;
        }

        .cp-info { display: flex; flex-direction: column; }

        .cp-ci-item {
          display: flex; align-items: center; gap: 0.65rem;
          font-size: 0.92rem; color: var(--text2);
          margin-bottom: 0.85rem; cursor: default;
          transition: color 0.2s ease;
        }
        .cp-ci-dot {
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(245,197,66,0.08);
          border: 1px solid rgba(245,197,66,0.15);
          border-radius: 8px;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .cp-socials {
          display: flex; gap: 0.65rem; flex-wrap: wrap;
          margin: 0.5rem 0 1.5rem;
        }
        .cp-social-link {
          color: var(--text2); text-decoration: none;
          font-size: 0.82rem; font-weight: 600;
          padding: 0.35rem 0.9rem;
          border-radius: 2rem;
          border: 1px solid var(--border);
          background: var(--surface);
          display: inline-block;
          transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
        }

        .cp-map {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid var(--border);
          flex: 1;
        }

        .cp-form {
          position: relative;
          overflow: hidden;
          display: flex; flex-direction: column;
          gap: 0;
          padding: clamp(1.5rem, 4vw, 2rem);
        }
        .cp-form-glow {
          position: absolute; top: -80px; right: -60px;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(245,197,66,0.07), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }

        .cp-field { margin-bottom: 1.1rem; position: relative; z-index: 1; }
        .cp-label {
          display: block;
          font-size: 0.78rem;
          font-weight: 500;
          color: var(--text2);
          margin-bottom: 0.4rem;
          letter-spacing: 0.3px;
        }
        .cp-input {
          width: 100%;
          background: rgba(255,255,255,0.03) !important;
          border: 1px solid var(--border) !important;
          border-radius: 10px !important;
          color: var(--text) !important;
          font-family: 'Outfit', sans-serif !important;
          font-size: 0.9rem !important;
          transition: box-shadow 0.2s ease, border-color 0.2s ease !important;
        }

        .cp-success {
          background: rgba(34,197,94,0.1);
          border: 1px solid rgba(34,197,94,0.25);
          color: #86efac;
          padding: 0.7rem 1rem;
          border-radius: 10px;
          font-size: 0.84rem;
          margin-bottom: 0.75rem;
        }

        .cp-submit {
          width: 100%; margin-top: 0.25rem;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }

        @media (max-width: 700px) {
          .cp-grid { grid-template-columns: 1fr; }
          .cp-map iframe { height: 180px; }
        }
      `}</style>
    </motion.div>
  );
}

export default AboutPage;
