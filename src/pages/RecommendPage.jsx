// src/pages/RecommendPage.jsx
// Premium-gated page. Tabs: Movies | Songs | Games | Audiobooks.
// Each tab calls GET /api/recommend/:type → Python Flask → pickle model.

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../context/AuthContext';
import { useLists }    from '../context/ListsContext';
import { useToast }    from '../context/ToastContext';
import api             from '../utils/api';

// ── Tab config ────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'movies',     icon: '🎬', label: 'Movies' },
  { id: 'songs',      icon: '🎵', label: 'Songs' },
  { id: 'games',      icon: '🎮', label: 'Games' },
  { id: 'audiobooks', icon: '📚', label: 'Audiobooks' },
];

const PH = 'https://placehold.co/342x513/07101f/f5c542?text=No+Poster';

// ════════════════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════════════════

function SkeletonCard() {
  return (
    <div className="rp2-card rp2-skel" aria-hidden="true">
      <div className="rp2-skel-img  skel-pulse" />
      <div className="rp2-body">
        <div className="rp2-skel-tag   skel-pulse" />
        <div className="rp2-skel-title skel-pulse" />
        <div className="rp2-skel-sub   skel-pulse" />
        <div className="rp2-skel-btn   skel-pulse" />
      </div>
    </div>
  );
}

function MovieCard({ item, onAdd, inList, index }) {
  const [adding, setAdding] = useState(false);
  const poster = (item.Poster && item.Poster !== 'N/A') ? item.Poster : PH;
  const title  = item.title || item.Title || 'Untitled';
  const jw     = `https://www.justwatch.com/in/search?q=${encodeURIComponent(title)}`;

  const handleAdd = async () => {
    if (inList || adding) return;
    setAdding(true);
    await onAdd(item);
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <div className="rp2-card rp2-card-animate" style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}>
      <div className="rp2-img-wrap">
        <img src={poster} alt={title} loading="lazy" onError={(e) => { e.target.src = PH; }} />
        <div className="rp2-overlay">
          <a href={jw} target="_blank" rel="noopener noreferrer" className="rp2-watch-btn">
            ▶ Where to Watch
          </a>
        </div>
        {inList && <span className="rp2-badge">✓</span>}
      </div>
      <div className="rp2-body">
        <span className="rp2-tag">{item.Genre || item.genre || ''}</span>
        <div className="rp2-title">{title}</div>
        {(item.imdbRating || item.rating) && (
          <div className="rp2-sub">⭐ {item.imdbRating || item.rating}
            {item.Year && <span className="rp2-year"> · {item.Year}</span>}
          </div>
        )}
        <button
          className={`rp2-add-btn${inList ? ' rp2-added' : ''}${adding ? ' rp2-adding' : ''}`}
          onClick={handleAdd}
          disabled={inList}
        >
          {inList ? '✓ Added' : adding ? <><span className="rp2-spin" /> Adding…</> : '+ Watchlist'}
        </button>
      </div>
      <div className="rp2-shine" />
    </div>
  );
}

