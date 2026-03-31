// src/pages/WelcomePage.jsx
// Shown ONCE after first login. Collects genre/content preferences.
// On completion → saves to /api/preferences → navigates to /recommendations.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../context/AuthContext';
import api             from '../utils/api';

// ── Static option data ────────────────────────────────────────────────────────
const CONTENT_TYPES = [
  { id: 'movies',     icon: '🎬', label: 'Movies' },
  { id: 'songs',      icon: '🎵', label: 'Songs' },
  { id: 'games',      icon: '🎮', label: 'Games' },
  { id: 'audiobooks', icon: '📚', label: 'Audiobooks' },
];

const MOVIE_GENRES = [
  'Action','Adventure','Animation','Comedy','Crime',
  'Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi','Thriller',
];
const MUSIC_GENRES = [
  'Pop','Rock','Hip-Hop','R&B','Electronic',
  'Dance','Jazz','Classical','Country','Indie','Metal','Folk',
];
const GAME_GENRES = [
  'Action','RPG','Strategy','Adventure','Sports',
  'Puzzle','Racing','Horror','Simulation','Fighting','Shooter','Platformer',
];
const AUDIOBOOK_DURATIONS = [
  { id: 'short',  label: 'Short',  sub: '< 5 hours' },
  { id: 'medium', label: 'Medium', sub: '5 – 10 hours' },
  { id: 'long',   label: 'Long',   sub: '10 – 20 hours' },
  { id: 'epic',   label: 'Epic',   sub: '20+ hours' },
];
const AUDIOBOOK_PRICES = [
  { id: 'free_low', label: 'Free / Low',  sub: '$0 – $5' },
  { id: 'budget',   label: 'Budget',      sub: '$5 – $15' },
  { id: 'premium',  label: 'Premium',     sub: '$15+' },
];
const LANGUAGES = ['English','Hindi','Spanish','French','German','Japanese'];

// ── Chip component ────────────────────────────────────────────────────────────
function Chip({ label, sub, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`wp-chip${selected ? ' wp-chip-on' : ''}`}
      aria-pressed={selected}
    >
      {label}
      {sub && <span className="wp-chip-sub">{sub}</span>}
      {selected && <span className="wp-chip-check">✓</span>}
    </button>
  );
}

