// src/pages/MyListsPage.jsx  — Animated & Production-Ready
import { useState, useEffect, useRef } from 'react';
import { useLists } from '../context/ListsContext';
import { useToast } from '../context/ToastContext';

const PH_MOVIE = 'https://placehold.co/342x513/07101f/f5c542?text=No+Poster';
const PH_BOOK  = 'https://placehold.co/200x300/07101f/f5c542?text=Book';
const PH_SONG  = 'https://placehold.co/300x300/0f1a2e/f5c542?text=%E2%99%AA';

const READ_STATUSES = ['Want to Read', 'Reading', 'Finished'];

const TABS = [
  { key:'watchlist', icon:'🎬', label:'Watchlist'    },
  { key:'reading',   icon:'📚', label:'Reading List' },
  { key:'songs',     icon:'🎵', label:'Songs Heard'  },
];

/* ── Animated counter hook ─────────────────────────────────────── */
function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(target);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const start = prevTarget.current;
    prevTarget.current = target;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const raf = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

/* ── Stat Card ─────────────────────────────────────────────────── */
function StatCard({ icon, num, label, index }) {
  const animated = useCountUp(num);
  return (
    <div
      className="stat-card card ml-stat-animate"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="sc-icon">{icon}</div>
      <div className="sc-num">{animated}</div>
      <div className="sc-label">{label}</div>
    </div>
  );
}

/* ── Watchlist Item ─────────────────────────────────────────────── */
function WatchlistItem({ m, onRemove, onMarkWatched }) {
  const [removing, setRemoving] = useState(false);
  const jwUrl   = `https://www.justwatch.com/in/search?q=${encodeURIComponent(m.title)}`;
  const imdbUrl = m.imdbID ? `https://www.imdb.com/title/${m.imdbID}/` : null;

  const handleRemove = () => {
    setRemoving(true);
    setTimeout(() => onRemove(m.imdbID), 350);
  };

  return (
    <div className={`list-item card ml-item-animate${removing ? ' ml-item-removing' : ''}`}>
      <div className="li-art-wrap">
        <img
          className="li-art"
          src={m.poster || PH_MOVIE}
          alt={m.title}
          onError={(e) => { e.target.src = PH_MOVIE; }}
        />
        {m.watched && <div className="li-watched-overlay">✓</div>}
      </div>
      <div className="li-info">
        <div className="li-title">{m.title}</div>
        <div className="li-meta">
          {m.year && <span>{m.year}</span>}
          {m.genre && <span> · {m.genre}</span>}
          {m.rating && <span> · ⭐ {m.rating}</span>}
        </div>
        <div className="li-links">
          <a className="li-link li-link-red" href={jwUrl} target="_blank" rel="noopener noreferrer">▶ Where to Watch</a>
          {imdbUrl && <a className="li-link li-link-gold" href={imdbUrl} target="_blank" rel="noopener noreferrer">IMDb</a>}
        </div>
      </div>
      <div className="li-actions">
        <button
          className={`li-btn${m.watched ? ' li-btn-done' : ''}`}
          onClick={() => onMarkWatched(m.imdbID)}
        >
          {m.watched ? '✓ Watched' : 'Mark Watched'}
        </button>
        <button className="li-btn li-btn-remove" onClick={handleRemove} aria-label="Remove">✕</button>
      </div>
    </div>
  );
}

