// src/pages/GamesPage.jsx — Steam Store API (replaces RAWG)
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

// ── Steam Store search (no API key needed) ─────────────────────────────────
// Proxied through allorigins to avoid CORS issues in the browser
const steamSearch = async (term, signal) => {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(term)}&cc=us&l=en&filter=games`;
  // allorigins proxy — handles CORS for Steam store API
  const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const r = await fetch(proxy, { signal });
  if (!r.ok) throw new Error('Steam search failed: ' + r.status);
  const wrapper = await r.json();
  const d = JSON.parse(wrapper.contents);
  return d.items || [];
};

// Steam header image (460×215) from appid
const steamImg = (appid) =>
  `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`;

// ── Genre → Steam search term mapping ─────────────────────────────────────
const GENRES = [
  { slug: 'action',      label: '⚔️ Action',      term: 'action'      },
  { slug: 'rpg',         label: '🧙 RPG',          term: 'rpg'         },
  { slug: 'strategy',    label: '♟️ Strategy',     term: 'strategy'    },
  { slug: 'adventure',   label: '🗺️ Adventure',    term: 'adventure'   },
  { slug: 'simulation',  label: '🚀 Simulation',   term: 'simulation'  },
  { slug: 'sports',      label: '⚽ Sports',        term: 'sports'      },
  { slug: 'puzzle',      label: '🧩 Puzzle',        term: 'puzzle'      },
  { slug: 'casual',      label: '🌸 Casual',        term: 'casual'      },
];

// ── Fallback mock data (Steam-style) ──────────────────────────────────────
const MOCK_GAMES = [
  { id: 570,   name: 'Dota 2',                  tiny_image: steamImg(570),   large_capsule_image: steamImg(570),   metascore: '90', price: { final_formatted: 'Free' }, platforms: { windows: true, mac: true } },
  { id: 730,   name: 'Counter-Strike 2',        tiny_image: steamImg(730),   large_capsule_image: steamImg(730),   metascore: '83', price: { final_formatted: 'Free' }, platforms: { windows: true } },
  { id: 1172470, name: 'Apex Legends',          tiny_image: steamImg(1172470), large_capsule_image: steamImg(1172470), metascore: '89', price: { final_formatted: 'Free' }, platforms: { windows: true } },
  { id: 1091500, name: 'Cyberpunk 2077',        tiny_image: steamImg(1091500), large_capsule_image: steamImg(1091500), metascore: '86', price: { final_formatted: '$59.99' }, platforms: { windows: true } },
  { id: 1245620, name: 'Elden Ring',            tiny_image: steamImg(1245620), large_capsule_image: steamImg(1245620), metascore: '95', price: { final_formatted: '$59.99' }, platforms: { windows: true } },
  { id: 1086940, name: 'Baldur\'s Gate 3',      tiny_image: steamImg(1086940), large_capsule_image: steamImg(1086940), metascore: '96', price: { final_formatted: '$59.99' }, platforms: { windows: true, mac: true } },
  { id: 2358720, name: 'Palworld',              tiny_image: steamImg(2358720), large_capsule_image: steamImg(2358720), metascore: '75', price: { final_formatted: '$29.99' }, platforms: { windows: true } },
  { id: 413150,  name: 'Stardew Valley',        tiny_image: steamImg(413150),  large_capsule_image: steamImg(413150),  metascore: '89', price: { final_formatted: '$14.99' }, platforms: { windows: true, mac: true, linux: true } },
  { id: 271590,  name: 'GTA V',                 tiny_image: steamImg(271590),  large_capsule_image: steamImg(271590),  metascore: '97', price: { final_formatted: '$29.99' }, platforms: { windows: true } },
  { id: 814380,  name: 'Sekiro',                tiny_image: steamImg(814380),  large_capsule_image: steamImg(814380),  metascore: '91', price: { final_formatted: '$59.99' }, platforms: { windows: true } },
  { id: 1151640, name: 'Crusader Kings III',    tiny_image: steamImg(1151640), large_capsule_image: steamImg(1151640), metascore: '91', price: { final_formatted: '$49.99' }, platforms: { windows: true, mac: true, linux: true } },
  { id: 1716740, name: 'DAVE THE DIVER',        tiny_image: steamImg(1716740), large_capsule_image: steamImg(1716740), metascore: '90', price: { final_formatted: '$19.99' }, platforms: { windows: true } },
];

/* ── Skeleton Card ─────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="game-card card gc-skeleton" aria-hidden="true">
      <div className="gc-skel-img skel-pulse" />
      <div className="gc-body">
        <div className="gc-skel-title skel-pulse" />
        <div className="gc-skel-foot">
          <div className="gc-skel-chip skel-pulse" />
          <div className="gc-skel-chip skel-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ── Game Card ─────────────────────────────────────────────────── */
function GameCard({ game, index }) {
  const appid    = game.id;
  const imgSrc   = game.large_capsule_image || game.tiny_image || steamImg(appid);
  const storeUrl = `https://store.steampowered.com/app/${appid}`;
  const meta     = game.metascore ? parseInt(game.metascore, 10) : null;
  const price    = game.price?.final_formatted || '';

  const platformIcons = [
    game.platforms?.windows && '🖥️',
    game.platforms?.mac     && '🍎',
    game.platforms?.linux   && '🐧',
  ].filter(Boolean).join(' ');

  return (
    <a
      href={storeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="game-card card gc-animate"
      style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}
    >
      <div className="gc-img-wrap">
        <img
          src={imgSrc}
          alt={game.name}
          loading="lazy"
          onError={(e) => {
            e.target.src = `https://placehold.co/460x215/07101f/f5c542?text=${encodeURIComponent(game.name)}`;
          }}
        />
        <div className="gc-img-overlay" />
        {/* Steam logo badge */}
        <div className="gc-steam-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white" opacity="0.9">
            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.909c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.497 1.009 2.453-.397.957-1.494 1.41-2.455 1.014zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
          </svg>
        </div>
        {meta !== null && (
          <div className={`gc-meta-score gc-meta-${meta >= 75 ? 'green' : meta >= 50 ? 'yellow' : 'red'} gc-meta-pop`}>
            {meta}
          </div>
        )}
      </div>
      <div className="gc-body">
        <div className="gc-title">{game.name}</div>
        <div className="gc-foot">
          <span className="gc-price">{price || 'View on Steam'}</span>
          <span className="gc-platforms">{platformIcons}</span>
        </div>
      </div>
      <div className="gc-shine" />
    </a>
  );
}

