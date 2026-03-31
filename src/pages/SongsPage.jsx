// src/pages/SongsPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLists } from '../context/ListsContext';
import { useToast } from '../context/ToastContext';
import { useAuth }  from '../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const ITUNES  = 'https://itunes.apple.com/search';
const PH_SONG = 'https://placehold.co/300x300/0f1a2e/f5c542?text=%E2%99%AA';

const GENRES = [
  { value: 'pop hits',   label: 'Pop'        },
  { value: 'bollywood',  label: 'Bollywood'  },
  { value: 'rock',       label: 'Rock'       },
  { value: 'hip hop',    label: 'Hip Hop'    },
  { value: 'electronic', label: 'Electronic' },
  { value: 'jazz',       label: 'Jazz'       },
  { value: 'k-pop',      label: 'K-Pop'      },
  { value: 'lo-fi',      label: 'Lo-Fi'      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtMs(ms) {
  if (!ms) return '';
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ─── Framer Motion Variants ───────────────────────────────────────────────────
const SPRING = [0.22, 1, 0.36, 1];

const pageV = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

const headerV = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const headerItemV = {
  hidden:  { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.5, ease: SPRING } },
};

const pillsV = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.1 } },
};
const pillV = {
  hidden:  { opacity: 0, scale: 0.72, y: 8 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.3, ease: 'backOut' } },
};

const gridV = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05 } },
};
const songCardV = {
  hidden:  { opacity: 0, y: 20, scale: 0.93 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.4, ease: SPRING } },
  exit:    { opacity: 0, scale: 0.9,         transition: { duration: 0.15 } },
};

const npBarV = {
  hidden:  { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,   transition: { duration: 0.4, ease: SPRING } },
  exit:    { opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.22 } },
};