/* ── Watchlist Panel ─────────────────────────────────────────────── */
function WatchlistPanel() {
  const { watchlist, removeFromWatchlist, markWatched } = useLists();
  const { success } = useToast();

  if (!watchlist.length) return <EmptyState icon="🎬" text="No movies in your watchlist yet." hint="Browse movies and hit + Watchlist." />;

  return (
    <div className="list-items">
      {watchlist.map((m, i) => (
        <div key={m.imdbID} className="ml-item-animate" style={{ animationDelay: `${i * 60}ms` }}>
          <WatchlistItem
            m={m}
            onRemove={(id) => { removeFromWatchlist(id); success(`Removed from watchlist.`); }}
            onMarkWatched={(id) => { markWatched(id); success(m.watched ? 'Unmarked' : 'Marked as watched! ✓'); }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Reading Panel ───────────────────────────────────────────────── */
function ReadingPanel() {
  const { readingList, removeFromReading, updateReadingStatus } = useLists();
  const { success } = useToast();
  const [removingIds, setRemovingIds] = useState(new Set());

  if (!readingList.length) return <EmptyState icon="📚" text="Your reading list is empty." hint="Browse books and hit + Reading List." />;

  const handleRemove = (bookId, title) => {
    setRemovingIds(s => new Set(s).add(bookId));
    setTimeout(() => { removeFromReading(bookId); success(`"${title}" removed.`); }, 350);
  };

  const statusProgress = { 'Want to Read': 0, 'Reading': 50, 'Finished': 100 };

  return (
    <div className="list-items">
      {readingList.map((b, i) => {
        const link = b.bookLink || `https://www.google.com/search?q=${encodeURIComponent(b.title+' '+b.author+' book')}`;
        const progress = statusProgress[b.status || 'Want to Read'];
        return (
          <div
            key={b.bookId}
            className={`list-item card ml-item-animate${removingIds.has(b.bookId) ? ' ml-item-removing' : ''}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <img
              className="li-art"
              src={b.cover || PH_BOOK}
              alt={b.title}
              style={{ aspectRatio:'2/3', height:'72px', width:'auto' }}
              onError={(e) => { e.target.src = PH_BOOK; }}
            />
            <div className="li-info">
              <div className="li-title">{b.title}</div>
              <div className="li-meta">{b.author}{b.genre ? ` · ${b.genre}` : ''}</div>
              <div className="li-progress-wrap">
                <div className="li-progress-bar">
                  <div className="li-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <select
                  className="li-status-select"
                  value={b.status || 'Want to Read'}
                  onChange={(e) => { updateReadingStatus(b.bookId, e.target.value); success(`Status → "${e.target.value}"`); }}
                >
                  {READ_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="li-actions">
              <a className="li-btn" href={link} target="_blank" rel="noopener noreferrer">Find →</a>
              <button className="li-btn li-btn-remove" onClick={() => handleRemove(b.bookId, b.title)} aria-label="Remove">✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Songs Panel ─────────────────────────────────────────────────── */
function SongsPanel() {
  const { songsHeard, removeFromSongs } = useLists();
  const { success } = useToast();
  const [removingIds, setRemovingIds] = useState(new Set());

  if (!songsHeard.length) return <EmptyState icon="🎵" text="No songs tracked yet." hint="Play any song preview to add it here." />;

  const handleRemove = (trackId, title) => {
    setRemovingIds(s => new Set(s).add(trackId));
    setTimeout(() => { removeFromSongs(trackId); success(`"${title}" removed.`); }, 350);
  };

  return (
    <div className="list-items">
      {songsHeard.map((s, i) => {
        const url  = `https://music.apple.com/search?term=${encodeURIComponent(s.title+' '+s.artist)}`;
        const date = s.ts ? new Date(s.ts).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '';
        return (
          <div
            key={s.trackId || s.ts}
            className={`list-item card ml-item-animate${removingIds.has(s.trackId) ? ' ml-item-removing' : ''}`}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="li-song-art-wrap">
              <img className="li-art li-art-round" src={s.art || PH_SONG} alt={s.title} onError={(e) => { e.target.src = PH_SONG; }} />
              <div className="li-note-anim">♪</div>
            </div>
            <div className="li-info">
              <div className="li-title">{s.title}</div>
              <div className="li-meta">{s.artist}{s.album ? ` · ${s.album}` : ''}</div>
              {date && <div className="li-date">{date}</div>}
            </div>
            <div className="li-actions">
              <a className="li-btn li-btn-apple" href={url} target="_blank" rel="noopener noreferrer">🎵 Apple Music</a>
              <button className="li-btn li-btn-remove" onClick={() => handleRemove(s.trackId, s.title)} aria-label="Remove">✕</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Empty State ─────────────────────────────────────────────────── */
function EmptyState({ icon, text, hint }) {
  return (
    <div className="list-empty">
      <span className="list-empty-icon">{icon}</span>
      <p>{text}<br />{hint && <span className="list-empty-hint">{hint}</span>}</p>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function MyListsPage() {
  const { stats, syncing } = useLists();
  const [activeTab, setActiveTab] = useState('watchlist');
  const [panelKey, setPanelKey] = useState(0);
  const headerRef = useRef(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.classList.add('ml-header-visible');
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleTab = (key) => {
    setActiveTab(key);
    setPanelKey(k => k + 1);
  };

  const STATS = [
    { icon:'🎬', num: stats.watchlistCount, label:'Watchlist'    },
    { icon:'✅', num: stats.watchedCount,   label:'Watched'      },
    { icon:'📚', num: stats.readingCount,   label:'Reading List' },
    { icon:'📖', num: stats.finishedCount,  label:'Finished'     },
    { icon:'🎵', num: stats.songsCount,     label:'Songs Heard'  },
  ];

  return (
    <div className="lists-page page-pad">
      <div className="container">

        {/* Header */}
        <div className="ml-header" ref={headerRef}>
          <div className="section-title ml-title">
            <span className="ml-title-icon">📋</span>
            <span>My Lists</span>
            {syncing && (
              <span className="sync-badge" aria-live="polite">
                <span className="sync-spinner" />
                Syncing…
              </span>
            )}
          </div>
          <p className="ml-subtitle">Your personal media tracker</p>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {STATS.map((s, i) => (
            <StatCard key={s.label} icon={s.icon} num={s.num} label={s.label} index={i} />
          ))}
        </div>

        {/* Tabs */}
        <div className="list-tabs" role="tablist">
          {TABS.map((t) => {
            const count = t.key === 'watchlist' ? stats.watchlistCount
                        : t.key === 'reading'   ? stats.readingCount
                        : stats.songsCount;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={activeTab === t.key}
                className={`list-tab${activeTab === t.key ? ' active' : ''}`}
                onClick={() => handleTab(t.key)}
              >
                <span className="lt-icon">{t.icon}</span>
                <span>{t.label}</span>
                <span className="list-tab-count">{count}</span>
                {activeTab === t.key && <span className="lt-underline" />}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="ml-panel" key={panelKey}>
          {activeTab === 'watchlist' && <WatchlistPanel />}
          {activeTab === 'reading'   && <ReadingPanel />}
          {activeTab === 'songs'     && <SongsPanel />}
        </div>
      </div>

      <style>{`
        /* ── Page entrance ── */
        .lists-page { animation: ml-page-in 0.5s cubic-bezier(.22,1,.36,1) both; }
        @keyframes ml-page-in {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── Header ── */
        .ml-header {
          margin-bottom: 2rem;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(.22,1,.36,1);
        }
        .ml-header.ml-header-visible { opacity:1; transform:translateY(0); }
        .ml-title {
          display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
          font-size: clamp(1.6rem, 4vw, 2.2rem);
        }
        .ml-title-icon {
          display: inline-block;
          animation: ml-icon-rock 3s ease-in-out infinite;
        }
        @keyframes ml-icon-rock {
          0%,100% { transform: rotate(0deg); }
          20%      { transform: rotate(-8deg); }
          40%      { transform: rotate(6deg); }
          60%      { transform: rotate(-3deg); }
        }
        .ml-subtitle { color:var(--text2); font-size:0.9rem; margin-top:0.3rem; opacity:0.75; }

        /* Sync badge */
        .sync-badge {
          font-size: 0.72rem; color: var(--accent); font-weight: 500;
          margin-left: 0.5rem; display: inline-flex; align-items: center; gap: 0.3rem;
        }
        .sync-spinner {
          width: 10px; height: 10px; border-radius: 50%;
          border: 2px solid rgba(245,197,66,0.3);
          border-top-color: var(--accent);
          animation: ml-spin 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes ml-spin { to{ transform: rotate(360deg); } }

        /* ── Stats ── */
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 1rem; margin-bottom: 2rem;
        }
        .stat-card {
          padding: 1.1rem 0.8rem; text-align: center;
          transition: transform 0.25s cubic-bezier(.22,1,.36,1), box-shadow 0.25s;
          cursor: default;
          opacity: 0;
          animation: ml-stat-in 0.5s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes ml-stat-in {
          from { opacity:0; transform:translateY(20px) scale(0.93); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .stat-card:hover {
          transform: translateY(-4px) scale(1.04);
          box-shadow: 0 8px 24px rgba(245,197,66,0.15);
        }
        .sc-icon {
          font-size: 1.5rem; margin-bottom: 0.3rem;
          transition: transform 0.3s;
          display: inline-block;
        }
        .stat-card:hover .sc-icon { transform: scale(1.25) rotate(-8deg); }
        .sc-num {
          font-family: 'Syne', sans-serif; font-size: 2rem; font-weight: 800;
          color: var(--accent); line-height: 1;
        }
        .sc-label { font-size: 0.72rem; color: var(--text2); margin-top: 0.25rem; }

        /* ── Tabs ── */
        .list-tabs { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
        .list-tab {
          padding: 0.5rem 1.1rem; border-radius: 2rem;
          border: 1px solid var(--border); background: var(--surface);
          color: var(--text2); cursor: pointer; font-family: 'Outfit', sans-serif;
          font-size: 0.85rem; font-weight: 600;
          transition: border-color 0.2s, color 0.2s, background 0.2s, transform 0.15s, box-shadow 0.2s;
          display: flex; align-items: center; gap: 0.4rem;
          position: relative; overflow: hidden;
        }
        .list-tab:hover {
          border-color: var(--accent); color: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(245,197,66,0.12);
        }
        .list-tab:active { transform: scale(0.97); }
        .list-tab.active {
          background: var(--accent); color: #07101f; border-color: var(--accent);
          box-shadow: 0 4px 16px rgba(245,197,66,0.25);
          transform: translateY(-1px);
        }
        .lt-icon { transition: transform 0.25s; }
        .list-tab:hover .lt-icon { transform: scale(1.2); }
        .list-tab.active .lt-icon { animation: ml-icon-rock 3s ease-in-out infinite; }
        .lt-underline {
          position: absolute; bottom: -1px; left: 0; right: 0; height: 2px;
          background: #07101f; border-radius: 2px;
          animation: lt-ul-in 0.25s ease both;
        }
        @keyframes lt-ul-in { from{transform:scaleX(0)} to{transform:scaleX(1)} }
        .list-tab-count {
          background: rgba(0,0,0,0.18); padding: 0.1rem 0.45rem;
          border-radius: 1rem; font-size: 0.7rem; font-weight: 700;
          transition: transform 0.2s;
        }
        .list-tab:hover .list-tab-count { transform: scale(1.1); }
        .list-tab.active .list-tab-count { background: rgba(7,16,31,0.2); }

        /* ── Panel ── */
        .ml-panel { animation: ml-panel-in 0.35s cubic-bezier(.22,1,.36,1) both; }
        @keyframes ml-panel-in {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── Empty state ── */
        .list-empty {
          padding: 3.5rem 1rem; text-align: center; color: var(--text2);
          display: flex; flex-direction: column; align-items: center; gap: 0.8rem;
        }
        .list-empty-icon {
          font-size: 3rem; opacity: 0.3; display: inline-block;
          animation: ml-icon-rock 3s ease-in-out infinite;
        }
        .list-empty p { font-size: 0.9rem; line-height: 1.7; }
        .list-empty-hint { font-weight: 600; color: var(--accent); opacity: 0.8; }

        /* ── List items ── */
        .list-items { display: flex; flex-direction: column; gap: 0.75rem; }

        .ml-item-animate {
          opacity: 0;
          animation: ml-item-in 0.45s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes ml-item-in {
          from { opacity:0; transform:translateX(-16px) scale(0.98); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
        .ml-item-removing {
          animation: ml-item-out 0.35s cubic-bezier(.4,0,.6,1) both !important;
        }
        @keyframes ml-item-out {
          from { opacity:1; transform:translateX(0) scale(1); max-height:200px; }
          to   { opacity:0; transform:translateX(40px) scale(0.95); max-height:0; overflow:hidden; }
        }

        .list-item {
          display: flex; align-items: center; gap: 1rem;
          padding: 0.9rem 1.1rem;
          transition: border-color 0.2s, background 0.2s, transform 0.25s, box-shadow 0.25s;
        }
        .list-item:hover {
          border-color: rgba(245,197,66,0.3);
          background: var(--accent-glow, rgba(245,197,66,0.04));
          transform: translateX(4px);
          box-shadow: -3px 0 0 var(--accent);
        }

        /* Art */
        .li-art-wrap { position: relative; flex-shrink: 0; }
        .li-art {
          width: 48px; height: 48px; border-radius: 8px; object-fit: cover;
          flex-shrink: 0; background: var(--bg2);
          transition: transform 0.3s;
        }
        .list-item:hover .li-art { transform: scale(1.06); }
        .li-art-round { border-radius: 50% !important; }
        .li-watched-overlay {
          position: absolute; inset: 0; border-radius: 8px;
          background: rgba(16,185,129,0.75); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.2rem; font-weight: 700;
          animation: ml-watched-in 0.3s ease both;
        }
        @keyframes ml-watched-in { from{opacity:0;transform:scale(1.3)} to{opacity:1;transform:scale(1)} }

        /* Song art animated note */
        .li-song-art-wrap { position: relative; flex-shrink: 0; }
        .li-note-anim {
          position: absolute; top: -6px; right: -6px;
          font-size: 0.75rem; color: var(--accent); opacity: 0;
          animation: ml-note-float 3s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes ml-note-float {
          0%   { opacity:0; transform:translateY(0) scale(0.5); }
          20%  { opacity:1; transform:translateY(-4px) scale(1); }
          80%  { opacity:0.6; transform:translateY(-12px) scale(0.8); }
          100% { opacity:0; transform:translateY(-16px) scale(0.5); }
        }

        .li-info { flex: 1; min-width: 0; }
        .li-title {
          font-weight: 700; font-size: 0.9rem; font-family: 'Syne', sans-serif;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          transition: color 0.2s;
        }
        .list-item:hover .li-title { color: var(--accent); }
        .li-meta  { font-size: 0.75rem; color: var(--text2); margin-top: 0.15rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .li-date  { font-size: 0.68rem; color: var(--text2); opacity: 0.6; margin-top: 0.2rem; }
        .li-links { display: flex; gap: 0.4rem; margin-top: 0.4rem; flex-wrap: wrap; }
        .li-link {
          font-size: 0.68rem; font-weight: 700; padding: 0.2rem 0.6rem;
          border-radius: 2rem; text-decoration: none;
          transition: transform 0.15s, filter 0.15s;
        }
        .li-link:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .li-link-red  { background: linear-gradient(135deg,#e50914,#c2000f); color:#fff; }
        .li-link-gold { background: linear-gradient(135deg,#f5c542,#c9971a); color:#07101f; }

        /* Reading progress bar */
        .li-progress-wrap { margin-top: 0.45rem; }
        .li-progress-bar {
          height: 3px; background: var(--border); border-radius: 3px;
          overflow: hidden; margin-bottom: 0.4rem;
        }
        .li-progress-fill {
          height: 100%; background: linear-gradient(90deg, var(--accent), #f59e0b);
          border-radius: 3px;
          transition: width 0.6s cubic-bezier(.22,1,.36,1);
        }
        .li-status-select {
          padding: 0.22rem 0.6rem; border-radius: 2rem;
          border: 1px solid var(--border); background: var(--input-bg, var(--surface));
          color: var(--text); font-family: 'Outfit', sans-serif;
          font-size: 0.72rem; cursor: pointer;
          transition: border-color 0.2s;
        }
        .li-status-select:focus { border-color: var(--accent); outline: none; }

        /* Action buttons */
        .li-actions { display: flex; gap: 0.4rem; align-items: center; flex-shrink: 0; }
        .li-btn {
          background: none; border: 1px solid var(--border); color: var(--text2);
          padding: 0.28rem 0.7rem; border-radius: 2rem; cursor: pointer;
          font-size: 0.72rem; font-family: 'Outfit', sans-serif;
          transition: border-color 0.2s, color 0.2s, transform 0.15s, background 0.2s;
          text-decoration: none; display: inline-flex; align-items: center; white-space: nowrap;
        }
        .li-btn:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-1px); }
        .li-btn:active { transform: scale(0.95); }
        .li-btn-done {
          background: rgba(16,185,129,0.12); border-color: var(--success, #10b981);
          color: var(--success, #10b981);
        }
        .li-btn-remove { transition: border-color 0.2s, color 0.2s, transform 0.15s; }
        .li-btn-remove:hover { border-color: var(--danger, #ef4444); color: var(--danger, #ef4444); transform: scale(1.1) !important; }
        .li-btn-apple:hover { border-color: #fc3c44; color: #fc3c44; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .stats-row { grid-template-columns: repeat(3, 1fr); }
          .ml-title { font-size: 1.5rem; }
        }
        @media (max-width: 540px) {
          .list-item { flex-wrap: wrap; gap: 0.75rem; }
          .li-actions { width: 100%; justify-content: flex-start; }
          .stats-row { grid-template-columns: repeat(3, 1fr); gap: 0.75rem; }
          .sc-num { font-size: 1.6rem; }
          .list-tabs { gap: 0.3rem; }
          .list-tab { font-size: 0.8rem; padding: 0.4rem 0.9rem; }
        }
        @media (max-width: 360px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .list-tab span:not(.lt-icon):not(.list-tab-count) { display: none; }
        }
      `}</style>
    </div>
  );
}
