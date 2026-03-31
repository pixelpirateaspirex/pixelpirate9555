// src/components/MeetTheTeam.jsx — Animated · Theme-Safe · Production Ready
import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import mayankPhoto       from "../assets/Mayank_Mishra1.jpg";
import anushkaPhoto      from "../assets/Anushka Jain.jpeg";
import arpitaPhoto       from "../assets/Arpita Wagh.jpeg";
import aryanPhoto        from "../assets/Aryan Dhola.jpeg";
import khushiPhoto       from "../assets/Khushi Mangal.jpeg";
import nekPhoto          from "../assets/Nek Narayan.jpeg";
import palakPhoto        from "../assets/Palak Khare.jpeg";
import priyansheePhoto   from "../assets/Priyanshee Manker.jpeg";
import rakshaPhoto       from "../assets/Raksha Kushwaha.jpeg";
import satyamPhoto       from "../assets/Satyam Sharma.jpeg";
import tishirPhoto       from "../assets/Tishir Raymond.jpeg";
import mayankbhumankarPhoto from "../assets/Mayank Bhumarkar.jpeg";
import rishabPhoto       from "../assets/Rishab Jatt.jpeg";
import Jitesh        from "../assets/Jitesh.jpeg";


const PH = (name) =>
  `https://placehold.co/200x200/07101f/f5c542?text=${encodeURIComponent(name.split(" ")[0])}`;

const TEAM_MEMBERS = [
  { id: 1,  name: "Mayank Mishra",      role: "President", tier: "president", domains: ["Leadership", "Strategy"],           photo: mayankPhoto },
  { id: 2,  name: "Tishir Raymond",     role: "Lead",      tier: "lead",      domains: ["Senior Advisor"],                   photo: tishirPhoto },
  { id: 3,  name: "Priyanshee Manker",  role: "Lead",      tier: "lead",      domains: ["Senior Advisor"],                   photo: priyansheePhoto },
  { id: 4,  name: "Satyam Sharma",      role: "Core",      tier: "core",      domains: ["Senior Web Developer"],             photo: satyamPhoto },
  { id: 5,  name: "Nek Narayan",        role: "Core",      tier: "core",      domains: ["AI Media Specialist"],              photo: nekPhoto },
  { id: 6,  name: "Rishab Jatt",        role: "Core",      tier: "core",      domains: ["DevOps Engineer"],                  photo: rishabPhoto },
  { id: 7,  name: "Anushka Jain",       role: "Core",      tier: "core",      domains: ["AI/ML Engineer"],                   photo: anushkaPhoto },
  { id: 8,  name: "Arpita Wagh",        role: "Core",      tier: "core",      domains: ["Visual Artist"],                    photo: arpitaPhoto },
  { id: 9,  name: "Aryan Dhola",        role: "Core",      tier: "core",      domains: ["Game Developer"],                   photo: aryanPhoto },
  { id: 10, name: "Khushi Mangal",      role: "Core",      tier: "core",      domains: ["Corporate Relations Manager"],      photo: khushiPhoto },
  { id: 11, name: "Palak Khare",        role: "Core",      tier: "core",      domains: ["AI/ML Engineer"],                   photo: palakPhoto },
  { id: 12, name: "Raksha Kushwaha",    role: "Core",      tier: "core",      domains: ["Visual Artist"],                    photo: rakshaPhoto },
  { id: 13, name: "Mayank Bhumarkar",   role: "Core",      tier: "core",      domains: ["Visual Artist"],                    photo: mayankbhumankarPhoto },
  { id: 14, name: "Jitesh Dhanware",    role: "Core",      tier: "core",      domains: ["AI/ML Engineer"],                   photo: Jitesh },
];

/* Duplicate for seamless infinite scroll */
const SCROLL_MEMBERS = [...TEAM_MEMBERS, ...TEAM_MEMBERS];

/* Role → accent color map */
const TIER_COLOR = {
  president: "#f5c542",
  lead:      "#4a90d9",
  core:      "var(--text2)",
};