/* ── Main Page ─────────────────────────────────────────────────── */
export default function GamesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initGenre  = searchParams.get('genre') || GENRES[0].slug;
  const [activeGenre, setActiveGenre] = useState(initGenre);
  const [games,       setGames]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [query,       setQuery]       = useState('');
  const [gridKey,     setGridKey]     = useState(0);
  const headerRef    = useRef(null);
  const abortRef     = useRef(null);

  const fetchGames = useCallback(async (genre, q) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setGames([]);

    const searchTerm = q || GENRES.find((g) => g.slug === genre)?.term || genre;
    const cKey = `pp_steam_${genre}_${(q || '').toLowerCase()}`;

    try {
      // Check localStorage cache (4 hr TTL)
      const cached = (() => {
        try {
          const c = localStorage.getItem(cKey);
          if (c) { const p = JSON.parse(c); if (Date.now() - p.t < 4 * 60 * 60 * 1000) return p.v; }
        } catch {}
        return null;
      })();

      if (cached) {
        setGames(cached);
        setLoading(false);
        setGridKey((k) => k + 1);
        return;
      }

      const items = await steamSearch(searchTerm, ctrl.signal);

      // Dedupe by id, filter to games only
      const seen = new Set();
      const unique = items.filter((g) => {
        if (seen.has(g.id)) return false;
        seen.add(g.id);
        return true;
      });

      try { localStorage.setItem(cKey, JSON.stringify({ v: unique, t: Date.now() })); } catch {}
      setGames(unique);
    } catch (err) {
      if (err.name === 'AbortError') return; // cancelled — don't update state
      console.warn('Steam API failed, using mock data:', err.message);
      setGames(MOCK_GAMES);
    }

    setLoading(false);
    setGridKey((k) => k + 1);
  }, []);

  useEffect(() => {
    fetchGames(activeGenre, '');
    setQuery('');
  }, [activeGenre]); // eslint-disable-line

  /* Header entrance observer */
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) el.classList.add('gp-header-visible'); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handleGenre = (slug) => {
    setActiveGenre(slug);
    setSearchParams({ genre: slug });
  };

  const handleSearch = () => {
    if (query.trim()) fetchGames(activeGenre, query.trim());
  };

  return (
    <div className="games-page page-pad">
      <div className="container">

        {/* Header */}
        <div className="gp-header" ref={headerRef}>
          <div className="section-title gp-title">
            <span className="gp-title-icon">🎮</span>
            <span>Games</span>
            <span className="gp-steam-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.909c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0z"/>
              </svg>
              via Steam
            </span>
          </div>
          <p className="gp-subtitle">Discover top games — data powered by Steam Store</p>
        </div>

        {/* Genre tabs */}
        <div className="genre-tabs">
          {GENRES.map((g, i) => (
            <button
              key={g.slug}
              className={`genre-tab${activeGenre === g.slug ? ' active' : ''}`}
              onClick={() => handleGenre(g.slug)}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="filter-row">
          <div className="search-wrap">
            <span className="search-icon-inner">🔍</span>
            <input
              className="form-control filter-input"
              type="text"
              placeholder="Search Steam…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            {query && (
              <button
                className="search-clear"
                onClick={() => { setQuery(''); fetchGames(activeGenre, ''); }}
                aria-label="Clear"
              >✕</button>
            )}
          </div>
          <button className="btn btn-primary gp-search-btn" onClick={handleSearch}>Search</button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="games-grid">
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : games.length === 0 ? (
          <div className="gp-empty">
            <span className="gp-empty-icon">🎮</span>
            <p>No games found. Try a different search or genre.</p>
          </div>
        ) : (
          <div className="games-grid" key={gridKey}>
            {games.map((g, i) => <GameCard key={g.id} game={g} index={i} />)}
          </div>
        )}
      </div>

      <style>{`
        .games-page { animation: gp-page-enter 0.5s cubic-bezier(.22,1,.36,1) both; }
        @keyframes gp-page-enter {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .gp-header {
          margin-bottom: 2rem;
          opacity: 0; transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s cubic-bezier(.22,1,.36,1);
        }
        .gp-header.gp-header-visible { opacity:1; transform:translateY(0); }
        .gp-title {
          display: flex; align-items: center; gap: 0.6rem;
          font-size: clamp(1.6rem, 4vw, 2.2rem);
        }
        .gp-title-icon {
          display: inline-block;
          animation: gp-icon-float 3s ease-in-out infinite;
        }
        @keyframes gp-icon-float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-5px) rotate(-8deg); }
        }
        .gp-steam-label {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.72rem; font-weight: 600;
          color: var(--text2); background: var(--surface);
          border: 1px solid var(--border);
          padding: 0.2rem 0.6rem; border-radius: 2rem;
          font-family: 'Outfit', sans-serif;
          letter-spacing: 0.02em;
        }
        .gp-subtitle { color: var(--text2); font-size: 0.9rem; margin-top: 0.3rem; opacity: 0.75; }

        .genre-tabs {
          display: flex; gap: 0.4rem; flex-wrap: wrap;
          margin-bottom: 1.2rem; padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border);
        }
        .genre-tab {
          padding: 0.42rem 1rem; border-radius: 2rem;
          border: 1px solid var(--border); background: var(--surface);
          color: var(--text2); cursor: pointer;
          font-family: 'Outfit', sans-serif; font-size: 0.84rem; font-weight: 600;
          transition: border-color 0.2s, color 0.2s, background 0.2s, transform 0.15s, box-shadow 0.2s;
          white-space: nowrap;
          animation: gp-tab-in 0.4s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes gp-tab-in {
          from { opacity:0; transform:translateY(8px) scale(0.95); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .genre-tab:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(245,197,66,0.15); }
        .genre-tab.active { background: var(--accent); color: #07101f; border-color: var(--accent); box-shadow: 0 4px 16px rgba(245,197,66,0.3); transform: translateY(-1px); }

        .filter-row { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.8rem; align-items: center; }
        .search-wrap { flex: 1; min-width: 200px; position: relative; display: flex; align-items: center; }
        .search-icon-inner { position: absolute; left: 0.9rem; font-size: 0.9rem; pointer-events: none; z-index: 1; }
        .filter-input { width: 100%; border-radius: 2rem !important; padding-left: 2.4rem !important; padding-right: 2.2rem !important; transition: box-shadow 0.25s, border-color 0.25s; }
        .filter-input:focus { box-shadow: 0 0 0 3px rgba(245,197,66,0.2); border-color: var(--accent) !important; }
        .search-clear { position: absolute; right: 0.8rem; background: none; border: none; color: var(--text2); cursor: pointer; font-size: 0.75rem; transition: color 0.15s, transform 0.15s; }
        .search-clear:hover { color: var(--danger); transform: scale(1.2); }
        .gp-search-btn { border-radius: 2rem !important; padding: 0.5rem 1.4rem; transition: transform 0.15s, box-shadow 0.2s; }
        .gp-search-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(245,197,66,0.25); }

        .gp-empty { padding: 4rem 1rem; text-align: center; color: var(--text2); display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .gp-empty-icon { font-size: 3rem; opacity: 0.3; animation: gp-icon-float 3s ease-in-out infinite; }
        .gp-empty p { font-size: 0.9rem; }

        .games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.2rem; }

        /* Skeleton */
        .skel-pulse {
          background: linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
          background-size: 200% 100%;
          animation: skel-shimmer 1.6s ease-in-out infinite; border-radius: 6px;
        }
        @keyframes skel-shimmer { from{background-position:200% 0} to{background-position:-200% 0} }
        .gc-skeleton { pointer-events: none; }
        .gc-skel-img { height: 130px; border-radius: 8px 8px 0 0; }
        .gc-skel-title { height: 14px; width: 80%; margin-bottom: 0.6rem; }
        .gc-skel-foot { display: flex; justify-content: space-between; }
        .gc-skel-chip { height: 10px; width: 30%; }

        /* Game Card */
        .game-card {
          overflow: hidden; text-decoration: none; color: var(--text);
          display: flex; flex-direction: column; position: relative;
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s;
          opacity: 0; animation: gp-card-in 0.5s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes gp-card-in {
          from { opacity:0; transform:translateY(24px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .game-card:hover { transform: translateY(-6px) scale(1.02); box-shadow: 0 16px 40px rgba(0,0,0,0.25), 0 0 0 1px rgba(245,197,66,0.2); z-index: 2; }

        .gc-shine {
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%);
          background-size: 200% 100%; background-position: -100% 0;
          transition: background-position 0.5s ease;
        }
        .game-card:hover .gc-shine { background-position: 200% 0; }

        .gc-img-wrap { position: relative; overflow: hidden; }
        .gc-img-wrap img {
          width: 100%; aspect-ratio: 460/215; object-fit: cover;
          display: block; background: var(--bg2);
          transition: transform 0.5s cubic-bezier(.22,1,.36,1);
        }
        .game-card:hover .gc-img-wrap img { transform: scale(1.07); }
        .gc-img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(7,16,31,0.6) 0%, transparent 50%); opacity: 0; transition: opacity 0.3s; }
        .game-card:hover .gc-img-overlay { opacity: 1; }

        .gc-steam-badge {
          position: absolute; bottom: 0.4rem; left: 0.4rem;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
          padding: 0.2rem 0.35rem; border-radius: 4px;
          display: flex; align-items: center;
        }
        .gc-meta-score {
          position: absolute; top: 0.5rem; right: 0.5rem;
          font-size: 0.75rem; font-weight: 700; padding: 0.2rem 0.5rem;
          border-radius: 4px; font-family: 'Syne', sans-serif;
          transition: transform 0.2s;
        }
        .game-card:hover .gc-meta-score { transform: scale(1.1); }
        .gc-meta-pop { animation: gp-meta-pop 0.4s cubic-bezier(.34,1.56,.64,1) both 0.3s; }
        @keyframes gp-meta-pop { from{transform:scale(0) rotate(-10deg);opacity:0} to{transform:scale(1) rotate(0);opacity:1} }
        .gc-meta-green  { background: #10b981; color: #fff; }
        .gc-meta-yellow { background: #f59e0b; color: #07101f; }
        .gc-meta-red    { background: #ef4444; color: #fff; }

        .gc-body  { padding: 0.85rem; flex: 1; position: relative; z-index: 1; }
        .gc-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.9rem; line-height: 1.3; margin-bottom: 0.5rem; transition: color 0.2s; }
        .game-card:hover .gc-title { color: var(--accent); }
        .gc-foot  { display: flex; justify-content: space-between; align-items: center; }
        .gc-price { font-size: 0.78rem; color: var(--accent); font-weight: 600; }
        .gc-platforms { font-size: 0.72rem; }

        @media (max-width: 768px) {
          .games-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }
        }
        @media (max-width: 480px) {
          .games-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .filter-row { flex-direction: column; }
          .gp-search-btn { width: 100%; }
        }
        @media (max-width: 360px) {
          .games-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
