// src/pages/BooksPage.jsx — Animated · Theme-Safe · Production Ready
import { useState, useEffect, useCallback, useRef } from "react";
import { useLists } from "../context/ListsContext";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

const BOOKS_API = "https://www.googleapis.com/books/v1/volumes";
const PH_BOOK   = "https://placehold.co/200x300/07101f/f5c542?text=Book";

const CATEGORIES = [
  { value: "",           label: "✦ All"        },
  { value: "fiction",    label: "📖 Fiction"    },
  { value: "science",    label: "🔬 Science"    },
  { value: "history",    label: "🏛️ History"   },
  { value: "biography",  label: "👤 Biography"  },
  { value: "fantasy",    label: "🧙 Fantasy"    },
  { value: "thriller",   label: "🔪 Thriller"   },
  { value: "self-help",  label: "🌱 Self-Help"  },
  { value: "technology", label: "💻 Technology" },
];

/* ── Debounce ──────────────────────────────────────────────────────────────── */
function useDebounce(v, d) {
  const [dv, setDv] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setDv(v), d);
    return () => clearTimeout(t);
  }, [v, d]);
  return dv;
}

/* ── Skeleton Card ─────────────────────────────────────────────────────────── */
function SkeletonCard({ i }) {
  return (
    <div className="bp-skel" style={{ "--si": `${i * 0.06}s` }}>
      <div className="bp-skel-img bp-shimmer" />
      <div className="bp-skel-body">
        <div className="bp-skel-line bp-shimmer" style={{ width: "80%" }} />
        <div className="bp-skel-line bp-shimmer" style={{ width: "55%", height: "10px", marginTop: "6px" }} />
        <div className="bp-skel-line bp-shimmer" style={{ width: "40%", height: "10px", marginTop: "4px" }} />
        <div className="bp-skel-line bp-shimmer" style={{ width: "100%", height: "30px", borderRadius: "999px", marginTop: "12px" }} />
      </div>
    </div>
  );
}

/* ── Book Card ─────────────────────────────────────────────────────────────── */
function BookCard({ book, onAdd, inList, index }) {
  const cardRef  = useRef(null);
  const [vis, setVis] = useState(false);

  const v      = book.volumeInfo || {};
  const cover  = (v.imageLinks?.thumbnail || PH_BOOK)
    .replace("http://", "https://")
    .replace("zoom=1", "zoom=2");
  const title  = v.title || "Untitled";
  const author = (v.authors || []).join(", ") || "Unknown Author";
  const genre  = v.categories?.[0]?.split("/")[0] || "General";
  const link   = v.infoLink || v.previewLink || `https://books.google.com/books?id=${book.id}`;
  const rating = v.averageRating;
  const pages  = v.pageCount;

  /* Scroll reveal */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  /* 3-D tilt */
  const onMove = (e) => {
    const c = cardRef.current;
    if (!c || !matchMedia("(hover:hover)").matches) return;
    const { left, top, width, height } = c.getBoundingClientRect();
    const x = (e.clientX - left) / width  - 0.5;
    const y = (e.clientY - top)  / height - 0.5;
    c.style.transform = `perspective(600px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg) scale3d(1.04,1.04,1.04)`;
  };
  const onLeave = () => { if (cardRef.current) cardRef.current.style.transform = ""; };

  /* Ripple */
  const onBtnClick = (e) => {
    e.stopPropagation();
    const b = e.currentTarget;
    const s = document.createElement("span");
    const sz = Math.max(b.clientWidth, b.clientHeight);
    const r  = b.getBoundingClientRect();
    s.className = "bp-ripple";
    s.style.cssText = `width:${sz}px;height:${sz}px;top:${e.clientY - r.top - sz/2}px;left:${e.clientX - r.left - sz/2}px`;
    b.appendChild(s);
    setTimeout(() => s.remove(), 600);
    onAdd({ book, title, author, genre, cover, bookLink: link });
  };

  return (
    <div
      ref={cardRef}
      className={`bp-card${vis ? " bp-card-vis" : ""}`}
      style={{ "--di": `${(index % 9) * 0.07}s` }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
      role="article"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && window.open(link, "_blank", "noopener,noreferrer")}
    >
      {/* Spinning glow border */}
      <div className="bp-card-glow" aria-hidden="true" />

      {/* Cover */}
      <div className="bp-img-wrap">
        <img src={cover} alt={title} loading="lazy" onError={(e) => { e.target.src = PH_BOOK; }} />
        {rating && <div className="bp-badge">⭐ {rating}</div>}
        <div className="bp-overlay">
          <div className="bp-overlay-inner">
            <p className="bp-ol-title">{title}</p>
            {pages && <p className="bp-ol-meta">📄 {pages} pages</p>}
            <span className="bp-ol-cta">📖 Open in Google Books</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bp-body">
        <p className="bp-title">{title}</p>
        <p className="bp-author">{author}</p>
        <div className="bp-meta-row">
          {rating && <span className="bp-rating">⭐ {rating}</span>}
          <span className="bp-genre-chip">{genre}</span>
        </div>
        <button
          className={`bp-btn${inList ? " bp-btn-added" : ""}`}
          onClick={onBtnClick}
          aria-label={inList ? "In Reading List" : "Add to Reading List"}
        >
          <span className="bp-btn-icon">{inList ? "✓" : "+"}</span>
          {inList ? "In List" : "Reading List"}
        </button>
      </div>
    </div>
  );
}

