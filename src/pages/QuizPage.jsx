// src/pages/QuizPage.jsx  —  ANIMATED VERSION
// Dependencies: framer-motion  →  npm install framer-motion
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth }  from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ── Variants ──────────────────────────────────────────────────────────────── */
const pageVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const cardVariants = {
  hidden:  { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1,    y: 0,  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, scale: 0.94, y: -20, transition: { duration: 0.3 } },
};

const questionVariants = {
  enter:  (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:   (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0, transition: { duration: 0.28 } }),
};

const optionVariants = {
  hidden:  { opacity: 0, x: -16 },
  visible: (i) => ({
    opacity: 1, x: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};

const fadeUp = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Confetti ──────────────────────────────────────────────────────────────── */
function Confetti({ active }) {
  const pieces = useRef(
    Array.from({ length: 48 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['#f5c542','#a78bfa','#34d399','#f87171','#60a5fa','#fb923c'][i % 6],
      delay: Math.random() * 0.6,
      duration: 1.4 + Math.random() * 0.8,
      rotate: Math.random() * 360,
      size: 6 + Math.random() * 7,
    }))
  ).current;

  if (!active) return null;
  return (
    <div className="confetti-wrap" aria-hidden="true">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="confetti-piece"
          style={{ left: `${p.x}%`, width: p.size, height: p.size, background: p.color }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: '100vh', opacity: 0, rotate: p.rotate + 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}

/* ── Animated score counter ────────────────────────────────────────────────── */
function AnimatedScore({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = display;
    const step = Math.ceil((value - start) / 20) || 1;
    const timer = setInterval(() => {
      start = Math.min(start + step, value);
      setDisplay(start);
      if (start >= value) clearInterval(timer);
    }, 28);
    return () => clearInterval(timer);
  }, [value]); // eslint-disable-line
  return <>{display}</>;
}

/* ── Floating particle background ─────────────────────────────────────────── */
function FloatingOrbs() {
  return (
    <div className="orbs-wrap" aria-hidden="true">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`orb orb-${i}`} />
      ))}
    </div>
  );
}

/* ── Default questions ─────────────────────────────────────────────────────── */
function getDefaultQuiz() {
  return [
    { text:'Which 2008 film features Heath Ledger as an iconic villain?',            options:['Batman Begins','The Dark Knight','Watchmen','V for Vendetta'],  correct:'The Dark Knight'  },
    { text:'Who directed "Inception" (2010)?',                                        options:['Ridley Scott','James Cameron','Steven Spielberg','Christopher Nolan'], correct:'Christopher Nolan' },
    { text:'When was "The Shawshank Redemption" released?',                           options:['1991','1993','1994','1996'],                                     correct:'1994'             },
    { text:'Which film is about wrestler Mahavir Singh Phogat?',                      options:['Sultan','Bhaag Milkha Bhaag','Dangal','Mary Kom'],              correct:'Dangal'           },
    { text:'What fictional planet is in "Avatar" (2009)?',                            options:['Tatooine','Pandora','Endor','Krypton'],                         correct:'Pandora'          },
    { text:'What year was the original Avengers film released?',                      options:['2010','2011','2012','2013'],                                    correct:'2012'             },
    { text:'Which streaming service produced "Stranger Things"?',                     options:['Hulu','HBO Max','Amazon Prime','Netflix'],                      correct:'Netflix'          },
    { text:'"Parasite" won Best Picture at which Academy Awards ceremony?',           options:['2019','2020','2021','2022'],                                    correct:'2020'             },
    { text:'How many primary Infinity Stones are in the MCU?',                        options:['4','5','6','7'],                                               correct:'6'                },
    { text:'Which singer is behind the hit "Levitating" (2020)?',                     options:['Doja Cat','Dua Lipa','Billie Eilish','Cardi B'],               correct:'Dua Lipa'         },
  ];
}

function badge(score, total) {
  const pct = score / total;
  if (pct === 1)   return '🏆 Perfect!';
  if (pct >= 0.8)  return '🥇 Gold';
  if (pct >= 0.5)  return '🥈 Silver';
  return '🥉 Bronze';
}

