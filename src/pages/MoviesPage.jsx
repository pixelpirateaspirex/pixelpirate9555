// src/pages/MoviesPage.jsx  ── Animated · Theme-Safe · Production Ready ────────
import { useState, useEffect, useCallback, useRef } from "react";
import { useLists }  from "../context/ListsContext";
import { useToast }  from "../context/ToastContext";
import { useAuth }   from "../context/AuthContext";

/* ─── constants ──────────────────────────────────────────────────────────────── */
const OMDB_KEY = import.meta.env.VITE_OMDB_KEY || "trilogy";
const OMDB     = "https://www.omdbapi.com/";
const PH       = "https://placehold.co/342x513/07101f/f5c542?text=No+Poster";

const getPoster = (m) =>
  m.Poster && m.Poster !== "N/A" ? m.Poster
  : m.imdbID ? `https://img.omdbapi.com/?i=${m.imdbID}&apikey=${OMDB_KEY}`
  : PH;

const LOCAL_MOVIES = [
  { imdbID:"tt0111161", title:"The Shawshank Redemption", Year:"1994", Genre:"Drama",     lang:"en", imdbRating:"9.3", Poster:"https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_SX300.jpg" },
  { imdbID:"tt0468569", title:"The Dark Knight",          Year:"2008", Genre:"Action",     lang:"en", imdbRating:"9.0", Poster:"https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg" },
  { imdbID:"tt0068646", title:"The Godfather",            Year:"1972", Genre:"Crime",      lang:"en", imdbRating:"9.2" },
  { imdbID:"tt0137523", title:"Fight Club",               Year:"1999", Genre:"Drama",      lang:"en", imdbRating:"8.8" },
  { imdbID:"tt1375666", title:"Inception",                Year:"2010", Genre:"Sci-Fi",     lang:"en", imdbRating:"8.8" },
  { imdbID:"tt0133093", title:"The Matrix",               Year:"1999", Genre:"Sci-Fi",     lang:"en", imdbRating:"8.7" },
  { imdbID:"tt0816692", title:"Interstellar",             Year:"2014", Genre:"Sci-Fi",     lang:"en", imdbRating:"8.6" },
  { imdbID:"tt4154796", title:"Avengers: Endgame",        Year:"2019", Genre:"Action",     lang:"en", imdbRating:"8.4" },
  { imdbID:"tt5074352", title:"Dangal",                   Year:"2016", Genre:"Drama",      lang:"hi", imdbRating:"8.3" },
  { imdbID:"tt1187043", title:"3 Idiots",                 Year:"2009", Genre:"Comedy",     lang:"hi", imdbRating:"8.4" },
  { imdbID:"tt0115937", title:"DDLJ",                     Year:"1995", Genre:"Romance",    lang:"hi", imdbRating:"8.1" },
  { imdbID:"tt2631186", title:"Baahubali: The Beginning", Year:"2015", Genre:"Action",     lang:"te", imdbRating:"8.0" },
  { imdbID:"tt0245429", title:"Spirited Away",            Year:"2001", Genre:"Animation",  lang:"ja", imdbRating:"8.6" },
  { imdbID:"tt6751668", title:"Parasite",                 Year:"2019", Genre:"Thriller",   lang:"ko", imdbRating:"8.5" },
  { imdbID:"tt1477834", title:"Avengers",                 Year:"2012", Genre:"Action",     lang:"en", imdbRating:"8.0" },
  { imdbID:"tt3783958", title:"La La Land",               Year:"2016", Genre:"Romance",    lang:"en", imdbRating:"8.0" },
];

const LANGS = [
  { value:"all", label:"🌍 All"       },
  { value:"en",  label:"🇺🇸 English"   },
  { value:"hi",  label:"🇮🇳 Hindi"     },
  { value:"ta",  label:"🎬 Tamil"     },
  { value:"te",  label:"🎭 Telugu"    },
  { value:"ja",  label:"🇯🇵 Japanese"  },
  { value:"ko",  label:"🇰🇷 Korean"    },
];

/* ─── debounce ───────────────────────────────────────────────────────────────── */
function useDebounce(v, d) {
  const [dv, setDv] = useState(v);
  useEffect(() => { const t = setTimeout(() => setDv(v), d); return () => clearTimeout(t); }, [v, d]);
  return dv;
}