const stateV = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.38, ease: SPRING } },
  exit:    { opacity: 0,         transition: { duration: 0.18 } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function Waveform({ playing }) {
  return (
    <div className={`sp-waveform${playing ? ' sp-wv-playing' : ''}`}>
      {[5, 14, 9, 18, 7].map((h, i) => (
        <span key={i} style={{ height: `${h}px` }} />
      ))}
    </div>
  );
}

function SongCard({ track, isPlaying, onPlay }) {
  const art        = (track.artworkUrl100 || PH_SONG).replace('100x100bb', '300x300bb');
  const hasPreview = !!track.previewUrl;

  return (
    <motion.div
      className={`sp-card card${isPlaying ? ' sp-is-playing' : ''}`}
      variants={songCardV}
      whileHover={{ y: -6, transition: { duration: 0.2, ease: 'easeOut' } }}
      whileTap={{ scale: 0.96 }}
      onClick={() => hasPreview && onPlay(track)}
    >
      <div className="sp-thumb">
        <img
          src={art}
          alt={track.trackName}
          loading="lazy"
          onError={e => { e.target.src = PH_SONG; }}
        />
        <div className="sp-overlay">
          <motion.button
            className="sp-play-btn"
            onClick={e => { e.stopPropagation(); hasPreview && onPlay(track); }}
            title={hasPreview ? (isPlaying ? 'Pause' : 'Play') : 'No preview'}
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.9 }}
          >
            {!hasPreview ? '🚫' : isPlaying ? '⏸' : '▶'}
          </motion.button>
        </div>
        {!hasPreview && <div className="sp-no-preview">No preview</div>}

        {/* Animated border ring when playing */}
        {isPlaying && <div className="sp-ring" />}
      </div>

      <div className="sp-body">
        <div className="sp-title">{track.trackName || 'Unknown'}</div>
        <div className="sp-artist">{track.artistName || ''}</div>
        <div className="sp-album">{track.collectionName || ''}</div>
        <div className="sp-foot">
          <Waveform playing={isPlaying} />
          {track.trackTimeMillis && (
            <span className="sp-dur">{fmtMs(track.trackTimeMillis)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SongsPage() {
  const { isLoggedIn } = useAuth();
  const { trackSong  } = useLists();
  const { info       } = useToast();

  const [query,    setQuery]    = useState('');
  const [genre,    setGenre]    = useState('pop hits');
  const [tracks,   setTracks]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [nowTrack, setNowTrack] = useState(null);
  const [playing,  setPlaying]  = useState(false);

  const audioRef = useRef(new Audio());

  // ── Data fetching (unchanged) ──
  const searchSongs = useCallback(async (q, g) => {
    const term = q.trim() || g || 'pop hits';
    const cKey = `pp_cache_songs_${term.toLowerCase().replace(/\s+/g, '_')}`;
    setLoading(true);
    try {
      const cached = (() => {
        const c = localStorage.getItem(cKey);
        if (c) { const p = JSON.parse(c); if (Date.now() - p.t < 60 * 60 * 1000) return p.v; }
        return null;
      })();
      if (cached) { setTracks(cached); setLoading(false); return; }

      const r = await fetch(
        `${ITUNES}?term=${encodeURIComponent(term)}&entity=song&media=music&limit=24&explicit=No`
      );
      const d     = await r.json();
      const items = d.results || [];
      try { localStorage.setItem(cKey, JSON.stringify({ v: items, t: Date.now() })); } catch {}
      setTracks(items);
    } catch {
      setTracks([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { searchSongs(query, genre); }, [genre]); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(() => { if (query.trim()) searchSongs(query, genre); }, 450);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line

  // ── Audio events (unchanged) ──
  useEffect(() => {
    const audio   = audioRef.current;
    const onEnd   = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    const onPlay  = () => setPlaying(true);
    audio.addEventListener('ended',  onEnd);
    audio.addEventListener('pause',  onPause);
    audio.addEventListener('play',   onPlay);
    return () => {
      audio.removeEventListener('ended',  onEnd);
      audio.removeEventListener('pause',  onPause);
      audio.removeEventListener('play',   onPlay);
      audio.pause();
    };
  }, []);

  const handlePlay = useCallback((track) => {
    const audio = audioRef.current;
    if (nowTrack?.trackId === track.trackId) {
      audio.paused ? audio.play() : audio.pause();
      return;
    }
    audio.pause();
    audio.src = track.previewUrl;
    audio.play().catch(e => info('Playback blocked: ' + e.message));
    setNowTrack(track);
    if (isLoggedIn) {
      trackSong({
        trackId:    track.trackId   || Date.now(),
        title:      track.trackName || 'Unknown',
        artist:     track.artistName || '',
        album:      track.collectionName || '',
        art:        (track.artworkUrl100 || PH_SONG).replace('100x100bb', '300x300bb'),
        genre:      track.primaryGenreName || 'Music',
        previewUrl: track.previewUrl || '',
      });
    }
  }, [nowTrack, isLoggedIn, trackSong, info]);

  const stopAudio = () => {
    audioRef.current.pause();
    audioRef.current.src = '';
    setNowTrack(null);
    setPlaying(false);
  };

  const nowArt = nowTrack
    ? (nowTrack.artworkUrl100 || PH_SONG).replace('100x100bb', '300x300bb')
    : PH_SONG;

  // Grid content key for AnimatePresence re-mount
  const contentKey = loading ? 'loading' : tracks.length === 0 ? 'empty' : `tracks-${genre}-${query}`;

  return (
    <motion.div
      className="sp-page page-pad"
      variants={pageV}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="sp-container">

        {/* ── Page Header ── */}
        <motion.div
          className="sp-header"
          variants={headerV}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="sp-section-title" variants={headerItemV}>
            <span className="sp-icon">🎵</span> Songs
          </motion.div>

          {/* Search row */}
          <motion.div className="sp-filter-row" variants={headerItemV}>
            <input
              className="sp-search-input"
              type="text"
              placeholder="Search songs, artists…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <motion.button
              className="btn btn-primary sp-search-btn"
              onClick={() => searchSongs(query, genre)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔍 Search
            </motion.button>
          </motion.div>

          {/* Genre pills */}
          <motion.div className="sp-genre-pills" variants={pillsV}>
            {GENRES.map(g => (
              <motion.button
                key={g.value}
                className={`sp-pill${genre === g.value ? ' active' : ''}`}
                onClick={() => {
                  setGenre(g.value);
                  if (!query.trim()) searchSongs('', g.value);
                }}
                variants={pillV}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.93 }}
              >
                {g.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Now Playing bar ── */}
        <AnimatePresence>
          {nowTrack && (
            <motion.div
              className="sp-np-bar"
              variants={npBarV}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.img
                className="sp-np-art"
                src={nowArt}
                alt={nowTrack.trackName}
                onError={e => { e.target.src = PH_SONG; }}
                animate={playing ? { scale: [1, 1.04, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="sp-np-info">
                <div className="sp-np-label">▶ NOW PLAYING</div>
                <div className="sp-np-title">{nowTrack.trackName}</div>
                <div className="sp-np-artist">{nowTrack.artistName}</div>
              </div>
              <div className="sp-np-ctrl">
                <motion.button
                  className="sp-np-btn"
                  onClick={() => handlePlay(nowTrack)}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.88 }}
                >
                  {playing ? '⏸' : '▶'}
                </motion.button>
                <motion.button
                  className="sp-np-btn sp-np-stop"
                  onClick={stopAudio}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ⏹
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Song Grid ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className="sp-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="sp-skel"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                />
              ))}
            </motion.div>

          ) : tracks.length === 0 ? (
            <motion.div
              key="empty"
              className="sp-state-box"
              variants={stateV}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <motion.span
                style={{ fontSize: '2.5rem' }}
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 1.5, delay: 0.3, repeat: Infinity, repeatDelay: 3 }}
              >
                🎵
              </motion.span>
              <span>No songs found. Try a different search.</span>
            </motion.div>

          ) : (
            <motion.div
              key={contentKey}
              className="sp-grid"
              variants={gridV}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              {tracks.map(t => (
                <SongCard
                  key={t.trackId || t.trackName}
                  track={t}
                  isPlaying={nowTrack?.trackId === t.trackId && playing}
                  onPlay={handlePlay}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Styles ──────────────────────────────────────────────────── */}
      <style>{`
        /* ── Base ── */
        .sp-page {
          min-height: 100vh;
          background: var(--bg);
          padding-bottom: 5rem;
        }
        .sp-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: calc(var(--nav-h, 64px) + 2rem) 1.5rem 0;
        }

        /* ── Header ── */
        .sp-header { margin-bottom: 1.75rem; }
        .sp-section-title {
          display: flex; align-items: center; gap: 0.5rem;
          font-family: 'Syne', sans-serif; font-size: clamp(1.6rem, 3.5vw, 2.2rem);
          font-weight: 900; color: var(--text); margin-bottom: 1.4rem;
          letter-spacing: -0.02em;
        }
        .sp-icon { font-size: 1.4em; line-height: 1; }

        /* ── Search row ── */
        .sp-filter-row {
          display: flex; gap: 0.75rem; flex-wrap: wrap;
          align-items: center; margin-bottom: 1.25rem;
        }
        .sp-search-input {
          flex: 1; min-width: 200px;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 2rem; padding: 0.7rem 1.2rem;
          font-family: 'Outfit', sans-serif; font-size: 0.9rem;
          color: var(--text); outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .sp-search-input::placeholder { color: var(--text2); }
        .sp-search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .sp-search-btn { border-radius: 2rem; white-space: nowrap; }

        /* ── Genre pills ── */
        .sp-genre-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .sp-pill {
          padding: 0.45rem 1.1rem; border-radius: 999px;
          border: 1.5px solid var(--border);
          background: transparent; color: var(--text2);
          font-size: 0.85rem; font-weight: 500;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
          white-space: nowrap; will-change: transform;
        }
        .sp-pill:hover { border-color: var(--accent); color: var(--text); }
        .sp-pill.active {
          background: var(--accent); border-color: var(--accent);
          color: #07101f; font-weight: 700;
        }

        /* ── Now Playing bar ── */
        .sp-np-bar {
          display: flex; align-items: center; gap: 0.9rem;
          background: linear-gradient(90deg, rgba(245,197,66,0.07), var(--bg2));
          border: 1px solid rgba(245,197,66,0.22);
          border-radius: var(--card-radius, 12px);
          padding: 0.75rem 1.1rem; margin-bottom: 1.4rem;
          backdrop-filter: blur(8px);
        }
        .sp-np-art {
          width: 46px; height: 46px; border-radius: 8px;
          object-fit: cover; flex-shrink: 0;
          border: 1px solid rgba(245,197,66,0.22);
          will-change: transform;
        }
        .sp-np-info { flex: 1; min-width: 0; }
        .sp-np-label {
          font-size: 0.6rem; color: var(--accent);
          text-transform: uppercase; letter-spacing: 0.07em;
          font-weight: 700;
        }
        .sp-np-title {
          font-weight: 700; font-size: 0.88rem;
          font-family: 'Syne', sans-serif;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .sp-np-artist { font-size: 0.72rem; color: var(--text2); }
        .sp-np-ctrl { display: flex; gap: 0.4rem; }
        .sp-np-btn {
          width: 2rem; height: 2rem; border-radius: 50%;
          background: var(--accent); border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          color: #07101f; font-size: 0.9rem; flex-shrink: 0;
          will-change: transform;
        }
        .sp-np-stop {
          background: var(--bg2); color: var(--text2);
          border: 1px solid var(--border);
        }
        .sp-np-stop:hover { border-color: #ef4444; color: #ef4444; }

        /* ── Song Grid ── */
        .sp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
          gap: 1.2rem;
        }

        /* ── Song Card ── */
        .sp-card {
          overflow: hidden; cursor: pointer;
          background: var(--bg2); border: 1px solid var(--border);
          border-radius: 14px;
          transition: border-color 0.22s, box-shadow 0.22s;
          will-change: transform;
        }
        .sp-card.sp-is-playing {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(245,197,66,0.22);
        }
        .sp-card:hover {
          border-color: var(--accent);
          box-shadow: 0 8px 28px var(--accent-glow);
        }
        .sp-thumb { position: relative; overflow: hidden; }
        .sp-thumb img {
          width: 100%; aspect-ratio: 1/1; object-fit: cover; display: block;
          transition: transform 0.35s;
        }
        .sp-card:hover .sp-thumb img { transform: scale(1.07); }
        .sp-overlay {
          position: absolute; inset: 0;
          background: rgba(0,0,0,0.44);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
        }
        .sp-card:hover .sp-overlay,
        .sp-card.sp-is-playing .sp-overlay { opacity: 1; }
        .sp-play-btn {
          width: 3rem; height: 3rem; border-radius: 50%;
          background: var(--accent); border: none; cursor: pointer;
          font-size: 1.1rem; color: #07101f;
          display: flex; align-items: center; justify-content: center;
          will-change: transform;
        }
        .sp-no-preview {
          position: absolute; top: 0.5rem; right: 0.5rem;
          background: rgba(0,0,0,0.62); color: var(--text2);
          font-size: 0.58rem; padding: 0.15rem 0.4rem;
          border-radius: 2rem; backdrop-filter: blur(4px);
        }
        /* Playing ring pulse */
        .sp-ring {
          position: absolute; inset: 0;
          border: 2px solid var(--accent);
          border-radius: 0;
          animation: spRing 1.6s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes spRing {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }

        .sp-body { padding: 0.85rem; }
        .sp-title {
          font-weight: 700; font-size: 0.84rem;
          font-family: 'Syne', sans-serif; line-height: 1.3;
          margin-bottom: 0.18rem;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .sp-artist { font-size: 0.75rem; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sp-album  { font-size: 0.67rem; color: var(--text2); opacity: 0.6; margin-top: 0.1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .sp-foot   { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.65rem; }
        .sp-dur    { font-size: 0.67rem; color: var(--text2); flex-shrink: 0; }

        /* ── Waveform ── */
        .sp-waveform { display: flex; align-items: flex-end; gap: 2px; height: 22px; flex: 1; }
        .sp-waveform span {
          display: block; width: 3px; border-radius: 2px;
          background: var(--border); transition: height 0.3s, background 0.3s;
        }
        .sp-wv-playing span { background: var(--accent); }
        .sp-wv-playing span:nth-child(1) { animation: spWv 0.7s 0s    ease-in-out infinite alternate; }
        .sp-wv-playing span:nth-child(2) { animation: spWv 0.7s 0.12s ease-in-out infinite alternate; }
        .sp-wv-playing span:nth-child(3) { animation: spWv 0.7s 0.24s ease-in-out infinite alternate; }
        .sp-wv-playing span:nth-child(4) { animation: spWv 0.7s 0.08s ease-in-out infinite alternate; }
        .sp-wv-playing span:nth-child(5) { animation: spWv 0.7s 0.18s ease-in-out infinite alternate; }
        @keyframes spWv { from { height: 3px; } to { height: 20px; } }

        /* ── Skeletons ── */
        .sp-skel {
          border-radius: 14px; aspect-ratio: 0.72;
          background: linear-gradient(90deg,
            var(--bg2) 25%, var(--border) 50%, var(--bg2) 75%);
          background-size: 200% 100%;
          animation: spShimmer 1.4s ease-in-out infinite;
        }
        @keyframes spShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── State box ── */
        .sp-state-box {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 1rem; padding: 5rem 0;
          color: var(--text2); text-align: center;
          grid-column: 1 / -1;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .sp-grid { grid-template-columns: repeat(3, 1fr); gap: 0.9rem; }
          .sp-container { padding-top: calc(var(--nav-h, 64px) + 1.25rem); }
        }
        @media (max-width: 600px) {
          .sp-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .sp-np-bar { padding: 0.6rem 0.85rem; gap: 0.7rem; }
          .sp-filter-row { gap: 0.5rem; }
        }
        @media (max-width: 400px) {
          .sp-grid { grid-template-columns: repeat(2, 1fr); gap: 0.55rem; }
        }
      `}</style>
    </motion.div>
  );
}
