// src/pages/HomePage.jsx  ── PRODUCTION VERSION ──
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useLists } from '../context/ListsContext';
import { useToast } from '../context/ToastContext';
import { useAuth }  from '../context/AuthContext';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
} from 'framer-motion';
import MeetTheTeam from '../components/MeetTheTeam';

/* ─────────────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────────────── */
const OMDB_KEY  = import.meta.env.VITE_OMDB_KEY  || 'trilogy';
const PH_MOVIE  = 'https://placehold.co/342x513/07101f/f5c542?text=No+Poster';

const TRENDING_IDS = [
  { imdbID: 'tt0468569', title: 'The Dark Knight',           genre: 'Action'    },
  { imdbID: 'tt1375666', title: 'Inception',                 genre: 'Sci-Fi'    },
  { imdbID: 'tt4154796', title: 'Avengers: Endgame',         genre: 'Action'    },
  { imdbID: 'tt6751668', title: 'Parasite',                  genre: 'Thriller'  },
  { imdbID: 'tt0245429', title: 'Spirited Away',             genre: 'Animation' },
  { imdbID: 'tt0111161', title: 'The Shawshank Redemption',  genre: 'Drama'     },
  { imdbID: 'tt1187043', title: '3 Idiots',                  genre: 'Comedy'    },
  { imdbID: 'tt0816692', title: 'Interstellar',              genre: 'Sci-Fi'    },
];