/* ─── SkeletonCard ───────────────────────────────────────────────────────────── */
function SkeletonCard({ i }) {
  return (
    <div className="mp-skel" style={{ "--si": `${i * 0.07}s` }}>
      <div className="mp-skel-img mp-shimmer" />
      <div className="mp-skel-body">
        <div className="mp-skel-line mp-shimmer" style={{ width:"78%" }} />
        <div className="mp-skel-line mp-shimmer" style={{ width:"52%", marginTop:"6px", height:"10px" }} />
        <div className="mp-skel-line mp-shimmer" style={{ width:"100%", marginTop:"10px", height:"32px", borderRadius:"999px" }} />
      </div>
    </div>
  );
}

/* ─── MovieCard ──────────────────────────────────────────────────────────────── */
function MovieCard({ movie, onAdd, inList, index }) {
  const cardRef = useRef(null);
  const poster  = getPoster(movie);
  const title   = movie.title || movie.Title;
  const jwUrl   = `https://www.justwatch.com/in/search?q=${encodeURIComponent(title)}`;
  const imdbUrl = movie.imdbID ? `https://www.imdb.com/title/${movie.imdbID}/` : null;

  /* 3-D tilt – only on pointer devices */
  const onMove = (e) => {
    const c = cardRef.current;
    if (!c || !matchMedia("(hover:hover)").matches) return;
    const { left, top, width, height } = c.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;
    const y = (e.clientY - top)  / height - 0.5;
    c.style.transform = `perspective(700px) rotateY(${x * 9}deg) rotateX(${-y * 7}deg) scale3d(1.03,1.03,1.03)`;
  };
  const onLeave = () => { if (cardRef.current) cardRef.current.style.transform = ""; };

  /* ripple */
  const onBtnClick = (e) => {
    const b = e.currentTarget;
    const s = document.createElement("span");
    const sz = Math.max(b.clientWidth, b.clientHeight);
    const r  = b.getBoundingClientRect();
    s.className = "mp-ripple";
    s.style.cssText = `width:${sz}px;height:${sz}px;top:${e.clientY - r.top - sz / 2}px;left:${e.clientX - r.left - sz / 2}px`;
    b.appendChild(s);
    setTimeout(() => s.remove(), 580);
    onAdd(movie);
  };

  const delayStyle = { "--d": `${(index % 12) * 0.06}s` };

  return (
    <div
      ref={cardRef}
      className="mp-card"
      style={delayStyle}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {/* Poster */}
      <div className="mp-img-wrap">
        <img src={poster} alt={title} loading="lazy" onError={(e) => { e.target.src = PH; }} />

        {movie.imdbRating && movie.imdbRating !== "N/A" && (
          <div className="mp-badge">⭐ {movie.imdbRating}</div>
        )}

        {/* Hover overlay */}
        <div className="mp-overlay">
          <div className="mp-ol-inner">
            <p className="mp-ol-title">{title}</p>
            {movie.Genre && <p className="mp-ol-genre">{movie.Genre.split(",")[0]}</p>}
            <div className="mp-ol-btns">
              <a href={jwUrl} target="_blank" rel="noopener noreferrer" className="mp-watch-btn">▶ Where to Watch</a>
              {imdbUrl && (
                <a href={imdbUrl} target="_blank" rel="noopener noreferrer" className="mp-imdb-btn">IMDb</a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="mp-card-body">
        <p className="mp-card-title">{title}</p>
        <div className="mp-card-meta">
          {movie.imdbRating && movie.imdbRating !== "N/A" && (
            <span className="mp-meta-rating">⭐ {movie.imdbRating}</span>
          )}
          {(movie.Year || movie.year) && (
            <span className="mp-meta-year">{movie.Year || movie.year}</span>
          )}
          {movie.Genre && (
            <span className="mp-genre-chip">{movie.Genre.split(",")[0]}</span>
          )}
        </div>
        <button
          className={`mp-add-btn${inList ? " mp-added" : ""}`}
          onClick={onBtnClick}
          aria-label={inList ? "In Watchlist" : "Add to Watchlist"}
        >
          <span className="mp-btn-icon">{inList ? "✓" : "+"}</span>
          {inList ? "In Watchlist" : "Watchlist"}
        </button>
      </div>
    </div>
  );
}

/* ─── MoviesPage ─────────────────────────────────────────────────────────────── */
export default function MoviesPage() {
  const { isLoggedIn }                    = useAuth();
  const { addToWatchlist, isInWatchlist } = useLists();
  const { success, info }                 = useToast();

  const [query,   setQuery]   = useState("");
  const [lang,    setLang]    = useState("all");
  const [movies,  setMovies]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [ready,   setReady]   = useState(false);

  const dQuery = useDebounce(query, 380);

  /* ── fetch ─────────────────────────────────────────────────────────────── */
  const fetchMovies = useCallback(async () => {
    setLoading(true);
    setReady(false);
    const cKey = `pp_cache_movies_${dQuery.toLowerCase().replace(/\s+/g, "_")}_${lang}`;

    try {
      /* check cache */
      const cached = (() => {
        try {
          const c = localStorage.getItem(cKey);
          if (c) { const p = JSON.parse(c); if (Date.now() - p.t < 2 * 60 * 60 * 1000) return p.v; }
        } catch {}
        return null;
      })();

      if (cached) {
        setMovies(cached);
        setLoading(false);
        requestAnimationFrame(() => setReady(true));
        return;
      }

      /* OMDB search */
      if (dQuery.trim()) {
        const r = await fetch(`${OMDB}?s=${encodeURIComponent(dQuery)}&type=movie&apikey=${OMDB_KEY}`);
        const d = await r.json();
        if (d.Response === "True") {
          const items = (d.Search || []).slice(0, 15).map((m) => ({ ...m, title: m.Title, lang: "en" }));
          try { localStorage.setItem(cKey, JSON.stringify({ v: items, t: Date.now() })); } catch {}
          setMovies(items);
          setLoading(false);
          requestAnimationFrame(() => setReady(true));
          return;
        }
      }

      /* local fallback */
      let res = [...LOCAL_MOVIES];
      if (lang !== "all") res = res.filter((m) => m.lang === lang);
      if (dQuery.trim()) {
        const q = dQuery.toLowerCase();
        res = res.filter((m) => (m.title || m.Title).toLowerCase().includes(q));
      }
      setMovies(res.slice(0, 16));
    } catch {
      setMovies(LOCAL_MOVIES.slice(0, 16));
    }

    setLoading(false);
    requestAnimationFrame(() => setReady(true));
  }, [dQuery, lang]);

  useEffect(() => { fetchMovies(); }, [fetchMovies]);

  const handleAdd = async (movie) => {
    if (!isLoggedIn) { info("Sign in to save movies!"); return; }
    const added = await addToWatchlist({
      imdbID: movie.imdbID,
      title:  movie.title || movie.Title,
      poster: movie.Poster && movie.Poster !== "N/A" ? movie.Poster : PH,
      year:   movie.Year  || movie.year,
      genre:  movie.Genre || movie.genre || "General",
      rating: movie.imdbRating,
    });
    if (added) success(`Added "${movie.title || movie.Title}" to watchlist! 🎬`);
    else info("Already in your watchlist.");
  };

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="mp-page">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="mp-hero">
        <div className="mp-orb mp-orb-a" aria-hidden="true" />
        <div className="mp-orb mp-orb-b" aria-hidden="true" />

        <div className="mp-hero-body">
          <span className="mp-hero-emoji" aria-hidden="true">🎬</span>
          <h1 className="mp-hero-h1">
            <span className="mp-sweep">Movies</span>
          </h1>
          <p className="mp-hero-tagline">Discover, explore, and build your watchlist</p>
        </div>

        {/* scrolling ticker */}
        <div className="mp-ticker" aria-hidden="true">
          <div className="mp-ticker-inner">
            {[...LOCAL_MOVIES, ...LOCAL_MOVIES].map((m, i) => (
              <span key={i} className="mp-tick">🎬 {m.title}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="mp-body-wrap">

        {/* Search */}
        <div className="mp-search-row">
          <div className="mp-input-wrap">
            <span className="mp-search-ico" aria-hidden="true">🔍</span>
            <input
              className="mp-search"
              type="text"
              placeholder="Search movies, genres, directors…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              aria-label="Search movies"
            />
            {query && (
              <button className="mp-clear" onClick={() => setQuery("")} aria-label="Clear search">✕</button>
            )}
          </div>
        </div>

        {/* Language pills */}
        <div className="mp-pills" role="group" aria-label="Filter by language">
          {LANGS.map((l, i) => (
            <button
              key={l.value}
              className={`mp-pill${lang === l.value ? " mp-pill-active" : ""}`}
              style={{ "--pi": i }}
              onClick={() => setLang(l.value)}
              aria-pressed={lang === l.value}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && movies.length > 0 && (
          <p className="mp-count" aria-live="polite">
            Showing <strong>{movies.length}</strong> movie{movies.length !== 1 ? "s" : ""}
            {query && <> for "<em>{query}</em>"</>}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="mp-grid">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} i={i} />)}
          </div>
        ) : movies.length === 0 ? (
          <div className="mp-empty" role="status">
            <span className="mp-empty-ico">🎬</span>
            <p className="mp-empty-h">No movies found</p>
            <p className="mp-empty-sub">Try a different search or language filter</p>
            <button
              className="mp-pill mp-pill-active mp-reset"
              onClick={() => { setQuery(""); setLang("all"); }}
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className={`mp-grid${ready ? " mp-grid-go" : ""}`} role="list">
            {movies.map((m, i) => (
              <MovieCard
                key={m.imdbID || m.Title || i}
                movie={m}
                onAdd={handleAdd}
                inList={isInWatchlist(m.imdbID)}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Styles ────────────────────────────────────────────────────── */}
      <style>{`

        /* ── Reset / base ─────────────────────────────────────────────── */
        .mp-page { overflow-x: hidden; }

        /* ── Hero ─────────────────────────────────────────────────────── */
        .mp-hero {
          position: relative;
          overflow: hidden;
          padding: 3.5rem 1.5rem 1.75rem;
          text-align: center;
          border-bottom: 1px solid var(--border, rgba(128,128,128,.15));
        }
        .mp-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          filter: blur(90px);
          opacity: .15;
          animation: mp-drift 9s ease-in-out infinite alternate;
        }
        .mp-orb-a {
          width: 360px; height: 360px;
          background: var(--accent, #f5c542);
          top: -120px; left: -80px;
        }
        .mp-orb-b {
          width: 260px; height: 260px;
          background: #e50914;
          top: -50px; right: -60px;
          animation-duration: 7s;
          animation-delay: 1.5s;
        }
        @keyframes mp-drift {
          from { transform: translateY(0) scale(1); }
          to   { transform: translateY(-22px) scale(1.1); }
        }

        .mp-hero-body {
          position: relative;
          z-index: 1;
          animation: mp-up .65s cubic-bezier(.22,1,.36,1) both;
        }
        .mp-hero-emoji {
          display: block;
          font-size: 2.8rem;
          margin-bottom: .4rem;
          animation: mp-pop .55s cubic-bezier(.34,1.56,.64,1) .15s both;
        }
        @keyframes mp-pop {
          from { transform: scale(.4) rotate(-15deg); opacity: 0; }
          to   { transform: scale(1)  rotate(0deg);   opacity: 1; }
        }
        .mp-hero-h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.8rem, 7vw, 5rem);
          font-weight: 800;
          margin: 0 0 .4rem;
          line-height: 1.05;
        }
        .mp-sweep {
          background: linear-gradient(90deg, var(--accent,#f5c542) 0%, #e50914 55%, var(--accent,#f5c542) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: mp-sweep 4s linear infinite;
        }
        @keyframes mp-sweep {
          from { background-position: 200% center; }
          to   { background-position: -200% center; }
        }
        .mp-hero-tagline {
          color: var(--text2);
          font-size: clamp(.88rem, 2vw, 1.05rem);
          margin: 0;
          animation: mp-up .6s ease .25s both;
        }
        @keyframes mp-up {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ticker */
        .mp-ticker {
          position: relative;
          z-index: 1;
          overflow: hidden;
          margin-top: 1.75rem;
          mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
        }
        .mp-ticker-inner {
          display: flex;
          gap: 2rem;
          width: max-content;
          animation: mp-tick-scroll 45s linear infinite;
        }
        @keyframes mp-tick-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .mp-tick { color: var(--text2); font-size: .76rem; white-space: nowrap; opacity: .55; }

        /* ── Body / layout ────────────────────────────────────────────── */
        .mp-body-wrap {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
        }

        /* ── Search ───────────────────────────────────────────────────── */
        .mp-search-row { margin-bottom: 1.25rem; }
        .mp-input-wrap { position: relative; }
        .mp-search-ico {
          position: absolute;
          left: 1rem; top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
          pointer-events: none;
          z-index: 2;
        }
        .mp-search {
          width: 100%;
          padding: .65rem 2.75rem .65rem 2.75rem;
          border-radius: 2rem;
          border: 1px solid var(--border, rgba(128,128,128,.2));
          background: var(--bg2, rgba(255,255,255,.05));
          color: var(--text);
          font-size: .95rem;
          outline: none;
          transition: border-color .25s, box-shadow .25s;
          box-sizing: border-box;
        }
        .mp-search::placeholder { color: var(--text2); }
        .mp-search:focus {
          border-color: var(--accent, #f5c542);
          box-shadow: 0 0 0 3px rgba(245,197,66,.18);
        }
        .mp-clear {
          position: absolute;
          right: .85rem; top: 50%;
          transform: translateY(-50%);
          background: var(--bg2, rgba(128,128,128,.15));
          border: none;
          color: var(--text2);
          width: 22px; height: 22px;
          border-radius: 50%;
          cursor: pointer;
          font-size: .58rem;
          display: flex; align-items: center; justify-content: center;
          transition: background .2s, color .2s;
          z-index: 2;
        }
        .mp-clear:hover { background: rgba(229,9,20,.18); color: #e50914; }

        /* ── Language pills ───────────────────────────────────────────── */
        .mp-pills {
          display: flex;
          flex-wrap: wrap;
          gap: .45rem;
          margin-bottom: 1.5rem;
          animation: mp-up .5s ease .3s both;
        }
        .mp-pill {
          padding: .38rem .85rem;
          border-radius: 999px;
          border: 1px solid var(--border, rgba(128,128,128,.2));
          background: var(--bg2, rgba(255,255,255,.05));
          color: var(--text2);
          font-size: .8rem;
          cursor: pointer;
          white-space: nowrap;
          transition: background .2s, color .2s, border-color .2s, transform .15s;
          animation: mp-pill-pop .4s cubic-bezier(.34,1.56,.64,1) calc(.38s + var(--pi,0)*.055s) both;
        }
        .mp-pill:hover {
          background: rgba(245,197,66,.1);
          border-color: var(--accent, #f5c542);
          color: var(--accent, #f5c542);
        }
        .mp-pill-active {
          background: var(--accent, #f5c542) !important;
          border-color: var(--accent, #f5c542) !important;
          color: #07101f !important;
          font-weight: 700;
        }
        @keyframes mp-pill-pop {
          from { opacity: 0; transform: scale(.7) translateY(6px); }
          to   { opacity: 1; transform: scale(1)  translateY(0); }
        }

        /* ── Count ────────────────────────────────────────────────────── */
        .mp-count {
          text-align: center;
          font-size: .82rem;
          color: var(--text2);
          margin: 0 0 1.5rem;
          animation: mp-up .4s ease both;
        }
        .mp-count strong { color: var(--accent, #f5c542); }
        .mp-count em { font-style: italic; }

        /* ── Grid ─────────────────────────────────────────────────────── */
        .mp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 1.25rem;
        }

        /* Cards start invisible; reveal after .mp-grid-go is added */
        .mp-grid .mp-card {
          opacity: 0;
          transform: translateY(20px) scale(.97);
        }
        .mp-grid.mp-grid-go .mp-card {
          animation: mp-card-in .48s cubic-bezier(.22,1,.36,1) var(--d, 0s) both;
        }
        @keyframes mp-card-in {
          from { opacity: 0; transform: translateY(20px) scale(.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);   }
        }

        /* ── Card ─────────────────────────────────────────────────────── */
        .mp-card {
          display: flex;
          flex-direction: column;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--border, rgba(128,128,128,.12));
          background: var(--card, var(--bg2));
          will-change: transform;
          transition:
            transform .3s cubic-bezier(.22,1,.36,1),
            box-shadow .3s ease,
            border-color .25s;
          cursor: default;
        }
        .mp-card:hover {
          border-color: var(--accent, #f5c542);
          box-shadow: 0 8px 32px rgba(0,0,0,.35);
        }

        /* poster */
        .mp-img-wrap {
          position: relative;
          overflow: hidden;
          line-height: 0;
          flex-shrink: 0;
        }
        .mp-img-wrap img {
          width: 100%;
          aspect-ratio: 2 / 3;
          object-fit: cover;
          object-position: center top;
          display: block;
          background: var(--bg2);
          transition: transform .45s cubic-bezier(.22,1,.36,1);
        }
        .mp-card:hover .mp-img-wrap img { transform: scale(1.07); }

        /* rating badge */
        .mp-badge {
          position: absolute;
          top: 8px; left: 8px;
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          color: #f5c542;
          font-size: .67rem;
          font-weight: 700;
          padding: .18rem .5rem;
          border-radius: 999px;
          border: 1px solid rgba(245,197,66,.35);
          z-index: 2;
          line-height: 1.4;
        }

        /* hover overlay */
        .mp-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.3) 60%, transparent 100%);
          display: flex;
          align-items: flex-end;
          opacity: 0;
          transform: translateY(6px);
          transition: opacity .28s ease, transform .28s ease;
          z-index: 3;
        }
        .mp-card:hover .mp-overlay { opacity: 1; transform: translateY(0); }
        .mp-ol-inner { padding: .75rem; width: 100%; }
        .mp-ol-title {
          font-family: 'Syne', sans-serif;
          font-size: .8rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 .15rem;
          line-height: 1.2;
        }
        .mp-ol-genre { font-size: .67rem; color: rgba(255,255,255,.5); margin: 0 0 .5rem; }
        .mp-ol-btns  { display: flex; gap: .35rem; flex-wrap: wrap; }
        .mp-watch-btn, .mp-imdb-btn {
          display: inline-flex;
          align-items: center;
          gap: .2rem;
          padding: .25rem .6rem;
          border-radius: 999px;
          font-size: .65rem;
          font-weight: 600;
          text-decoration: none;
          transition: opacity .2s, transform .15s;
          white-space: nowrap;
        }
        .mp-watch-btn {
          background: var(--accent, #f5c542);
          color: #07101f;
        }
        .mp-imdb-btn {
          background: rgba(255,255,255,.15);
          color: #fff;
          border: 1px solid rgba(255,255,255,.25);
        }
        .mp-watch-btn:hover, .mp-imdb-btn:hover { opacity: .85; transform: scale(1.04); }

        /* card body */
        .mp-card-body {
          display: flex;
          flex-direction: column;
          gap: .35rem;
          padding: .75rem;
          flex: 1;
        }
        .mp-card-title {
          font-family: 'Syne', sans-serif;
          font-size: .82rem;
          font-weight: 700;
          color: var(--text);
          margin: 0;
          line-height: 1.25;
          /* clamp to 2 lines, prevents height blowout */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.1em;
        }
        .mp-card-meta {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: .2rem;
          font-size: .72rem;
          color: var(--text2);
        }
        .mp-meta-rating { color: var(--accent, #f5c542); font-weight: 600; }
        .mp-meta-year   { color: var(--text2); }
        .mp-meta-year::before { content: "·"; margin-right: .2rem; }
        .mp-genre-chip {
          font-size: .62rem;
          padding: .06rem .4rem;
          border-radius: 999px;
          background: rgba(245,197,66,.1);
          color: var(--accent, #f5c542);
          border: 1px solid rgba(245,197,66,.2);
          margin-left: auto;
          white-space: nowrap;
        }

        /* add button */
        .mp-add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: .3rem;
          width: 100%;
          margin-top: auto;
          padding: .45rem .75rem;
          border-radius: 999px;
          border: 1px solid var(--accent, #f5c542);
          background: transparent;
          color: var(--accent, #f5c542);
          font-size: .75rem;
          font-weight: 600;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition:
            background .22s,
            color .22s,
            transform .22s cubic-bezier(.34,1.56,.64,1),
            box-shadow .22s;
        }
        .mp-add-btn:hover {
          background: var(--accent, #f5c542);
          color: #07101f;
          transform: scale(1.04);
          box-shadow: 0 4px 16px rgba(245,197,66,.3);
        }
        .mp-add-btn:active { transform: scale(.97); }
        .mp-add-btn.mp-added {
          background: rgba(245,197,66,.12);
          border-color: transparent;
          color: var(--accent, #f5c542);
          cursor: default;
        }
        .mp-btn-icon { font-size: .9rem; font-weight: 800; line-height: 1; }

        /* ripple */
        .mp-ripple {
          position: absolute;
          border-radius: 50%;
          background: rgba(255,255,255,.3);
          transform: scale(0);
          pointer-events: none;
          animation: mp-rip .55s ease-out forwards;
        }
        @keyframes mp-rip { to { transform: scale(2.8); opacity: 0; } }

        /* ── Skeleton ─────────────────────────────────────────────────── */
        .mp-skel {
          border-radius: 12px;
          overflow: hidden;
          background: var(--card, var(--bg2));
          border: 1px solid var(--border, rgba(128,128,128,.1));
          animation: mp-up .4s ease var(--si, 0s) both;
        }
        .mp-skel-img  { width: 100%; aspect-ratio: 2 / 3; }
        .mp-skel-body { padding: .75rem; }
        .mp-skel-line { height: 13px; border-radius: 6px; }
        .mp-shimmer {
          background: linear-gradient(90deg,
            rgba(128,128,128,.06) 0%,
            rgba(128,128,128,.16) 50%,
            rgba(128,128,128,.06) 100%);
          background-size: 200% 100%;
          animation: mp-shim 1.6s ease-in-out infinite;
        }
        @keyframes mp-shim {
          from { background-position: 200% 0; }
          to   { background-position: -200% 0; }
        }

        /* ── Empty state ──────────────────────────────────────────────── */
        .mp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: .5rem;
          padding: 5rem 1rem;
          text-align: center;
        }
        .mp-empty-ico {
          font-size: 3.2rem;
          animation: mp-bob 3s ease-in-out infinite;
        }
        @keyframes mp-bob {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        .mp-empty-h {
          font-family: 'Syne', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text);
          margin: .5rem 0 0;
        }
        .mp-empty-sub { color: var(--text2); font-size: .88rem; margin: 0; }
        .mp-reset { margin-top: .75rem; cursor: pointer; }

        /* ── Responsive ───────────────────────────────────────────────── */
        @media (max-width: 1200px) {
          .mp-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); }
        }
        @media (max-width: 900px) {
          .mp-hero { padding: 2.75rem 1.25rem 1.5rem; }
          .mp-body-wrap { padding: 1.5rem 1rem 3rem; }
        }
        @media (max-width: 640px) {
          .mp-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: .85rem; }
          .mp-hero-tagline { display: none; }
          .mp-ticker { display: none; }
          .mp-pills { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; }
          .mp-pills::-webkit-scrollbar { height: 2px; }
          .mp-pills::-webkit-scrollbar-thumb { background: var(--accent, #f5c542); border-radius: 4px; }
          .mp-card-body { padding: .6rem; }
          .mp-card-title { font-size: .76rem; }
          .mp-add-btn { font-size: .68rem; padding: .38rem .5rem; }
        }
        @media (max-width: 400px) {
          .mp-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Reduced motion ───────────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .mp-orb, .mp-ticker-inner, .mp-sweep,
          .mp-shimmer, .mp-empty-ico, .mp-skel { animation: none !important; }
          .mp-grid .mp-card { opacity: 1 !important; transform: none !important; }
          .mp-grid.mp-grid-go .mp-card { animation: none !important; }
          .mp-card, .mp-add-btn { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