/* ── QuestionCard ──────────────────────────────────────────────────────────── */
function QuestionCard({ q, idx, total, onNext }) {
  const [sel, setSel]       = useState('');
  const [dir, setDir]       = useState(1);
  const [key, setKey]       = useState(idx);
  const prevIdx             = useRef(idx);

  useEffect(() => {
    setDir(idx > prevIdx.current ? 1 : -1);
    setKey(idx);
    prevIdx.current = idx;
    setSel('');
  }, [idx]);

  const handleNext = () => {
    if (!sel) return;
    onNext(sel);
  };

  const pct = ((idx + 1) / total) * 100;

  return (
    <div className="quiz-q-card">
      {/* Progress */}
      <div className="qprogress-track">
        <motion.div
          className="qprogress-fill"
          initial={{ width: `${((idx) / total) * 100}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="qprogress-glow"
          initial={{ width: `${((idx) / total) * 100}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Step indicators */}
      <div className="qstep-row">
        {[...Array(total)].map((_, i) => (
          <motion.div
            key={i}
            className={`qstep-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}`}
            animate={i === idx ? { scale: [1, 1.35, 1] } : {}}
            transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 1.6 }}
          />
        ))}
      </div>

      {/* Question text slides in */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={key}
          custom={dir}
          variants={questionVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="qbody"
        >
          <p className="quiz-q-num">Question {idx + 1} <span>/ {total}</span></p>
          <p className="quiz-q-text">{q.text}</p>

          <motion.div
            className="quiz-opts"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {q.options.map((o, i) => (
              <motion.label
                key={o}
                className={`quiz-opt${sel === o ? ' selected' : ''}`}
                variants={optionVariants}
                custom={i}
                whileHover={{ scale: 1.025, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.975 }}
              >
                <input
                  type="radio"
                  name="qopt"
                  value={o}
                  checked={sel === o}
                  onChange={() => setSel(o)}
                />
                <span className="quiz-opt-letter">{String.fromCharCode(65 + i)}</span>
                <span>{o}</span>
                {sel === o && (
                  <motion.span
                    className="opt-check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >✓</motion.span>
                )}
              </motion.label>
            ))}
          </motion.div>

          <motion.button
            className={`quiz-next-btn ${sel ? 'active' : ''}`}
            onClick={handleNext}
            disabled={!sel}
            whileHover={sel ? { scale: 1.04, boxShadow: '0 0 28px rgba(245,197,66,0.45)' } : {}}
            whileTap={sel ? { scale: 0.97 } : {}}
            animate={sel ? { opacity: 1, y: 0 } : { opacity: 0.45, y: 4 }}
            transition={{ duration: 0.22 }}
          >
            {idx + 1 < total
              ? <><span>Next</span><span className="btn-arrow">→</span></>
              : <><span>Finish</span><span className="btn-arrow">🎯</span></>
            }
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ── ResultView ────────────────────────────────────────────────────────────── */
function ResultView({ score, total, points, history, onRetry, canRetry }) {
  const b      = badge(score, total);
  const pct    = score / total;
  const isPerfect = pct === 1;
  const emoji  = isPerfect ? '🏆' : pct >= 0.8 ? '🥇' : pct >= 0.5 ? '🥈' : '🥉';

  return (
    <>
      <Confetti active={isPerfect} />
      <motion.div
        className="quiz-result-card"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="qr-trophy"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18, delay: 0.15 }}
        >
          {emoji}
        </motion.div>

        <motion.h2 className="qr-title" variants={fadeUp} initial="hidden" animate="visible">
          Quiz Complete!
        </motion.h2>

        <motion.div
          className="qr-score-ring"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}
        >
          <svg viewBox="0 0 80 80" className="ring-svg">
            <circle cx="40" cy="40" r="34" className="ring-bg" />
            <motion.circle
              cx="40" cy="40" r="34"
              className="ring-fill"
              strokeDasharray={`${2 * Math.PI * 34}`}
              strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct)}`}
              initial={{ strokeDashoffset: `${2 * Math.PI * 34}` }}
              animate={{ strokeDashoffset: `${2 * Math.PI * 34 * (1 - pct)}` }}
              transition={{ duration: 1.1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="ring-label">
            <span className="ring-score">{score}/{total}</span>
            <span className="ring-sub">correct</span>
          </div>
        </motion.div>

        <motion.div
          className="qr-stats-row"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="qr-stat" variants={fadeUp}>
            <span className="qr-stat-val">+{score * 10}</span>
            <span className="qr-stat-lbl">pts earned</span>
          </motion.div>
          <motion.div className="qr-stat accent" variants={fadeUp}>
            <span className="qr-stat-val">{b}</span>
            <span className="qr-stat-lbl">badge</span>
          </motion.div>
          <motion.div className="qr-stat" variants={fadeUp}>
            <span className="qr-stat-val"><AnimatedScore value={points} /></span>
            <span className="qr-stat-lbl">total pts</span>
          </motion.div>
        </motion.div>

        {history.length > 1 && (
          <motion.div
            className="qr-history"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="qr-hist-title">📜 Past Attempts</div>
            <div className="qr-hist-list">
              {history.slice(1).map((h, i) => (
                <motion.div
                  key={i}
                  className="qr-hist-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65 + i * 0.05 }}
                >
                  <span className="qr-hist-score">{h.score}/{h.total}</span>
                  <span>{badge(h.score, h.total)}</span>
                  <span className="qr-hist-date">
                    {new Date(h.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {canRetry ? (
          <motion.button
            className="quiz-next-btn active"
            style={{ marginTop: '1.5rem' }}
            onClick={onRetry}
            whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(245,197,66,0.45)' }}
            whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <span>Play Again</span><span className="btn-arrow">↺</span>
          </motion.button>
        ) : (
          <motion.div
            className="quiz-locked-inline"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <p>🔒 Upgrade to <strong>Premium</strong> to replay unlimited times!</p>
            <Link to="/premium" className="quiz-next-btn active" style={{ display:'inline-flex', marginTop:'0.8rem', textDecoration:'none' }}>
              👑 Get Premium
            </Link>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

/* ── LockedView ────────────────────────────────────────────────────────────── */
function LockedView({ history, points }) {
  return (
    <motion.div
      className="quiz-locked-card"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="lock-icon"
        animate={{ rotate: [0, -8, 8, -5, 5, 0] }}
        transition={{ duration: 0.7, delay: 0.3 }}
      >🔒</motion.div>
      <motion.h3 variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
        Quiz Locked
      </motion.h3>
      <motion.p variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
        You need <strong>Premium</strong> to retake the quiz. Get a perfect score on your first try for a <strong>FREE month!</strong>
      </motion.p>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Link to="/premium" className="quiz-next-btn active" style={{ display:'inline-flex', textDecoration:'none', marginTop:'1rem' }}>
          🚀 Unlock with Premium
        </Link>
      </motion.div>

      {history.length > 0 && (
        <motion.div
          className="qr-history"
          style={{ marginTop: '1.5rem' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <div className="qr-hist-title">Your Attempts</div>
          <div className="qr-hist-list">
            {history.map((h, i) => (
              <div key={i} className="qr-hist-item">
                <span className="qr-hist-score">{h.score}/{h.total}</span>
                <span>{badge(h.score, h.total)}</span>
                <span className="qr-hist-pts">+{h.score * 10} pts</span>
                <span className="qr-hist-date">
                  {new Date(h.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── StartCard ─────────────────────────────────────────────────────────────── */
function StartCard({ onStart, history, points }) {
  return (
    <motion.div
      className="quiz-start-card"
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="start-icon"
        animate={{
          y:       [0, -10, 0],
          rotate:  [0, -6, 6, 0],
          filter:  ['drop-shadow(0 0 0px #f5c542)', 'drop-shadow(0 0 18px #f5c542)', 'drop-shadow(0 0 0px #f5c542)'],
        }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >🎯</motion.div>

      <motion.h2 variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
        Entertainment Quiz
      </motion.h2>

      <motion.div
        className="start-meta-row"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[['10', 'Questions'], ['🎬', 'Movies & Music'], ['🏆', 'Win Premium']].map(([v, l]) => (
          <motion.div key={l} className="start-meta-pill" variants={fadeUp}>
            <span className="meta-val">{v}</span>
            <span className="meta-lbl">{l}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="start-desc"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.3 }}
      >
        Get a <strong>perfect score</strong> on your first try to win a{' '}
        <strong className="gold-text">FREE Premium month!</strong>
      </motion.p>

      {points > 0 && (
        <motion.div
          className="start-pts-badge"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
        >
          🏆 <AnimatedScore value={points} /> total points
        </motion.div>
      )}

      <motion.button
        className="quiz-next-btn active start-btn"
        onClick={onStart}
        whileHover={{ scale: 1.05, boxShadow: '0 0 36px rgba(245,197,66,0.5)' }}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <span>Start Quiz</span>
        <motion.span
          className="btn-arrow"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        >🚀</motion.span>
      </motion.button>

      {history.length > 0 && (
        <motion.div
          className="qr-history"
          style={{ marginTop: '1.5rem' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="qr-hist-title">Your Past Scores</div>
          <div className="qr-hist-list">
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="qr-hist-item">
                <span className="qr-hist-score">{h.score}/{h.total}</span>
                <span>{badge(h.score, h.total)}</span>
                <span className="qr-hist-date">
                  {new Date(h.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Main QuizPage ─────────────────────────────────────────────────────────── */
export default function QuizPage() {
  const { isLoggedIn } = useAuth();
  const { success, info } = useToast();

  const [phase,     setPhase]     = useState('loading');
  const [quiz,      setQuiz]      = useState([]);
  const [qIdx,      setQIdx]      = useState(0);
  const [answers,   setAnswers]   = useState([]);
  const [points,    setPoints]    = useState(0);
  const [history,   setHistory]   = useState([]);
  const [unlocked,  setUnlocked]  = useState(false);
  const [attempted, setAttempted] = useState(false);

  const loadState = useCallback(async () => {
    try {
      const { data } = await api.get('/quiz/state');
      setPoints(data.points || 0);
      setHistory(data.history || []);
      setUnlocked(data.unlocked || false);
      setAttempted(data.attempted || false);
    } catch {
      const u = localStorage.getItem('pp_quiz_unlocked') === 'true';
      const a = localStorage.getItem('pp_quiz_attempted') === 'true';
      const p = parseInt(localStorage.getItem('pp_quiz_points') || '0', 10);
      const h = (() => { try { return JSON.parse(localStorage.getItem('pp_quiz_history') || '[]'); } catch { return []; } })();
      setUnlocked(u); setAttempted(a); setPoints(p); setHistory(h);
    }
  }, []);

  const saveResult = useCallback(async (score, total) => {
    const entry      = { score, total, ts: Date.now() };
    const newHistory = [entry, ...history].slice(0, 20);
    const newPoints  = points + score * 10;
    const isPerfect  = score === total;
    const isFirst    = !attempted;
    const newUnlocked = unlocked || (isFirst && isPerfect);

    setHistory(newHistory); setPoints(newPoints);
    setAttempted(true);     setUnlocked(newUnlocked);

    localStorage.setItem('pp_quiz_history',   JSON.stringify(newHistory));
    localStorage.setItem('pp_quiz_points',    String(newPoints));
    localStorage.setItem('pp_quiz_attempted', String(true));
    localStorage.setItem('pp_quiz_unlocked',  String(newUnlocked));

    try {
      await api.post('/quiz/result', { score, total, earned: score * 10, isPerfect, isFirst });
    } catch { /* offline */ }

    if (isFirst && isPerfect) success('🏆 Perfect first try! You earned FREE Premium!');
    else if (isFirst) info('Upgrade to Premium to retake the quiz!');

    setPhase('result');
  }, [history, points, attempted, unlocked, success, info]);

  const startQuiz = useCallback(async () => {
    setQIdx(0); setAnswers([]);
    try {
      const { data } = await api.get('/quiz/questions');
      setQuiz(data.questions || getDefaultQuiz());
    } catch {
      setQuiz(getDefaultQuiz());
    }
    setPhase('questions');
  }, []);

  useEffect(() => { loadState().then(() => setPhase('idle')); }, []); // eslint-disable-line
  useEffect(() => {
    if (phase === 'idle') {
      if (attempted && !unlocked) setPhase('locked');
      else setPhase('start');
    }
  }, [phase, attempted, unlocked]);

  const handleAnswer = useCallback(async (answer) => {
    const newAnswers = [...answers, { answer, correct: quiz[qIdx].correct }];
    setAnswers(newAnswers);
    if (qIdx + 1 < quiz.length) {
      setQIdx((i) => i + 1);
    } else {
      const score = newAnswers.filter((a) => a.answer === a.correct).length;
      await saveResult(score, quiz.length);
    }
  }, [answers, qIdx, quiz, saveResult]);

  const handleRetry = () => {
    if (!unlocked) { setPhase('locked'); return; }
    startQuiz();
  };

  /* ── Not logged in ─────────────────────────────────────────────────────── */
  if (!isLoggedIn) return (
    <motion.div className="quiz-page" variants={pageVariants} initial="hidden" animate="visible">
      <FloatingOrbs />
      <div className="container">
        <motion.div className="section-title" initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <span className="section-icon">🧠</span> AI Quiz
        </motion.div>
        <motion.div className="quiz-locked-card" variants={cardVariants} initial="hidden" animate="visible" transition={{ delay:0.15 }}>
          <motion.div className="lock-icon" animate={{ rotate:[0,-8,8,-5,5,0] }} transition={{ duration:0.7, delay:0.4 }}>🔒</motion.div>
          <h3>Sign In Required</h3>
          <p>Sign in to take the quiz and earn Premium rewards!</p>
          <Link to="/login" className="quiz-next-btn active" style={{ display:'inline-flex', textDecoration:'none', marginTop:'1rem' }}>
            👤 Sign In
          </Link>
        </motion.div>
      </div>
      <style>{quizCss}</style>
    </motion.div>
  );

  return (
    <motion.div className="quiz-page" variants={pageVariants} initial="hidden" animate="visible">
      <FloatingOrbs />
      <div className="container">

        {/* Header */}
        <motion.div
          className="section-title"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="section-icon">🧠</span> AI Quiz
        </motion.div>

        {/* Score bar */}
        <AnimatePresence>
          {phase !== 'loading' && phase !== 'idle' && (
            <motion.div
              className="quiz-score-bar"
              initial={{ opacity: 0, y: -10, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <span>🏆 Points: <strong><AnimatedScore value={points} /></strong></span>
              {unlocked && (
                <motion.span
                  className="premium-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, delay: 0.3 }}
                >👑 Premium</motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="quiz-wrap">
          {/* Loading */}
          <AnimatePresence mode="wait">
            {(phase === 'loading' || phase === 'idle') && (
              <motion.div
                key="loader"
                className="loader-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="quiz-spinner">
                  <div /><div /><div />
                </div>
              </motion.div>
            )}

            {phase === 'start' && (
              <motion.div key="start" variants={cardVariants} initial="hidden" animate="visible" exit="exit">
                <StartCard onStart={startQuiz} history={history} points={points} />
              </motion.div>
            )}

            {phase === 'questions' && quiz[qIdx] && (
              <motion.div key="questions" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0, scale:0.95 }}>
                <QuestionCard q={quiz[qIdx]} idx={qIdx} total={quiz.length} onNext={handleAnswer} />
              </motion.div>
            )}

            {phase === 'result' && (
              <motion.div key="result" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <ResultView
                  score={answers.filter(a => a.answer === a.correct).length}
                  total={quiz.length}
                  points={points}
                  history={history}
                  onRetry={handleRetry}
                  canRetry={unlocked}
                />
              </motion.div>
            )}

            {phase === 'locked' && (
              <motion.div key="locked" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <LockedView history={history} points={points} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style>{quizCss}</style>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════════════════════ */
const quizCss = `
  /* ── Page layout ─────────────────────────────────────────────────── */
  .quiz-page {
    position: relative;
    min-height: 100vh;
    padding: 2rem 1rem 4rem;
    overflow: hidden;
  }
  .quiz-page .container {
    max-width: 760px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }
  .quiz-wrap { max-width: 660px; }

  /* ── Section title ───────────────────────────────────────────────── */
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-family: 'Syne', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin-bottom: 1.2rem;
    letter-spacing: -0.02em;
  }
  .section-icon {
    font-size: 1.4rem;
    filter: drop-shadow(0 0 8px rgba(245,197,66,0.6));
    animation: iconPulse 3s ease-in-out infinite;
  }
  @keyframes iconPulse {
    0%,100% { filter: drop-shadow(0 0 6px rgba(245,197,66,0.4)); }
    50%      { filter: drop-shadow(0 0 16px rgba(245,197,66,0.8)); }
  }

  /* ── Score bar ───────────────────────────────────────────────────── */
  .quiz-score-bar {
    display: inline-flex;
    align-items: center;
    gap: 0.8rem;
    background: var(--accent-glow, rgba(245,197,66,0.12));
    border: 1px solid rgba(245,197,66,0.25);
    padding: 0.55rem 1.3rem;
    border-radius: 2rem;
    margin-bottom: 1.6rem;
    font-weight: 600;
    font-size: 0.88rem;
    backdrop-filter: blur(8px);
  }
  .premium-badge {
    background: linear-gradient(135deg, #f5c542, #e0a812);
    color: #1a1200;
    padding: 0.2rem 0.7rem;
    border-radius: 2rem;
    font-size: 0.75rem;
    font-weight: 700;
  }

  /* ── Floating orbs ───────────────────────────────────────────────── */
  .orbs-wrap {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.18;
  }
  .orb-0 { width:340px; height:340px; background:#f5c542; top:-80px; right:-80px; animation: orbFloat 9s ease-in-out infinite; }
  .orb-1 { width:240px; height:240px; background:#a78bfa; bottom:60px; left:-60px; animation: orbFloat 12s ease-in-out infinite reverse; }
  .orb-2 { width:180px; height:180px; background:#34d399; top:45%; right:5%; animation: orbFloat 8s ease-in-out infinite 2s; }
  .orb-3 { width:140px; height:140px; background:#60a5fa; top:30%; left:20%; animation: orbFloat 10s ease-in-out infinite 1s; }
  .orb-4 { width:100px; height:100px; background:#fb923c; bottom:20%; right:25%; animation: orbFloat 7s ease-in-out infinite 3s; }
  @keyframes orbFloat {
    0%,100% { transform: translateY(0px) scale(1); }
    50%      { transform: translateY(-30px) scale(1.05); }
  }

  /* ── Confetti ────────────────────────────────────────────────────── */
  .confetti-wrap {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 100;
    overflow: hidden;
  }
  .confetti-piece {
    position: absolute;
    top: 0;
    border-radius: 2px;
  }

  /* ── Cards base ──────────────────────────────────────────────────── */
  .quiz-start-card,
  .quiz-result-card,
  .quiz-locked-card,
  .quiz-q-card {
    background: var(--surface, rgba(255,255,255,0.04));
    border: 1px solid var(--border, rgba(255,255,255,0.1));
    border-radius: 20px;
    padding: 2.5rem 2rem;
    text-align: center;
    backdrop-filter: blur(16px);
    box-shadow: 0 8px 40px rgba(0,0,0,0.18);
    position: relative;
    overflow: hidden;
  }
  .quiz-q-card { text-align: left; }
  .quiz-start-card::before,
  .quiz-result-card::before,
  .quiz-locked-card::before,
  .quiz-q-card::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(245,197,66,0.04) 0%, transparent 60%);
    pointer-events: none;
  }

  /* ── Start card ──────────────────────────────────────────────────── */
  .start-icon { font-size: 3.8rem; display: block; margin-bottom: 0.8rem; }
  .quiz-start-card h2 {
    font-family: 'Syne', sans-serif;
    font-size: 1.65rem;
    margin-bottom: 1rem;
    letter-spacing: -0.02em;
  }
  .start-meta-row {
    display: flex;
    justify-content: center;
    gap: 0.7rem;
    margin-bottom: 1.2rem;
    flex-wrap: wrap;
  }
  .start-meta-pill {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    background: var(--bg2, rgba(255,255,255,0.05));
    border: 1px solid var(--border, rgba(255,255,255,0.1));
    border-radius: 12px;
    padding: 0.55rem 1rem;
    min-width: 90px;
  }
  .meta-val { font-size: 1.15rem; font-weight: 700; font-family: 'Syne', sans-serif; }
  .meta-lbl { font-size: 0.68rem; color: var(--text2, rgba(255,255,255,0.5)); text-transform: uppercase; letter-spacing: 0.06em; }
  .start-desc {
    color: var(--text2, rgba(255,255,255,0.65));
    font-size: 0.9rem;
    line-height: 1.7;
    margin-bottom: 0.5rem;
  }
  .gold-text { color: #f5c542 !important; }
  .start-pts-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--accent-glow, rgba(245,197,66,0.12));
    border: 1px solid rgba(245,197,66,0.25);
    border-radius: 2rem;
    padding: 0.35rem 1rem;
    font-size: 0.82rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #f5c542;
  }

  /* ── Next / action button ────────────────────────────────────────── */
  .quiz-next-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.78rem 2.2rem;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.95rem;
    font-family: inherit;
    transition: opacity 0.2s;
    background: linear-gradient(135deg, #f5c542 0%, #e0a812 100%);
    color: #1a1200;
    box-shadow: 0 4px 20px rgba(245,197,66,0.25);
    letter-spacing: 0.01em;
  }
  .quiz-next-btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
  .btn-arrow { font-size: 1rem; }
  .start-btn { padding: 0.88rem 2.8rem; font-size: 1rem; margin-top: 1rem; }

  /* ── Progress track ──────────────────────────────────────────────── */
  .qprogress-track {
    height: 5px;
    background: var(--border, rgba(255,255,255,0.1));
    border-radius: 3px;
    margin-bottom: 1.2rem;
    overflow: hidden;
    position: relative;
  }
  .qprogress-fill {
    height: 100%;
    background: linear-gradient(90deg, #f5c542, #e0a812);
    border-radius: 3px;
    position: absolute;
    top: 0; left: 0;
  }
  .qprogress-glow {
    height: 100%;
    background: linear-gradient(90deg, rgba(245,197,66,0.6), transparent);
    filter: blur(4px);
    border-radius: 3px;
    position: absolute;
    top: 0; left: 0;
  }

  /* ── Step dots ───────────────────────────────────────────────────── */
  .qstep-row {
    display: flex;
    gap: 5px;
    margin-bottom: 1.4rem;
    flex-wrap: wrap;
  }
  .qstep-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--border, rgba(255,255,255,0.15));
    transition: background 0.3s, transform 0.3s;
    flex-shrink: 0;
  }
  .qstep-dot.done    { background: rgba(245,197,66,0.45); }
  .qstep-dot.active  { background: #f5c542; transform: scale(1.3); box-shadow: 0 0 8px rgba(245,197,66,0.7); }

  /* ── Question body ───────────────────────────────────────────────── */
  .qbody { }
  .quiz-q-num {
    font-size: 0.75rem;
    color: var(--text2, rgba(255,255,255,0.5));
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin-bottom: 0.5rem;
  }
  .quiz-q-num span { opacity: 0.6; }
  .quiz-q-text {
    font-size: 1.05rem;
    font-weight: 600;
    line-height: 1.65;
    margin-bottom: 1.3rem;
  }

  /* ── Options ─────────────────────────────────────────────────────── */
  .quiz-opts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
    margin-bottom: 1.4rem;
  }
  .quiz-opt {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    background: var(--bg2, rgba(255,255,255,0.04));
    border: 1.5px solid var(--border, rgba(255,255,255,0.1));
    border-radius: 12px;
    padding: 0.78rem 0.9rem;
    cursor: pointer;
    font-size: 0.87rem;
    position: relative;
    overflow: hidden;
    transition: border-color 0.18s, background 0.18s;
  }
  .quiz-opt:hover {
    background: var(--accent-glow, rgba(245,197,66,0.08));
    border-color: rgba(245,197,66,0.4);
  }
  .quiz-opt.selected {
    background: var(--accent-glow, rgba(245,197,66,0.12));
    border-color: #f5c542;
    box-shadow: 0 0 0 3px rgba(245,197,66,0.12), inset 0 0 20px rgba(245,197,66,0.05);
  }
  .quiz-opt input { display: none; }
  .quiz-opt-letter {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--border, rgba(255,255,255,0.08));
    font-size: 0.7rem;
    font-weight: 700;
    flex-shrink: 0;
    transition: background 0.18s;
  }
  .quiz-opt.selected .quiz-opt-letter {
    background: #f5c542;
    color: #1a1200;
  }
  .opt-check {
    margin-left: auto;
    color: #f5c542;
    font-size: 0.85rem;
    font-weight: 700;
  }

  /* ── Result card ─────────────────────────────────────────────────── */
  .qr-trophy {
    font-size: 4.5rem;
    display: block;
    margin-bottom: 0.6rem;
    filter: drop-shadow(0 0 20px rgba(245,197,66,0.5));
  }
  .qr-title {
    font-family: 'Syne', sans-serif;
    font-size: 1.65rem;
    margin-bottom: 1.2rem;
    letter-spacing: -0.02em;
  }
  .qr-score-ring {
    position: relative;
    width: 100px;
    height: 100px;
    margin: 0 auto 1.5rem;
  }
  .ring-svg { width: 100%; height: 100%; transform: rotate(-90deg); }
  .ring-bg   { fill: none; stroke: var(--border, rgba(255,255,255,0.1)); stroke-width: 5; }
  .ring-fill { fill: none; stroke: #f5c542; stroke-width: 5; stroke-linecap: round; filter: drop-shadow(0 0 6px rgba(245,197,66,0.6)); }
  .ring-label {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
  }
  .ring-score { font-size: 1.1rem; font-weight: 700; font-family: 'Syne', sans-serif; }
  .ring-sub   { font-size: 0.62rem; color: var(--text2, rgba(255,255,255,0.5)); text-transform: uppercase; letter-spacing: 0.06em; }

  .qr-stats-row {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.2rem;
    flex-wrap: wrap;
  }
  .qr-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    min-width: 80px;
    background: var(--bg2, rgba(255,255,255,0.04));
    border: 1px solid var(--border, rgba(255,255,255,0.1));
    border-radius: 12px;
    padding: 0.6rem 1rem;
  }
  .qr-stat.accent { border-color: rgba(245,197,66,0.3); background: rgba(245,197,66,0.06); }
  .qr-stat-val { font-size: 1rem; font-weight: 700; font-family: 'Syne', sans-serif; }
  .qr-stat-lbl { font-size: 0.65rem; color: var(--text2, rgba(255,255,255,0.5)); text-transform: uppercase; letter-spacing: 0.06em; }

  .quiz-locked-inline {
    margin-top: 1.5rem;
    padding: 1.2rem;
    background: var(--accent-glow, rgba(245,197,66,0.08));
    border: 1px solid rgba(245,197,66,0.2);
    border-radius: 12px;
  }
  .quiz-locked-inline p { color: var(--text2, rgba(255,255,255,0.65)); font-size: 0.88rem; margin-bottom: 0; }

  /* ── Locked card ─────────────────────────────────────────────────── */
  .lock-icon { font-size: 3.2rem; display: block; margin-bottom: 0.7rem; }
  .quiz-locked-card h3 {
    font-family: 'Syne', sans-serif;
    font-size: 1.4rem;
    margin-bottom: 0.6rem;
  }
  .quiz-locked-card p { color: var(--text2, rgba(255,255,255,0.65)); font-size: 0.9rem; line-height: 1.7; }

  /* ── History block ───────────────────────────────────────────────── */
  .qr-history {
    text-align: left;
    margin-top: 1.2rem;
    background: var(--bg2, rgba(255,255,255,0.03));
    border-radius: 12px;
    padding: 0.85rem 1rem;
    border: 1px solid var(--border, rgba(255,255,255,0.08));
  }
  .qr-hist-title {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text2, rgba(255,255,255,0.45));
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.55rem;
  }
  .qr-hist-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-height: 160px;
    overflow-y: auto;
  }
  .qr-hist-item {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    font-size: 0.78rem;
    padding: 0.28rem 0;
    border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
  }
  .qr-hist-item:last-child { border-bottom: none; }
  .qr-hist-score { font-weight: 700; color: #f5c542; font-family: 'Syne', sans-serif; flex-shrink: 0; }
  .qr-hist-pts   { color: var(--success, #34d399); font-size: 0.7rem; }
  .qr-hist-date  { color: var(--text2, rgba(255,255,255,0.4)); margin-left: auto; font-size: 0.67rem; flex-shrink: 0; }

  /* ── Spinner ─────────────────────────────────────────────────────── */
  .loader-center { display: flex; justify-content: center; align-items: center; min-height: 280px; }
  .quiz-spinner {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .quiz-spinner > div {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #f5c542;
    animation: spinnerBounce 1.2s ease-in-out infinite;
  }
  .quiz-spinner > div:nth-child(2) { animation-delay: 0.15s; }
  .quiz-spinner > div:nth-child(3) { animation-delay: 0.3s; }
  @keyframes spinnerBounce {
    0%, 80%, 100% { transform: scale(0.5); opacity: 0.4; }
    40%           { transform: scale(1); opacity: 1; }
  }

  /* ── Responsive ──────────────────────────────────────────────────── */
  @media (max-width: 600px) {
    .quiz-opts             { grid-template-columns: 1fr; }
    .quiz-q-card,
    .quiz-start-card,
    .quiz-result-card,
    .quiz-locked-card      { padding: 1.6rem 1.2rem; }
    .quiz-q-text           { font-size: 0.97rem; }
    .start-meta-row        { gap: 0.5rem; }
    .start-meta-pill       { min-width: 78px; padding: 0.45rem 0.8rem; }
    .qr-stats-row          { gap: 0.6rem; }
    .qr-stat               { min-width: 70px; padding: 0.5rem 0.75rem; }
    .section-title         { font-size: 1.25rem; }
    .quiz-next-btn         { padding: 0.72rem 1.6rem; font-size: 0.9rem; }
    .start-btn             { padding: 0.78rem 2rem; }
    .qstep-dot             { width: 6px; height: 6px; }
    .qr-score-ring         { width: 84px; height: 84px; }
  }
  @media (max-width: 380px) {
    .quiz-page             { padding: 1.5rem 0.75rem 3rem; }
    .start-meta-row        { flex-direction: column; align-items: center; }
  }
`;
