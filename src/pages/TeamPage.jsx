// src/pages/TeamPage.jsx  — Animated & Production-Ready
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import mayankPhoto        from "../assets/Mayank_Mishra1.jpg";
import anushkaPhoto       from "../assets/Anushka Jain.jpeg";
import arpitaPhoto        from "../assets/Arpita Wagh.jpeg";
import aryanPhoto         from "../assets/Aryan Dhola.jpeg";
import khushiPhoto        from "../assets/Khushi Mangal.jpeg";
import nekPhoto           from "../assets/Nek Narayan.jpeg";
import palakPhoto         from "../assets/Palak Khare.jpeg";
import priyansheePhoto    from "../assets/Priyanshee Manker.jpeg";
import rakshaPhoto        from "../assets/Raksha Kushwaha.jpeg";
import satyamPhoto        from "../assets/Satyam Sharma.jpeg";
import tishirPhoto        from "../assets/Tishir Raymond.jpeg";
import mayankbhumankarPhoto from "../assets/Mayank Bhumarkar.jpeg";
import rishabPhoto        from "../assets/Rishab Jatt.jpeg";
import Jitesh        from "../assets/Jitesh.jpeg";

const PH    = (name) => `https://placehold.co/400x500/07101f/f5c542?text=${encodeURIComponent(name.split(" ")[0])}`;
const PH_SQ = (name) => `https://placehold.co/300x300/07101f/f5c542?text=${encodeURIComponent(name.split(" ")[0])}`;

const PRESIDENT = {
  name: "Mayank Mishra",
  role: "President",
  domains: ["Leadership", "Strategy", "Community"],
  photo: mayankPhoto,
  bio: "Driving Pixel Pirates' vision and building a community of passionate learners.",
};

const LEADS = [
  { id:1, name:"Tishir Raymond Michael",    role:"Lead", domains:["Senior Advisor"], photo:tishirPhoto    },
  { id:2, name:"Priyanshee Manker", role:"Lead", domains:["Senior Advisor"], photo:priyansheePhoto },
];

const CORE_MEMBERS = [
  { id:1,  name:"Satyam Sharma",    role:"Core Member", domains:["Senior Web Developer"],      photo:satyamPhoto          },
  { id:2,  name:"Nek Narayan",      role:"Core Member", domains:["AI Media Specialist"],        photo:nekPhoto             },
  { id:3,  name:"Rishab Jatt",      role:"Core Member", domains:["DevOps Engineer"],             photo:rishabPhoto          },
  { id:4,  name:"Anushka Jain",     role:"Core Member", domains:["AI/ML Engineer"],              photo:anushkaPhoto         },
  { id:5,  name:"Arpita Wagh",      role:"Core Member", domains:["Visual Artist"],               photo:arpitaPhoto          },
  { id:6,  name:"Aryan Dhola",      role:"Core Member", domains:["Game Developer"],              photo:aryanPhoto           },
  { id:7,  name:"Khushi Mangal",    role:"Core Member", domains:["Corporate Relations Manager"], photo:khushiPhoto          },
  { id:8,  name:"Palak Khare",      role:"Core Member", domains:["AI/ML Engineer"],              photo:palakPhoto           },
  { id:9,  name:"Raksha Kushwaha",  role:"Core Member", domains:["Visual Artist"],               photo:rakshaPhoto          },
  { id:10, name:"Mayank Bhumarkar", role:"Core Member", domains:["Visual Artist"],               photo:mayankbhumankarPhoto },
  { id:11, name:"Jitesh Dhanware",  role:"Core Member", domains:["AI/ML Engineer"],              photo:Jitesh },
];

