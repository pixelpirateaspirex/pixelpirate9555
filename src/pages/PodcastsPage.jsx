// src/pages/PodcastsPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Constants ────────────────────────────────────────────────────────────────
const GENRES = [
  { label: 'All',          term: 'top podcasts'  },
  { label: 'True Crime',   term: 'true crime'    },
  { label: 'Tech',         term: 'technology'    },
  { label: 'Comedy',       term: 'comedy'        },
  { label: 'Business',     term: 'business'      },
  { label: 'Science',      term: 'science'       },
  { label: 'History',      term: 'history'       },
  { label: 'Sports',       term: 'sports'        },
  { label: 'Education',    term: 'education'     },
  { label: 'Music',        term: 'music'         },
  { label: 'News',         term: 'news'          },
  { label: 'Storytelling', term: 'storytelling'  },
];

const PH = 'https://placehold.co/300x300/07101f/f5c542?text=🎙️';

// ─── API (unchanged) ──────────────────────────────────────────────────────────
async function fetchPodcasts(term, limit = 20) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=podcast&entity=podcast&limit=${limit}&country=us`;
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
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.12 } },
};
const pillV = {
  hidden:  { opacity: 0, scale: 0.72, y: 8 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.3, ease: 'backOut' } },
};

const gridV = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.055, delayChildren: 0.05 } },
};
const cardV = {
  hidden:  { opacity: 0, y: 22, scale: 0.93 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.44, ease: SPRING } },
  exit:    { opacity: 0, scale: 0.9,         transition: { duration: 0.18 } },
};

const headerBarV = {
  hidden:  { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut', delay: 0.2 } },
};

const stateV = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.4, ease: SPRING } },
  exit:    { opacity: 0,         transition: { duration: 0.2 } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function PodcastCard({ pod, onPlay, isPlaying }) {
  const art = pod.artworkUrl600 || pod.artworkUrl100 || PH;

  return (
    <motion.div
      className={`pc-card${isPlaying ? ' pc-playing' : ''}`}
      variants={cardV}
      whileHover={{ y: -6, transition: { duration: 0.22, ease: 'easeOut' } }}
      whileTap={{ scale: 0.97, transition: { duration: 0.12 } }}
      layout
    >
      <div className="pc-art-wrap">
        <img
          src={art}
          alt={pod.collectionName}
          loading="lazy"
          onError={e => { e.target.src = PH; }}
        />
        <div className="pc-overlay">
          <motion.button
            className="pc-play-btn"
            onClick={() => onPlay(pod)}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? '⏸' : '▶'}
          </motion.button>
        </div>

        {isPlaying && (
          <div className="pc-playing-bar">
            <span/><span/><span/><span/>
          </div>
        )}

        {/* Episode count badge */}
        {pod.trackCount && (
          <div className="pc-count-badge">{pod.trackCount} eps</div>
        )}
      </div>

      <div className="pc-body">
        <div className="pc-name">{pod.collectionName || pod.trackName}</div>
        <div className="pc-author">{pod.artistName}</div>
        <div className="pc-meta-row">
          {pod.primaryGenreName && (
            <span className="pc-genre-badge">{pod.primaryGenreName}</span>
          )}
        </div>
        <a
          href={pod.collectionViewUrl || pod.trackViewUrl}
          target="_blank" rel="noopener noreferrer"
          className="pc-open-btn"
        >
          Open in Podcasts →
        </a>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PodcastsPage() {
  const [query,     setQuery]     = useState('');
  const [genre,     setGenre]     = useState(GENRES[0]);
  const [podcasts,  setPodcasts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [playingId, setPlayingId] = useState(null);
  const debounceRef = useRef(null);

  // ── Data fetching (unchanged) ──
  const load = useCallback(async (term) => {
    setLoading(true); setError('');
    try {
      const results = await fetchPodcasts(term, 20);
      setPodcasts(results);
    } catch {
      setError('Failed to load podcasts. Please try again.');
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

  const handlePlay = (pod) => {
    if (playingId === pod.collectionId) { setPlayingId(null); return; }
    setPlayingId(pod.collectionId);
    setTimeout(() => {
      window.open(pod.collectionViewUrl || pod.trackViewUrl, '_blank');
      setPlayingId(null);
    }, 500);
  };

  const handleGenre  = g  => { setGenre(g); setQuery(''); setPlayingId(null); };
  const handleSearch = e  => { e.preventDefault(); if (query.trim()) load(query); };

  const contentKey = loading ? 'loading' : error ? 'error' : podcasts.length === 0
    ? 'empty'
    : `pods-${genre.label}-${query}`;

  return (
    <motion.div
      className="pods-page"
      variants={pageV}
      initial="hidden"
      animate="visible"
      exit="exit"
    >

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="pods-hero">
        <div className="pods-hero-bg" aria-hidden>
          <div className="pods-glow pods-glow-1" />
          <div className="pods-glow pods-glow-2" />
          <div className="pods-grid-pattern" />
        </div>

        <motion.div
          className="pods-hero-inner"
          variants={heroContainerV}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="pods-badge" variants={heroItemV}>
            🎙️ Pixel Pirates Podcasts
          </motion.div>

          <motion.h1 className="pods-title" variants={heroItemV}>
            Listen to the <span className="pods-accent">World</span>
          </motion.h1>

          <motion.p className="pods-subtitle" variants={heroItemV}>
            Explore thousands of podcasts — true crime, tech, comedy, science &amp; more.
          </motion.p>

          <motion.form
            className="pods-search-form"
            onSubmit={handleSearch}
            variants={heroItemV}
          >
            <input
              className="pods-search-input"
              type="text"
              placeholder="Search podcasts, topics, hosts…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <motion.button
              type="submit"
              className="pods-search-btn"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Search
            </motion.button>
          </motion.form>
        </motion.div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="pods-container">

        {/* Genre pills */}
        <motion.div
          className="pods-genres"
          variants={pillsV}
          initial="hidden"
          animate="visible"
        >
          {GENRES.map(g => (
            <motion.button
              key={g.label}
              className={`pods-genre-pill${genre.label === g.label && !query ? ' active' : ''}`}
              onClick={() => handleGenre(g)}
              variants={pillV}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.93 }}
            >
              {g.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Results header */}
        <motion.div
          className="pods-results-header"
          variants={headerBarV}
          initial="hidden"
          animate="visible"
        >
          <span className="pods-results-label">
            {query ? `Results for "${query}"` : genre.label}
          </span>
          <AnimatePresence mode="wait">
            {!loading && (
              <motion.span
                key={podcasts.length}
                className="pods-results-count"
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {podcasts.length} podcasts
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Content — AnimatePresence for smooth state transitions */}
        <AnimatePresence mode="wait">

          {loading ? (
            <motion.div
              key="skeleton"
              className="pods-skeleton-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="pods-skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.045 }}
                />
              ))}
            </motion.div>

          ) : error ? (
            <motion.div
              key="error"
              className="pods-state-box"
              variants={stateV}
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

          ) : podcasts.length === 0 ? (
            <motion.div
              key="empty"
              className="pods-state-box"
              variants={stateV}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.div
                style={{ fontSize: '3.5rem' }}
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ duration: 1.2, delay: 0.3, repeat: Infinity, repeatDelay: 3 }}
              >
                🎙️
              </motion.div>
              <p>No podcasts found. Try a different search.</p>
            </motion.div>

          ) : (
            <motion.div
              key={contentKey}
              className="pods-grid"
              variants={gridV}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {podcasts.map(pod => (
                <PodcastCard
                  key={pod.collectionId || pod.trackId}
                  pod={pod}
                  onPlay={handlePlay}
                  isPlaying={playingId === pod.collectionId}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Styles ──────────────────────────────────────────────────── */}
      <style>{`
        /* ── Base ── */
        .pods-page {
          min-height: 100vh;
          padding-bottom: 5rem;
          background: var(--bg);
          position: relative;
        }

        /* ── Hero ── */
        .pods-hero {
          position: relative; overflow: hidden;
          background: var(--bg);
          padding: calc(var(--nav-h, 64px) + 3rem) 0 3.5rem;
          text-align: center; z-index: 1;
        }
        .pods-hero-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        .pods-glow {
          position: absolute; border-radius: 50%;
          filter: blur(90px); pointer-events: none;
        }
        .pods-glow-1 {
          width: 700px; height: 420px;
          top: -120px; left: 50%; transform: translateX(-50%);
          background: radial-gradient(circle, rgba(245,197,66,0.09), transparent 70%);
          animation: podsPulse1 6s ease-in-out infinite alternate;
        }
        .pods-glow-2 {
          width: 400px; height: 300px; bottom: 0; right: -80px;
          background: radial-gradient(circle, rgba(99,102,241,0.07), transparent 70%);
          animation: podsPulse2 8s ease-in-out infinite alternate-reverse;
        }
        @keyframes podsPulse1 {
          from { opacity: 0.6; transform: translateX(-50%) scale(1); }
          to   { opacity: 1;   transform: translateX(-50%) scale(1.1); }
        }
        @keyframes podsPulse2 {
          from { opacity: 0.5; transform: scale(1); }
          to   { opacity: 1;   transform: scale(1.12); }
        }
        .pods-grid-pattern {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(var(--border) 1px, transparent 1px),
            linear-gradient(90deg, var(--border) 1px, transparent 1px);
          background-size: 50px 50px; opacity: 0.25;
        }
        .pods-hero-inner { position: relative; z-index: 1; padding: 0 1rem; }

        .pods-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          background: var(--accent-glow); border: 1px solid rgba(245,197,66,0.25);
          color: var(--accent); padding: 0.35rem 1rem; border-radius: 2rem;
          font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em;
          margin-bottom: 1.2rem;
        }
        .pods-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 5.5vw, 3.8rem);
          font-weight: 900; letter-spacing: -0.02em;
          color: var(--text); margin: 0 0 0.7rem;
        }
        .pods-accent {
          background: linear-gradient(110deg, var(--accent) 30%, #ffd97a);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .pods-subtitle {
          font-size: clamp(0.85rem, 1.5vw, 1rem);
          color: var(--text2); margin: 0 0 2rem; line-height: 1.65;
          max-width: 520px; margin-left: auto; margin-right: auto;
        }
        .pods-search-form {
          display: flex; max-width: 520px; margin: 0 auto;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 3rem; overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .pods-search-form:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .pods-search-input {
          flex: 1; background: none; border: none; outline: none;
          padding: 0.85rem 1.25rem; font-family: 'Outfit', sans-serif;
          font-size: 0.9rem; color: var(--text);
        }
        .pods-search-input::placeholder { color: var(--text2); }
        .pods-search-btn {
          background: var(--accent); border: none; color: #07101f;
          font-family: 'Outfit', sans-serif; font-weight: 700;
          font-size: 0.85rem; padding: 0 1.4rem; cursor: pointer;
          transition: background 0.2s; white-space: nowrap;
        }
        .pods-search-btn:hover { background: var(--accent-dk, #d4a017); }

        /* ── Container ── */
        .pods-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

        /* ── Genre pills ── */
        .pods-genres { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 2rem 0 1.5rem; }
        .pods-genre-pill {
          background: var(--bg2); border: 1px solid var(--border);
          color: var(--text2); font-family: 'Outfit', sans-serif;
          font-size: 0.8rem; font-weight: 500; padding: 0.38rem 1rem;
          border-radius: 2rem; cursor: pointer;
          transition: border-color 0.18s, color 0.18s, background 0.18s;
          white-space: nowrap; will-change: transform;
        }
        .pods-genre-pill:hover { border-color: var(--accent); color: var(--accent); }
        .pods-genre-pill.active {
          background: var(--accent); border-color: var(--accent);
          color: #07101f; font-weight: 700;
        }

        /* ── Results header ── */
        .pods-results-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 1.4rem; gap: 0.75rem;
        }
        .pods-results-label {
          font-family: 'Syne', sans-serif; font-weight: 700;
          font-size: 1.1rem; color: var(--text);
        }
        .pods-results-count { font-size: 0.8rem; color: var(--text2); }

        /* ── Grid ── */
        .pods-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.2rem;
        }

        /* ── Card — transform handled by Framer Motion ── */
        .pc-card {
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 14px; overflow: hidden;
          transition: border-color 0.22s, box-shadow 0.22s;
          will-change: transform; cursor: pointer;
        }
        .pc-card:hover {
          border-color: var(--accent);
          box-shadow: 0 8px 32px var(--accent-glow);
        }
        .pc-card.pc-playing {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent), 0 8px 28px var(--accent-glow);
        }
        .pc-art-wrap {
          position: relative; aspect-ratio: 1;
          overflow: hidden; background: var(--bg);
        }
        .pc-art-wrap img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.38s ease, filter 0.38s ease;
          filter: brightness(0.95);
        }
        .pc-card:hover .pc-art-wrap img { transform: scale(1.07); filter: brightness(1); }
        .pc-overlay {
          position: absolute; inset: 0;
          background: rgba(7,16,31,0.52);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.22s;
        }
        .pc-card:hover .pc-overlay { opacity: 1; }
        .pc-play-btn {
          width: 52px; height: 52px; border-radius: 50%;
          background: var(--accent); border: none; color: #07101f;
          font-size: 1.3rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          will-change: transform;
        }

        /* Animated playing bars */
        .pc-playing-bar {
          position: absolute; bottom: 10px; left: 50%;
          transform: translateX(-50%);
          display: flex; align-items: flex-end; gap: 3px; height: 18px;
        }
        .pc-playing-bar span {
          display: block; width: 3px; background: var(--accent);
          border-radius: 2px;
          animation: pcBar 0.8s ease-in-out infinite alternate;
        }
        .pc-playing-bar span:nth-child(1) { height: 8px;  animation-delay: 0s;    }
        .pc-playing-bar span:nth-child(2) { height: 16px; animation-delay: 0.15s; }
        .pc-playing-bar span:nth-child(3) { height: 11px; animation-delay: 0.3s;  }
        .pc-playing-bar span:nth-child(4) { height: 6px;  animation-delay: 0.45s; }
        @keyframes pcBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }

        /* Episode count badge */
        .pc-count-badge {
          position: absolute; top: 8px; left: 8px;
          background: rgba(7,16,31,0.82); color: var(--text2);
          font-size: 0.62rem; font-weight: 600; padding: 0.18rem 0.55rem;
          border-radius: 2rem; border: 1px solid var(--border);
        }

        /* ── Card body ── */
        .pc-body { padding: 0.9rem; }
        .pc-name {
          font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.88rem;
          color: var(--text); line-height: 1.3; margin-bottom: 0.25rem;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        .pc-author {
          font-size: 0.76rem; color: var(--text2); margin-bottom: 0.55rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pc-meta-row {
          display: flex; align-items: center; gap: 0.5rem;
          flex-wrap: wrap; margin-bottom: 0.7rem;
        }
        .pc-genre-badge {
          font-size: 0.65rem; font-weight: 600;
          background: var(--accent-glow); color: var(--accent);
          border: 1px solid rgba(245,197,66,0.25);
          padding: 0.15rem 0.55rem; border-radius: 2rem;
        }
        .pc-open-btn {
          display: inline-block; font-size: 0.72rem; font-weight: 600;
          color: var(--accent); text-decoration: none;
          font-family: 'Outfit', sans-serif; transition: letter-spacing 0.18s;
        }
        .pc-open-btn:hover { letter-spacing: 0.05em; }

        /* ── Skeletons ── */
        .pods-skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1.2rem;
        }
        .pods-skeleton {
          border-radius: 14px; aspect-ratio: 0.75;
          background: linear-gradient(90deg,
            var(--bg2) 25%, var(--border) 50%, var(--bg2) 75%);
          background-size: 200% 100%;
          animation: pcShimmer 1.4s ease-in-out infinite;
        }
        @keyframes pcShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── State box ── */
        .pods-state-box {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 1rem; padding: 5rem 0;
          color: var(--text2); text-align: center;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .pods-grid, .pods-skeleton-grid { grid-template-columns: repeat(3, 1fr); gap: 0.9rem; }
          .pods-hero { padding: calc(var(--nav-h, 64px) + 2rem) 0 3rem; }
        }
        @media (max-width: 600px) {
          .pods-grid, .pods-skeleton-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .pods-hero { padding: calc(var(--nav-h, 64px) + 1.5rem) 0 2.5rem; }
        }
        @media (max-width: 400px) {
          .pods-grid, .pods-skeleton-grid { grid-template-columns: repeat(2, 1fr); gap: 0.6rem; }
        }
      `}</style>
    </motion.div>
  );
}