/* ── Team Card ─────────────────────────────────────────────────────────────── */
function TeamCard({ member, index }) {
  const cardRef = useRef(null);
  const color   = TIER_COLOR[member.tier] || "var(--text2)";

  /* 3-D tilt */
  const onMove = (e) => {
    const c = cardRef.current;
    if (!c || !matchMedia("(hover:hover)").matches) return;
    const { left, top, width, height } = c.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;
    const y = (e.clientY - top)  / height - 0.5;
    c.style.transform = `perspective(500px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) translateY(-6px) scale(1.03)`;
  };
  const onLeave = () => { if (cardRef.current) cardRef.current.style.transform = ""; };

  return (
    <div
      ref={cardRef}
      className="tt-card"
      style={{ "--tc": color, "--di": `${(index % 7) * 0.04}s` }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      role="listitem"
    >
      {/* Animated border glow */}
      <div className="tt-card-border" aria-hidden="true" />

      {/* Photo */}
      <div className="tt-img-wrap">
        <img
          src={member.photo}
          alt={member.name}
          loading="lazy"
          onError={(e) => { e.target.src = PH(member.name); }}
        />
        {/* Hover overlay shimmer */}
        <div className="tt-img-overlay" aria-hidden="true" />
        {/* Role badge on photo */}
        <div className="tt-role-badge" style={{ "--bc": color }}>{member.role}</div>
      </div>

      {/* Info */}
      <div className="tt-info">
        <div className="tt-name">{member.name}</div>
        <div className="tt-domain">{member.domains.join(" · ")}</div>
      </div>
    </div>
  );
}

/* ── MeetTheTeam ───────────────────────────────────────────────────────────── */
export default function MeetTheTeam() {
  const trackRef    = useRef(null);
  const sectionRef  = useRef(null);
  const [visible, setVisible] = useState(false);
  const [paused,  setPaused]  = useState(false);

  /* Section reveal */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* Pause carousel on hover */
  const pause  = () => { setPaused(true);  if (trackRef.current) trackRef.current.style.animationPlayState = "paused"; };
  const resume = () => { setPaused(false); if (trackRef.current) trackRef.current.style.animationPlayState = "running"; };

  return (
    <section ref={sectionRef} className={`tt-section${visible ? " tt-visible" : ""}`} aria-label="Meet the team">

      {/* Ambient orbs */}
      <div className="tt-orb tt-orb-a" aria-hidden="true" />
      <div className="tt-orb tt-orb-b" aria-hidden="true" />

      {/* Heading */}
      <div className="tt-heading-wrap">
        <div className="tt-eyebrow" aria-hidden="true">
          <span className="tt-line" /><span>The Crew</span><span className="tt-line" />
        </div>
        <h2 className="tt-heading">
          MEET THE <span className="tt-accent-word">TEAM</span>
        </h2>
        <p className="tt-sub">The passionate individuals driving the Pixel Pirates community forward.</p>
      </div>

      {/* Member count */}
      <div className="tt-meta-row" aria-label="Team statistics">
        <div className="tt-meta-item">
          <span className="tt-meta-n">{TEAM_MEMBERS.length}</span>
          <span className="tt-meta-l">Members</span>
        </div>
        <div className="tt-meta-div" />
        <div className="tt-meta-item">
          <span className="tt-meta-n">2</span>
          <span className="tt-meta-l">Tiers</span>
        </div>
        <div className="tt-meta-div" />
        <div className="tt-meta-item">
          <span className="tt-meta-n">∞</span>
          <span className="tt-meta-l">Passion</span>
        </div>
      </div>

      {/* Carousel */}
      <div
        className="tt-viewport"
        onMouseEnter={pause}
        onMouseLeave={resume}
        onTouchStart={pause}
        onTouchEnd={resume}
        role="list"
        aria-label="Team members carousel"
      >
        <div className="tt-track" ref={trackRef}>
          {SCROLL_MEMBERS.map((m, i) => (
            <TeamCard key={`${m.id}-${i}`} member={m} index={i} />
          ))}
        </div>
      </div>

      {/* Pause indicator */}
      {paused && (
        <div className="tt-pause-hint" aria-live="polite">⏸ Paused — move away to resume</div>
      )}

      {/* CTA */}
      <div className="tt-cta-wrap">
        <Link to="/team" className="tt-cta" aria-label="View full team page">
          <span className="tt-cta-shimmer" aria-hidden="true" />
          VIEW FULL TEAM
          <span className="tt-cta-arrow" aria-hidden="true">→</span>
        </Link>
      </div>

      {/* ── Styles ────────────────────────────────────────────────── */}
      <style>{`
        /* Section */
        .tt-section {
          position: relative; overflow: hidden;
          padding: 4rem 0 4.5rem;
        }

        /* Ambient orbs */
        .tt-orb {
          position: absolute; border-radius: 50%;
          pointer-events: none; filter: blur(110px); opacity: .08;
          animation: tt-drift 12s ease-in-out infinite alternate;
        }
        .tt-orb-a { width: 400px; height: 400px; background: var(--accent,#f5c542); top: -100px; left: -80px; }
        .tt-orb-b { width: 300px; height: 300px; background: #4a90d9; bottom: -80px; right: -60px; animation-duration: 9s; animation-delay: 2s; }
        @keyframes tt-drift { from{transform:translateY(0) scale(1)} to{transform:translateY(-24px) scale(1.1)} }

        /* Section reveal */
        .tt-section .tt-heading-wrap,
        .tt-section .tt-meta-row,
        .tt-section .tt-cta-wrap {
          opacity: 0; transform: translateY(28px);
          transition: opacity .7s ease, transform .7s cubic-bezier(.22,1,.36,1);
        }
        .tt-visible .tt-heading-wrap { opacity: 1; transform: translateY(0); transition-delay: .05s; }
        .tt-visible .tt-meta-row     { opacity: 1; transform: translateY(0); transition-delay: .18s; }
        .tt-visible .tt-cta-wrap     { opacity: 1; transform: translateY(0); transition-delay: .3s;  }

        /* Eyebrow */
        .tt-heading-wrap { text-align: center; padding: 0 1rem; margin-bottom: 1.8rem; }
        .tt-eyebrow {
          display: flex; align-items: center; justify-content: center;
          gap: .75rem; font-size: .7rem; color: var(--text2);
          letter-spacing: .12em; text-transform: uppercase; margin-bottom: .65rem;
        }
        .tt-line {
          flex: 1; max-width: 80px; height: 1px;
          background: linear-gradient(90deg, transparent, var(--border,rgba(128,128,128,.25)));
        }
        .tt-eyebrow span:nth-child(2) { color: var(--accent,#f5c542); }
        .tt-line:last-child { background: linear-gradient(270deg, transparent, var(--border,rgba(128,128,128,.25))); }

        /* Heading */
        .tt-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 6vw, 3.5rem);
          font-weight: 900; letter-spacing: .04em;
          color: var(--text); margin: 0 0 .65rem; text-transform: uppercase; line-height: 1.05;
        }
        .tt-accent-word {
          background: linear-gradient(110deg, var(--accent,#f5c542) 20%, #ffd97a 60%, var(--accent,#f5c542) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: tt-sweep 4s linear infinite;
        }
        @keyframes tt-sweep { from{background-position:200% center} to{background-position:-200% center} }
        .tt-sub { font-size: clamp(.85rem, 1.5vw, 1rem); color: var(--text2); margin: 0; }

        /* Meta row */
        .tt-meta-row {
          display: flex; align-items: center; justify-content: center; gap: 2rem;
          margin-bottom: 2rem; padding: 0 1rem;
        }
        .tt-meta-item { display: flex; flex-direction: column; align-items: center; gap: .08rem; }
        .tt-meta-n {
          font-family: 'Syne', sans-serif; font-size: 1.4rem;
          font-weight: 900; color: var(--accent,#f5c542); line-height: 1;
        }
        .tt-meta-l { font-size: .62rem; color: var(--text2); text-transform: uppercase; letter-spacing: .08em; }
        .tt-meta-div { width: 1px; height: 32px; background: var(--border,rgba(128,128,128,.2)); }

        /* Viewport */
        .tt-viewport {
          width: 100%; overflow: hidden; cursor: default;
          mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 7%, black 93%, transparent 100%);
          padding: .5rem 0 1rem;
        }

        /* Track */
        .tt-track {
          display: flex; gap: 1.1rem; width: max-content;
          animation: tt-scroll 42s linear infinite;
          will-change: transform;
        }
        @keyframes tt-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }

        /* Pause hint */
        .tt-pause-hint {
          text-align: center; font-size: .72rem; color: var(--text2);
          margin-top: .5rem; animation: tt-fade-in .25s ease both;
        }
        @keyframes tt-fade-in { from{opacity:0} to{opacity:1} }

        /* ── Card ─────────────────────────────────────────────────── */
        .tt-card {
          position: relative; flex-shrink: 0; width: 210px;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 18px; padding: 1.4rem 1.1rem 1.25rem;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          cursor: default; will-change: transform;
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, border-color .25s;
          overflow: hidden;
        }
        .tt-card:hover {
          border-color: var(--tc, var(--accent,#f5c542));
          box-shadow: 0 14px 40px rgba(0,0,0,.3), 0 0 0 1px rgba(245,197,66,.1);
        }

        /* Animated conic glow border */
        .tt-card-border {
          position: absolute; inset: -1px; border-radius: 19px; z-index: -1;
          background: conic-gradient(from 0deg, transparent 0deg, var(--tc,var(--accent,#f5c542)) 60deg, transparent 120deg);
          opacity: 0; transition: opacity .3s;
          animation: tt-border-spin 4s linear infinite;
        }
        .tt-card:hover .tt-card-border { opacity: .45; }
        @keyframes tt-border-spin { to { transform: rotate(360deg); } }

        /* Photo */
        .tt-img-wrap {
          position: relative;
          width: 100px; height: 100px; border-radius: 50%; overflow: hidden;
          border: 2.5px solid var(--border); margin-bottom: .9rem;
          background: var(--surface); flex-shrink: 0;
          transition: border-color .28s, box-shadow .28s;
        }
        .tt-card:hover .tt-img-wrap {
          border-color: var(--tc, var(--accent,#f5c542));
          box-shadow: 0 0 0 4px rgba(245,197,66,.12);
        }
        .tt-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s; }
        .tt-card:hover .tt-img-wrap img { transform: scale(1.08); }

        /* Shimmer overlay on photo hover */
        .tt-img-overlay {
          position: absolute; inset: 0; border-radius: 50%;
          background: linear-gradient(135deg, rgba(245,197,66,.18) 0%, transparent 60%);
          opacity: 0; transition: opacity .3s;
        }
        .tt-card:hover .tt-img-overlay { opacity: 1; }

        /* Role badge */
        .tt-role-badge {
          position: absolute; bottom: 2px; right: 2px;
          font-size: .56rem; font-weight: 700;
          color: var(--bc, var(--accent,#f5c542));
          background: var(--bg); border: 1px solid var(--bc, var(--accent,#f5c542));
          padding: .1rem .38rem; border-radius: 999px;
          letter-spacing: .04em; text-transform: uppercase;
          opacity: 0; transform: scale(.8);
          transition: opacity .25s, transform .25s;
        }
        .tt-card:hover .tt-role-badge { opacity: 1; transform: scale(1); }

        /* Text */
        .tt-info { display: flex; flex-direction: column; gap: .2rem; }
        .tt-name {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: .94rem;
          color: var(--text); line-height: 1.25;
        }
        .tt-domain {
          font-size: .66rem; font-weight: 500;
          color: var(--text2); letter-spacing: .04em;
          line-height: 1.4;
        }

        /* Light mode overrides */
        body.light .tt-card { background: #fff; border-color: rgba(0,0,0,.1); box-shadow: 0 2px 10px rgba(0,0,0,.06); }
        body.light .tt-card:hover { box-shadow: 0 12px 36px rgba(0,0,0,.12); }
        body.light .tt-name  { color: #16213e; }
        body.light .tt-domain { color: #5a6580; }
        body.light .tt-img-wrap { border-color: rgba(0,0,0,.12); }

        /* CTA */
        .tt-cta-wrap { display: flex; justify-content: center; margin-top: 2.5rem; padding: 0 1rem; }
        .tt-cta {
          position: relative; overflow: hidden;
          display: inline-flex; align-items: center; gap: .6rem;
          border: 2px solid var(--border, rgba(128,128,128,.25));
          color: var(--text); padding: .8rem 2.6rem;
          border-radius: 2rem;
          font-family: 'Syne', sans-serif; font-size: .82rem; font-weight: 700;
          letter-spacing: .1em; text-decoration: none; text-transform: uppercase;
          transition: border-color .25s, color .25s, background .25s, transform .25s;
          isolation: isolate;
        }
        .tt-cta:hover {
          border-color: var(--accent,#f5c542);
          background: var(--accent,#f5c542); color: #07101f;
          transform: scale(1.04);
          box-shadow: 0 6px 24px rgba(245,197,66,.32);
        }
        .tt-cta:active { transform: scale(.97); }

        /* Shimmer sweep on CTA hover */
        .tt-cta-shimmer {
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent);
          transition: none;
        }
        .tt-cta:hover .tt-cta-shimmer {
          animation: tt-cta-sweep .55s ease forwards;
        }
        @keyframes tt-cta-sweep { to { left: 160%; } }

        .tt-cta-arrow {
          display: inline-block;
          transition: transform .22s cubic-bezier(.34,1.56,.64,1);
        }
        .tt-cta:hover .tt-cta-arrow { transform: translateX(5px); }

        body.light .tt-cta { color: #16213e; border-color: rgba(0,0,0,.2); }
        body.light .tt-cta:hover { color: #07101f; }

        /* Responsive */
        @media (max-width: 768px) {
          .tt-meta-row { gap: 1.25rem; }
          .tt-card { width: 185px; padding: 1.25rem 1rem; }
          .tt-img-wrap { width: 88px; height: 88px; }
        }
        @media (max-width: 480px) {
          .tt-card { width: 165px; }
          .tt-heading { font-size: clamp(1.75rem, 7vw, 2.5rem); }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .tt-track, .tt-accent-word, .tt-orb, .tt-card-border { animation: none !important; }
          .tt-section .tt-heading-wrap,
          .tt-section .tt-meta-row,
          .tt-section .tt-cta-wrap { opacity: 1 !important; transform: none !important; transition: none !important; }
          .tt-card { transition: none !important; }
          .tt-cta  { transition: none !important; }
          .tt-cta:hover .tt-cta-shimmer { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