// ── Big content-type card ─────────────────────────────────────────────────────
function TypeCard({ item, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`wp-type-card${selected ? ' wp-type-card-on' : ''}`}
      aria-pressed={selected}
    >
      <span className="wp-type-icon">{item.icon}</span>
      <span className="wp-type-label">{item.label}</span>
      {selected && <span className="wp-type-tick">✓</span>}
    </button>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  return (
    <div className="wp-progress-bar">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`wp-progress-seg${i < current ? ' wp-progress-done' : i === current ? ' wp-progress-active' : ''}`}
        />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function WelcomePage() {
  const { user, markOnboarded } = useAuth();
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [contentTypes,      setContentTypes]      = useState([]);
  const [movieGenres,       setMovieGenres]        = useState([]);
  const [musicGenres,       setMusicGenres]        = useState([]);
  const [gameGenres,        setGameGenres]         = useState([]);
  const [audiobookDuration, setAudiobookDuration]  = useState([]);
  const [audiobookPrice,    setAudiobookPrice]     = useState([]);
  const [language,          setLanguage]           = useState(['English']);

  // ── Wizard state ────────────────────────────────────────────────────────────
  const [step,        setStep]        = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [prefLoading, setPrefLoading] = useState(true);

  // ── Pre-load existing preferences (for returning users updating their profile)
  useEffect(() => {
    api.get('/preferences')
      .then(({ data }) => {
        const p = data.preferences;
        if (p) {
          if (p.contentTypes?.length)     setContentTypes(p.contentTypes);
          if (p.movieGenres?.length)       setMovieGenres(p.movieGenres);
          if (p.musicGenres?.length)       setMusicGenres(p.musicGenres);
          if (p.gameGenres?.length)        setGameGenres(p.gameGenres);
          if (p.audiobookDuration?.length) setAudiobookDuration(p.audiobookDuration);
          if (p.audiobookPrice?.length)    setAudiobookPrice(p.audiobookPrice);
          if (p.language?.length)          setLanguage(p.language);
        }
      })
      .catch(() => {}) // first-time users won't have preferences — that's fine
      .finally(() => setPrefLoading(false));
  }, []);

  // Build dynamic step list based on selected content types
  const steps = [
    { id: 'types',      title: 'What do you enjoy?',         desc: 'Pick everything that interests you.' },
    ...(contentTypes.includes('movies')     ? [{ id: 'movies',     title: 'Movie Genres',      desc: 'Select your favourite genres.' }] : []),
    ...(contentTypes.includes('songs')      ? [{ id: 'songs',      title: 'Music Genres',      desc: 'What beats move you?' }] : []),
    ...(contentTypes.includes('games')      ? [{ id: 'games',      title: 'Game Genres',       desc: 'How do you play?' }] : []),
    ...(contentTypes.includes('audiobooks') ? [{ id: 'audiobooks', title: 'Audiobook Prefs',   desc: 'Duration, budget, and language.' }] : []),
  ];
  const totalSteps   = steps.length;
  const currentStep  = steps[step];
  const isLastStep   = step === totalSteps - 1;

  // ── Toggle helpers ───────────────────────────────────────────────────────────
  const toggle = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);

  // ── Navigation ───────────────────────────────────────────────────────────────
  const handleNext = () => {
    setError('');
    if (step === 0 && !contentTypes.length) {
      setError('Please select at least one content type.');
      return;
    }
    if (!isLastStep) { setStep((s) => s + 1); return; }
    handleSubmit();
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(0, s - 1));
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');
    try {
      await api.post('/preferences', {
        contentTypes,
        movieGenres,
        musicGenres,
        gameGenres,
        audiobookDuration,
        audiobookPrice,
        language,
      });
      markOnboarded();          // update in-memory user so ProtectedRoute stops redirecting
      navigate('/recommendations', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
      setSaving(false);
    }
  };

  // ── Step content renderer ─────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep?.id) {
      case 'types':
        return (
          <div className="wp-type-grid">
            {CONTENT_TYPES.map((t) => (
              <TypeCard
                key={t.id}
                item={t}
                selected={contentTypes.includes(t.id)}
                onClick={() => toggle(contentTypes, setContentTypes, t.id)}
              />
            ))}
          </div>
        );

      case 'movies':
        return (
          <div className="wp-chip-grid">
            {MOVIE_GENRES.map((g) => (
              <Chip key={g} label={g} selected={movieGenres.includes(g)}
                onClick={() => toggle(movieGenres, setMovieGenres, g)} />
            ))}
          </div>
        );

      case 'songs':
        return (
          <div className="wp-chip-grid">
            {MUSIC_GENRES.map((g) => (
              <Chip key={g} label={g} selected={musicGenres.includes(g)}
                onClick={() => toggle(musicGenres, setMusicGenres, g)} />
            ))}
          </div>
        );

      case 'games':
        return (
          <div className="wp-chip-grid">
            {GAME_GENRES.map((g) => (
              <Chip key={g} label={g} selected={gameGenres.includes(g)}
                onClick={() => toggle(gameGenres, setGameGenres, g)} />
            ))}
          </div>
        );

      case 'audiobooks':
        return (
          <div className="wp-ab-wrap">
            <div className="wp-ab-section">
              <h4 className="wp-ab-label">⏱ Duration</h4>
              <div className="wp-chip-grid">
                {AUDIOBOOK_DURATIONS.map((d) => (
                  <Chip key={d.id} label={d.label} sub={d.sub}
                    selected={audiobookDuration.includes(d.id)}
                    onClick={() => toggle(audiobookDuration, setAudiobookDuration, d.id)} />
                ))}
              </div>
            </div>
            <div className="wp-ab-section">
              <h4 className="wp-ab-label">💰 Price Range</h4>
              <div className="wp-chip-grid">
                {AUDIOBOOK_PRICES.map((p) => (
                  <Chip key={p.id} label={p.label} sub={p.sub}
                    selected={audiobookPrice.includes(p.id)}
                    onClick={() => toggle(audiobookPrice, setAudiobookPrice, p.id)} />
                ))}
              </div>
            </div>
            <div className="wp-ab-section">
              <h4 className="wp-ab-label">🌐 Language</h4>
              <div className="wp-chip-grid">
                {LANGUAGES.map((l) => (
                  <Chip key={l} label={l} selected={language.includes(l)}
                    onClick={() => toggle(language, setLanguage, l)} />
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="wp-page">
      {/* Animated background orbs */}
      <div className="wp-bg" aria-hidden="true">
        <div className="wp-orb wp-orb-1" />
        <div className="wp-orb wp-orb-2" />
        <div className="wp-orb wp-orb-3" />
      </div>

      <div className="wp-card">

        {/* ── Preferences loading state ── */}
        {prefLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text2)' }}>
            <div className="wp-spin" style={{ width: '1.8rem', height: '1.8rem', margin: '0 auto 1rem' }} />
            <p style={{ fontSize: '0.88rem' }}>Loading your preferences…</p>
          </div>
        ) : (
          <>
            {/* ── Header ── */}
            <div className="wp-header">
              <div className="wp-logo">⚓</div>
              <h1 className="wp-title">
                Welcome aboard{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </h1>
              <p className="wp-subtitle">
                Let's personalise your Pixel Pirates experience in just a moment.
              </p>
            </div>

            {/* ── Progress ── */}
            <ProgressBar current={step} total={totalSteps} />
            <div className="wp-step-label">
              Step {step + 1} of {totalSteps} — <strong>{currentStep?.title}</strong>
            </div>

            {/* ── Step description ── */}
            <p className="wp-step-desc">{currentStep?.desc}</p>

            {/* ── Content ── */}
            <div className="wp-content-area">
              {renderStepContent()}
            </div>

            {/* ── Error ── */}
            {error && <div className="wp-error">{error}</div>}

            {/* ── Actions ── */}
            <div className="wp-actions">
              {step > 0 && (
                <button type="button" className="wp-btn-back" onClick={handleBack} disabled={saving}>
                  ← Back
                </button>
              )}
              <button
                type="button"
                className={`wp-btn-next${saving ? ' wp-btn-saving' : ''}`}
                onClick={handleNext}
                disabled={saving}
              >
                {saving ? (
                  <><span className="wp-spin" /> Saving…</>
                ) : isLastStep ? (
                  '🚀 Get My Recommendations'
                ) : (
                  'Next →'
                )}
              </button>
            </div>

            {/* ── Skip ── */}
            {step === 0 && (
              <button
                type="button"
                className="wp-skip"
                onClick={async () => {
                  if (contentTypes.length === 0) {
                    setContentTypes(['movies', 'songs', 'games', 'audiobooks']);
                  }
                  handleNext();
                }}
              >
                Skip for now
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Styles ── */}
      <style>{`
        /* ── Page ── */
        .wp-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: var(--bg);
          position: relative;
          overflow: hidden;
        }

        /* ── Background orbs ── */
        .wp-bg { position:fixed; inset:0; pointer-events:none; z-index:0; }
        .wp-orb {
          position: absolute; border-radius: 50%;
          filter: blur(80px); opacity: 0.07;
          animation: wp-float ease-in-out infinite;
          background: var(--accent);
        }
        .wp-orb-1 { width:500px; height:500px; top:-120px; left:-100px;  animation-duration:20s; animation-delay:0s; }
        .wp-orb-2 { width:350px; height:350px; bottom:-80px; right:-80px; animation-duration:16s; animation-delay:-7s; opacity:0.05; }
        .wp-orb-3 { width:200px; height:200px; top:40%; left:55%;        animation-duration:12s; animation-delay:-4s; opacity:0.04; }
        @keyframes wp-float {
          0%,100% { transform: translateY(0) scale(1); }
          50%      { transform: translateY(-40px) scale(1.08); }
        }

        /* ── Card ── */
        .wp-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 680px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          box-shadow: 0 24px 80px rgba(0,0,0,0.35);
          animation: wp-card-in 0.5s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes wp-card-in {
          from { opacity:0; transform:translateY(30px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        /* ── Header ── */
        .wp-header { text-align:center; margin-bottom:1.8rem; }
        .wp-logo {
          font-size: 3rem; line-height:1;
          margin-bottom: 0.6rem; display:block;
          animation: wp-logo-bob 3s ease-in-out infinite;
        }
        @keyframes wp-logo-bob {
          0%,100% { transform:rotate(-5deg) scale(1); }
          50%      { transform:rotate(5deg) scale(1.1); }
        }
        .wp-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.4rem, 4vw, 1.8rem);
          font-weight: 800;
          color: var(--text);
          margin: 0 0 0.4rem;
        }
        .wp-subtitle {
          color: var(--text2);
          font-size: 0.9rem;
          margin: 0;
          opacity: 0.8;
        }

        /* ── Progress ── */
        .wp-progress-bar {
          display: flex; gap: 6px; margin-bottom: 0.5rem;
        }
        .wp-progress-seg {
          flex: 1; height: 4px; border-radius: 4px;
          background: var(--border);
          transition: background 0.35s, transform 0.25s;
        }
        .wp-progress-done   { background: var(--accent); }
        .wp-progress-active {
          background: var(--accent);
          opacity: 0.5;
          animation: wp-pulse-seg 1.5s ease-in-out infinite;
        }
        @keyframes wp-pulse-seg {
          0%,100% { opacity:0.5; } 50% { opacity:0.9; }
        }
        .wp-step-label {
          font-size: 0.78rem; color: var(--text2);
          margin-bottom: 0.3rem;
        }
        .wp-step-label strong { color: var(--accent); }
        .wp-step-desc {
          font-size: 0.85rem; color: var(--text2);
          margin: 0 0 1.5rem; opacity: 0.75;
        }

        /* ── Content types grid ── */
        .wp-type-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .wp-type-card {
          position: relative;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 0.5rem;
          padding: 1.8rem 1rem;
          background: var(--bg);
          border: 2px solid var(--border);
          border-radius: 14px;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .wp-type-card:hover {
          border-color: var(--accent);
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .wp-type-card-on {
          border-color: var(--accent) !important;
          background: color-mix(in srgb, var(--accent) 8%, var(--bg));
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
        }
        .wp-type-icon { font-size: 2.4rem; line-height:1; }
        .wp-type-label {
          font-size: 0.9rem; font-weight: 700;
          color: var(--text);
        }
        .wp-type-tick {
          position: absolute; top: 0.5rem; right: 0.6rem;
          font-size: 0.75rem; font-weight: 800;
          color: var(--accent);
          animation: wp-tick-pop 0.3s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes wp-tick-pop { from{transform:scale(0)} to{transform:scale(1)} }

        /* ── Genre chip grid ── */
        .wp-chip-grid {
          display: flex; flex-wrap: wrap; gap: 0.5rem;
        }
        .wp-chip {
          position: relative;
          display: inline-flex; align-items: center; gap: 0.35rem;
          padding: 0.4rem 0.9rem;
          background: var(--bg);
          border: 1.5px solid var(--border);
          border-radius: 2rem;
          font-size: 0.82rem; font-weight: 600;
          font-family: 'Outfit', sans-serif;
          color: var(--text2);
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, color 0.2s, transform 0.15s;
          flex-direction: column;
          text-align: center;
        }
        .wp-chip-sub {
          font-size: 0.68rem; font-weight: 400;
          color: var(--text2); opacity: 0.7;
          margin-top: -2px;
        }
        .wp-chip:hover {
          border-color: var(--accent); color: var(--accent);
          transform: scale(1.03);
        }
        .wp-chip-on {
          border-color: var(--accent) !important;
          background: color-mix(in srgb, var(--accent) 12%, var(--bg)) !important;
          color: var(--accent) !important;
        }
        .wp-chip-check { font-size: 0.65rem; font-weight: 900; }

        /* ── Audiobook sections ── */
        .wp-ab-wrap    { display: flex; flex-direction: column; gap: 1.5rem; }
        .wp-ab-section { }
        .wp-ab-label {
          font-size: 0.8rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: var(--text2);
          margin: 0 0 0.6rem;
        }

        /* ── Content area ── */
        .wp-content-area {
          min-height: 160px;
          margin-bottom: 1.5rem;
          animation: wp-step-in 0.3s ease both;
        }
        @keyframes wp-step-in {
          from { opacity:0; transform:translateX(12px); }
          to   { opacity:1; transform:translateX(0); }
        }

        /* ── Error ── */
        .wp-error {
          background: color-mix(in srgb, #e53e3e 12%, transparent);
          border: 1px solid #e53e3e55;
          color: #fc8181;
          border-radius: 8px;
          padding: 0.6rem 1rem;
          font-size: 0.83rem;
          margin-bottom: 1rem;
        }

        /* ── Actions ── */
        .wp-actions {
          display: flex; gap: 0.75rem; justify-content: flex-end;
        }
        .wp-btn-back {
          padding: 0.6rem 1.4rem;
          background: transparent;
          border: 1.5px solid var(--border);
          border-radius: 2rem;
          font-size: 0.85rem; font-weight: 600;
          font-family: 'Outfit', sans-serif;
          color: var(--text2);
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .wp-btn-back:hover { border-color: var(--text2); color: var(--text); }

        .wp-btn-next {
          flex: 1;
          padding: 0.7rem 1.6rem;
          background: var(--accent);
          border: none;
          border-radius: 2rem;
          font-size: 0.9rem; font-weight: 800;
          font-family: 'Outfit', sans-serif;
          color: #07101f;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .wp-btn-next:hover:not(:disabled) {
          background: var(--accent-dk, #e0b530);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px color-mix(in srgb, var(--accent) 35%, transparent);
        }
        .wp-btn-next:active:not(:disabled) { transform: scale(0.98); }
        .wp-btn-next:disabled { opacity: 0.65; cursor: not-allowed; }
        .wp-btn-saving { opacity: 0.75 !important; }

        .wp-spin {
          width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid rgba(7,16,31,0.25); border-top-color: #07101f;
          animation: wp-spin-anim 0.7s linear infinite; display: inline-block;
        }
        @keyframes wp-spin-anim { to { transform:rotate(360deg); } }

        /* ── Skip ── */
        .wp-skip {
          display: block; margin: 1rem auto 0;
          background: none; border: none;
          font-size: 0.78rem; color: var(--text2);
          cursor: pointer; opacity: 0.6;
          transition: opacity 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .wp-skip:hover { opacity: 1; text-decoration: underline; }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .wp-card { padding: 1.8rem 1.2rem; }
          .wp-type-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
          .wp-actions { flex-direction: column-reverse; }
          .wp-btn-back { width: 100%; }
        }
      `}</style>
    </div>
  );
  
}