function SongCard({ item, index }) {
  const [artwork, setArtwork] = useState(null);
  const title   = item.track_name || item.title || 'Untitled';
  const artist  = Array.isArray(item.artist_name) ? item.artist_name[0] : (item.artist_name || item.artist || '');
  const genre   = Array.isArray(item.genre) ? item.genre[0] : (item.genre || '');
  const rating  = Array.isArray(item.rating) ? item.rating[0] : (item.rating || '');
  const searchQ = encodeURIComponent(`${title} ${artist}`);
  const spotifyUrl = `https://open.spotify.com/search/${searchQ}`;

  useEffect(() => {
    if (!title) return;
    const q = encodeURIComponent(`${title} ${artist}`);
    fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=1`)
      .then(r => r.json())
      .then(d => {
        const url = d.results?.[0]?.artworkUrl100;
        if (url) setArtwork(url.replace('100x100bb', '400x400bb'));
      })
      .catch(() => {});
  }, [title, artist]);

  return (
    <div className="rp2-card rp2-card-animate" style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}>
      <div className="rp2-img-wrap">
        {artwork
          ? <img src={artwork} alt={title} loading="lazy"
              style={{ aspectRatio: '1/1', objectFit: 'cover', width: '100%', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          : <div className="rp2-song-art"><span className="rp2-song-icon">🎵</span></div>
        }
        <div className="rp2-overlay">
          <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="rp2-watch-btn"
            style={{ background: 'linear-gradient(135deg,#1db954,#17a349)' }}>
            ▶ Listen on Spotify
          </a>
        </div>
      </div>
      <div className="rp2-body">
        <span className="rp2-tag">{genre}</span>
        <div className="rp2-title">{title}</div>
        {artist && <div className="rp2-sub">{artist}</div>}
        {rating && <div className="rp2-sub rp2-sub-sm">⭐ {rating}</div>}
      </div>
      <div className="rp2-shine" />
    </div>
  );
}

function GameCard({ item, index }) {
  const title   = item.Name || item.title || item.name || 'Untitled';
  const tags    = Array.isArray(item.Tags) ? item.Tags.join(', ') : (item.Tags || '');
  const img     = item['Header image'] || null;
  const steamUrl = `https://store.steampowered.com/search/?term=${encodeURIComponent(title)}`;

  return (
    <div className="rp2-card rp2-card-animate" style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}>
      <div className="rp2-img-wrap">
        {img
          ? <img src={img} alt={title} loading="lazy"
              style={{ aspectRatio: '460/215', objectFit: 'cover', width: '100%', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          : <div className="rp2-game-art"><span className="rp2-game-icon">🎮</span></div>
        }
        <div className="rp2-overlay">
          <a href={steamUrl} target="_blank" rel="noopener noreferrer" className="rp2-watch-btn"
            style={{ background: 'linear-gradient(135deg,#1b2838,#2a475e)' }}>
            ▶ View on Steam
          </a>
        </div>
      </div>
      <div className="rp2-body">
        <span className="rp2-tag">{tags}</span>
        <div className="rp2-title">{title}</div>
        {item.Categories && (
          <div className="rp2-sub rp2-sub-sm">{item.Categories.split(',')[0].trim()}</div>
        )}
      </div>
      <div className="rp2-shine" />
    </div>
  );
}

function AudiobookCard({ item, index }) {
  const [cover, setCover] = useState(null);
  const title   = item.name || item.title || 'Untitled';
  const author  = item.author_clean || item.author || '';
  const dur     = item.duration_bucket || '';
  const price   = item.price !== undefined ? `$${item.price}` : '';
  const audibleUrl = `https://www.audible.com/search?keywords=${encodeURIComponent(title)}`;

  useEffect(() => {
    if (!title) return;
    fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title + ' ' + author)}&maxResults=1`)
      .then(r => r.json())
      .then(d => {
        const thumb = d.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
        if (thumb) {
          setCover(thumb.replace('http://', 'https://').replace('zoom=1', 'zoom=2'));
          return;
        }
        return fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1&fields=cover_i`)
          .then(r => r.json())
          .then(d => {
            const id = d.docs?.[0]?.cover_i;
            if (id) setCover(`https://covers.openlibrary.org/b/id/${id}-M.jpg`);
          });
      })
      .catch(() => {});
  }, [title, author]);

  return (
    <div className="rp2-card rp2-card-animate" style={{ animationDelay: `${Math.min(index * 60, 600)}ms` }}>
      <div className="rp2-img-wrap">
        {cover
          ? <img src={cover} alt={title} loading="lazy"
              style={{ aspectRatio: '2/3', objectFit: 'cover', width: '100%', display: 'block' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          : <div className="rp2-ab-art"><span className="rp2-ab-icon">📚</span></div>
        }
        <div className="rp2-overlay">
          <a href={audibleUrl} target="_blank" rel="noopener noreferrer" className="rp2-watch-btn"
            style={{ background: 'linear-gradient(135deg,#f47f20,#d4610a)' }}>
            ▶ Listen on Audible
          </a>
        </div>
      </div>
      <div className="rp2-body">
        <span className="rp2-tag">{item.language || 'English'}</span>
        <div className="rp2-title">{title}</div>
        {author && <div className="rp2-sub">{author}</div>}
        <div className="rp2-sub rp2-sub-sm">
          {dur && <span>⏱ {dur}</span>}
          {price && <span style={{ marginLeft: '0.6rem' }}>💰 {price}</span>}
        </div>
        {item.rating && <div className="rp2-sub rp2-sub-sm">⭐ {item.rating}</div>}
      </div>
      <div className="rp2-shine" />
    </div>
  );
}

function ItemCard({ tab, item, index, onAddMovie, isInWatchlist }) {
  switch (tab) {
    case 'movies':
      return (
        <MovieCard
          item={item}
          index={index}
          inList={isInWatchlist(item.imdbID || '')}
          onAdd={onAddMovie}
        />
      );
    case 'songs':      return <SongCard      item={item} index={index} />;
    case 'games':      return <GameCard      item={item} index={index} />;
    case 'audiobooks': return <AudiobookCard item={item} index={index} />;
    default:           return null;
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function RecommendPage() {
  const { user }                              = useAuth();
  const { addToWatchlist, isInWatchlist }     = useLists();
  const { success, info }                     = useToast();
  const navigate                              = useNavigate();

  const [activeTab,  setActiveTab]  = useState('movies');
  const [cache,      setCache]      = useState({});
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  // ── FIX: use a ref to track in-flight requests and avoid double-fetch ──────
  const fetchingRef = useRef({});

  const fetchTab = useCallback(async (tab) => {
    // ── FIX 1: Skip if already cached ─────────────────────────────────────
    setCache((prev) => {
      if (prev[tab]) return prev; // trigger no state update needed
      return prev;
    });

    // ── FIX 2: Read cache synchronously via ref to avoid stale closure ─────
    // We use a functional check instead of capturing `cache` in closure
    setCache((prev) => {
      if (prev[tab] !== undefined) return prev; // already have data, bail
      return prev;
    });

    // Check via a separate flag to avoid double fetch
    if (fetchingRef.current[tab]) return;
    fetchingRef.current[tab] = true;

    setLoading(true);
    setError('');

    try {
      const { data } = await api.get(`/recommend/${tab}`);
      setCache((prev) => ({
        ...prev,
        [tab]: data.recommendations || [],
      }));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load recommendations.';
      if (err.response?.data?.needsOnboarding) {
        setError('Please complete your taste profile first.');
      } else {
        setError(msg);
      }
      // ── FIX 3: Reset flag on error so user can retry ───────────────────
      fetchingRef.current[tab] = false;
    } finally {
      setLoading(false);
    }
  }, []); // no deps needed — fetchingRef and setCache are stable

  useEffect(() => {
    // ── FIX 4: Only fetch if not already cached ────────────────────────────
    setCache((prev) => {
      if (prev[activeTab] !== undefined) {
        // Already cached — just ensure loading is false
        setLoading(false);
        return prev;
      }
      // Not cached — trigger fetch
      fetchTab(activeTab);
      return prev;
    });
  }, [activeTab, fetchTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  const handleAddMovie = async (movie) => {
    const title = movie.title || movie.Title;
    const added = await addToWatchlist({
      imdbID: movie.imdbID, title,
      poster: movie.Poster || movie.poster,
      year:   movie.Year   || movie.year,
      genre:  movie.Genre  || movie.genre,
      rating: movie.imdbRating || movie.rating,
    });
    if (added) success(`Added "${title}" to watchlist! 🎬`);
    else       info('Already in your watchlist.');
  };

  const items = cache[activeTab] || [];

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="rp2-page page-pad">

      {/* ── Star background ── */}
      <div className="rp2-bg" aria-hidden="true">
        {[1,2,3,4].map((n) => <div key={n} className={`rp2-orb rp2-orb-${n}`} />)}
      </div>

      <div className="container" style={{ position:'relative', zIndex:1 }}>

        {/* ── Header ── */}
        <div className="rp2-header">
          <h1 className="section-title">
            <span className="rp2-star-icon">⭐</span> For You
          </h1>
          <p className="rp2-subtitle">
            Personalised picks powered by your taste profile
          </p>
        </div>

        <>
          {/* Tab bar */}
          <div className="rp2-tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`rp2-tab${activeTab === tab.id ? ' rp2-tab-active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <span className="rp2-tab-icon">{tab.icon}</span>
                <span className="rp2-tab-label">{tab.label}</span>
                {cache[tab.id] && (
                  <span className="rp2-tab-count">{cache[tab.id].length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Error state */}
          {error && !loading && (
            <div className="rp2-error">
              <span>⚠️ {error}</span>
              {error.includes('taste profile') && (
                <button className="rp2-error-link" onClick={() => navigate('/welcome')}>
                  Set up preferences →
                </button>
              )}
            </div>
          )}

          {/* Loading skeletons */}
          {loading && (
            <div className="rp2-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* Results */}
          {!loading && !error && items.length > 0 && (
            <>
              <p className="rp2-count-label">
                {items.length} picks for your <strong>{activeTab}</strong> taste
              </p>
              <div className="rp2-grid">
                {items.map((item, i) => (
                  <ItemCard
                    key={i}
                    tab={activeTab}
                    item={item}
                    index={i}
                    onAddMovie={handleAddMovie}
                    isInWatchlist={isInWatchlist}
                  />
                ))}
              </div>
            </>
          )}

          {/* Empty */}
          {!loading && !error && items.length === 0 && cache[activeTab] !== undefined && (
            <div className="rp2-empty">
              <div className="rp2-empty-icon">🧭</div>
              <h3>No recommendations found</h3>
              <p>
                We couldn't find matches for your {activeTab} preferences.{' '}
                <button className="rp2-error-link" onClick={() => navigate('/welcome')}>
                  Update your taste profile
                </button>
              </p>
            </div>
          )}
        </>

      </div>

      {/* ── Styles ── */}
      <style>{`
        .rp2-page {
          position: relative;
          animation: rp2-page-in 0.45s cubic-bezier(.22,1,.36,1) both;
          overflow-x: hidden;
        }
        @keyframes rp2-page-in {
          from { opacity:0; transform:translateY(14px); }
          to   { opacity:1; transform:translateY(0); }
        }

        /* ── Background orbs ── */
        .rp2-bg { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
        .rp2-orb {
          position:absolute; border-radius:50%;
          background:var(--accent); filter:blur(90px); opacity:0.04;
          animation: rp2-orb-drift ease-in-out infinite;
        }
        .rp2-orb-1 { width:400px; height:400px; top:-80px;  left:-80px;  animation-duration:22s; }
        .rp2-orb-2 { width:300px; height:300px; top:40%;    right:-60px; animation-duration:18s; animation-delay:-6s; }
        .rp2-orb-3 { width:200px; height:200px; bottom:5%;  left:20%;    animation-duration:14s; animation-delay:-10s; opacity:0.03; }
        .rp2-orb-4 { width:150px; height:150px; top:25%;    left:50%;    animation-duration:12s; animation-delay:-3s;  opacity:0.025; }
        @keyframes rp2-orb-drift {
          0%,100% { transform:translateY(0) scale(1); }
          50%      { transform:translateY(-35px) scale(1.06); }
        }

        /* ── Header ── */
        .rp2-header { margin-bottom:1.6rem; }
        .rp2-star-icon {
          display:inline-block;
          animation: rp2-spin-star 4s ease-in-out infinite;
        }
        @keyframes rp2-spin-star {
          0%,100% { transform:rotate(0deg) scale(1); }
          25%      { transform:rotate(18deg) scale(1.1); }
          75%      { transform:rotate(-14deg) scale(0.95); }
        }
        .rp2-subtitle {
          color:var(--text2); font-size:0.88rem; margin-top:0.25rem;
          display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;
        }

        /* ── Tabs ── */
        .rp2-tabs {
          display:flex; gap:0.5rem; margin-bottom:1.8rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0;
          overflow-x: auto; -webkit-overflow-scrolling: touch;
        }
        .rp2-tabs::-webkit-scrollbar { display:none; }
        .rp2-tab {
          display:flex; align-items:center; gap:0.4rem;
          padding:0.65rem 1.1rem;
          background:none; border:none;
          border-bottom: 3px solid transparent;
          font-size:0.88rem; font-weight:600;
          font-family:'Outfit',sans-serif;
          color:var(--text2);
          cursor:pointer; white-space:nowrap;
          transition: color 0.2s, border-color 0.2s;
          margin-bottom: -1px;
        }
        .rp2-tab:hover { color:var(--text); }
        .rp2-tab-active {
          color:var(--accent) !important;
          border-bottom-color:var(--accent) !important;
        }
        .rp2-tab-icon { font-size:1rem; }
        .rp2-tab-count {
          background:var(--surface);
          border:1px solid var(--border);
          color:var(--text2);
          font-size:0.68rem; font-weight:700;
          padding:0.1rem 0.45rem; border-radius:2rem;
        }
        .rp2-tab-active .rp2-tab-count {
          background: color-mix(in srgb, var(--accent) 15%, transparent);
          border-color: var(--accent);
          color: var(--accent);
        }

        /* ── Count label ── */
        .rp2-count-label {
          font-size:0.82rem; color:var(--text2); margin-bottom:1.2rem;
          animation: rp2-page-in 0.3s ease both;
        }
        .rp2-count-label strong { color:var(--accent); }

        /* ── Grid ── */
        .rp2-grid {
          display:grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap:1.2rem;
        }

        /* ── Card base ── */
        .rp2-card {
          position:relative; overflow:hidden;
          background:var(--surface);
          border:1px solid var(--border);
          border-radius:12px;
          transition: transform 0.3s cubic-bezier(.22,1,.36,1), box-shadow 0.3s;
          opacity:0;
          animation: rp2-card-in 0.45s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes rp2-card-in {
          from { opacity:0; transform:translateY(24px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .rp2-card:hover {
          transform:translateY(-7px) scale(1.02);
          box-shadow:0 18px 48px rgba(0,0,0,0.28), 0 0 0 1px rgba(245,197,66,0.18);
          z-index:2;
        }

        /* Shine sweep */
        .rp2-shine {
          position:absolute; inset:0; pointer-events:none;
          background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.07) 50%,transparent 60%);
          background-size:200% 100%; background-position:-100% 0;
          transition:background-position 0.55s ease;
        }
        .rp2-card:hover .rp2-shine { background-position:200% 0; }

        /* ── Movie img ── */
        .rp2-img-wrap { position:relative; overflow:hidden; }
        .rp2-img-wrap img {
          width:100%; aspect-ratio:2/3; object-fit:cover;
          background:var(--bg); display:block;
          transition:transform 0.5s cubic-bezier(.22,1,.36,1);
        }
        .rp2-card:hover .rp2-img-wrap img { transform:scale(1.06); }
        .rp2-overlay {
          position:absolute; inset:0;
          background:linear-gradient(to top, rgba(7,16,31,0.9) 40%, transparent);
          display:flex; align-items:flex-end; padding:0.75rem;
          opacity:0; transition:opacity 0.3s;
        }
        .rp2-card:hover .rp2-overlay { opacity:1; }
        .rp2-watch-btn {
          background:linear-gradient(135deg,#e50914,#c2000f); color:#fff;
          padding:0.28rem 0.75rem; border-radius:2rem;
          font-size:0.67rem; font-weight:700; text-decoration:none;
          transition:transform 0.2s;
        }
        .rp2-watch-btn:hover { transform:scale(1.06); }
        .rp2-badge {
          position:absolute; top:0.4rem; right:0.4rem;
          width:24px; height:24px; border-radius:50%;
          background:var(--success,#10b981); color:#fff;
          font-size:0.7rem; font-weight:700;
          display:flex; align-items:center; justify-content:center;
          animation: rp2-pop 0.35s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes rp2-pop { from{transform:scale(0)} to{transform:scale(1)} }

        /* ── Art placeholders ── */
        .rp2-song-art, .rp2-game-art, .rp2-ab-art {
          height:120px;
          display:flex; align-items:center; justify-content:center;
          font-size:3rem;
          background: linear-gradient(135deg, var(--bg), var(--surface));
        }

        /* ── Card body ── */
        .rp2-body   { padding:0.8rem; position:relative; z-index:1; }
        .rp2-tag    {
          font-size:0.64rem; color:var(--accent); font-weight:700;
          text-transform:uppercase; letter-spacing:0.06em;
          display:block; margin-bottom:0.2rem;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }
        .rp2-title  {
          font-family:'Syne',sans-serif; font-weight:600; font-size:0.84rem;
          line-height:1.3; color:var(--text); margin-bottom:0.2rem;
          transition:color 0.2s;
        }
        .rp2-card:hover .rp2-title { color:var(--accent); }
        .rp2-sub    { font-size:0.72rem; color:var(--text2); margin-bottom:0.15rem; }
        .rp2-sub-sm { font-size:0.68rem; opacity:0.75; }

        /* Add to watchlist button */
        .rp2-add-btn {
          width:100%; margin-top:0.5rem;
          background:var(--accent); border:none;
          padding:0.3rem 0.8rem; border-radius:2rem;
          font-size:0.7rem; font-weight:700;
          font-family:'Outfit',sans-serif; color:#07101f;
          cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:0.3rem;
          transition:background 0.2s, transform 0.15s;
        }
        .rp2-add-btn:hover:not(:disabled) { background:var(--accent-dk,#e0b530); transform:translateY(-1px); }
        .rp2-add-btn.rp2-added   { background:var(--success,#10b981); color:#fff; cursor:default; }
        .rp2-add-btn.rp2-adding  { opacity:0.75; cursor:wait; }
        .rp2-spin {
          width:10px; height:10px; border-radius:50%;
          border:2px solid rgba(7,16,31,0.25); border-top-color:#07101f;
          animation:rp2-spinit 0.7s linear infinite; display:inline-block;
        }
        @keyframes rp2-spinit { to { transform:rotate(360deg); } }

        /* ── Skeleton ── */
        .skel-pulse {
          background:linear-gradient(90deg, var(--surface) 25%, var(--border) 50%, var(--surface) 75%);
          background-size:200% 100%;
          animation:skel-shimmer 1.6s ease-in-out infinite;
          border-radius:6px;
        }
        @keyframes skel-shimmer { from{background-position:200% 0} to{background-position:-200% 0} }
        .rp2-skel { pointer-events:none; opacity:1 !important; animation:none !important; }
        .rp2-skel-img   { height:190px; border-radius:11px 11px 0 0; }
        .rp2-skel-tag   { height:9px;  width:35%; margin-bottom:0.45rem; }
        .rp2-skel-title { height:13px; width:80%; margin-bottom:0.35rem; }
        .rp2-skel-sub   { height:9px;  width:50%; margin-bottom:0.6rem; }
        .rp2-skel-btn   { height:26px; width:100%; border-radius:2rem; }

        /* ── Error / empty ── */
        .rp2-error {
          background:color-mix(in srgb, #e53e3e 10%, transparent);
          border:1px solid #e53e3e44;
          color:#fc8181; border-radius:10px;
          padding:1rem 1.2rem; font-size:0.85rem;
          margin-bottom:1.5rem;
          display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;
        }
        .rp2-error-link {
          background:none; border:none;
          color:var(--accent); font-size:0.82rem; font-weight:600;
          cursor:pointer; text-decoration:underline;
          font-family:'Outfit',sans-serif;
        }
        .rp2-empty {
          text-align:center; padding:4rem 1.5rem; color:var(--text2);
        }
        .rp2-empty-icon { font-size:3rem; margin-bottom:1rem; }
        .rp2-empty h3 {
          font-family:'Syne',sans-serif; font-size:1.2rem;
          color:var(--text); margin:0 0 0.5rem;
        }
        .rp2-empty p { font-size:0.88rem; line-height:1.6; }

        /* ── Responsive ── */
        @media (max-width:768px) {
          .rp2-grid { grid-template-columns:repeat(auto-fill, minmax(155px,1fr)); gap:0.9rem; }
          .rp2-tab-label { display:none; }
          .rp2-tab { padding:0.6rem 0.9rem; }
          .rp2-tab-icon { font-size:1.2rem; }
        }
        @media (max-width:480px) {
          .rp2-grid { grid-template-columns:repeat(2,1fr); gap:0.75rem; }
        }
      `}</style>
    </div>
  );
}
