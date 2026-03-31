// src/pages/AudiobooksPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────
const GENRES = [
  { label: 'All',       term: 'bestseller'       },
  { label: 'Fiction',   term: 'fiction'          },
  { label: 'Mystery',   term: 'mystery thriller' },
  { label: 'Sci-Fi',    term: 'science fiction'  },
  { label: 'Fantasy',   term: 'fantasy'          },
  { label: 'Biography', term: 'biography memoir' },
  { label: 'Self-Help', term: 'self help'        },
  { label: 'History',   term: 'history'          },
  { label: 'Business',  term: 'business'         },
  { label: 'Children',  term: 'children stories' },
  { label: 'Romance',   term: 'romance'          },
  { label: 'Horror',    term: 'horror'           },
];

const PH = 'https://placehold.co/300x300/07101f/f5c542?text=📖';

// ─── API (unchanged) ──────────────────────────────────────────────────────────
async function fetchAudiobooks(term, limit = 24) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=audiobook&entity=audiobook&limit=${limit}&country=us`;
  const res  = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

// ─── Framer Motion Variants ───────────────────────────────────────────────────
const SPRING = [0.22, 1, 0.36, 1];

const pageV = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.45 } },
  exit:    { opacity: 0, transition: { duration: 0.2  } },
};

const heroContainerV = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
};
const heroItemV = {
  hidden:  { opacity: 0, y: 30, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.65, ease: SPRING } },
};

const pillsV = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};
const pillV = {
  hidden:  { opacity: 0, scale: 0.72, y: 8 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.32, ease: 'backOut' } },
};

const gridV = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};
const cardV = {
  hidden:  { opacity: 0, y: 22,  scale: 0.93 },
  visible: { opacity: 1, y: 0,   scale: 1,   transition: { duration: 0.44, ease: SPRING } },
  exit:    { opacity: 0, scale: 0.9,          transition: { duration: 0.18 } },
};

const listRowV = {
  hidden:  { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0,   transition: { duration: 0.35, ease: SPRING } },
  exit:    { opacity: 0, x: 18,  transition: { duration: 0.15 } },
};

const toolbarV = {
  hidden:  { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut', delay: 0.2 } },
};

const stateBoxV = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: SPRING } },
  exit:    { opacity: 0,        transition: { duration: 0.2 } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StarRating({ rating }) {
  if (!rating) return null;
  const stars = Math.round(rating);
  return (
    <div className="ab-stars">
      {[1,2,3,4,5].map(i => (
        <span key={i} className={i <= stars ? 'ab-star filled' : 'ab-star'}>★</span>
      ))}
      <span className="ab-rating-num">{rating.toFixed(1)}</span>
    </div>
  );
}

function AudiobookCard({ book, onPreview, isPlaying }) {
  const art        = book.artworkUrl600 || book.artworkUrl100 || PH;
  const hasPreview = !!book.previewUrl;

  return (
    <motion.div
      className={`ab-card${isPlaying ? ' ab-playing' : ''}`}
      variants={cardV}
      whileHover={{ y: -6, transition: { duration: 0.22, ease: 'easeOut' } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
      layout
    >
      <div className="ab-art-wrap">
        <img
          src={art}
          alt={book.collectionName || book.trackName}
          loading="lazy"
          onError={e => { e.target.src = PH; }}
        />
        <div className="ab-overlay">
          {hasPreview ? (
            <motion.button
              className="ab-preview-btn"
              onClick={() => onPreview(book)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
            >
              {isPlaying ? '⏸ Pause' : '▶ Preview'}
            </motion.button>
          ) : (
            <a
              href={book.collectionViewUrl || book.trackViewUrl}
              target="_blank" rel="noopener noreferrer"
              className="ab-preview-btn ab-preview-btn--link"
            >
              Open →
            </a>
          )}
        </div>

        {isPlaying && (
          <div className="ab-now-playing">
            <div className="ab-wave">
              <span/><span/><span/><span/><span/>
            </div>
            <span>Playing</span>
          </div>
        )}

        {book.releaseDate && (
          <div className="ab-year-badge">
            {new Date(book.releaseDate).getFullYear()}
          </div>
        )}
      </div>

      <div className="ab-body">
        <div className="ab-title">{book.collectionName || book.trackName}</div>
        <div className="ab-author">by {book.artistName}</div>
        {book.averageUserRating && <StarRating rating={book.averageUserRating} />}
        <div className="ab-meta-row">
          {book.primaryGenreName && (
            <span className="ab-genre-tag">{book.primaryGenreName}</span>
          )}
          {book.trackTimeMillis && (
            <span className="ab-duration">
              {Math.round(book.trackTimeMillis / 3600000)}h
            </span>
          )}
        </div>
        <a
          href={book.collectionViewUrl || book.trackViewUrl}
          target="_blank" rel="noopener noreferrer"
          className="ab-listen-btn"
        >
          Listen on Apple Books →
        </a>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AudiobooksPage() {
  const [query,     setQuery]     = useState('');
  const [genre,     setGenre]     = useState(GENRES[0]);
  const [books,     setBooks]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [playingId, setPlayingId] = useState(null);
  const [view,      setView]      = useState('grid');
  const audioRef    = useRef(null);
  const debounceRef = useRef(null);

  // ── Data fetching (unchanged) ──
  const load = useCallback(async (term) => {
    setLoading(true); setError('');
    try {
      const results = await fetchAudiobooks(term, 24);
      setBooks(results);
    } catch {
      setError('Failed to load audiobooks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(GENRES[0].term); }, []); // eslint-disable-line
  useEffect(() => { if (!query.trim()) load(genre.term); }, [genre]); // eslint-disable-line
  useEffect(() => {
    if (!query.trim()) { load(genre.term); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(query), 600);
    return () => clearTimeout(debounceRef.current);
  }, [query]); // eslint-disable-line

  // ── Audio controls (unchanged) ──
  const handlePreview = (book) => {
    if (!audioRef.current) return;
    const id = book.collectionId || book.trackId;
    if (playingId === id) {
      audioRef.current.pause();
      setPlayingId(null);
      return;
    }
    audioRef.current.src = book.previewUrl;
    audioRef.current.play().catch(() => {});
    setPlayingId(id);
  };

  const handleGenre = (g) => {
    setGenre(g); setQuery(''); setPlayingId(null);
    if (audioRef.current) audioRef.current.pause();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) load(query);
  };

  // ── Unique key so AnimatePresence re-mounts grid on genre/query change ──
  const contentKey = loading ? 'loading' : error ? 'error' : books.length === 0
    ? 'empty'
    : `${view}-${genre.label}-${query}`;

  return (
    <motion.div
      className="ab-page"
      variants={pageV}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} style={{ display: 'none' }} />

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="ab-hero">
        <div className="ab-hero-bg" aria-hidden>
          <div className="ab-glow ab-glow-1" />
          <div className="ab-glow ab-glow-2" />
          <div className="ab-grid-bg" />
        </div>

        <motion.div
          className="ab-hero-inner"
          variants={heroContainerV}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="ab-badge" variants={heroItemV}>
            📖 Pixel Pirates Audiobooks
          </motion.div>

          <motion.h1 className="ab-title-h" variants={heroItemV}>
            Stories for Your <span className="ab-accent">Ears</span>
          </motion.h1>

          <motion.p className="ab-subtitle" variants={heroItemV}>
            Thousands of audiobooks — fiction, history, self-help, mystery &amp; more.
            Preview before you listen.
          </motion.p>

          <motion.form
            className="ab-search-form"
            onSubmit={handleSearch}
            variants={heroItemV}
          >
            <input
              className="ab-search-input"
              type="text"
              placeholder="Search by title, author, genre…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <motion.button
              type="submit"
              className="ab-search-btn"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Search
            </motion.button>
          </motion.form>
        </motion.div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="ab-container">

        {/* Genre pills */}
        <motion.div
          className="ab-genres"
          variants={pillsV}
          initial="hidden"
          animate="visible"
        >
          {GENRES.map((g) => (
            <motion.button
              key={g.label}
              className={`ab-genre-pill${genre.label === g.label && !query ? ' active' : ''}`}
              onClick={() => handleGenre(g)}
              variants={pillV}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.93 }}
            >
              {g.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Toolbar */}
        <motion.div
          className="ab-toolbar"
          variants={toolbarV}
          initial="hidden"
          animate="visible"
        >
          <div className="ab-toolbar-left">
            <span className="ab-section-label">
              {query ? `Results for "${query}"` : genre.label}
            </span>
            <AnimatePresence mode="wait">
              {!loading && (
                <motion.span
                  key={books.length}
                  className="ab-count"
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  {books.length} titles
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="ab-view-toggle">
            <motion.button
              className={`ab-view-btn${view === 'grid' ? ' active' : ''}`}
              onClick={() => setView('grid')}
              title="Grid view"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >⊞</motion.button>
            <motion.button
              className={`ab-view-btn${view === 'list' ? ' active' : ''}`}
              onClick={() => setView('list')}
              title="List view"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >☰</motion.button>
          </div>
        </motion.div>

        {/* Content — AnimatePresence for smooth state transitions */}
        <AnimatePresence mode="wait">

          {loading ? (
            <motion.div
              key="skeleton"
              className={view === 'list' ? 'ab-skel-list' : 'ab-skel-grid'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {[...Array(view === 'list' ? 6 : 8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={view === 'list' ? 'ab-skel ab-skel--row' : 'ab-skel'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.045 }}
                />
              ))}
            </motion.div>

          ) : error ? (
            <motion.div
              key="error"
              className="ab-state-box"
              variants={stateBoxV}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <span>⚠️</span>
              <p>{error}</p>
              <motion.button
                className="btn btn-primary"
                onClick={() => load(genre.term)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Retry
              </motion.button>
            </motion.div>

          ) : books.length === 0 ? (
            <motion.div
              key="empty"
              className="ab-state-box"
              variants={stateBoxV}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                style={{ fontSize: '3.5rem' }}
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 1.2, delay: 0.3, repeat: Infinity, repeatDelay: 3 }}
              >
                📚
              </motion.div>
              <p>No audiobooks found. Try a different search.</p>
            </motion.div>

          ) : view === 'grid' ? (
            <motion.div
              key={contentKey}
              className="ab-grid"
              variants={gridV}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {books.map(book => (
                <AudiobookCard
                  key={book.collectionId || book.trackId}
                  book={book}
                  onPreview={handlePreview}
                  isPlaying={playingId === (book.collectionId || book.trackId)}
                />
              ))}
            </motion.div>

          ) : (
            <motion.div
              key={contentKey}
              className="ab-list"
              variants={gridV}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {books.map(book => {
                const id  = book.collectionId || book.trackId;
                const art = book.artworkUrl100 || PH;
                return (
                  <motion.div
                    key={id}
                    className={`ab-list-item${playingId === id ? ' playing' : ''}`}
                    variants={listRowV}
                    whileHover={{ x: 5, transition: { duration: 0.18 } }}
                  >
                    <img
                      src={art}
                      alt={book.collectionName}
                      loading="lazy"
                      onError={e => { e.target.src = PH; }}
                      className="ab-list-art"
                    />
                    <div className="ab-list-info">
                      <div className="ab-list-title">{book.collectionName || book.trackName}</div>
                      <div className="ab-list-author">by {book.artistName}</div>
                      {book.averageUserRating && <StarRating rating={book.averageUserRating} />}
                    </div>
                    <div className="ab-list-meta">
                      {book.primaryGenreName && (
                        <span className="ab-genre-tag">{book.primaryGenreName}</span>
                      )}
                      {book.trackTimeMillis && (
                        <span className="ab-list-dur">
                          {Math.round(book.trackTimeMillis / 3600000)}h
                        </span>
                      )}
                    </div>
                    <div className="ab-list-actions">
                      {book.previewUrl && (
                        <motion.button
                          className={`ab-list-play${playingId === id ? ' active' : ''}`}
                          onClick={() => handlePreview(book)}
                          whileHover={{ scale: 1.14 }}
                          whileTap={{ scale: 0.88 }}
                        >
                          {playingId === id ? '⏸' : '▶'}
                        </motion.button>
                      )}
                      <a
                        href={book.collectionViewUrl || book.trackViewUrl}
                        target="_blank" rel="noopener noreferrer"
                        className="ab-list-open"
                      >
                        Open
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Styles ──────────────────────────────────────────────────── */}
      <style>{`
        /* ── Base ── */
        .ab-page {
          min-height: 100vh;
          padding-bottom: 5rem;
          background: var(--bg);
          position: relative;
        }

        /* ── Hero ── */
        .ab-hero {
          position: relative;
          overflow: hidden;
          background: var(--bg);
          padding: calc(var(--nav-h, 64px) + 3rem) 0 3.5rem;
          text-align: center;
          z-index: 1;
        }
        .ab-hero-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .ab-glow {
          position: absolute; border-radius: 50%;
          filter: blur(90px); pointer-events: none;
        }
        .ab-glow-1 {
          width: 700px; height: 420px;
          top: -120px; left: 50%; transform: translateX(-50%);
          background: radial-gradient(circle, rgba(245,197,66,0.09), transparent 70%);
          animation: abPulse 6s ease-in-out infinite alternate;
        }
        .ab-glow-2 {
          width: 450px; height: 320px; bottom: -40px; left: -80px;
          background: radial-gradient(circle, rgba(16,185,129,0.06), transparent 70%);
          animation: abPulse 8s ease-in-out infinite alternate-reverse;
        }
        @keyframes abPulse {
          from { opacity: 0.6; transform: translateX(-50%) scale(1); }
          to   { opacity: 1;   transform: translateX(-50%) scale(1.08); }
        }
        .ab-glow-2 { animation: abPulse2 8s ease-in-out infinite alternate-reverse; }
        @keyframes abPulse2 {
          from { opacity: 0.5; transform: scale(1); }
          to   { opacity: 1;   transform: scale(1.1); }
        }
        .ab-grid-bg {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 50px 50px; opacity: 0.25;
        }
        .ab-hero-inner { position: relative; z-index: 1; padding: 0 1rem; }

        .ab-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--accent-glow); border: 1px solid rgba(245,197,66,0.25);
          color: var(--accent); padding: 0.35rem 1rem; border-radius: 2rem;
          font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em;
          margin-bottom: 1.2rem;
        }
        .ab-title-h {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 5.5vw, 3.8rem);
          font-weight: 900; letter-spacing: -0.02em;
          color: var(--text); margin: 0 0 0.7rem;
        }
        .ab-accent {
          background: linear-gradient(110deg, var(--accent) 30%, #ffd97a);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .ab-subtitle {
          font-size: clamp(0.85rem, 1.5vw, 1rem);
          color: var(--text2); margin: 0 auto 2rem;
          max-width: 540px; line-height: 1.65;
        }
        .ab-search-form {
          display: flex; max-width: 520px; margin: 0 auto;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 3rem; overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ab-search-form:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .ab-search-input {
          flex: 1; background: none; border: none; outline: none;
          padding: 0.85rem 1.25rem; font-family: 'Outfit', sans-serif;
          font-size: 0.9rem; color: var(--text);
        }
        .ab-search-input::placeholder { color: var(--text2); }
        .ab-search-btn {
          background: var(--accent); border: none; color: #07101f;
          font-family: 'Outfit', sans-serif; font-weight: 700;
          font-size: 0.85rem; padding: 0 1.4rem; cursor: pointer;
          transition: background 0.2s; white-space: nowrap;
        }
        .ab-search-btn:hover { background: var(--accent-dk, #d4a017); }

        /* ── Container ── */
        .ab-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

        /* ── Genre pills ── */
        .ab-genres { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 2rem 0 1.5rem; }
        .ab-genre-pill {
          background: var(--bg2); border: 1px solid var(--border);
          color: var(--text2); font-family: 'Outfit', sans-serif;
          font-size: 0.8rem; font-weight: 500; padding: 0.38rem 1rem;
          border-radius: 2rem; cursor: pointer;
          transition: border-color 0.18s, color 0.18s, background 0.18s;
          white-space: nowrap; will-change: transform;
        }
        .ab-genre-pill:hover { border-color: var(--accent); color: var(--accent); }
        .ab-genre-pill.active {
          background: var(--accent); border-color: var(--accent);
          color: #07101f; font-weight: 700;
        }

        /* ── Toolbar ── */
        .ab-toolbar {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.4rem; flex-wrap: wrap; gap: 0.75rem;
        }
        .ab-toolbar-left { display: flex; align-items: center; gap: 0.75rem; }
        .ab-section-label {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 1.1rem; color: var(--text);
        }
        .ab-count { font-size: 0.8rem; color: var(--text2); }
        .ab-view-toggle { display: flex; gap: 0.3rem; }
        .ab-view-btn {
          background: var(--bg2); border: 1px solid var(--border);
          color: var(--text2); width: 34px; height: 34px;
          border-radius: 8px; cursor: pointer; font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
          transition: border-color 0.18s, color 0.18s, background 0.18s;
          will-change: transform;
        }
        .ab-view-btn:hover, .ab-view-btn.active {
          border-color: var(--accent); color: var(--accent); background: var(--accent-glow);
        }

        /* ── Grid ── */
        .ab-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 1.2rem;
        }

        /* ── Card ── transform handled by Framer Motion */
        .ab-card {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 14px; overflow: hidden;
          transition: border-color 0.22s, box-shadow 0.22s;
          will-change: transform;
          cursor: pointer;
        }
        .ab-card:hover {
          border-color: var(--accent);
          box-shadow: 0 8px 32px var(--accent-glow);
        }
        .ab-card.ab-playing {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent), 0 8px 28px var(--accent-glow);
        }
        .ab-art-wrap {
          position: relative; aspect-ratio: 1;
          overflow: hidden; background: var(--bg);
        }
        .ab-art-wrap img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.38s ease;
        }
        .ab-card:hover .ab-art-wrap img { transform: scale(1.07); }
        .ab-overlay {
          position: absolute; inset: 0;
          background: rgba(7,16,31,0.58);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.22s;
        }
        .ab-card:hover .ab-overlay { opacity: 1; }
        .ab-preview-btn {
          background: var(--accent); border: none; color: #07101f;
          font-family: 'Outfit', sans-serif; font-size: 0.78rem; font-weight: 700;
          padding: 0.5rem 1.2rem; border-radius: 2rem; cursor: pointer;
          text-decoration: none; display: inline-block;
          box-shadow: 0 4px 16px rgba(0,0,0,0.38);
        }
        .ab-year-badge {
          position: absolute; top: 8px; right: 8px;
          background: rgba(7,16,31,0.8); color: var(--text2);
          font-size: 0.65rem; font-weight: 600; padding: 0.18rem 0.55rem;
          border-radius: 2rem; border: 1px solid var(--border);
        }
        .ab-now-playing {
          position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
          background: rgba(7,16,31,0.88); border: 1px solid var(--accent);
          border-radius: 2rem; padding: 0.25rem 0.75rem;
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.65rem; color: var(--accent); font-weight: 600;
          white-space: nowrap;
        }
        .ab-wave { display: flex; align-items: flex-end; gap: 2px; height: 14px; }
        .ab-wave span {
          display: block; width: 3px; background: var(--accent);
          border-radius: 2px; animation: abWave 0.7s ease-in-out infinite alternate;
        }
        .ab-wave span:nth-child(1) { height: 6px;  animation-delay: 0s;    }
        .ab-wave span:nth-child(2) { height: 12px; animation-delay: 0.12s; }
        .ab-wave span:nth-child(3) { height: 8px;  animation-delay: 0.24s; }
        .ab-wave span:nth-child(4) { height: 14px; animation-delay: 0.36s; }
        .ab-wave span:nth-child(5) { height: 5px;  animation-delay: 0.48s; }
        @keyframes abWave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1);   }
        }

        /* ── Card body ── */
        .ab-body { padding: 0.9rem; }
        .ab-title {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.86rem;
          color: var(--text); line-height: 1.3; margin-bottom: 0.2rem;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .ab-author {
          font-size: 0.74rem; color: var(--text2); margin-bottom: 0.45rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .ab-stars { display: flex; align-items: center; gap: 1px; margin-bottom: 0.45rem; }
        .ab-star { font-size: 0.7rem; color: var(--border); }
        .ab-star.filled { color: var(--accent); }
        .ab-rating-num { font-size: 0.68rem; color: var(--text2); margin-left: 0.3rem; font-weight: 600; }
        .ab-meta-row {
          display: flex; align-items: center; gap: 0.5rem;
          flex-wrap: wrap; margin-bottom: 0.5rem;
        }
        .ab-genre-tag {
          font-size: 0.64rem; font-weight: 600;
          background: var(--accent-glow); color: var(--accent);
          border: 1px solid rgba(245,197,66,0.25);
          padding: 0.14rem 0.5rem; border-radius: 2rem;
        }
        .ab-duration { font-size: 0.66rem; color: var(--text2); }
        .ab-listen-btn {
          display: inline-block; font-size: 0.71rem; font-weight: 600;
          color: var(--accent); text-decoration: none;
          font-family: 'Outfit', sans-serif; transition: letter-spacing 0.18s;
        }
        .ab-listen-btn:hover { letter-spacing: 0.06em; }

        /* ── List view ── */
        .ab-list { display: flex; flex-direction: column; gap: 0.6rem; }
        .ab-list-item {
          display: flex; align-items: center; gap: 1rem;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 12px; padding: 0.85rem 1.1rem;
          transition: border-color 0.2s; will-change: transform;
        }
        .ab-list-item:hover { border-color: var(--accent); }
        .ab-list-item.playing { border-color: var(--accent); background: var(--accent-glow); }
        .ab-list-art { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
        .ab-list-info { flex: 1; min-width: 0; }
        .ab-list-title {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 0.9rem; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-bottom: 0.15rem;
        }
        .ab-list-author { font-size: 0.76rem; color: var(--text2); margin-bottom: 0.3rem; }
        .ab-list-meta { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .ab-list-dur { font-size: 0.72rem; color: var(--text2); }
        .ab-list-actions { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }
        .ab-list-play {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--bg); border: 1px solid var(--border);
          color: var(--text2); cursor: pointer; font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.18s, border-color 0.18s, color 0.18s;
          will-change: transform;
        }
        .ab-list-play:hover, .ab-list-play.active {
          background: var(--accent); border-color: var(--accent); color: #07101f;
        }
        .ab-list-open {
          font-size: 0.76rem; font-weight: 600; color: var(--accent);
          text-decoration: none; border: 1px solid rgba(245,197,66,0.3);
          padding: 0.28rem 0.8rem; border-radius: 2rem; transition: background 0.18s;
        }
        .ab-list-open:hover { background: var(--accent-glow); }

        /* ── Skeletons ── */
        .ab-skel-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 1.2rem;
        }
        .ab-skel-list { display: flex; flex-direction: column; gap: 0.6rem; }
        .ab-skel {
          border-radius: 14px; aspect-ratio: 0.72;
          background: linear-gradient(90deg,
            var(--bg2) 25%, var(--border) 50%, var(--bg2) 75%);
          background-size: 200% 100%;
          animation: abShimmer 1.4s ease-in-out infinite;
        }
        .ab-skel--row { aspect-ratio: unset; height: 80px; border-radius: 12px; }
        @keyframes abShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── State box ── */
        .ab-state-box {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 1rem; padding: 5rem 0;
          color: var(--text2); text-align: center;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .ab-grid, .ab-skel-grid { grid-template-columns: repeat(3, 1fr); gap: 0.9rem; }
        }
        @media (max-width: 600px) {
          .ab-grid, .ab-skel-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .ab-list-meta { display: none; }
          .ab-hero { padding: calc(var(--nav-h, 64px) + 1.5rem) 0 2.5rem; }
        }
        @media (max-width: 400px) {
          .ab-grid, .ab-skel-grid { grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
        }
      `}</style>
    </motion.div>
  );
}
