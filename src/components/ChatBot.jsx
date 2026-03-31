// src/components/ChatBot.jsx — Animated · Theme-Safe · Production Ready
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const GROQ_API   = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_KEY   = import.meta.env.VITE_GROQ_KEY;
const GROQ_MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama3-8b-8192';

const SYSTEM_PROMPT = `You are a friendly, knowledgeable entertainment assistant for Pixel Pirates — a platform covering movies, music, books, games and events. Keep responses concise (2–5 sentences). Be enthusiastic and occasionally add light pirate flavor (e.g. "Ahoy!", "Shiver me timbers!", "Arrr!"). When recommending, give specific titles with a brief reason. Format lists cleanly. If asked something unrelated to entertainment, gently redirect.`;

const SUGGESTIONS = [
  { label: '🎬 Movie rec',       msg: 'Recommend me a great movie to watch tonight.' },
  { label: '📚 Book rec',        msg: 'What book should I read next?'                },
  { label: '🎵 Late night vibes', msg: 'Suggest a song for late night chilling.'     },
  { label: '🔥 Trending',        msg: "What's trending in cinema right now?"         },
  { label: '🎮 Game pick',       msg: 'Recommend a game I can get lost in for hours.' },
];

/* ── Typing Dots ───────────────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="cb-msg cb-bot cb-typing-row">
      <div className="cb-avatar-sm" aria-hidden="true">⚓</div>
      <div className="cb-bubble cb-bot-bubble cb-typing-bubble">
        <span className="cb-dot" />
        <span className="cb-dot" />
        <span className="cb-dot" />
      </div>
    </div>
  );
}

/* ── Chat Message ──────────────────────────────────────────────────────────── */
function ChatMessage({ msg, animate }) {
  const isUser = msg.role === 'user';
  const html = msg.content
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');

  return (
    <div className={`cb-msg ${isUser ? 'cb-user' : 'cb-bot'}${animate ? ' cb-msg-in' : ''}`}>
      {!isUser && <div className="cb-avatar-sm" aria-hidden="true">⚓</div>}
      <div className="cb-msg-inner">
        <div
          className={`cb-bubble ${isUser ? 'cb-user-bubble' : 'cb-bot-bubble'}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <span className="cb-time">{msg.time || ''}</span>
      </div>
    </div>
  );
}

/* ── ChatBot ───────────────────────────────────────────────────────────────── */
export default function ChatBot() {
  const { user }  = useAuth();
  const { error } = useToast();

  const chatKey = `pp_chat_${user?.uid || user?.email || 'guest'}`;

  const [open,        setOpen]        = useState(false);
  const [input,       setInput]       = useState('');
  const [msgs,        setMsgs]        = useState(() => {
    try { return JSON.parse(localStorage.getItem(chatKey) || '[]'); } catch { return []; }
  });
  const [typing,      setTyping]      = useState(false);
  const [unread,      setUnread]      = useState(0);
  const [latestIdx,   setLatestIdx]   = useState(-1);

  const msgsEndRef = useRef(null);
  const inputRef   = useRef(null);
  const busy       = useRef(false);

  const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const save = (m) => { try { localStorage.setItem(chatKey, JSON.stringify(m.slice(-60))); } catch {} };

  /* Welcome */
  useEffect(() => {
    if (msgs.length === 0) {
      const w = [{ role: 'assistant', content: `Ahoy, matey! ⚓ I'm your Pixel Pirates AI. Ask me to recommend a movie, book, song or game — or anything about entertainment!`, time: now() }];
      setMsgs(w); save(w); setUnread(1);
    }
  }, []); // eslint-disable-line

  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);
  useEffect(() => { if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 120); } }, [open]);

  const addMsg = useCallback((role, content) => {
    const m = { role, content, time: now() };
    setMsgs((prev) => {
      const next = [...prev, m];
      save(next);
      setLatestIdx(next.length - 1);
      return next;
    });
    if (!open && role === 'assistant') setUnread((n) => n + 1);
  }, [open]); // eslint-disable-line

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || busy.current) return;
    busy.current = true;
    setInput('');
    addMsg('user', text);
    setTyping(true);

    const history = msgs.slice(-20).map((m) => ({
      role: m.role === 'bot' ? 'assistant' : m.role,
      content: m.content,
    }));
    history.push({ role: 'user', content: text });

    try {
      if (!GROQ_KEY) throw new Error('No Groq API key configured');
      const res = await fetch(GROQ_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({
          model: GROQ_MODEL, max_tokens: 400, temperature: 0.75,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
        }),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
      const data  = await res.json();
      const reply = data.choices?.[0]?.message?.content || '';
      if (!reply) throw new Error('Empty response');
      addMsg('assistant', reply);
    } catch (ex) {
      addMsg('assistant', `Arrr, something went wrong! ${ex.message}. Please try again.`);
    } finally {
      setTyping(false);
      busy.current = false;
      inputRef.current?.focus();
    }
  }, [msgs, addMsg]);

  const clearChat = () => {
    if (!confirm('Clear chat history?')) return;
    const w = [{ role: 'assistant', content: 'Chat cleared! Ahoy, ready for a fresh start! ⚓', time: now() }];
    setMsgs(w); save(w);
  };

  return (
    <>
      {/* ── FAB ───────────────────────────────────────────────────── */}
      <button
        className={`cb-fab${open ? ' cb-fab-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title="Chat with Pixel Pirates AI"
        aria-label={open ? 'Close chat' : 'Open chat'}
        aria-expanded={open}
      >
        {!open && unread > 0 && (
          <>
            <span className="cb-ring cb-ring-1" aria-hidden="true" />
            <span className="cb-ring cb-ring-2" aria-hidden="true" />
          </>
        )}
        <span className="cb-fab-icon" aria-hidden="true">{open ? '✕' : '💬'}</span>
        {unread > 0 && !open && (
          <span className="cb-unread" aria-label={`${unread} unread`}>{unread}</span>
        )}
      </button>

      {/* ── Panel ─────────────────────────────────────────────────── */}
      <div
        className={`cb-panel${open ? ' cb-open' : ''}`}
        role="dialog"
        aria-label="Pixel Pirates AI Chat"
        aria-modal="true"
      >
        {/* Animated top shimmer line */}
        <div className="cb-top-bar" aria-hidden="true" />

        {/* Header */}
        <div className="cb-head">
          <div className="cb-head-l">
            <div className="cb-avatar">
              <span aria-hidden="true">⚓</span>
              <div className="cb-avatar-ring" aria-hidden="true" />
            </div>
            <div>
              <div className="cb-name">
                Pixel Pirates AI
                <span className="cb-ai-badge">✦ Groq</span>
              </div>
              <div className="cb-sub">Powered by LLaMA · Always ready</div>
            </div>
          </div>
          <div className="cb-actions">
            <button className="cb-icon-btn" onClick={clearChat} title="Clear chat" aria-label="Clear chat">🗑️</button>
            <button className="cb-icon-btn" onClick={() => setOpen(false)} title="Close" aria-label="Close">✕</button>
          </div>
        </div>

        {/* Status bar */}
        <div className="cb-status">
          <span className={`cb-status-dot${typing ? ' cb-thinking' : ''}`} aria-hidden="true" />
          <span>{typing ? 'Thinking…' : 'Online · Ask me anything'}</span>
          {typing && <span className="cb-wave" aria-hidden="true">〜〜〜</span>}
        </div>

        {/* Messages */}
        <div className="cb-msgs" role="log" aria-live="polite">
          {msgs.map((m, i) => (
            <ChatMessage key={i} msg={m} animate={i === latestIdx} />
          ))}
          {typing && <TypingDots />}
          <div ref={msgsEndRef} />
        </div>

        {/* Suggestions */}
        <div className="cb-chips">
          <p className="cb-chips-lbl">Quick picks</p>
          <div className="cb-chips-row">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s.label}
                className="cb-chip"
                style={{ '--ci': i }}
                onClick={() => sendMessage(s.msg)}
                disabled={typing}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="cb-foot">
          <input
            ref={inputRef}
            className="cb-input"
            type="text"
            placeholder="Ask about movies, books, music…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
            disabled={typing}
            autoComplete="off"
            aria-label="Message"
          />
          <button
            className={`cb-send${input.trim() && !typing ? ' cb-send-active' : ''}`}
            onClick={() => sendMessage(input)}
            disabled={typing || !input.trim()}
            aria-label="Send"
          >
            ➤
          </button>
        </div>
      </div>

      {/* ── Styles ────────────────────────────────────────────────── */}
      <style>{`
        /* FAB */
        .cb-fab {
          position: fixed; bottom: 1.8rem; right: 1.8rem; z-index: 350;
          width: 60px; height: 60px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent,#f5c542), #ffd97a);
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 24px rgba(245,197,66,.45);
          transition: transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s;
          font-size: 1.45rem; color: #07101f; isolation: isolate;
        }
        .cb-fab:hover { transform: scale(1.13) rotate(-6deg); box-shadow: 0 8px 36px rgba(245,197,66,.65); }
        .cb-fab.cb-fab-open { transform: scale(1.05) rotate(90deg); }

        /* Pulse rings */
        .cb-ring {
          position: absolute; border-radius: 50%;
          background: rgba(245,197,66,.22);
          pointer-events: none; animation: cb-pulse 2s ease-out infinite;
        }
        .cb-ring-1 { width: 80px;  height: 80px;  animation-delay: 0s;  }
        .cb-ring-2 { width: 104px; height: 104px; animation-delay: .55s; }
        @keyframes cb-pulse { 0%{transform:scale(.7);opacity:.8} 100%{transform:scale(1.45);opacity:0} }

        /* Unread badge */
        .cb-unread {
          position: absolute; top: -4px; right: -4px;
          background: #e50914; color: #fff;
          min-width: 20px; height: 20px; border-radius: 999px; padding: 0 .28rem;
          font-size: .6rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--bg); animation: cb-pop .4s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes cb-pop { from{transform:scale(0)} to{transform:scale(1)} }

        /* Panel */
        .cb-panel {
          position: fixed; bottom: calc(1.8rem + 72px); right: 1.8rem; z-index: 349;
          width: 390px; height: 580px;
          background: var(--modal-bg, var(--bg2));
          border: 1px solid var(--border);
          border-radius: 22px; overflow: hidden;
          display: flex; flex-direction: column;
          box-shadow: 0 28px 72px rgba(0,0,0,.6), 0 0 0 1px rgba(245,197,66,.07);
          visibility: hidden; opacity: 0;
          transform: translateY(22px) scale(.92);
          transition: all .32s cubic-bezier(.34,1.22,.64,1);
          transform-origin: bottom right;
        }
        .cb-panel.cb-open { visibility: visible; opacity: 1; transform: translateY(0) scale(1); }

        /* Shimmer top bar */
        .cb-top-bar {
          position: absolute; top: 0; left: 0; right: 0; height: 2px; z-index: 10;
          background: linear-gradient(90deg, transparent 0%, var(--accent,#f5c542) 35%, #ffd97a 65%, transparent 100%);
          background-size: 200% 100%;
          animation: cb-shimmer 2.5s ease-in-out infinite;
        }
        @keyframes cb-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Header */
        .cb-head {
          padding: .88rem 1rem; display: flex;
          justify-content: space-between; align-items: center;
          background: linear-gradient(135deg,#0d1929,#111d30);
          border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .cb-head-l { display: flex; align-items: center; gap: .75rem; }
        .cb-avatar {
          position: relative; width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg,var(--accent,#f5c542),#ffd97a);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.15rem; flex-shrink: 0;
          box-shadow: 0 2px 12px rgba(245,197,66,.4);
        }
        .cb-avatar-ring {
          position: absolute; inset: -4px; border-radius: 50%;
          border: 2px solid rgba(245,197,66,.28);
          animation: cb-ring-breathe 2.8s ease-in-out infinite;
        }
        @keyframes cb-ring-breathe { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.14);opacity:1} }
        .cb-avatar-sm {
          width: 26px; height: 26px; border-radius: 50%;
          background: linear-gradient(135deg,var(--accent,#f5c542),#ffd97a);
          display: flex; align-items: center; justify-content: center;
          font-size: .75rem; flex-shrink: 0;
        }
        .cb-name {
          font-weight: 700; font-size: .9rem; font-family: 'Syne',sans-serif;
          color: var(--text); display: flex; align-items: center; gap: .4rem;
        }
        .cb-ai-badge {
          display: inline-flex; align-items: center; font-size: .58rem;
          font-weight: 700; padding: .14rem .44rem; border-radius: 2rem;
          background: linear-gradient(90deg,var(--accent,#f5c542),#ffd97a); color: #07101f;
        }
        .cb-sub { font-size: .6rem; color: var(--text2); margin-top: .1rem; }
        .cb-actions { display: flex; gap: .3rem; }
        .cb-icon-btn {
          background: none; border: none; cursor: pointer; color: var(--text2);
          width: 30px; height: 30px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: .85rem; transition: background .15s, color .15s;
        }
        .cb-icon-btn:hover { background: rgba(255,255,255,.08); color: var(--text); }

        /* Status */
        .cb-status {
          display: flex; align-items: center; gap: .5rem; padding: .35rem 1rem;
          font-size: .7rem; color: var(--text2); font-family: 'Outfit',sans-serif;
          border-bottom: 1px solid var(--border); background: rgba(0,0,0,.12); flex-shrink: 0;
        }
        .cb-status-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e; flex-shrink: 0;
          animation: cb-dot-beat 2s ease-in-out infinite;
        }
        .cb-status-dot.cb-thinking { background: var(--accent,#f5c542); animation-duration: .65s; }
        @keyframes cb-dot-beat { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.7)} }
        .cb-wave {
          font-size: .65rem; color: var(--accent,#f5c542); letter-spacing: -.06em;
          animation: cb-wave-osc 1s ease-in-out infinite;
        }
        @keyframes cb-wave-osc { 0%,100%{opacity:.3;transform:scaleX(.8)} 50%{opacity:1;transform:scaleX(1)} }

        /* Messages */
        .cb-msgs {
          flex: 1; overflow-y: auto; padding: .9rem .85rem;
          display: flex; flex-direction: column; gap: .65rem;
        }
        .cb-msgs::-webkit-scrollbar { width: 3px; }
        .cb-msgs::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        .cb-msg { display: flex; gap: .45rem; align-items: flex-end; max-width: 92%; }
        .cb-user { align-self: flex-end; flex-direction: row-reverse; }
        .cb-bot  { align-self: flex-start; }
        .cb-typing-row { align-items: center; }

        /* Entrance animation for latest message */
        .cb-msg-in { animation: cb-msg-slide .35s cubic-bezier(.22,1,.36,1) both; }
        @keyframes cb-msg-slide {
          from { opacity: 0; transform: translateY(14px) scale(.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .cb-msg-inner { display: flex; flex-direction: column; gap: .18rem; }
        .cb-user .cb-msg-inner { align-items: flex-end; }
        .cb-bot  .cb-msg-inner { align-items: flex-start; }

        .cb-bubble {
          padding: .62rem .95rem; border-radius: 1.1rem;
          font-size: .84rem; line-height: 1.65; word-break: break-word; max-width: 280px;
        }
        .cb-user-bubble {
          background: linear-gradient(135deg,var(--accent,#f5c542),#ffd97a);
          color: #07101f; font-weight: 500; border-radius: 1.1rem 1.1rem 0 1.1rem;
        }
        .cb-bot-bubble {
          background: var(--surface,var(--bg2));
          border: 1px solid var(--border); border-radius: 1.1rem 1.1rem 1.1rem 0;
        }
        .cb-time { font-size: .58rem; color: var(--text2); }

        /* Typing */
        .cb-typing-bubble { display: flex; align-items: center; gap: .3rem; min-width: 56px; }
        .cb-dot {
          width: 6px; height: 6px; border-radius: 50%; background: var(--text2);
          animation: cb-bounce .9s ease-in-out infinite; display: inline-block;
        }
        .cb-dot:nth-child(2) { animation-delay: .18s; }
        .cb-dot:nth-child(3) { animation-delay: .36s; }
        @keyframes cb-bounce {
          0%,60%,100% { transform: translateY(0); opacity: .4; }
          30%          { transform: translateY(-8px); opacity: 1; }
        }

        /* Suggestions */
        .cb-chips {
          border-top: 1px solid var(--border); padding: .5rem .75rem .4rem;
          flex-shrink: 0; background: rgba(0,0,0,.08);
        }
        .cb-chips-lbl { font-size: .6rem; color: var(--text2); margin: 0 0 .35rem; text-transform: uppercase; letter-spacing: .06em; }
        .cb-chips-row { display: flex; flex-wrap: wrap; gap: .35rem; }
        .cb-chip {
          padding: .28rem .7rem; border-radius: 2rem;
          border: 1px solid var(--border); background: var(--surface,var(--bg2));
          color: var(--text2); cursor: pointer;
          font-family: 'Outfit',sans-serif; font-size: .68rem; white-space: nowrap;
          transition: border-color .18s, color .18s, background .18s, transform .15s;
          animation: cb-chip-in .35s cubic-bezier(.34,1.56,.64,1) calc(var(--ci,0) * .05s) both;
        }
        @keyframes cb-chip-in { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
        .cb-chip:hover:not(:disabled) {
          border-color: var(--accent,#f5c542); color: var(--accent,#f5c542);
          background: rgba(245,197,66,.07); transform: translateY(-1px);
        }
        .cb-chip:disabled { opacity: .35; cursor: not-allowed; }

        /* Footer input */
        .cb-foot {
          display: flex; padding: .55rem .65rem; border-top: 1px solid var(--border);
          gap: .4rem; align-items: center; flex-shrink: 0; background: rgba(0,0,0,.1);
        }
        .cb-input {
          flex: 1; padding: .52rem 1rem; border-radius: 2rem;
          border: 1.5px solid var(--border); background: var(--input-bg,var(--bg2));
          color: var(--text); font-family: 'Outfit',sans-serif; font-size: .83rem;
          outline: none; transition: border-color .22s, box-shadow .22s;
        }
        .cb-input:focus { border-color: var(--accent,#f5c542); box-shadow: 0 0 0 3px rgba(245,197,66,.12); }
        .cb-input::placeholder { color: var(--text2); }
        .cb-input:disabled { opacity: .5; }

        /* Send */
        .cb-send {
          background: rgba(128,128,128,.2); border: none; border-radius: 50%;
          width: 40px; height: 40px; cursor: not-allowed; color: var(--text2);
          font-size: .85rem; display: flex; align-items: center; justify-content: center;
          transition: background .25s, transform .22s cubic-bezier(.34,1.56,.64,1), box-shadow .25s;
          flex-shrink: 0;
        }
        .cb-send.cb-send-active {
          background: linear-gradient(135deg,var(--accent,#f5c542),#ffd97a);
          color: #07101f; cursor: pointer;
        }
        .cb-send.cb-send-active:hover { transform: scale(1.14) rotate(-8deg); box-shadow: 0 4px 16px rgba(245,197,66,.5); }
        .cb-send.cb-send-active:active { transform: scale(.95); }
        .cb-send:disabled { opacity: .4; }

        /* Responsive */
        @media (max-width: 480px) {
          .cb-panel { width: calc(100vw - 2rem); right: 1rem; bottom: calc(1rem + 70px); height: 72vh; }
          .cb-fab   { bottom: 1rem; right: 1rem; }
        }
        @media (max-width: 360px) {
          .cb-panel { width: calc(100vw - 1.2rem); right: .6rem; }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .cb-top-bar, .cb-avatar-ring, .cb-status-dot,
          .cb-ring, .cb-dot, .cb-wave, .cb-chip { animation: none !important; opacity: 1 !important; }
          .cb-panel { transition: opacity .2s !important; transform: none !important; }
          .cb-fab { transition: none !important; }
          .cb-msg-in { animation: none !important; }
        }
      `}</style>
    </>
  );
}