/* ── BooksPage ─────────────────────────────────────────────────────────────── */
export default function BooksPage() {
  const { isLoggedIn }                = useAuth();
  const { addToReading, isInReading } = useLists();
  const { success, info }             = useToast();

  const [query,    setQuery]    = useState("");
  const [category, setCat]      = useState("");
  const [books,    setBooks]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [ready,    setReady]    = useState(false);

  const dQuery = useDebounce(query, 420);

  /* Stable particle data */
  const particles = useRef(
    Array.from({ length: 14 }, (_, i) => ({
      left:  `${5 + i * 6.5}%`,
      top:   `${15 + (i % 5) * 17}%`,
      size:  `${3 + (i % 4) * 2.5}px`,
      delay: `${i * 0.4}s`,
      dur:   `${3 + (i % 3)}s`,
    }))
  ).current;

  /* ── Fetch ──────────────────────────────────────────────────────── */
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setReady(false);
    const q     = dQuery.trim() || "popular fiction";
    const qFull = category ? `${q}+subject:${category}` : q;
    const cKey  = `pp_cache_books_${qFull.toLowerCase().replace(/[\s+]+/g, "_")}`;

    try {
      const cached = (() => {
        try {
          const c = localStorage.getItem(cKey);
          if (c) { const p = JSON.parse(c); if (Date.now() - p.t < 2 * 60 * 60 * 1000) return p.v; }
        } catch {}
        return null;
      })();

      if (cached) {
        setBooks(cached); setLoading(false);
        requestAnimationFrame(() => setReady(true));
        return;
      }

      const r = await fetch(
        `${BOOKS_API}?q=${encodeURIComponent(qFull)}&maxResults=18&orderBy=relevance&langRestrict=en`
      );
      const d = await r.json();
      const items = d.items || [];
      if (items.length > 0) {
        try { localStorage.setItem(cKey, JSON.stringify({ v: items, t: Date.now() })); } catch {}
      }
      setBooks(items);
    } catch { setBooks([]); }

    setLoading(false);
    requestAnimationFrame(() => setReady(true));
  }, [dQuery, category]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleAdd = async ({ book, title, author, genre, cover, bookLink }) => {
    if (!isLoggedIn) { info("Sign in to save books!"); return; }
    const bookId = book.id || title;
    if (isInReading(bookId)) { info(`"${title}" is already in your reading list.`); return; }
    await addToReading({ bookId, title, author, genre, cover, bookLink });
    success(`Added "${title}" to your reading list! 📚`);
  };

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="bp-page">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="bp-hero">
        <div className="bp-orb bp-orb-a" aria-hidden="true" />
        <div className="bp-orb bp-orb-b" aria-hidden="true" />
        <div className="bp-orb bp-orb-c" aria-hidden="true" />

        {particles.map((p, i) => (
          <div
            key={i}
            className="bp-particle"
            aria-hidden="true"
            style={{ left: p.left, top: p.top, width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.dur }}
          />
        ))}

        <div className="bp-hero-body">
          <div className="bp-hero-icon" aria-hidden="true">📚</div>
          <h1 className="bp-hero-h1"><span className="bp-sweep">Books</span></h1>
          <p className="bp-hero-sub">Discover stories, knowledge &amp; ideas — build your reading list</p>

          <div className="bp-stats" aria-label="Library stats">
            <div className="bp-stat"><span className="bp-stat-n">18M+</span><span className="bp-stat-l">Books</span></div>
            <div className="bp-stat-div" />
            <div className="bp-stat"><span className="bp-stat-n">40+</span><span className="bp-stat-l">Genres</span></div>
            <div className="bp-stat-div" />
            <div className="bp-stat"><span className="bp-stat-n">Free</span><span className="bp-stat-l">Access</span></div>
          </div>
        </div>

        <div className="bp-ticker" aria-hidden="true">
          <div className="bp-ticker-inner">
            {[
              "The Alchemist","Dune","Atomic Habits","1984","Harry Potter","Sapiens",
              "The Hobbit","Rich Dad Poor Dad","To Kill a Mockingbird","Clean Code",
              "The Great Gatsby","Thinking Fast and Slow","The Alchemist","Dune",
              "Atomic Habits","1984","Harry Potter","Sapiens","The Hobbit",
              "Rich Dad Poor Dad","To Kill a Mockingbird","Clean Code",
            ].map((t, i) => (
              <span key={i} className="bp-tick">📚 {t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <div className="bp-body-wrap">

        {/* Search */}
        <div className="bp-search-row">
          <div className="bp-input-wrap">
            <span className="bp-search-ico" aria-hidden="true">🔍</span>
            <input
              className="bp-search"
              type="text"
              placeholder="Search books, authors, topics…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              aria-label="Search books"
            />
            {query && (
              <button className="bp-clear" onClick={() => setQuery("")} aria-label="Clear">✕</button>
            )}
          </div>
        </div>

        {/* Genre pills */}
        <div className="bp-pills" role="group" aria-label="Filter by genre">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.value}
              className={`bp-pill${category === c.value ? " bp-pill-active" : ""}`}
              style={{ "--pi": i }}
              onClick={() => setCat(c.value)}
              aria-pressed={category === c.value}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Count */}
        {!loading && books.length > 0 && (
          <p className="bp-count" aria-live="polite">
            Showing <strong>{books.length}</strong> book{books.length !== 1 ? "s" : ""}
            {query && <> for "<em>{query}</em>"</>}
          </p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="bp-grid">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} i={i} />)}
          </div>
        ) : books.length === 0 ? (
          <div className="bp-empty" role="status">
            <span className="bp-empty-ico">📚</span>
            <p className="bp-empty-h">No books found</p>
            <p className="bp-empty-sub">Try a different search or genre</p>
            <button className="bp-pill bp-pill-active bp-reset" onClick={() => { setQuery(""); setCat(""); }}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className={`bp-grid${ready ? " bp-grid-go" : ""}`} role="list">
            {books.map((b, i) => (
              <BookCard key={b.id} book={b} onAdd={handleAdd} inList={isInReading(b.id)} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* ── Styles ────────────────────────────────────────────────── */}
      <style>{`
        /* Page */
        .bp-page { overflow-x: hidden; }

        /* Hero */
        .bp-hero {
          position: relative; overflow: hidden;
          padding: 4rem 1.5rem 2rem; text-align: center;
          border-bottom: 1px solid var(--border, rgba(128,128,128,.15));
        }

        /* Orbs */
        .bp-orb {
          position: absolute; border-radius: 50%;
          pointer-events: none; filter: blur(100px); opacity: .12;
          animation: bp-drift 10s ease-in-out infinite alternate;
        }
        .bp-orb-a { width: 420px; height: 420px; background: var(--accent,#f5c542); top: -140px; left: -100px; }
        .bp-orb-b { width: 280px; height: 280px; background: #4a90d9; top: -60px; right: -80px; animation-duration: 8s; animation-delay: 2s; }
        .bp-orb-c { width: 200px; height: 200px; background: #e0522a; bottom: -60px; left: 40%; animation-duration: 12s; animation-delay: 1s; }
        @keyframes bp-drift {
          from { transform: translateY(0) scale(1); }
          to   { transform: translateY(-30px) scale(1.12); }
        }

        /* Particles */
        .bp-particle {
          position: absolute; border-radius: 50%;
          background: var(--accent, #f5c542); opacity: .15;
          pointer-events: none;
          animation: bp-float linear infinite;
        }
        @keyframes bp-float {
          0%   { transform: translateY(0) rotate(0deg); }
          50%  { transform: translateY(-20px) rotate(180deg); opacity: .28; }
          100% { transform: translateY(0) rotate(360deg); }
        }

        /* Hero body */
        .bp-hero-body { position: relative; z-index: 1; animation: bp-up .7s cubic-bezier(.22,1,.36,1) both; }
        .bp-hero-icon {
          font-size: 3rem; display: block; margin-bottom: .5rem;
          animation: bp-pop .6s cubic-bezier(.34,1.56,.64,1) .1s both;
        }
        @keyframes bp-pop {
          from { transform: scale(.3) rotate(-20deg); opacity: 0; }
          to   { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .bp-hero-h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(3rem, 8vw, 5.5rem);
          font-weight: 900; margin: 0 0 .5rem; line-height: 1;
        }
        .bp-sweep {
          background: linear-gradient(90deg, var(--accent,#f5c542) 0%, #4a90d9 45%, var(--accent,#f5c542) 90%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
          animation: bp-sweep 5s linear infinite;
        }
        @keyframes bp-sweep { from { background-position: 200% center; } to { background-position: -200% center; } }
        .bp-hero-sub {
          color: var(--text2); font-size: clamp(.9rem, 2vw, 1.05rem);
          margin: 0 auto .5rem; max-width: 500px;
          animation: bp-up .6s ease .2s both;
        }
        @keyframes bp-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Stats */
        .bp-stats {
          display: inline-flex; align-items: center; gap: 1.5rem;
          margin-top: 1.25rem; padding: .65rem 1.8rem;
          background: rgba(255,255,255,.04);
          border: 1px solid var(--border, rgba(128,128,128,.15));
          border-radius: 999px; backdrop-filter: blur(8px);
          animation: bp-up .6s ease .35s both;
        }
        .bp-stat { display: flex; flex-direction: column; align-items: center; gap: .08rem; }
        .bp-stat-n {
          font-family: 'Syne', sans-serif; font-size: 1.1rem;
          font-weight: 800; color: var(--accent, #f5c542); line-height: 1;
        }
        .bp-stat-l { font-size: .62rem; color: var(--text2); letter-spacing: .05em; text-transform: uppercase; }
        .bp-stat-div { width: 1px; height: 28px; background: var(--border, rgba(128,128,128,.2)); }

        /* Ticker */
        .bp-ticker {
          position: relative; z-index: 1; overflow: hidden; margin-top: 1.75rem;
          mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 10%, black 90%, transparent);
        }
        .bp-ticker-inner { display: flex; gap: 2.5rem; width: max-content; animation: bp-tick 50s linear infinite; }
        @keyframes bp-tick { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .bp-tick { color: var(--text2); font-size: .75rem; white-space: nowrap; opacity: .45; }

        /* Body */
        .bp-body-wrap { max-width: 1400px; margin: 0 auto; padding: 2rem 1.5rem 5rem; }

        /* Search */
        .bp-search-row { margin-bottom: 1.25rem; }
        .bp-input-wrap { position: relative; }
        .bp-search-ico {
          position: absolute; left: 1.1rem; top: 50%; transform: translateY(-50%);
          font-size: 1rem; pointer-events: none; z-index: 2;
        }
        .bp-search {
          width: 100%; padding: .7rem 2.8rem; border-radius: 2rem;
          border: 1.5px solid var(--border, rgba(128,128,128,.2));
          background: var(--bg2, rgba(255,255,255,.04));
          color: var(--text); font-size: .95rem; font-family: 'Outfit', sans-serif;
          outline: none; transition: border-color .25s, box-shadow .25s; box-sizing: border-box;
        }
        .bp-search::placeholder { color: var(--text2); }
        .bp-search:focus {
          border-color: var(--accent, #f5c542);
          box-shadow: 0 0 0 3px rgba(245,197,66,.15);
        }
        .bp-clear {
          position: absolute; right: .9rem; top: 50%; transform: translateY(-50%);
          background: rgba(128,128,128,.15); border: none; color: var(--text2);
          width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
          font-size: .6rem; display: flex; align-items: center; justify-content: center;
          transition: background .2s, color .2s; z-index: 2;
        }
        .bp-clear:hover { background: rgba(224,82,42,.2); color: #e0522a; }

        /* Pills */
        .bp-pills {
          display: flex; flex-wrap: wrap; gap: .45rem; margin-bottom: 1.5rem;
          animation: bp-up .5s ease .3s both;
        }
        .bp-pill {
          padding: .38rem .9rem; border-radius: 999px;
          border: 1.5px solid var(--border, rgba(128,128,128,.2));
          background: transparent; color: var(--text2); font-size: .8rem;
          font-family: 'Outfit', sans-serif; font-weight: 500;
          cursor: pointer; white-space: nowrap;
          transition: background .2s, border-color .2s, color .2s, transform .15s;
          animation: bp-pill-pop .4s cubic-bezier(.34,1.56,.64,1) calc(.3s + var(--pi,0) * .05s) both;
        }
        @keyframes bp-pill-pop {
          from { opacity: 0; transform: scale(.65) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .bp-pill:hover {
          border-color: var(--accent, #f5c542); color: var(--accent, #f5c542);
          background: rgba(245,197,66,.07); transform: translateY(-1px);
        }
        .bp-pill-active {
          background: var(--accent, #f5c542) !important; border-color: var(--accent, #f5c542) !important;
          color: #07101f !important; font-weight: 700;
        }

        /* Count */
        .bp-count {
          text-align: center; font-size: .82rem; color: var(--text2);
          margin: 0 0 1.5rem; animation: bp-up .4s ease both;
        }
        .bp-count strong { color: var(--accent, #f5c542); }
        .bp-count em { font-style: italic; }

        /* Grid */
        .bp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 1.25rem; }

        /* Card initial state */
        .bp-grid .bp-card { opacity: 0; transform: translateY(24px) scale(.96); }
        .bp-grid.bp-grid-go .bp-card {
          animation: bp-card-in .52s cubic-bezier(.22,1,.36,1) var(--di, 0s) both;
        }
        @keyframes bp-card-in {
          from { opacity: 0; transform: translateY(24px) scale(.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* Card */
        .bp-card {
          position: relative; display: flex; flex-direction: column;
          border-radius: 14px; overflow: hidden;
          border: 1px solid var(--border, rgba(128,128,128,.12));
          background: var(--card, var(--bg2));
          cursor: pointer; will-change: transform;
          transition: transform .3s cubic-bezier(.22,1,.36,1), box-shadow .3s, border-color .25s;
        }
        .bp-card:hover {
          border-color: var(--accent, #f5c542);
          box-shadow: 0 12px 40px rgba(0,0,0,.3), 0 0 0 1px rgba(245,197,66,.12);
        }
        .bp-card:focus-visible { outline: 2px solid var(--accent, #f5c542); outline-offset: 2px; }

        /* Animated glow border */
        .bp-card-glow {
          position: absolute; inset: -2px; border-radius: 15px; z-index: -1;
          background: conic-gradient(from 0deg, transparent 0deg, var(--accent,#f5c542) 60deg, transparent 120deg);
          opacity: 0; transition: opacity .3s;
          animation: bp-spin 3.5s linear infinite;
        }
        .bp-card:hover .bp-card-glow { opacity: .4; }
        @keyframes bp-spin { to { transform: rotate(360deg); } }

        /* Cover */
        .bp-img-wrap { position: relative; overflow: hidden; line-height: 0; flex-shrink: 0; }
        .bp-img-wrap img {
          width: 100%; aspect-ratio: 2 / 3;
          object-fit: cover; object-position: center top;
          display: block; background: var(--bg2);
          transition: transform .45s cubic-bezier(.22,1,.36,1);
        }
        .bp-card:hover .bp-img-wrap img { transform: scale(1.08); }

        /* Badge */
        .bp-badge {
          position: absolute; top: 8px; left: 8px;
          background: rgba(0,0,0,.72); backdrop-filter: blur(6px);
          color: #f5c542; font-size: .65rem; font-weight: 700;
          padding: .18rem .5rem; border-radius: 999px;
          border: 1px solid rgba(245,197,66,.35); z-index: 2; line-height: 1.4;
        }

        /* Overlay */
        .bp-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.35) 55%, transparent 100%);
          display: flex; align-items: flex-end;
          opacity: 0; transform: translateY(4px);
          transition: opacity .28s, transform .28s; z-index: 3;
        }
        .bp-card:hover .bp-overlay { opacity: 1; transform: translateY(0); }
        .bp-overlay-inner { padding: .75rem; width: 100%; }
        .bp-ol-title {
          font-family: 'Syne', sans-serif; font-size: .78rem; font-weight: 700;
          color: #fff; margin: 0 0 .12rem; line-height: 1.25;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }
        .bp-ol-meta { font-size: .64rem; color: rgba(255,255,255,.5); margin: 0 0 .4rem; }
        .bp-ol-cta {
          display: inline-block; font-size: .64rem; font-weight: 700;
          color: var(--accent, #f5c542); padding: .2rem .55rem;
          border: 1px solid rgba(245,197,66,.4); border-radius: 999px;
          background: rgba(245,197,66,.1);
        }

        /* Body */
        .bp-body { display: flex; flex-direction: column; gap: .3rem; padding: .75rem; flex: 1; }
        .bp-title {
          font-family: 'Syne', sans-serif; font-size: .82rem; font-weight: 700;
          color: var(--text); margin: 0; line-height: 1.25;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 2.1em;
        }
        .bp-author { font-size: .72rem; color: var(--text2); margin: 0; line-height: 1.3; }
        .bp-meta-row { display: flex; align-items: center; flex-wrap: wrap; gap: .25rem; font-size: .7rem; }
        .bp-rating { color: var(--accent, #f5c542); font-weight: 600; }
        .bp-genre-chip {
          font-size: .6rem; padding: .05rem .4rem; border-radius: 999px;
          background: rgba(74,144,217,.1); color: #4a90d9;
          border: 1px solid rgba(74,144,217,.2); margin-left: auto; white-space: nowrap;
        }

        /* Button */
        .bp-btn {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center; gap: .3rem;
          width: 100%; margin-top: auto; padding: .42rem .75rem;
          border-radius: 999px; border: 1.5px solid var(--accent, #f5c542);
          background: transparent; color: var(--accent, #f5c542);
          font-family: 'Outfit', sans-serif; font-size: .74rem; font-weight: 600;
          cursor: pointer;
          transition: background .22s, color .22s, transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .22s;
        }
        .bp-btn:hover {
          background: var(--accent, #f5c542); color: #07101f;
          transform: scale(1.04); box-shadow: 0 4px 18px rgba(245,197,66,.3);
        }
        .bp-btn:active { transform: scale(.97); }
        .bp-btn-added {
          background: rgba(245,197,66,.1) !important; border-color: transparent !important;
          color: var(--accent, #f5c542) !important; cursor: default;
        }
        .bp-btn-added:hover { transform: none !important; box-shadow: none !important; }
        .bp-btn-icon { font-size: .9rem; font-weight: 800; line-height: 1; }

        /* Ripple */
        .bp-ripple {
          position: absolute; border-radius: 50%;
          background: rgba(255,255,255,.28); transform: scale(0);
          pointer-events: none; animation: bp-rip .6s ease-out forwards;
        }
        @keyframes bp-rip { to { transform: scale(3); opacity: 0; } }

        /* Skeleton */
        .bp-skel {
          border-radius: 14px; overflow: hidden;
          background: var(--card, var(--bg2));
          border: 1px solid var(--border, rgba(128,128,128,.1));
          animation: bp-up .4s ease var(--si, 0s) both;
        }
        .bp-skel-img { width: 100%; aspect-ratio: 2 / 3; }
        .bp-skel-body { padding: .75rem; display: flex; flex-direction: column; gap: 0; }
        .bp-skel-line { height: 13px; border-radius: 6px; }
        .bp-shimmer {
          background: linear-gradient(90deg,
            rgba(128,128,128,.06) 0%, rgba(128,128,128,.18) 50%, rgba(128,128,128,.06) 100%);
          background-size: 200% 100%;
          animation: bp-shim 1.7s ease-in-out infinite;
        }
        @keyframes bp-shim { from { background-position: 200% 0; } to { background-position: -200% 0; } }

        /* Empty */
        .bp-empty { display: flex; flex-direction: column; align-items: center; gap: .5rem; padding: 5rem 1rem; text-align: center; }
        .bp-empty-ico { font-size: 3.5rem; animation: bp-bob 3s ease-in-out infinite; }
        @keyframes bp-bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .bp-empty-h { font-family: 'Syne', sans-serif; font-size: 1.2rem; font-weight: 800; color: var(--text); margin: .5rem 0 0; }
        .bp-empty-sub { color: var(--text2); font-size: .88rem; margin: 0; }
        .bp-reset { margin-top: .75rem; cursor: pointer; }

        /* Responsive */
        @media (max-width: 900px) {
          .bp-hero { padding: 3rem 1.25rem 1.5rem; }
          .bp-body-wrap { padding: 1.5rem 1rem 3rem; }
          .bp-stats { gap: 1rem; padding: .6rem 1.2rem; }
        }
        @media (max-width: 640px) {
          .bp-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: .9rem; }
          .bp-pills { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; scroll-snap-type: x mandatory; }
          .bp-pill { scroll-snap-align: start; }
          .bp-pills::-webkit-scrollbar { height: 2px; }
          .bp-pills::-webkit-scrollbar-thumb { background: var(--accent, #f5c542); border-radius: 2px; }
          .bp-hero-sub, .bp-ticker, .bp-stats { display: none; }
        }
        @media (max-width: 400px) { .bp-grid { grid-template-columns: repeat(2, 1fr); } }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .bp-orb, .bp-ticker-inner, .bp-sweep, .bp-shimmer,
          .bp-empty-ico, .bp-particle, .bp-card-glow { animation: none !important; }
          .bp-grid .bp-card { opacity: 1 !important; transform: none !important; }
          .bp-grid.bp-grid-go .bp-card { animation: none !important; }
          .bp-card { transition: none !important; }
          .bp-btn { transition: none !important; }
        }
      `}</style>
    </div>
  );
}