const HERO_SLIDES = [
  { url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1920&q=80', label: 'Cinema' },
  { url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1920&q=80', label: 'Neon City' },
  { url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1920&q=80', label: 'Concert' },
  { url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=1920&q=80', label: 'Movies' },
  { url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=1920&q=80', label: 'Gaming' },
];

const ease = [0.22, 1, 0.36, 1];

/* ─────────────────────────────────────────────────────────────
   ANIMATION VARIANTS
───────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden:  { opacity: 0, y: 40 },
  visible: (d = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: d, ease } }),
};
const fadeLeft = {
  hidden:  { opacity: 0, x: -50 },
  visible: (d = 0) => ({ opacity: 1, x: 0, transition: { duration: 0.6, delay: d, ease } }),
};
const fadeRight = {
  hidden:  { opacity: 0, x: 50 },
  visible: (d = 0) => ({ opacity: 1, x: 0, transition: { duration: 0.6, delay: d, ease } }),
};
const popIn = {
  hidden:  { opacity: 0, scale: 0.8 },
  visible: (d = 0) => ({ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 280, damping: 20, delay: d } }),
};
const blurReveal = {
  hidden:  { opacity: 0, y: 50, filter: 'blur(14px)' },
  visible: (d = 0) => ({ opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.9, delay: d, ease } }),
};
const stagger      = { hidden: {}, visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } };
const staggerFast  = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } };

/* ─────────────────────────────────────────────────────────────
   SCROLL REVEAL WRAPPER
───────────────────────────────────────────────────────────── */
function Reveal({ children, variant = 'up', delay = 0, className = '' }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-70px' });
  const map    = { up: fadeUp, left: fadeLeft, right: fadeRight, pop: popIn };
  const v      = map[variant] || fadeUp;
  return (
    <motion.div ref={ref} className={className} variants={v} custom={delay}
      initial="hidden" animate={inView ? 'visible' : 'hidden'}>
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SCROLL PROGRESS BAR
───────────────────────────────────────────────────────────── */
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '3px',
        background: 'linear-gradient(90deg, #f5c542, #ffd97a, #f59e0b)',
        transformOrigin: '0%', scaleX, zIndex: 9999,
        boxShadow: '0 0 12px rgba(245,197,66,0.7)',
      }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   MAGNETIC BUTTON WRAPPER
───────────────────────────────────────────────────────────── */
function MagneticBtn({ children, strength = 0.4 }) {
  const ref = useRef(null);
  const x   = useMotionValue(0);
  const y   = useMotionValue(0);
  const sx  = useSpring(x, { stiffness: 350, damping: 20 });
  const sy  = useSpring(y, { stiffness: 350, damping: 20 });

  const handleMove = (e) => {
    if (!ref.current) return;
    const r  = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  };
  const handleLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div ref={ref} style={{ x: sx, y: sy, display: 'inline-block' }}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TYPEWRITER HOOK
───────────────────────────────────────────────────────────── */
function useTypewriter(text, speed = 38, startDelay = 1200) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay]);
  return displayed;
}

/* ─────────────────────────────────────────────────────────────
   SHIMMER SKELETON CARD
───────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skel-img shimmer" />
      <div className="skel-body">
        <div className="skel-line shimmer" style={{ width: '75%' }} />
        <div className="skel-line shimmer" style={{ width: '50%', height: '10px', marginTop: '6px' }} />
        <div className="skel-btn shimmer" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3-D TILT MOVIE CARD
───────────────────────────────────────────────────────────── */
function MovieCard({ movie, onAdd, inList }) {
  const poster  = (movie.Poster && movie.Poster !== 'N/A') ? movie.Poster : PH_MOVIE;
  const jwUrl   = `https://www.justwatch.com/in/search?q=${encodeURIComponent(movie.title)}`;
  const ref     = useRef(null);
  const mx      = useMotionValue(0);
  const my      = useMotionValue(0);
  const rx      = useSpring(useTransform(my, [-0.5, 0.5], [9, -9]),  { stiffness: 300, damping: 28 });
  const ry      = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]),  { stiffness: 300, damping: 28 });
  const shine   = useMotionValue('radial-gradient(circle at 50% 50%, rgba(255,255,255,0.08), transparent 60%)');

  const handleMove = (e) => {
    const r  = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    mx.set(px - 0.5);
    my.set(py - 0.5);
    shine.set(`radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.13), transparent 55%)`);
  };
  const handleLeave = () => {
    mx.set(0); my.set(0);
    shine.set('radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04), transparent 60%)');
  };

  return (
    <motion.div
      ref={ref}
      className="media-card card"
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
      variants={fadeUp}
      whileHover={{ y: -10, boxShadow: '0 28px 56px rgba(245,197,66,0.22)', transition: { type: 'spring', stiffness: 300, damping: 22 } }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <motion.div className="card-shine" style={{ background: shine }} />

      <div className="mc-img-wrap">
        <img src={poster} alt={movie.title} loading="lazy" onError={(e) => { e.target.src = PH_MOVIE; }} />
        <motion.div className="mc-overlay" initial={{ opacity: 0 }} whileHover={{ opacity: 1 }} transition={{ duration: 0.22 }}>
          <a href={jwUrl} target="_blank" rel="noopener noreferrer" className="mc-watch-btn">
            ▶ Where to Watch
          </a>
        </motion.div>
        {movie.genre && (
          <div className="mc-genre-tag">{movie.genre}</div>
        )}
      </div>

      <div className="mc-body">
        <div className="mc-title">{movie.title}</div>
        {movie.imdbRating && movie.imdbRating !== 'N/A' && (
          <div className="mc-rating">⭐ {movie.imdbRating} · {movie.Year || ''}</div>
        )}
        <motion.button
          className={`mc-add-btn${inList ? ' added' : ''}`}
          onClick={() => onAdd(movie)}
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.91 }}
        >
          {inList ? '✓ In List' : '+ Watchlist'}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   DRAGGABLE HORIZONTAL MOVIE STRIP  — fixed constraints
───────────────────────────────────────────────────────────── */
function MovieStrip({ movies, onAdd, isInWatchlist }) {
  const viewportRef  = useRef(null);
  const trackRef     = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });

  /* Recalculate drag bounds whenever movies change or window resizes */
  const recalc = useCallback(() => {
    if (!viewportRef.current || !trackRef.current) return;
    const vw = viewportRef.current.offsetWidth;
    const tw = trackRef.current.scrollWidth;
    const leftBound = Math.min(0, vw - tw - 16);
    setDragConstraints({ left: leftBound, right: 0 });
  }, []);

  useEffect(() => {
    // Small timeout lets the DOM paint first so scrollWidth is accurate
    const t = setTimeout(recalc, 80);
    window.addEventListener('resize', recalc);
    return () => { clearTimeout(t); window.removeEventListener('resize', recalc); };
  }, [recalc, movies]);

  return (
    <div className="strip-viewport" ref={viewportRef}>
      <motion.div
        ref={trackRef}
        className="strip-track"
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={0.06}
        dragMomentum
        dragTransition={{ bounceStiffness: 300, bounceDamping: 35, power: 0.3, timeConstant: 300 }}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
        whileTap={{ cursor: 'grabbing' }}
      >
        <motion.div
          className="strip-inner"
          variants={staggerFast}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {movies.map((m) => (
            <MovieCard
              key={m.imdbID}
              movie={m}
              onAdd={onAdd}
              inList={isInWatchlist(m.imdbID)}
            />
          ))}
        </motion.div>
      </motion.div>
      <motion.p
        className="drag-hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        ← drag to explore →
      </motion.p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANIMATED FEATURE CARD
───────────────────────────────────────────────────────────── */
function FeatureCard({ f, i }) {
  const ref    = useRef(null);
  const mx     = useMotionValue(0.5);
  const my     = useMotionValue(0.5);
  const rotX   = useSpring(useTransform(my, [0, 1], [6, -6]),  { stiffness: 250, damping: 25 });
  const rotY   = useSpring(useTransform(mx, [0, 1], [-6, 6]),  { stiffness: 250, damping: 25 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top)  / r.height);
  };
  const onLeave = () => { mx.set(0.5); my.set(0.5); };

  return (
    <motion.div variants={fadeUp} custom={i * 0.06}>
      <motion.div
        ref={ref}
        style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d', perspective: 800 }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        whileHover={{
          y: -10,
          boxShadow: `0 20px 50px ${f.color}30`,
          transition: { type: 'spring', stiffness: 300, damping: 20 },
        }}
      >
        <Link to={f.to} className="feature-card card" style={{ '--fc': f.color }}>
          <motion.div
            className="fc-icon"
            whileHover={{ scale: 1.25, rotate: [-6, 6, -6, 0] }}
            transition={{ duration: 0.45 }}
          >
            {f.icon}
          </motion.div>
          <div className="fc-title">{f.title}</div>
          <div className="fc-desc">{f.desc}</div>
          <motion.div className="fc-arrow" initial={{ x: 0 }} whileHover={{ x: 6 }} transition={{ type: 'spring', stiffness: 400 }}>
            →
          </motion.div>
          <div className="fc-color-bar" style={{ background: f.color }} />
        </Link>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ANIMATED FAQ
───────────────────────────────────────────────────────────── */
function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={index * 0.06}>
      <motion.div
        className={`faq-item${open ? ' open' : ''}`}
        onClick={() => setOpen(v => !v)}
        whileHover={{ borderColor: 'rgba(245,197,66,0.55)', x: 3 }}
        transition={{ duration: 0.18 }}
      >
        <div className="faq-q">
          <span>{q}</span>
          <motion.span
            className="faq-chevron"
            animate={{ rotate: open ? 135 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            style={{ display: 'inline-block' }}
          >
            +
          </motion.span>
        </div>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              className="faq-a"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              style={{ overflow: 'hidden' }}
            >
              {a}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Reveal>
  );
}

/* ─────────────────────────────────────────────────────────────
   FLOATING PARTICLE
───────────────────────────────────────────────────────────── */
function Particle({ style }) {
  return (
    <motion.div
      style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', ...style }}
      animate={{ y: [0, -22, 0], opacity: [0.25, 0.7, 0.25] }}
      transition={{ duration: 3 + Math.random() * 3, repeat: Infinity, ease: 'easeInOut', delay: Math.random() * 2 }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   COUNTUP
───────────────────────────────────────────────────────────── */
function CountUp({ to, suffix = '' }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end  = parseInt(to.replace(/\D/g, ''));
    const step = (end / 1400) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(timer); }
      else setVal(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─────────────────────────────────────────────────────────────
   MARQUEE TICKER
───────────────────────────────────────────────────────────── */
function MarqueeTicker() {
  const items = ['🎬 Movies', '🎵 Songs', '📚 Books', '🎮 Games', '📅 Events', '🧠 AI Quiz', '🎙️ Podcasts', '🎧 Audiobooks'];
  const repeated = [...items, ...items, ...items];
  return (
    <div className="marquee-wrap">
      <motion.div
        className="marquee-track"
        animate={{ x: ['0%', '-33.33%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="marquee-item">{item}</span>
        ))}
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const { isLoggedIn }                      = useAuth();
  const { addToWatchlist, isInWatchlist }   = useLists();
  const { success, info }                   = useToast();

  const [trending, setTrending] = useState([]);
  const [loading,  setLoading]  = useState(true);
const [slideIdx, setSlideIdx] = useState(0);

// Auto-advance hero slides every 2 seconds
useEffect(() => {
  const timer = setInterval(() => {
    setSlideIdx(prev => (prev + 1) % HERO_SLIDES.length);
  }, 2000);
  return () => clearInterval(timer);
}, []);

  /* Parallax hero */
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '32%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  /* Typewriter hero sub */
  const subText = useTypewriter('Movies · Music · Books · Games · Events — all in one place, personalized for you.', 36, 900);

  /* Fetch trending */
  useEffect(() => {
    const cached = (() => {
      try {
        const c = localStorage.getItem('pp_cache_trending');
        if (c) { const p = JSON.parse(c); if (Date.now() - p.t < 6 * 60 * 60 * 1000) return p.v; }
      } catch {} return null;
    })();
    if (cached) { setTrending(cached); setLoading(false); return; }
    Promise.all(
      TRENDING_IDS.map(async (m) => {
        try {
          const r = await fetch(`https://www.omdbapi.com/?i=${m.imdbID}&apikey=${OMDB_KEY}`);
          const d = await r.json();
          return { ...m, Poster: d.Poster, imdbRating: d.imdbRating, Year: d.Year };
        } catch { return m; }
      })
    ).then((res) => {
      setTrending(res); setLoading(false);
      try { localStorage.setItem('pp_cache_trending', JSON.stringify({ v: res, t: Date.now() })); } catch {}
    });
  }, []);

  const handleAdd = async (movie) => {
    if (!isLoggedIn) { info('Sign in to save to your watchlist!'); return; }
    const added = await addToWatchlist({
      imdbID: movie.imdbID, title: movie.title,
      poster: movie.Poster !== 'N/A' ? movie.Poster : PH_MOVIE,
      year: movie.Year, genre: movie.genre, rating: movie.imdbRating,
    });
    if (added) success(`"${movie.title}" added to watchlist! 🎬`);
    else info(`"${movie.title}" is already in your watchlist.`);
  };

  const FEATURES = [
    { icon: '🎬', title: 'Movies',    desc: 'Discover films in any language with real-time streaming links.',  to: '/movies',  color: '#e50914' },
    { icon: '🎵', title: 'Songs',     desc: 'Preview tracks from pop, Bollywood, K-Pop, jazz & more.',          to: '/songs',   color: '#1db954' },
    { icon: '📚', title: 'Books',     desc: 'Explore millions of titles and build your reading list.',           to: '/books',   color: '#f59e0b' },
    { icon: '🎮', title: 'Games',     desc: 'Browse top-rated games across 8 genres via RAWG.',                 to: '/games',   color: '#8b5cf6' },
    { icon: '📅', title: 'Events',    desc: 'India concerts, e-sports, festivals & live events near you.',      to: '/events',  color: '#3b82f6' },
    { icon: '🧠', title: 'AI Quiz',   desc: 'Test your entertainment knowledge and earn Premium rewards.',       to: '/quiz',    color: '#f43f5e' },
  ];

  const STATS = [
    { value: '10', suffix: 'K+', label: 'Movies'   },
    { value: '50', suffix: 'K+', label: 'Books'    },
    { value: '1',  suffix: 'M+', label: 'Songs'    },
    { value: '500', suffix: '+', label: 'Podcasts' },
  ];

  const FAQS = [
    { q: 'What is Pixel Pirates?', a: 'Pixel Pirates is your all-in-one entertainment hub — movies, music, books, games and events, personalized just for you.' },
    { q: 'Is Pixel Pirates free to use?', a: 'Yes! The core platform is completely free. Premium unlocks unlimited AI quizzes, personalized recommendations, and an ad-free experience.' },
    { q: 'How does the AI Quiz work?', a: 'Answer 10 entertainment trivia questions. Score 80%+ on your first try to unlock Premium for free — forever!' },
    { q: 'Can I use it without signing up?', a: 'Absolutely. Browse movies, songs, books, games and events without an account. Sign up only to save lists and unlock quiz rewards.' },
    { q: 'What data do you store?', a: 'Only your email, name, and saved lists. We never sell your data. Your watchlist and reading list are yours alone.' },
  ];

  const MV_CARDS = [
    {
      icon: '🔭', title: 'Vision', items: [
        'A world where great content is never more than one click away.',
        'AI-powered recommendations that genuinely understand your taste.',
        'A platform that grows smarter the more you explore.',
        'Entertainment discovery that feels like talking to a friend.',
      ],
    },
    {
      icon: '🎯', title: 'Mission', items: [
        'To be the single destination for all entertainment discovery.',
        'To make finding what to watch, read, play or listen to effortless.',
        'To reward curiosity — through quizzes, lists, and smart recommendations.',
        'To build a community of passionate fans across every medium.',
      ],
    },
    {
      icon: '⚓', title: 'Our Aim', items: [
        'Bridge the gap between curiosity and content.',
        'Support indie films, underground music and hidden-gem books.',
        'Make entertainment tracking fun — not a chore.',
        'Keep the platform free and accessible for everyone.',
      ],
    },
  ];

  /* ── Render ── */
  return (
    <motion.div
      className="home-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
    >
      <ScrollProgressBar />

      {/* ════════════════════════════════════════
          HERO  — static slide, manual dot nav only
      ════════════════════════════════════════ */}
      <div className="home-hero" ref={heroRef}>

        <motion.div className="hero-slides" aria-hidden style={{ y: heroY }}>
          <AnimatePresence mode="sync">
            {HERO_SLIDES.map((slide, i) =>
              i === slideIdx ? (
                <motion.div
                  key={i}
                  className="hero-slide"
                  style={{ backgroundImage: `url(${slide.url})` }}
                  initial={{ opacity: 0, scale: 1.06 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 1.1, ease }}
                />
              ) : null
            )}
          </AnimatePresence>
          <div className="hero-slide-overlay" />
        </motion.div>

        <div className="home-hero-bg" aria-hidden>
          <div className="hero-aurora hero-aurora-1" />
          <div className="hero-aurora hero-aurora-2" />
          <div className="hero-aurora hero-aurora-3" />
          <div className="hero-grid" />
          <Particle style={{ width: 7,  height: 7,  background: '#f5c542', top: '20%', left: '15%' }} />
          <Particle style={{ width: 4,  height: 4,  background: '#3b82f6', top: '60%', left: '80%' }} />
          <Particle style={{ width: 5,  height: 5,  background: '#f5c542', top: '35%', left: '70%' }} />
          <Particle style={{ width: 3,  height: 3,  background: '#fff',    top: '75%', left: '30%' }} />
          <Particle style={{ width: 6,  height: 6,  background: '#ec4899', top: '15%', left: '55%' }} />
          <Particle style={{ width: 4,  height: 4,  background: '#a78bfa', top: '50%', left: '20%' }} />
          <Particle style={{ width: 5,  height: 5,  background: '#34d399', top: '80%', left: '65%' }} />
        </div>

        <motion.div
          className="container home-hero-inner"
          style={{ opacity: heroOpacity }}
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            variants={blurReveal} custom={0}
            className="hero-badge"
            whileHover={{ scale: 1.07, borderColor: 'rgba(245,197,66,0.6)' }}
          >
            <span className="live-dot" />
            ⚓ Your World, Our Pixels
          </motion.div>

          <motion.h1 className="hero-heading" variants={stagger}>
            {'Discover Endless'.split(' ').map((word, i) => (
              <motion.span
                key={i} variants={blurReveal} custom={i * 0.09}
                style={{ display: 'inline-block', marginRight: '0.3em' }}
              >
                {word}
              </motion.span>
            ))}
            <br />
            <motion.span
              className="hero-accent" variants={blurReveal} custom={0.24}
              style={{ display: 'inline-block' }}
            >
              Entertainment
            </motion.span>
          </motion.h1>

          <motion.p className="hero-sub" variants={fadeUp} custom={0.35}>
            {subText}
            <motion.span
              className="cursor-blink"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
            >|</motion.span>
          </motion.p>

          {/* Both CTAs use btn-primary; music button gets green override */}
          <motion.div className="hero-ctas" variants={fadeUp} custom={0.5}>
            <MagneticBtn>
              <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.94 }}>
                <Link to="/movies" className="btn btn-primary hero-cta">🎬 Browse Movies</Link>
              </motion.div>
            </MagneticBtn>
            <MagneticBtn>
              <motion.div whileHover={{ scale: 1.06, y: -3 }} whileTap={{ scale: 0.94 }}>
                <Link to="/songs" className="btn btn-primary hero-cta hero-cta--music">🎵 Explore Music</Link>
              </motion.div>
            </MagneticBtn>
          </motion.div>

          {/* Manual slide dots */}
          <motion.div className="hero-dots" variants={fadeUp} custom={0.6}>
            {HERO_SLIDES.map((_, i) => (
              <motion.button
                key={i}
                className={`hero-dot${i === slideIdx ? ' active' : ''}`}
                onClick={() => setSlideIdx(i)}
                aria-label={`Slide ${i + 1}`}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.85 }}
              />
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="scroll-cue"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8, duration: 0.7 }}
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ fontSize: '1.5rem' }}
          >↓</motion.div>
        </motion.div>
      </div>

      {/* ════ MARQUEE ════ */}
      <MarqueeTicker />

      {/* ════ STATS ════ */}
      <Reveal variant="up">
        <div className="stats-bar">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label} className="stat-item"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.55, ease }}
              whileHover={{ scale: 1.08 }}
            >
              <span className="stat-value"><CountUp to={s.value} suffix={s.suffix} /></span>
              <span className="stat-label">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* ════ TRENDING ════ */}
      <section className="home-section container">
        <Reveal variant="left">
          <div className="section-header">
            <div className="section-title">
              <motion.span className="icon"
                animate={{ scale: [1, 1.22, 1], rotate: [0, -8, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >🔥</motion.span>{' '}Trending Now
            </div>
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loader" className="strip-inner"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </motion.div>
          ) : (
            <motion.div key="grid">
              <MovieStrip movies={trending} onAdd={handleAdd} isInWatchlist={isInWatchlist} />
            </motion.div>
          )}
        </AnimatePresence>

        <Reveal variant="up" delay={0.1}>
          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <MagneticBtn>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link to="/movies" className="btn btn-ghost">View All Movies →</Link>
              </motion.div>
            </MagneticBtn>
          </div>
        </Reveal>
      </section>

      {/* ════ FEATURES ════ */}
      <section className="home-section container">
        <Reveal variant="up">
          <div className="section-header">
            <div className="section-title">
              <motion.span className="icon"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block' }}
              >⚡</motion.span>{' '}Everything in One Place
            </div>
          </div>
        </Reveal>
        <motion.div className="features-grid" variants={stagger}
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
        </motion.div>
      </section>

      {/* ════ TEAM ════ */}
      <section className="home-section container">
        <Reveal variant="up"><MeetTheTeam /></Reveal>
      </section>

      {/* ════ CTA BANNER ════ */}
      {!isLoggedIn && (
        <section className="home-section container">
          <Reveal variant="pop">
            <motion.div className="cta-banner"
              whileHover={{ scale: 1.012 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
              <motion.div className="cta-orb cta-orb-1"
                animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0.85, 0.45] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
              <motion.div className="cta-orb cta-orb-2"
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} />

              <div className="cta-content">
                <motion.span className="cta-icon"
                  animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.18, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 2 }}>
                  👑
                </motion.span>
                <div className="cta-text">
                  <h3 className="cta-title">Join Pixel Pirates Premium</h3>
                  <p className="cta-sub">Unlimited AI quizzes · Personalized recs · Ad-free experience</p>
                </div>
                {/* flex spacer pushes button to far right on desktop */}
                <div className="cta-spacer" aria-hidden="true" />
                <MagneticBtn>
                  <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.94 }}>
                    <Link to="/login" className="btn btn-primary cta-action-btn">Get Started Free</Link>
                  </motion.div>
                </MagneticBtn>
              </div>
            </motion.div>
          </Reveal>
        </section>
      )}

      {/* ════ MISSION & VISION ════ */}
      <section className="home-section container">
        <Reveal variant="up">
          <div className="section-header">
            <div className="section-title">
              <span className="icon">🏴‍☠️</span> Our Mission &amp; Vision
            </div>
          </div>
        </Reveal>
        <motion.div className="mv-grid" variants={stagger}
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
          {MV_CARDS.map((card, i) => (
            <motion.div key={card.title} className="mv-card card" variants={fadeUp} custom={i * 0.1}
              whileHover={{ y: -7, boxShadow: '0 24px 56px rgba(245,197,66,0.13)',
                borderColor: 'rgba(245,197,66,0.32)',
                transition: { type: 'spring', stiffness: 260, damping: 20 } }}>
              <motion.div className="mv-icon"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}>
                {card.icon}
              </motion.div>
              <h3 className="mv-title">{card.title}</h3>
              <ul className="mv-list">
                {card.items.map((item, j) => (
                  <motion.li key={j}
                    initial={{ opacity: 0, x: -18 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 + j * 0.07, duration: 0.48, ease }}>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ════ FAQ ════ */}
      <section className="home-section container">
        <Reveal variant="up">
          <div className="section-header">
            <div className="section-title">
              <motion.span className="icon"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                style={{ display: 'inline-block' }}>❓</motion.span>{' '}
              Frequently Asked Questions
            </div>
          </div>
        </Reveal>
        <div className="faq-list">
          {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} index={i} />)}
        </div>
      </section>

      {/* ════════════════════════════════════════
          STYLES
      ════════════════════════════════════════ */}
      <style>{`
        .home-page { padding-bottom: 5rem; }

        /* ── Marquee ── */
        .marquee-wrap {
          overflow: hidden;
          background: rgba(245,197,66,0.05);
          border-top: 1px solid rgba(245,197,66,0.1);
          border-bottom: 1px solid rgba(245,197,66,0.1);
          padding: 0.65rem 0; white-space: nowrap; position: relative; z-index: 2;
        }
        .marquee-track { display: inline-flex; gap: 0; will-change: transform; }
        .marquee-item {
          padding: 0 2.5rem; font-size: 0.8rem; font-weight: 600;
          letter-spacing: 0.06em; color: var(--accent); opacity: 0.75; text-transform: uppercase;
        }
        .marquee-item::after { content: '·'; padding-left: 2.5rem; opacity: 0.4; }

        /* ── Hero ── */
        .home-hero {
          position: relative; overflow: hidden;
          padding: calc(var(--nav-h, 70px) + 5rem) 0 6rem;
        }
        .hero-slides { position: absolute; inset: 0; z-index: 0; will-change: transform; }
        .hero-slide {
          position: absolute; inset: 0; background-size: cover;
          background-position: center; background-repeat: no-repeat;
        }
        .hero-slide-overlay {
          position: absolute; inset: 0; z-index: 2;
          background: linear-gradient(to bottom,
            rgba(7,16,31,0.50) 0%, rgba(7,16,31,0.72) 50%, rgba(7,16,31,0.95) 100%);
        }
        .home-hero-bg { position: absolute; inset: 0; pointer-events: none; z-index: 3; }
        .hero-aurora {
          position: absolute; border-radius: 50%; filter: blur(90px);
          pointer-events: none; animation: auroraPulse 6s ease-in-out infinite;
        }
        .hero-aurora-1 {
          width: 700px; height: 450px; top: -120px; left: -120px;
          background: radial-gradient(circle, rgba(245,197,66,0.10), transparent 70%);
          animation-duration: 5s;
        }
        .hero-aurora-2 {
          width: 500px; height: 380px; bottom: -80px; right: -100px;
          background: radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%);
          animation-delay: 2s; animation-duration: 7s; animation-direction: reverse;
        }
        .hero-aurora-3 {
          width: 350px; height: 280px; top: 40%; left: 40%;
          background: radial-gradient(circle, rgba(236,72,153,0.06), transparent 70%);
          animation-delay: 1s; animation-duration: 9s;
        }
        @keyframes auroraPulse {
          0%,100% { transform: scale(1) translateY(0); opacity: 1; }
          50%      { transform: scale(1.18) translateY(-12px); opacity: 0.65; }
        }
        .hero-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(var(--border, rgba(255,255,255,0.07)) 1px, transparent 1px),
            linear-gradient(90deg, var(--border, rgba(255,255,255,0.07)) 1px, transparent 1px);
          background-size: 56px 56px; opacity: 0.18;
        }
        .home-hero-inner { position: relative; z-index: 4; text-align: center; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background: rgba(245,197,66,0.08); border: 1px solid rgba(245,197,66,0.25);
          color: var(--accent, #f5c542); padding: 0.38rem 1.1rem; border-radius: 2rem;
          font-size: 0.8rem; font-weight: 600; letter-spacing: 0.05em;
          margin-bottom: 1.6rem; cursor: default; backdrop-filter: blur(6px);
        }
        .live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #f5c542;
          box-shadow: 0 0 0 0 rgba(245,197,66,0.5);
          animation: livePing 1.8s ease-in-out infinite;
        }
        @keyframes livePing {
          0%  { box-shadow: 0 0 0 0 rgba(245,197,66,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(245,197,66,0); }
          100%{ box-shadow: 0 0 0 0 rgba(245,197,66,0); }
        }
        .hero-heading {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.4rem, 6vw, 4.8rem);
          font-weight: 800; line-height: 1.08;
          letter-spacing: -2px; margin-bottom: 1.2rem; color: var(--text, #fff);
        }
        .hero-accent {
          background: linear-gradient(110deg, var(--accent, #f5c542) 30%, #ffd97a, #f5c542);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: shimmerText 3s linear infinite;
        }
        @keyframes shimmerText {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .cursor-blink { color: var(--accent, #f5c542); font-weight: 300; margin-left: 1px; }
        .hero-sub {
          font-size: clamp(0.95rem, 2vw, 1.15rem);
          color: var(--text2, rgba(255,255,255,0.65));
          max-width: 580px; margin: 0 auto 2.8rem; line-height: 1.75; min-height: 2.8em;
        }

        /* ── Hero CTAs — both match primary style; music overrides to green ── */
        .hero-ctas { display: flex; gap: 1.1rem; justify-content: center; flex-wrap: wrap; }
        .hero-cta  { padding: 0.9rem 2.1rem; font-size: 1rem; }
        

        .scroll-cue {
          position: absolute; bottom: 1.8rem; left: 50%; transform: translateX(-50%);
          z-index: 5; color: rgba(255,255,255,0.38); font-size: 1rem; pointer-events: none;
        }
        .hero-dots { display: flex; justify-content: center; gap: 0.55rem; margin-top: 2.8rem; }
        .hero-dot {
          width: 8px; height: 8px; border-radius: 50%; border: none;
          cursor: pointer; padding: 0; background: rgba(255,255,255,0.28);
          transition: background 0.3s, width 0.35s;
        }
        .hero-dot.active {
          background: var(--accent, #f5c542); width: 24px; border-radius: 4px;
          box-shadow: 0 0 8px rgba(245,197,66,0.5);
        }
        .hero-dot:hover:not(.active) { background: rgba(255,255,255,0.55); }

        /* ── Stats ── */
        .stats-bar {
          display: flex; justify-content: center; gap: clamp(20px, 6vw, 80px);
          padding: 2.4rem 5%;
          background: rgba(245,197,66,0.03);
          border-top: 1px solid rgba(255,255,255,0.05);
          border-bottom: 1px solid rgba(255,255,255,0.05);
          flex-wrap: wrap;
        }
        .stat-item { text-align: center; cursor: default; }
        .stat-value {
          display: block; font-family: 'Syne', sans-serif;
          font-size: clamp(1.9rem, 4vw, 3rem); font-weight: 800;
          background: linear-gradient(135deg, var(--accent, #f5c542), #ffd97a);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .stat-label {
          display: block; font-size: 0.8rem;
          color: var(--text2, rgba(255,255,255,0.5)); margin-top: 5px; letter-spacing: 0.05em;
        }

        /* ── Section headers — no section numbers ── */
        .home-section { padding: 4rem 0; }
        .section-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
        .section-title {
          font-family: 'Syne', sans-serif; font-size: clamp(1.35rem, 3vw, 1.9rem);
          font-weight: 700; color: var(--text, #fff);
          display: flex; align-items: center; gap: 0.5rem;
        }
        .section-title .icon { font-size: 1.4em; }

        /* ── Draggable strip ── */
        .strip-viewport {
          overflow: hidden; padding-bottom: 0.5rem;
          -webkit-user-select: none; user-select: none; position: relative;
        }
        .strip-track { width: max-content; will-change: transform; }
        .strip-inner {
          display: flex !important; flex-wrap: nowrap !important; gap: 1rem !important;
        }
        .strip-inner .media-card, .skeleton-card {
          min-width: clamp(150px, 18vw, 200px); flex-shrink: 0;
        }
        .drag-hint {
          text-align: center; font-size: 0.74rem;
          color: var(--text2, rgba(255,255,255,0.4));
          margin-top: 0.75rem; letter-spacing: 0.04em; pointer-events: none;
        }

        /* ── Skeleton ── */
        .skeleton-card {
          border-radius: var(--card-radius, 12px); overflow: hidden;
          background: var(--bg2, rgba(255,255,255,0.04));
        }
        .skel-img { width: 100%; aspect-ratio: 2/3; }
        .skel-body { padding: 0.85rem; display: flex; flex-direction: column; gap: 0.45rem; }
        .skel-line { height: 13px; border-radius: 4px; }
        .skel-btn  { height: 26px; width: 70%; border-radius: 2rem; margin-top: 4px; }
        .shimmer {
          background: linear-gradient(90deg,
            rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.11) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 200% 100%; animation: shimmer 1.6s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Card Shine ── */
        .card-shine {
          position: absolute; inset: 0; z-index: 10;
          border-radius: inherit; pointer-events: none;
        }

        /* ── Movie card ── */
        .media-card { overflow: hidden; cursor: default; position: relative; border-radius: var(--card-radius, 12px); }
        .mc-img-wrap { position: relative; overflow: hidden; }
        .mc-img-wrap img {
          width: 100%; display: block; aspect-ratio: 2/3; object-fit: cover;
          background: var(--bg2); transition: transform 0.5s cubic-bezier(0.22,1,0.36,1);
        }
        .media-card:hover .mc-img-wrap img { transform: scale(1.09); }
        .mc-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(7,16,31,0.95) 38%, transparent);
          display: flex; align-items: flex-end; padding: 0.8rem;
        }
        .mc-watch-btn {
          display: inline-flex; align-items: center; gap: 0.3rem;
          background: linear-gradient(135deg, #e50914, #c2000f); color: #fff;
          padding: 0.3rem 0.8rem; border-radius: 2rem; font-size: 0.7rem;
          font-weight: 700; text-decoration: none; transition: transform 0.2s, box-shadow 0.2s;
        }
        .mc-watch-btn:hover { transform: scale(1.06); box-shadow: 0 4px 12px rgba(229,9,20,0.45); }
        .mc-genre-tag {
          position: absolute; top: 0.55rem; right: 0.55rem;
          background: rgba(7,16,31,0.75); backdrop-filter: blur(6px);
          border: 1px solid rgba(245,197,66,0.25); color: var(--accent, #f5c542);
          font-size: 0.62rem; font-weight: 700; padding: 0.18rem 0.55rem;
          border-radius: 2rem; letter-spacing: 0.05em; text-transform: uppercase;
        }
        .mc-body { padding: 0.9rem; }
        .mc-title {
          font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.83rem;
          line-height: 1.3; margin-bottom: 0.28rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .mc-rating { font-size: 0.72rem; color: var(--text2); margin-bottom: 0.5rem; }
        .mc-add-btn {
          background: var(--accent, #f5c542); border: none;
          padding: 0.3rem 0.9rem; border-radius: 2rem;
          font-size: 0.72rem; font-weight: 600; font-family: 'Outfit', sans-serif;
          color: #07101f; cursor: pointer; transition: background 0.2s, box-shadow 0.2s;
        }
        .mc-add-btn:hover { background: var(--accent-dk, #d4a017); box-shadow: 0 4px 12px rgba(245,197,66,0.35); }
        .mc-add-btn.added { background: var(--success, #22c55e); color: #fff; }

        /* ── Feature grid ── */
        .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 1.25rem; }
        .feature-card {
          padding: 1.7rem 1.5rem; text-decoration: none; color: var(--text, #fff);
          display: flex; flex-direction: column; gap: 0.55rem;
          position: relative; overflow: hidden; transition: border-color 0.3s;
        }
        .fc-color-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; opacity: 0; transition: opacity 0.3s; }
        .feature-card:hover .fc-color-bar { opacity: 1; }
        .feature-card::after {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(circle at 0% 100%, rgba(245,197,66,0.05), transparent 60%);
          pointer-events: none;
        }
        .fc-icon { font-size: 2.1rem; }
        .fc-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.05rem; }
        .fc-desc  { font-size: 0.82rem; color: var(--text2); line-height: 1.58; flex: 1; }
        .fc-arrow { color: var(--accent); font-size: 1.1rem; margin-top: 0.35rem; }

        /* ── CTA Banner — button pinned to right on desktop ── */
        .cta-banner {
          background: var(--bg2, rgba(255,255,255,0.04));
          border: 1px solid rgba(245,197,66,0.22); border-radius: var(--card-radius, 12px);
          padding: 2.2rem 2.5rem; position: relative; overflow: hidden;
          transition: border-color 0.35s;
        }
        .cta-banner:hover { border-color: rgba(245,197,66,0.5); }
        .cta-orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(70px); }
        .cta-orb-1 {
          width: 280px; height: 280px; top: -80px; right: -60px;
          background: radial-gradient(circle, rgba(245,197,66,0.15), transparent 70%);
        }
        .cta-orb-2 {
          width: 220px; height: 220px; bottom: -70px; left: -40px;
          background: radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%);
        }
        .cta-content {
          position: relative; z-index: 1;
          display: flex; align-items: center; gap: 1.5rem; width: 100%;
        }
        /* spacer fills remaining width, pushing action button to the far right */
        .cta-spacer { flex: 1 1 0%; min-width: 0; }
        .cta-icon  { font-size: 2.6rem; flex-shrink: 0; }
        .cta-text  { flex-shrink: 0; }
        .cta-title { font-family: 'Syne', sans-serif; font-size: clamp(1.1rem, 2.5vw, 1.35rem); font-weight: 700; margin-bottom: 0.25rem; }
        .cta-sub   { font-size: 0.85rem; color: var(--text2); }
        .cta-action-btn { padding: 0.75rem 1.7rem; white-space: nowrap; flex-shrink: 0; }

        /* ── Mission & Vision ── */
        .mv-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; }
        .mv-card { padding: 2.1rem 1.9rem; transition: border-color 0.3s; }
        .mv-icon  { font-size: 2.3rem; margin-bottom: 0.8rem; }
        .mv-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1.2rem; color: var(--accent, #f5c542); margin-bottom: 1rem; }
        .mv-list  { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.7rem; }
        .mv-list li { font-size: 0.85rem; color: var(--text2); line-height: 1.65; padding-left: 1.2rem; position: relative; }
        .mv-list li::before { content: '▸'; position: absolute; left: 0; color: var(--accent, #f5c542); font-size: 0.75rem; top: 0.1rem; }

        /* ── FAQ ── */
        .faq-list { display: flex; flex-direction: column; gap: 0.8rem; max-width: 820px; margin: 0 auto; }
        .faq-item {
          background: var(--bg2, rgba(255,255,255,0.04));
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: var(--card-radius, 12px); padding: 1.25rem 1.6rem;
          cursor: pointer; transition: border-color 0.28s;
        }
        .faq-item.open { border-color: rgba(245,197,66,0.42); }
        .faq-q {
          display: flex; justify-content: space-between; align-items: center;
          font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.97rem;
          color: var(--text, #fff); gap: 1rem;
        }
        .faq-chevron { color: var(--accent, #f5c542); font-size: 1.5rem; font-weight: 300; flex-shrink: 0; line-height: 1; }
        .faq-a {
          margin-top: 0.9rem; font-size: 0.87rem;
          color: var(--text2, rgba(255,255,255,0.55)); line-height: 1.72;
          border-top: 1px solid rgba(255,255,255,0.07); padding-top: 0.9rem;
        }

        /* ═══ RESPONSIVE ═══ */
        @media (max-width: 900px) {
          .mv-grid { grid-template-columns: 1fr 1fr; }
          .features-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }
          .home-hero { padding: calc(var(--nav-h, 70px) + 3.5rem) 0 5rem; }
          .stats-bar { gap: 28px; }
        }
        @media (max-width: 680px) {
          .mv-grid { grid-template-columns: 1fr; }
          /* CTA stacks vertically; spacer hidden; button full-width */
          .cta-content { flex-wrap: wrap; }
          .cta-spacer  { display: none; }
          .cta-action-btn { width: 100%; text-align: center; }
          .hero-ctas { flex-direction: column; align-items: center; gap: 0.8rem; }
          .hero-cta  { width: 100%; max-width: 280px; justify-content: center; }
          .features-grid { grid-template-columns: 1fr 1fr; gap: 0.9rem; }
          .hero-heading { letter-spacing: -1px; }
          .section-header { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
          .cta-banner { padding: 1.6rem 1.4rem; }
          .home-section { padding: 2.8rem 0; }
          .stats-bar { padding: 1.8rem 4%; gap: 20px; }
        }
        @media (max-width: 420px) {
          .features-grid { grid-template-columns: 1fr; }
          .strip-inner .media-card, .skeleton-card { min-width: 140px; }
          .hero-badge { font-size: 0.72rem; padding: 0.3rem 0.85rem; }
          .cta-title { font-size: 1rem; }
          .mv-card { padding: 1.5rem 1.2rem; }
          .faq-item { padding: 1rem 1.2rem; }
          .faq-q { font-size: 0.88rem; }
        }
      `}</style>
    </motion.div>
  );
}
