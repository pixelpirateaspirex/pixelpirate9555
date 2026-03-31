// src/pages/EventsPage.jsx  — Animated & Production-Ready
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';

const TABS = [
  { key:'live',      label:'Live Now',  icon:'🔴' },
  { key:'upcoming',  label:'Upcoming',  icon:'📆' },
  { key:'concerts',  label:'Concerts',  icon:'🎤' },
  { key:'esports',   label:'E-Sports',  icon:'🏆' },
  { key:'festivals', label:'Festivals', icon:'🎪' },
];

/* ── Fallback events ─────────────────────────────────────────── */
const FALLBACK = {
  live: [
    { id:'l1', title:'IPL 2026 – CSK vs MI',         venue:'Wankhede Stadium, Mumbai',       date:'Live Now', category:'Cricket',  imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=IPL+Live',  ticketUrl:'https://www.bookmyshow.com', tags:['Cricket','IPL'] },
    { id:'l2', title:'Valorant Champions Tour India', venue:'Online / LAN',                  date:'Live Now', category:'E-Sports', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=VCT+India',  ticketUrl:'https://vct.gg', tags:['Esports','Valorant'] },
    { id:'l3', title:'Bollywood Unplugged Live',      venue:'Jawaharlal Nehru Stadium, Delhi',date:'Live Now', category:'Concert',  imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=Live+Music', ticketUrl:'https://www.bookmyshow.com', tags:['Music','Concert'] },
  ],
  upcoming: [
    { id:'u1', title:'Arijit Singh World Tour – India', venue:'DY Patil Stadium, Navi Mumbai',date:'Jul 12, 2026', category:'Concert',  imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=Arijit+Singh',  ticketUrl:'https://insider.in', tags:['Music','Concert'] },
    { id:'u2', title:'Comic Con India 2026',            venue:'BIEC, Bengaluru',              date:'Aug 3–4, 2026', category:'Festival', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=Comic+Con',     ticketUrl:'https://www.comicconindia.com', tags:['Comics','Gaming'] },
    { id:'u3', title:'BGMI Pro Series Season 3',        venue:'Online',                       date:'Jul 20, 2026', category:'E-Sports', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=BGMI+Pro',      ticketUrl:'https://battlegroundsmobileindia.com', tags:['Esports','BGMI'] },
    { id:'u4', title:'India International Film Fest',   venue:'Goa',                          date:'Nov 20, 2026', category:'Festival', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=IFFI',          ticketUrl:'https://iffigoa.org', tags:['Cinema','Festival'] },
  ],
  concerts: [
    { id:'c1', title:'Dua Lipa – Future Nostalgia India', venue:'MMRDA Grounds, Mumbai',      date:'Sep 5, 2026',  category:'Concert', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=Dua+Lipa',     ticketUrl:'https://insider.in', tags:['Pop','Concert'] },
    { id:'c2', title:'AP Dhillon Live',                   venue:'Palace Grounds, Bengaluru',  date:'Aug 22, 2026', category:'Concert', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=AP+Dhillon',   ticketUrl:'https://www.bookmyshow.com', tags:['Punjabi','Concert'] },
    { id:'c3', title:'Nucleya Big Room Tour',             venue:'Hitex, Hyderabad',            date:'Jul 27, 2026', category:'Concert', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=Nucleya',       ticketUrl:'https://insider.in', tags:['Electronic','Concert'] },
    { id:'c4', title:'Sunidhi Chauhan Live',              venue:'Siri Fort, New Delhi',        date:'Oct 3, 2026',  category:'Concert', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=Sunidhi',      ticketUrl:'https://www.bookmyshow.com', tags:['Bollywood','Concert'] },
  ],
  esports: [
    { id:'e1', title:'Free Fire India Championship',  venue:'Online',          date:'Jul 15, 2026', category:'E-Sports', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=FFIC',      ticketUrl:'https://esports.gg', tags:['FreeFire','Esports'] },
    { id:'e2', title:'ESL India Premiership – CS2',   venue:'Blu-O, Mumbai',   date:'Aug 10, 2026', category:'E-Sports', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=ESL+India',  ticketUrl:'https://www.eslgaming.com', tags:['CS2','Esports'] },
    { id:'e3', title:'NODWIN Gaming Valorant Cup',    venue:'Online',           date:'Sep 1, 2026',  category:'E-Sports', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=NODWIN',     ticketUrl:'https://nodwingaming.com', tags:['Valorant','Esports'] },
  ],
  festivals: [
    { id:'f1', title:'Lollapalooza India 2027',  venue:'Mahalaxmi Racecourse, Mumbai',  date:'Jan 10–11, 2027',  category:'Festival', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=Lollapalooza', ticketUrl:'https://www.lollapaloozain.com', tags:['Music','Festival'] },
    { id:'f2', title:'Sunburn Festival Goa',     venue:'Vagator Beach, Goa',            date:'Dec 27–30, 2026',  category:'Festival', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=Sunburn',      ticketUrl:'https://sunburn.in', tags:['EDM','Festival'] },
    { id:'f3', title:'Hornbill Festival',        venue:'Kisama, Nagaland',              date:'Dec 1–10, 2026',   category:'Festival', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=Hornbill',     ticketUrl:'https://www.hornbillfestival.com', tags:['Culture','Festival'] },
    { id:'f4', title:'NH7 Weekender Pune',       venue:'Pune, Maharashtra',             date:'Nov 28–30, 2026',  category:'Festival', imgUrl:'https://placehold.co/640x360/0f1a2e/f5c542?text=NH7',          ticketUrl:'https://insider.in', tags:['Music','Festival'] },
  ],
};

/* ── Live Dot ─────────────────────────────────────────────────── */
const LiveDot = () => (
  <span className="live-dot" aria-label="Live">
    <span className="live-dot-ring" />
    <span className="live-dot-core" />
  </span>
);

/* ── Skeleton Card ────────────────────────────────────────────── */
function SkeletonEventCard() {
  return (
    <div className="event-card card ev-skeleton" aria-hidden="true">
      <div className="ev-skel-img skel-pulse" />
      <div className="ev-body">
        <div className="ev-skel-title skel-pulse" />
        <div className="ev-skel-line skel-pulse" />
        <div className="ev-skel-tags">
          <div className="ev-skel-tag skel-pulse" />
          <div className="ev-skel-tag skel-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ── Event Card ───────────────────────────────────────────────── */
function EventCard({ event, tab, index }) {
  const isLive = tab === 'live';
  return (
    <a
      href={event.ticketUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="event-card card ev-animate"
      style={{ animationDelay: `${Math.min(index * 70, 560)}ms` }}
    >
      <div className="ev-img-wrap">
        <img
          src={event.imgUrl}
          alt={event.title}
          loading="lazy"
          onError={(e) => { e.target.src = 'https://placehold.co/640x360/0f1a2e/f5c542?text=Event'; }}
        />
        <div className="ev-img-overlay" />
        <div className={`ev-badge ${isLive ? 'ev-badge-live' : ''}`}>
          {isLive ? '🔴 LIVE' : event.category}
        </div>
        {isLive && <div className="ev-live-bar" />}
      </div>
      <div className="ev-body">
        <div className="ev-title">{event.title}</div>
        <div className="ev-venue">
          <span className="ev-venue-icon">📍</span>
          {event.venue}
        </div>
        <div className={`ev-date${isLive ? ' ev-date-live' : ''}`}>
          {isLive && <LiveDot />}
          {event.date}
        </div>
        <div className="ev-tags">
          {(event.tags || []).map((t, i) => (
            <span key={t} className="ev-tag" style={{ animationDelay: `${index * 70 + i * 40}ms` }}>{t}</span>
          ))}
        </div>
        <div className="ev-cta">
          <span className="ev-cta-text">Get Tickets</span>
          <span className="ev-cta-arrow">→</span>
        </div>
      </div>
    </a>
  );
}

/* ── Main Page ────────────────────────────────────────────────── */
export default function EventsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initTab = searchParams.get('tab') || 'live';
  const [tab,      setTab]      = useState(initTab);
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [gridKey,  setGridKey]  = useState(0);
  const [prevTab,  setPrevTab]  = useState(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.classList.add('ep-header-visible');
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    setLoading(true);
    setEvents([]);
    api.get(`/events?tab=${tab}`)
      .then(({ data }) => {
        setEvents(data?.events || data || []);
        setLoading(false);
        setGridKey(k => k + 1);
      })
      .catch(() => {
        setEvents(FALLBACK[tab] || []);
        setLoading(false);
        setGridKey(k => k + 1);
      });
  }, [tab]);

  const handleTab = (key) => {
    setPrevTab(tab);
    setTab(key);
    setSearchParams({ tab: key });
  };

  const activeTabData = TABS.find(t => t.key === tab);

  return (
    <div className="events-page page-pad">
      <div className="container">

        {/* Header */}
        <div className="ep-header" ref={headerRef}>
          <div className="section-title ep-title">
            <span className="ep-title-icon">📅</span>
            <span>Events in India</span>
          </div>
          <p className="ep-subtitle">Live shows · Concerts · E-Sports · Festivals</p>
        </div>

        {/* Tabs */}
        <div className="ev-tabs" role="tablist">
          {TABS.map((t, i) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              className={`ev-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => handleTab(t.key)}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="ev-tab-icon">{t.icon}</span>
              <span className="ev-tab-label">{t.label}</span>
              {t.key === 'live' && <span className="ev-live-pulse" aria-hidden="true" />}
              {tab === t.key && <span className="ev-tab-underline" />}
            </button>
          ))}
        </div>

        {/* Count badge */}
        {!loading && events.length > 0 && (
          <div className="ep-count-row">
            <span className="ep-count-badge">
              {activeTabData?.icon} {events.length} {activeTabData?.label} event{events.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="events-grid">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonEventCard key={i} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="ep-empty">
            <span className="ep-empty-icon">📅</span>
            <p>No events right now. Check back soon!</p>
          </div>
        ) : (
          <div className="events-grid" key={gridKey}>
            {events.map((e, i) => (
              <EventCard key={e.id || e._id} event={e} tab={tab} index={i} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        /* ── Page entrance ── */
        .events-page { animation: ep-page-in 0.5s cubic-bezier(.22,1,.36,1) both; }
        @keyframes ep-page-in {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── Header ── */
        .ep-header {
          margin-bottom: 2rem;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(.22,1,.36,1);
        }
        .ep-header.ep-header-visible { opacity:1; transform:translateY(0); }
        .ep-title { display:flex; align-items:center; gap:0.6rem; font-size: clamp(1.6rem,4vw,2.2rem); }
        .ep-title-icon {
          display: inline-block;
          animation: ep-icon-bounce 2s ease-in-out infinite;
        }
        @keyframes ep-icon-bounce {
          0%,100% { transform: translateY(0); }
          40%      { transform: translateY(-6px); }
          60%      { transform: translateY(-3px); }
        }
        .ep-subtitle { color:var(--text2); font-size:0.9rem; margin-top:0.3rem; opacity:0.75; }

        /* ── Tabs ── */
        .ev-tabs {
          display: flex; gap: 0.4rem; flex-wrap: wrap;
          margin-bottom: 1.4rem; position: relative;
        }
        .ev-tab {
          padding: 0.5rem 1.1rem; border-radius: 2rem;
          border: 1px solid var(--border); background: var(--surface);
          color: var(--text2); cursor: pointer; font-family: 'Outfit', sans-serif;
          font-size: 0.85rem; font-weight: 600;
          transition: border-color 0.2s, color 0.2s, background 0.2s, transform 0.15s, box-shadow 0.2s;
          display: flex; align-items: center; gap: 0.35rem; white-space: nowrap;
          position: relative; overflow: hidden;
          animation: ep-tab-in 0.4s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes ep-tab-in {
          from { opacity:0; transform:scale(0.9) translateY(6px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
        .ev-tab:hover {
          border-color: var(--accent); color: var(--accent);
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(245,197,66,0.15);
        }
        .ev-tab:active { transform: scale(0.96); }
        .ev-tab.active {
          background: var(--accent); color: #07101f;
          border-color: var(--accent);
          box-shadow: 0 4px 18px rgba(245,197,66,0.3);
          transform: translateY(-2px);
        }
        .ev-tab-icon { font-size: 1rem; transition: transform 0.3s; }
        .ev-tab:hover .ev-tab-icon { transform: scale(1.2) rotate(-5deg); }
        .ev-tab.active .ev-tab-icon { animation: ep-icon-bounce 2s ease-in-out infinite; }
        .ev-tab-underline {
          position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
          background: #07101f; border-radius: 2px;
          animation: ep-ul-in 0.25s ease both;
        }
        @keyframes ep-ul-in { from{transform:scaleX(0)} to{transform:scaleX(1)} }

        /* Live pulse dot in tab */
        .ev-live-pulse {
          width: 7px; height: 7px; border-radius: 50%;
          background: var(--danger);
          animation: ep-pulse-dot 1.4s ease-in-out infinite;
          flex-shrink: 0;
        }
        .ev-tab.active .ev-live-pulse { background: #07101f; }
        @keyframes ep-pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(0.7); }
        }

        /* Count badge */
        .ep-count-row { margin-bottom: 1.2rem; }
        .ep-count-badge {
          display: inline-flex; align-items: center; gap: 0.3rem;
          background: var(--surface); border: 1px solid var(--border);
          padding: 0.25rem 0.75rem; border-radius: 2rem;
          font-size: 0.75rem; color: var(--text2);
          animation: ep-page-in 0.3s ease both;
        }

        /* ── Skeleton ── */
        .skel-pulse {
          background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
          background-size: 200% 100%;
          animation: skel-shimmer 1.6s ease-in-out infinite;
          border-radius: 6px;
        }
        @keyframes skel-shimmer {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }
        .ev-skeleton { pointer-events: none; }
        .ev-skel-img { height: 160px; border-radius: 8px 8px 0 0; }
        .ev-skel-title { height: 14px; width: 75%; margin-bottom: 0.5rem; }
        .ev-skel-line  { height: 10px; width: 55%; margin-bottom: 0.75rem; }
        .ev-skel-tags  { display: flex; gap: 0.4rem; }
        .ev-skel-tag   { height: 18px; width: 50px; border-radius: 2rem; }

        /* ── Empty state ── */
        .ep-empty {
          padding: 4rem 1rem; text-align: center; color: var(--text2);
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
          animation: ep-page-in 0.4s ease both;
        }
        .ep-empty-icon { font-size: 3rem; opacity: 0.3; animation: ep-icon-bounce 2s ease-in-out infinite; }

        /* ── Events grid ── */
        .events-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.3rem;
        }

        /* ── Event card ── */
        .event-card {
          overflow: hidden; text-decoration: none; color: var(--text);
          display: flex; flex-direction: column;
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s;
          opacity: 0;
          animation: ep-card-in 0.5s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes ep-card-in {
          from { opacity:0; transform:translateY(28px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .event-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(245,197,66,0.2);
          z-index: 2;
        }

        .ev-img-wrap { position: relative; overflow: hidden; }
        .ev-img-wrap img {
          width: 100%; aspect-ratio: 16/9; object-fit: cover;
          display: block; background: var(--bg2);
          transition: transform 0.5s cubic-bezier(.22,1,.36,1);
        }
        .event-card:hover .ev-img-wrap img { transform: scale(1.07); }
        .ev-img-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(7,16,31,0.65) 0%, transparent 55%);
          opacity: 0; transition: opacity 0.3s;
        }
        .event-card:hover .ev-img-overlay { opacity: 1; }

        .ev-badge {
          position: absolute; top: 0.7rem; left: 0.7rem;
          background: rgba(15,26,46,0.85); backdrop-filter: blur(8px);
          color: var(--accent); font-size: 0.7rem; font-weight: 700;
          padding: 0.22rem 0.6rem; border-radius: 2rem;
          border: 1px solid rgba(245,197,66,0.2);
          transition: transform 0.2s;
        }
        .event-card:hover .ev-badge { transform: scale(1.05); }
        .ev-badge-live {
          background: rgba(239,68,68,0.9); color: #fff;
          border-color: rgba(239,68,68,0.3);
          animation: ev-badge-live-pulse 2s ease-in-out infinite;
        }
        @keyframes ev-badge-live-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50%      { box-shadow: 0 0 0 6px rgba(239,68,68,0); }
        }

        /* Live bar at bottom of image */
        .ev-live-bar {
          position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #ef4444, #f97316, #ef4444);
          background-size: 200% 100%;
          animation: ev-bar-scroll 2s linear infinite;
        }
        @keyframes ev-bar-scroll {
          from { background-position: 0% 0; }
          to   { background-position: 200% 0; }
        }

        .ev-body {
          padding: 1rem 1.1rem; flex: 1;
          display: flex; flex-direction: column; gap: 0.35rem;
        }
        .ev-title {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 0.95rem; line-height: 1.35;
          transition: color 0.2s;
        }
        .event-card:hover .ev-title { color: var(--accent); }
        .ev-venue {
          font-size: 0.78rem; color: var(--text2);
          display: flex; align-items: center; gap: 0.2rem;
        }
        .ev-venue-icon { flex-shrink: 0; transition: transform 0.3s; }
        .event-card:hover .ev-venue-icon { transform: scale(1.2); }
        .ev-date {
          font-size: 0.78rem; color: var(--accent); font-weight: 600;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .ev-date-live { color: var(--danger); }
        .ev-tags { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.2rem; }
        .ev-tag {
          font-size: 0.65rem; padding: 0.15rem 0.5rem; border-radius: 2rem;
          background: var(--surface); border: 1px solid var(--border); color: var(--text2);
          transition: border-color 0.2s, color 0.2s, transform 0.2s;
          opacity: 0;
          animation: ep-tag-in 0.3s ease both;
        }
        @keyframes ep-tag-in { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
        .event-card:hover .ev-tag { border-color: rgba(245,197,66,0.4); color: var(--accent); transform: translateY(-1px); }

        .ev-cta {
          margin-top: auto; padding-top: 0.5rem;
          font-size: 0.8rem; color: var(--accent); font-weight: 600;
          display: flex; align-items: center; gap: 0.3rem;
        }
        .ev-cta-arrow { transition: transform 0.25s; display: inline-block; }
        .event-card:hover .ev-cta-arrow { transform: translateX(4px); }

        /* ── Live dot ── */
        .live-dot { position:relative; display:inline-block; width:10px; height:10px; flex-shrink:0; }
        .live-dot-core { position:absolute; inset:2px; border-radius:50%; background:var(--danger); }
        .live-dot-ring {
          position:absolute; inset:0; border-radius:50%;
          border:2px solid var(--danger); animation:ring-pulse 1.4s ease-in-out infinite;
        }
        @keyframes ring-pulse {
          0%  { transform:scale(1); opacity:1; }
          100%{ transform:scale(2.2); opacity:0; }
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .events-grid { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
          .ep-title { font-size: 1.5rem; }
        }
        @media (max-width: 540px) {
          .events-grid { grid-template-columns: 1fr; }
          .ev-tabs { gap: 0.3rem; }
          .ev-tab { font-size: 0.78rem; padding: 0.4rem 0.8rem; }
          .ev-tab-label { display: none; }
          .ev-tab { justify-content: center; min-width: 44px; }
        }
        @media (max-width: 360px) {
          .ev-tab { padding: 0.4rem 0.6rem; min-width: 38px; }
        }
      `}</style>
    </div>
  );
}