/* ── Scroll-reveal hook ─────────────────────────────────────────── */
function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Grid Card ──────────────────────────────────────────────────── */
function GridCard({ member, index }) {
  const [hovered, setHovered] = useState(false);
  const [ref, visible] = useInView(0.05);

  return (
    <div
      ref={ref}
      className={`tg-card${visible ? ' tg-visible' : ''}`}
      style={{ transitionDelay: `${Math.min(index * 55, 550)}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="tg-img-wrap">
        <img
          src={member.photo}
          alt={member.name}
          loading="lazy"
          onError={(e) => { e.target.src = PH_SQ(member.name); }}
        />
        {/* hover overlay */}
        <div className={`tg-overlay${hovered ? " show" : ""}`}>
          <div className="tg-overlay-domains">
            {member.domains.map((d, i) => (
              <span
                key={d}
                className="tg-tag"
                style={{ animationDelay: hovered ? `${i * 60}ms` : '0ms' }}
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
      {/* bottom meta — hidden on hover */}
      <div className={`tg-meta${hovered ? ' tg-meta-hidden' : ''}`}>
        <span className="tg-mname">{member.name}</span>
        <span className="tg-mrole">{member.domains.join(" · ").toUpperCase()}</span>
      </div>
    </div>
  );
}

/* ── Section Label ──────────────────────────────────────────────── */
function SectionLabel({ label }) {
  const [ref, visible] = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`tp-label${visible ? ' tp-label-visible' : ''}`}
    >
      <span className="tp-label-bar" />
      <span className="tp-label-text">{label}</span>
    </div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function TeamPage() {
  const [presRef, presVisible] = useInView(0.1);
  const [heroRef, setHeroVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="tp-page">

      {/* ── Hero ── */}
      <div className={`tp-hero${heroRef ? ' tp-hero-visible' : ''}`}>
        <div className="tp-hero-bg" aria-hidden>
          <div className="tp-glow tp-glow-1" />
          <div className="tp-glow tp-glow-2" />
          <div className="tp-hero-grid" />
        </div>
        <div className="tp-hero-inner">
          <div className="tp-hero-eyebrow">👾 Pixel Pirates</div>
          <h1 className="tp-title">
            THE <span className="tp-accent">MINDS</span> BEHIND
          </h1>
          <p className="tp-subtitle">
            Meet the leaders, creators, and innovators driving Pixel Pirates forward.
          </p>
        </div>
      </div>

      <div className="tp-container">

        {/* ── President ── */}
        <div
          ref={presRef}
          className={`tp-president-wrap${presVisible ? ' tp-pres-visible' : ''}`}
        >
          <div className="tp-president-card">
            <div className="tp-pres-img-wrap">
              <img
                src={PRESIDENT.photo}
                alt={PRESIDENT.name}
                onError={(e) => { e.target.src = PH(PRESIDENT.name); }}
              />
              <div className="tp-pres-glow-ring" />
              <div className="tp-pres-overlay">
                <div className="tp-pres-name">{PRESIDENT.name}</div>
                <div className="tp-pres-role-badge">{PRESIDENT.role}</div>
                <div className="tp-pres-bio">{PRESIDENT.bio}</div>
              </div>
            </div>
            <div className="tp-pres-domains">
              {PRESIDENT.domains.map((d) => (
                <span key={d} className="tp-pres-domain-tag">{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Leads ── */}
        <SectionLabel label="LEADS" />
        <div className="tp-grid tp-leads-grid">
          {LEADS.map((m, i) => (
            <GridCard key={m.id} member={m} index={i} />
          ))}
        </div>

        {/* ── Core Members ── */}
        {CORE_MEMBERS.length > 0 && (
          <>
            <SectionLabel label="CORE MEMBERS" />
            <div className="tp-grid">
              {CORE_MEMBERS.map((m, i) => (
                <GridCard key={m.id} member={m} index={i} />
              ))}
            </div>
          </>
        )}

        {/* ── Back ── */}
        <div className="tp-back-wrap">
          <Link to="/" className="tp-back-btn">
            <span className="tp-back-arrow">←</span> Back to Home
          </Link>
        </div>
      </div>

      <style>{`
        /* ── Page ── */
        .tp-page {
          min-height: 100vh;
          padding-bottom: 5rem;
        }

        /* ── Hero ── */
        .tp-hero {
          position: relative; overflow: hidden;
          padding: calc(var(--nav-h, 64px) + 3.5rem) 0 3rem;
          text-align: center;
          opacity: 0; transform: translateY(24px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(.22,1,.36,1);
        }
        .tp-hero.tp-hero-visible { opacity:1; transform:translateY(0); }
        .tp-hero-bg { position:absolute; inset:0; pointer-events:none; }
        .tp-glow {
          position:absolute; border-radius:50%;
          filter:blur(80px); pointer-events:none;
        }
        .tp-glow-1 {
          width:600px; height:400px; top:-100px; left:-100px;
          background:radial-gradient(circle, var(--accent-glow, rgba(245,197,66,0.08)), transparent 70%);
          animation: tp-glow-drift 8s ease-in-out infinite;
        }
        .tp-glow-2 {
          width:500px; height:350px; bottom:-50px; right:-80px;
          background:radial-gradient(circle, rgba(59,130,246,0.05), transparent 70%);
          animation: tp-glow-drift 10s ease-in-out infinite reverse;
        }
        @keyframes tp-glow-drift {
          0%,100% { transform:translate(0,0); }
          50%      { transform:translate(20px,15px); }
        }
        .tp-hero-grid {
          position:absolute; inset:0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size:50px 50px; opacity:0.3;
          animation: tp-grid-fade 1.2s ease both 0.3s;
        }
        @keyframes tp-grid-fade { from{opacity:0} to{opacity:0.3} }
        .tp-hero-inner { position:relative; z-index:1; padding:0 1rem; }

        .tp-hero-eyebrow {
          font-size:0.8rem; font-weight:700; letter-spacing:0.12em;
          color:var(--accent); text-transform:uppercase;
          margin-bottom:0.75rem; opacity:0;
          animation: tp-eyebrow-in 0.5s ease both 0.4s;
        }
        @keyframes tp-eyebrow-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .tp-title {
          font-family:'Syne',sans-serif;
          font-size:clamp(2rem,6vw,4rem); font-weight:900;
          letter-spacing:0.04em; text-transform:uppercase;
          color:var(--text); margin:0 0 0.75rem;
          opacity:0;
          animation: tp-title-in 0.6s cubic-bezier(.22,1,.36,1) both 0.55s;
        }
        @keyframes tp-title-in {
          from{opacity:0;transform:translateY(16px) scale(0.97)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        .tp-accent {
          background:linear-gradient(110deg, var(--accent) 30%, #ffd97a);
          -webkit-background-clip:text; background-clip:text; color:transparent;
          position:relative;
        }
        .tp-subtitle {
          font-size:clamp(0.85rem,1.5vw,1rem); color:var(--text2); margin:0;
          opacity:0;
          animation: tp-eyebrow-in 0.5s ease both 0.75s;
        }

        /* ── Container ── */
        .tp-container { max-width:960px; margin:0 auto; padding:0 1.5rem; }

        /* ── President ── */
        .tp-president-wrap {
          display:flex; justify-content:center;
          margin:2.5rem 0 3rem;
          opacity:0; transform:translateY(30px) scale(0.97);
          transition:opacity 0.7s ease, transform 0.7s cubic-bezier(.22,1,.36,1);
        }
        .tp-president-wrap.tp-pres-visible { opacity:1; transform:translateY(0) scale(1); }
        .tp-president-card { width:220px; }
        .tp-pres-img-wrap {
          position:relative; border-radius:var(--card-radius, 12px); overflow:hidden;
          aspect-ratio:3/4; background:var(--bg2);
          border:1px solid var(--border);
          cursor:default;
          transition:border-color 0.3s, box-shadow 0.3s;
        }
        .tp-pres-img-wrap:hover {
          border-color:var(--accent);
          box-shadow:0 12px 40px rgba(245,197,66,0.2), 0 0 0 3px rgba(245,197,66,0.08);
        }
        .tp-pres-glow-ring {
          position:absolute; inset:-2px; border-radius:inherit;
          background:conic-gradient(from 0deg, var(--accent), transparent 60%, var(--accent));
          opacity:0; transition:opacity 0.3s;
          pointer-events:none; z-index:0;
          animation:tp-ring-spin 3s linear infinite;
        }
        @keyframes tp-ring-spin { to{transform:rotate(360deg)} }
        .tp-pres-img-wrap:hover .tp-pres-glow-ring { opacity:0.15; }
        .tp-pres-img-wrap img {
          width:100%; height:100%; object-fit:cover; display:block;
          transition:transform 0.4s ease;
          position:relative; z-index:1;
        }
        .tp-president-card:hover .tp-pres-img-wrap img { transform:scale(1.04); }
        .tp-pres-overlay {
          position:absolute; bottom:0; left:0; right:0;
          background:linear-gradient(to top, rgba(7,16,31,0.92) 60%, transparent);
          padding:1rem 0.9rem 0.85rem;
          z-index:2;
        }
        .tp-pres-name {
          font-family:'Syne',sans-serif; font-weight:700; font-size:1rem;
          color:var(--text); margin-bottom:0.3rem;
        }
        .tp-pres-role-badge {
          display:inline-block; background:var(--accent); color:#07101f;
          font-size:0.65rem; font-weight:700; letter-spacing:0.1em;
          padding:0.18rem 0.6rem; border-radius:3px; text-transform:uppercase;
        }
        .tp-pres-bio {
          font-size:0.68rem; color:rgba(255,255,255,0.6); margin-top:0.45rem;
          line-height:1.4; opacity:0; max-height:0; overflow:hidden;
          transition:opacity 0.3s, max-height 0.3s;
        }
        .tp-pres-img-wrap:hover .tp-pres-bio { opacity:1; max-height:60px; }

        .tp-pres-domains {
          display:flex; flex-wrap:wrap; gap:0.35rem;
          justify-content:center; margin-top:0.75rem;
        }
        .tp-pres-domain-tag {
          font-size:0.6rem; padding:0.15rem 0.5rem; border-radius:2rem;
          background:var(--surface); border:1px solid var(--border);
          color:var(--text2); transition:border-color 0.2s, color 0.2s;
        }
        .tp-president-card:hover .tp-pres-domain-tag {
          border-color:rgba(245,197,66,0.4); color:var(--accent);
        }

        /* ── Section label ── */
        .tp-label {
          display:flex; align-items:center; gap:0.75rem;
          margin:2.5rem 0 1.4rem;
          opacity:0; transform:translateX(-16px);
          transition:opacity 0.5s ease, transform 0.5s cubic-bezier(.22,1,.36,1);
        }
        .tp-label.tp-label-visible { opacity:1; transform:translateX(0); }
        .tp-label-bar {
          display:block; width:4px; height:1.3em;
          background:var(--accent); border-radius:2px; flex-shrink:0;
          transform:scaleY(0); transform-origin:bottom;
          transition:transform 0.4s cubic-bezier(.22,1,.36,1) 0.1s;
        }
        .tp-label.tp-label-visible .tp-label-bar { transform:scaleY(1); }
        .tp-label-text {
          font-family:'Syne',sans-serif; font-size:1rem; font-weight:800;
          letter-spacing:0.12em; color:var(--text); text-transform:uppercase;
        }

        /* ── Grid ── */
        .tp-grid {
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:0.85rem;
        }
        .tp-leads-grid {
          grid-template-columns:repeat(2,minmax(0,220px));
          justify-content:center;
        }

        /* ── Grid Card ── */
        .tg-card {
          position:relative; border-radius:10px; overflow:hidden;
          background:var(--bg2); border:1px solid var(--border);
          cursor:default; aspect-ratio:1;
          opacity:0; transform:translateY(24px) scale(0.95);
          transition:
            opacity 0.5s cubic-bezier(.22,1,.36,1),
            transform 0.5s cubic-bezier(.22,1,.36,1),
            border-color 0.25s,
            box-shadow 0.25s;
        }
        .tg-card.tg-visible { opacity:1; transform:translateY(0) scale(1); }
        .tg-card:hover {
          border-color:var(--accent);
          box-shadow:0 8px 28px rgba(245,197,66,0.15);
          z-index:2;
        }
        .tg-img-wrap {
          width:100%; height:100%; position:relative; overflow:hidden;
        }
        .tg-img-wrap img {
          width:100%; height:100%; object-fit:cover; display:block;
          transition:transform 0.4s ease, filter 0.4s ease;
        }
        .tg-card:hover .tg-img-wrap img { transform:scale(1.04); }

        /* hover overlay — domain tags */
        .tg-overlay {
          position:absolute; inset:0;
          background:linear-gradient(to top, rgba(7,16,31,0.88) 40%, transparent 65%);
          display:flex; flex-direction:column;
          justify-content:flex-end; padding:0.6rem;
          opacity:0; transition:opacity 0.25s;
        }
        .tg-overlay.show { opacity:1; }
        .tg-overlay-domains { display:flex; flex-wrap:wrap; gap:0.3rem; }
        .tg-tag {
          font-size:0.6rem; font-weight:600;
          background:var(--accent); color:#07101f;
          padding:0.15rem 0.45rem; border-radius:3px;
          letter-spacing:0.05em; text-transform:uppercase;
          opacity:0; transform:translateY(6px);
          animation:none;
        }
        .tg-overlay.show .tg-tag {
          animation:tp-tag-pop 0.3s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes tp-tag-pop {
          from{opacity:0;transform:translateY(8px) scale(0.85)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }

        /* bottom meta strip */
        .tg-meta {
          position:absolute; bottom:0; left:0; right:0;
          background:linear-gradient(to top, rgba(7,16,31,0.82) 100%, transparent);
          padding:0.55rem 0.6rem 0.5rem;
          pointer-events:none;
          transition:opacity 0.2s;
        }
        .tg-meta.tg-meta-hidden { opacity:0; }
        .tg-mname {
          display:block; font-family:'Syne',sans-serif;
          font-weight:700; font-size:0.75rem;
          color:var(--text); line-height:1.3; margin-bottom:0.15rem;
        }
        .tg-mrole {
          display:block; font-size:0.58rem;
          color:var(--text2); letter-spacing:0.04em;
          font-weight:500; line-height:1.3;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }

        /* ── Back link ── */
        .tp-back-wrap { text-align:center; margin-top:3.5rem; }
        .tp-back-btn {
          display:inline-flex; align-items:center; gap:0.4rem;
          border:1px solid var(--border); color:var(--text2);
          padding:0.7rem 2rem; border-radius:2rem;
          font-family:'Syne',sans-serif; font-size:0.82rem; font-weight:700;
          letter-spacing:0.06em; text-decoration:none;
          transition:border-color 0.2s, color 0.2s, background 0.2s, transform 0.15s;
        }
        .tp-back-btn:hover {
          border-color:var(--accent); color:#07101f; background:var(--accent);
          transform:translateY(-2px);
        }
        .tp-back-btn:active { transform:scale(0.97); }
        .tp-back-arrow { transition:transform 0.2s; }
        .tp-back-btn:hover .tp-back-arrow { transform:translateX(-4px); }

        /* ── Responsive ── */
        @media (max-width:768px) {
          .tp-grid { grid-template-columns:repeat(3,1fr); }
          .tp-leads-grid { grid-template-columns:repeat(2,minmax(0,180px)); }
        }
        @media (max-width:480px) {
          .tp-grid { grid-template-columns:repeat(2,1fr); gap:0.65rem; }
          .tp-leads-grid { grid-template-columns:repeat(2,1fr); }
          .tp-president-card { width:180px; }
          .tp-title { font-size:clamp(1.6rem,8vw,2.5rem); }
        }
        @media (max-width:360px) {
          .tp-grid { grid-template-columns:repeat(2,1fr); gap:0.5rem; }
        }
      `}</style>
    </div>
  );
}
