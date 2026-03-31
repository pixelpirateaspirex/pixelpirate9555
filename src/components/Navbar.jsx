// src/components/Navbar.jsx  ── FIXED v3: mobile responsive, no duplicate theme toggle
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/* ── Nav data ─────────────────────────────────────────────────────────────── */
const NAV_MENUS = [
  {
    label: 'Entertainment',
    icon: '🎬',
    items: [
      { label: 'Movies',     icon: '🎬', to: '/movies'     },
      { label: 'Songs',      icon: '🎵', to: '/songs'      },
      { label: 'Books',      icon: '📚', to: '/books'      },
      { label: 'Podcasts',   icon: '🎙️', to: '/podcasts'   },
      { label: 'Audiobooks', icon: '🎧', to: '/audiobooks' },
    ],
  },
  {
    label: 'Games',
    icon: '🎮',
    items: [
      { label: 'Arcade',   icon: '🕹️', to: '/games?genre=arcade'                },
      { label: 'Casual',   icon: '🌸', to: '/games?genre=casual'                },
      { label: 'Action',   icon: '⚔️',  to: '/games?genre=action'                },
      { label: 'RPG',      icon: '🧙', to: '/games?genre=role-playing-games-rpg' },
      { label: 'Strategy', icon: '♟️', to: '/games?genre=strategy'              },
      { label: 'Sports',   icon: '⚽', to: '/games?genre=sports'                },
    ],
  },
  {
    label: 'Events',
    icon: '📅',
    items: [
      { label: 'Live Now',  icon: '🔴', to: '/events?tab=live'      },
      { label: 'Upcoming',  icon: '📆', to: '/events?tab=upcoming'  },
      { label: 'Concerts',  icon: '🎤', to: '/events?tab=concerts'  },
      { label: 'E-Sports',  icon: '🏆', to: '/events?tab=esports'   },
      { label: 'Festivals', icon: '🎪', to: '/events?tab=festivals' },
    ],
  },
];

const MORE_LINKS = [
  { label: 'My Lists', to: '/lists'           },
  { label: 'For You',  to: '/recommendations' },
  { label: 'AI Quiz',  to: '/quiz'            },
  { label: 'Team',     to: '/team'            },
  { label: 'About',    to: '/about'           },
  { label: 'Contact',  to: '/contact'         },
];

/* ── DropMenu ─────────────────────────────────────────────────────────────── */
function DropMenu({ menu, onClose }) {
  return (
    <div className="nav-dropdown-menu" role="menu">
      {menu.items.map((item, i) => (
        <Link
          key={item.label}
          to={item.to}
          className="nav-dropdown-item"
          onClick={onClose}
          role="menuitem"
          style={{ '--item-i': i }}
        >
          <span className="ndi-icon">{item.icon}</span>
          <span className="ndi-label">{item.label}</span>
          <span className="ndi-arrow">→</span>
        </Link>
      ))}
    </div>
  );
}

/* ── Scroll progress ──────────────────────────────────────────────────────── */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const update = () => {
      const el  = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setProgress(isNaN(pct) ? 0 : pct);
    };
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);
  return (
    <div className="pp-scroll-track">
      <div className="pp-scroll-bar" style={{ width: `${progress}%` }} />
    </div>
  );
}

/* ── Main Navbar ─────────────────────────────────────────────────────────── */
export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const { success }                  = useToast();
  const navigate                     = useNavigate();
  const location                     = useLocation();

  const [openMenu,       setOpenMenu]       = useState(null);
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [scrolled,       setScrolled]       = useState(false);
  const [theme,          setTheme]          = useState(
    () => localStorage.getItem('pp_theme') || 'dark'
  );
  const [themeAnimating, setThemeAnimating] = useState(false);

  const navRef = useRef(null);

  // Close everything on route change
  useEffect(() => { closeAll(); }, [location.pathname]); // eslint-disable-line

  // Scroll shadow
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Click-outside to close dropdowns
  useEffect(() => {
    const handler = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Apply theme to body
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('pp_theme', theme);
  }, [theme]);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const toggleTheme = () => {
    setThemeAnimating(true);
    setTimeout(() => setThemeAnimating(false), 600);
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };
  const toggleMenu = (label) => setOpenMenu((prev) => (prev === label ? null : label));
  const closeAll   = useCallback(() => { setOpenMenu(null); setMobileOpen(false); }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    success('Signed out. See you soon! 🏴‍☠️');
    navigate('/');
    closeAll();
  }, [logout, success, navigate, closeAll]);

  const rawName     = user?.name || user?.email?.split('@')[0] || 'Pirate';
  const displayName = rawName;
  const shortName   = rawName.length > 14 ? rawName.slice(0, 13) + '…' : rawName;

  return (
    <>
      <ScrollProgress />

      <header className={`pp-nav${scrolled ? ' scrolled' : ''}`} ref={navRef}>
        <div className="pp-nav-inner">

          {/* Logo */}
          <Link to="/" className="pp-logo" onClick={closeAll} aria-label="Pixel Pirates Home">
            <span className="pp-logo-mark" aria-hidden="true">⚓</span>
            <span className="pp-logo-text">
              Pixel Pirates
              <small>Your World, Our Pixels</small>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="pp-desktop-nav" aria-label="Main navigation">
            {NAV_MENUS.map((menu) => (
              <div key={menu.label} className="pp-nav-item">
                <button
                  className={`pp-nav-btn${openMenu === menu.label ? ' active' : ''}`}
                  onClick={() => toggleMenu(menu.label)}
                  aria-expanded={openMenu === menu.label}
                  aria-haspopup="true"
                >
                  <span className="btn-icon">{menu.icon}</span>
                  {menu.label}
                  <span className={`pp-chevron${openMenu === menu.label ? ' up' : ''}`} aria-hidden="true">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                </button>
                {openMenu === menu.label && (
                  <DropMenu menu={menu} onClose={closeAll} />
                )}
              </div>
            ))}

            {MORE_LINKS.map((l) => (
              <NavLink
                key={l.label}
                to={l.to}
                className={({ isActive }) =>
                  `pp-nav-link${isActive ? ' active' : ''}${l.label === 'Team' ? ' pp-nav-link--team' : ''}`
                }
                onClick={closeAll}
              >
                {l.label === 'Team' ? <span className="btn-icon">👥</span> : null}
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* ── Actions: theme + user/signin + hamburger ── */}
          <div className="pp-nav-actions">

            {/* Theme toggle — shown on ALL screen sizes */}
            <button
              className={`pp-icon-btn pp-theme-btn${themeAnimating ? ' animating' : ''}`}
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              <span className="theme-icon theme-icon--sun">☀️</span>
              <span className="theme-icon theme-icon--moon">🌙</span>
            </button>

            {isLoggedIn ? (
              <div className="pp-nav-item pp-user-nav-item">
                <button
                  className={`pp-user-btn${openMenu === '__user' ? ' active' : ''}`}
                  onClick={() => toggleMenu('__user')}
                  aria-expanded={openMenu === '__user'}
                  aria-haspopup="true"
                  title={displayName}
                >
                  <span className="pp-avatar">
                    {user?.photoURL
                      ? <img src={user.photoURL} alt={displayName} referrerPolicy="no-referrer" />
                      : <span className="pp-avatar-letter">{displayName[0].toUpperCase()}</span>
                    }
                    <span className="pp-avatar-ring" aria-hidden="true" />
                  </span>
                  {/* Username hidden on mobile via CSS */}
                  <span className="pp-username">{shortName}</span>
                  <span className={`pp-chevron pp-chevron--user${openMenu === '__user' ? ' up' : ''}`} aria-hidden="true">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                </button>

                {openMenu === '__user' && (
                  <div className="nav-dropdown-menu nav-dropdown-menu--right" role="menu">
                    <div className="nav-dropdown-header">
                      <div className="nav-dropdown-avatar">
                        {user?.photoURL
                          ? <img src={user.photoURL} alt={displayName} referrerPolicy="no-referrer" />
                          : displayName[0].toUpperCase()
                        }
                      </div>
                      <div className="nav-dd-user-info">
                        <div className="nav-dropdown-name">{displayName}</div>
                        <div className="nav-dropdown-email">{user?.email}</div>
                      </div>
                    </div>
                    <div className="nav-divider" />
                    {[
                      { to: '/lists',   icon: '📋', label: 'My Lists' },
                      { to: '/premium', icon: '👑', label: 'Premium'  },
                      { to: '/quiz',    icon: '🧠', label: 'Quiz'     },
                    ].map((item, i) => (
                      <Link
                        key={item.label} to={item.to}
                        className="nav-dropdown-item" onClick={closeAll}
                        role="menuitem" style={{ '--item-i': i }}
                      >
                        <span className="ndi-icon">{item.icon}</span>
                        <span className="ndi-label">{item.label}</span>
                        <span className="ndi-arrow">→</span>
                      </Link>
                    ))}
                    <div className="nav-divider" />
                    <button
                      className="nav-dropdown-item nav-dropdown-item--danger"
                      onClick={handleLogout}
                      role="menuitem"
                      style={{ '--item-i': 3 }}
                    >
                      <span className="ndi-icon">🚪</span>
                      <span className="ndi-label">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="pp-signin-btn" onClick={closeAll}>
                <span>👤</span>
                <span className="pp-signin-label">Sign In</span>
                <span className="pp-signin-shine" aria-hidden="true" />
              </Link>
            )}

            {/* Hamburger — only visible on mobile */}
            <button
              className={`pp-hamburger${mobileOpen ? ' open' : ''}`}
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span className="ham-line" />
              <span className="ham-line" />
              <span className="ham-line" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile backdrop */}
      <div
        className={`pp-mobile-backdrop${mobileOpen ? ' visible' : ''}`}
        onClick={closeAll}
        aria-hidden="true"
      />

      {/* Mobile nav drawer */}
      <nav
        className={`pp-mobile-nav${mobileOpen ? ' open' : ''}`}
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen ? '' : undefined}
      >
        <div className="pp-mobile-header">
          <span className="pp-mobile-logo">
            <span className="pp-logo-mark">⚓</span>
            Pixel Pirates
          </span>
          <button className="pp-mobile-close" onClick={closeAll} aria-label="Close menu">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {isLoggedIn && (
          <div className="pp-mobile-user">
            <span className="pp-mobile-avatar">
              {user?.photoURL
                ? <img src={user.photoURL} alt={displayName} referrerPolicy="no-referrer" />
                : displayName[0].toUpperCase()
              }
            </span>
            <div className="pp-mobile-user-info">
              <div className="pp-mobile-username">Hey, {displayName}!</div>
              <div className="pp-mobile-useremail">{user?.email}</div>
            </div>
          </div>
        )}

        <div className="pp-mobile-body">
          {NAV_MENUS.map((menu, gi) => (
            <div key={menu.label} className="pp-mobile-group" style={{ '--group-i': gi }}>
              <div className="pp-mobile-group-label">{menu.icon} {menu.label}</div>
              <div className="pp-mobile-group-items">
                {menu.items.map((item, ii) => (
                  <Link
                    key={item.label} to={item.to}
                    className="pp-mobile-link" onClick={closeAll}
                    style={{ '--link-i': ii }}
                  >
                    <span className="pml-icon">{item.icon}</span>
                    <span>{item.label}</span>
                    <span className="pml-arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="pp-mobile-group" style={{ '--group-i': NAV_MENUS.length }}>
            <div className="pp-mobile-group-label">⚡ More</div>
            <div className="pp-mobile-group-items">
              {MORE_LINKS.map((l, ii) => (
                <Link
                  key={l.label} to={l.to}
                  className={`pp-mobile-link${l.label === 'Team' ? ' pp-mobile-link--team' : ''}`}
                  onClick={closeAll} style={{ '--link-i': ii }}
                >
                  <span className="pml-icon">{l.label === 'Team' ? '👥' : '›'}</span>
                  <span>{l.label}</span>
                  <span className="pml-arrow">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile footer — NO theme toggle here (it lives in the top bar) */}
        <div className="pp-mobile-footer">
          {isLoggedIn
            ? <button className="pp-mobile-signout-btn" onClick={handleLogout}>🚪 Sign Out</button>
            : <Link to="/login" className="pp-mobile-signin-btn" onClick={closeAll}>👤 Sign In</Link>
          }
        </div>
      </nav>

      <style>{`
        /* ── Scroll progress ──────────────────────────────────────────── */
        .pp-scroll-track {
          position: fixed; top: 0; left: 0; right: 0; height: 3px;
          z-index: 9999; background: transparent; pointer-events: none;
        }
        .pp-scroll-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), #ffd97a, var(--accent));
          background-size: 200% 100%;
          animation: scrollGradient 2s linear infinite;
          border-radius: 0 3px 3px 0;
          box-shadow: 0 0 10px var(--accent), 0 0 20px var(--accent-glow);
          transition: width 0.08s linear;
        }
        @keyframes scrollGradient {
          0% { background-position: 0% 0% }
          100% { background-position: 200% 0% }
        }

        /* ── Navbar shell ─────────────────────────────────────────────── */
        .pp-nav {
          position: sticky; top: 0; z-index: 300;
          background: var(--header-bg);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-bottom: 1px solid var(--border);
          height: var(--nav-h, 64px);
          transition: box-shadow 0.4s ease, background 0.4s ease;
          animation: navSlideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
          overflow: visible; /* MUST be visible — clips dropdowns if hidden */
        }
        @keyframes navSlideIn {
          from { transform: translateY(-100%); opacity: 0 }
          to   { transform: translateY(0); opacity: 1 }
        }
        .pp-nav.scrolled {
          box-shadow:
            0 1px 0 rgba(255,255,255,.04),
            0 8px 32px rgba(0,0,0,.35),
            0 0 0 1px rgba(255,255,255,.03);
        }

        /* ── Inner row ────────────────────────────────────────────────── */
        .pp-nav-inner {
          max-width: 1280px; margin: 0 auto; padding: 0 1.5rem;
          display: flex; align-items: center; gap: 0.5rem; height: 100%;
          flex-wrap: nowrap; min-width: 0;
          overflow: visible; /* dropdowns must escape */
        }

        /* ── Logo — never shrinks ─────────────────────────────────────── */
        .pp-logo {
          display: flex; align-items: center; gap: 0.6rem;
          text-decoration: none; flex-shrink: 0; outline: none;
        }
        .pp-logo-mark {
          font-size: 1.6rem; display: inline-block;
          animation: anchorFloat 3.5s ease-in-out infinite;
          transform-origin: center top;
          filter: drop-shadow(0 0 8px rgba(var(--accent-rgb, 250, 180, 40), .5));
        }
        @keyframes anchorFloat {
          0%, 100% { transform: translateY(0) rotate(-3deg) }
          50%       { transform: translateY(-4px) rotate(3deg) }
        }
        .pp-logo:hover .pp-logo-mark { animation: anchorSpin 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) }
        @keyframes anchorSpin {
          0%   { transform: rotate(0deg) scale(1) }
          50%  { transform: rotate(20deg) scale(1.15) }
          100% { transform: rotate(-5deg) scale(1) }
        }
        .pp-logo-text {
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.2rem;
          background: linear-gradient(110deg, var(--accent) 20%, #ffd97a 50%, var(--accent) 80%);
          background-size: 200% auto;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          display: flex; flex-direction: column; line-height: 1;
          animation: textShimmer 4s linear infinite; white-space: nowrap;
        }
        @keyframes textShimmer {
          0%   { background-position: 0% center }
          100% { background-position: 200% center }
        }
        .pp-logo-text small {
          font-size: 0.52rem; color: var(--text2); font-weight: 400;
          background: none; -webkit-background-clip: unset; background-clip: unset;
          letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.7; margin-top: 2px;
        }

        /* ── Desktop nav ──────────────────────────────────────────────── */
        .pp-desktop-nav {
          display: flex; align-items: center; gap: 0.15rem;
          flex: 1 1 0; min-width: 0;
          margin-left: 1.5rem; flex-wrap: nowrap;
          overflow: visible; /* MUST be visible for dropdowns */
        }
        .pp-nav-item {
          position: relative; flex-shrink: 0;
        }
        .pp-nav-btn, .pp-nav-link {
          position: relative; color: var(--text2);
          background: none; border: none;
          font-family: 'Outfit', sans-serif; font-size: 0.84rem; font-weight: 500;
          padding: 0.42rem 0.7rem; border-radius: 8px; cursor: pointer;
          transition: color 0.2s, background 0.2s;
          display: flex; align-items: center; gap: 0.3rem;
          text-decoration: none; white-space: nowrap; overflow: hidden;
        }
        .pp-nav-btn::after, .pp-nav-link::after {
          content: ''; position: absolute; bottom: 4px; left: 50%;
          transform: translateX(-50%) scaleX(0); width: calc(100% - 1.4rem); height: 2px;
          background: linear-gradient(90deg, var(--accent), #ffd97a); border-radius: 2px;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .pp-nav-btn:hover::after, .pp-nav-link:hover::after,
        .pp-nav-btn.active::after, .pp-nav-link.active::after { transform: translateX(-50%) scaleX(1) }
        .pp-nav-btn:hover, .pp-nav-link:hover,
        .pp-nav-btn.active, .pp-nav-link.active { color: var(--accent); background: var(--accent-glow) }
        .btn-icon { font-size: 0.9em; transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) }
        .pp-nav-btn:hover .btn-icon, .pp-nav-link:hover .btn-icon { transform: scale(1.3) rotate(-5deg) }
        .pp-chevron {
          display: inline-flex; align-items: center;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); opacity: 0.6;
        }
        .pp-chevron.up { transform: rotate(-180deg) }

        /* ── Dropdown ─────────────────────────────────────────────────── */
        .nav-dropdown-menu {
          position: absolute;
          top: calc(100% + 0.65rem);
          left: 50%; transform: translateX(-50%);
          background: var(--modal-bg);
          border: 1px solid var(--border);
          border-radius: var(--card-radius, 14px);
          padding: 0.5rem; min-width: 210px;
          box-shadow:
            0 4px 6px rgba(0,0,0,.05),
            0 20px 50px rgba(0,0,0,.4),
            0 0 0 1px rgba(255,255,255,.04);
          animation: dropPop 0.22s cubic-bezier(0.34, 1.4, 0.64, 1) both;
          transform-origin: top center;
          z-index: 400;
        }
        .nav-dropdown-menu--right {
          left: auto; right: 0; transform: none; transform-origin: top right;
          animation: dropPopRight 0.22s cubic-bezier(0.34, 1.4, 0.64, 1) both;
        }
        @keyframes dropPop {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px) scale(0.95) }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1) }
        }
        @keyframes dropPopRight {
          from { opacity: 0; transform: translateY(-10px) scale(0.95) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
        .nav-dropdown-header {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.65rem 0.85rem; min-width: 0;
        }
        .nav-dropdown-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), #ffd97a);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.85rem; font-weight: 700; color: #07101f;
          flex-shrink: 0; overflow: hidden;
        }
        .nav-dropdown-avatar img { width: 100%; height: 100%; object-fit: cover }
        .nav-dd-user-info { min-width: 0; flex: 1; overflow: hidden }
        .nav-dropdown-name {
          font-size: 0.88rem; font-weight: 700; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .nav-dropdown-email {
          font-size: 0.72rem; color: var(--text2);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 160px;
        }
        .nav-dropdown-item {
          display: flex; align-items: center; gap: 0.65rem;
          padding: 0.58rem 0.85rem; border-radius: 9px;
          font-size: 0.86rem; color: var(--text2); cursor: pointer;
          transition: background 0.15s, color 0.15s, transform 0.15s;
          text-decoration: none; width: 100%; background: none; border: none;
          font-family: 'Outfit', sans-serif; text-align: left;
          animation: itemFadeIn 0.25s ease both;
          animation-delay: calc(var(--item-i, 0) * 0.04s);
        }
        @keyframes itemFadeIn {
          from { opacity: 0; transform: translateX(-6px) }
          to   { opacity: 1; transform: translateX(0) }
        }
        .nav-dropdown-item:hover { background: var(--accent-glow); color: var(--accent); transform: translateX(3px) }
        .nav-dropdown-item--danger:hover { background: rgba(239,68,68,.1); color: var(--danger); transform: translateX(3px) }
        .ndi-icon { font-size: 1rem; width: 20px; text-align: center; flex-shrink: 0; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) }
        .nav-dropdown-item:hover .ndi-icon { transform: scale(1.2) }
        .ndi-label { flex: 1 }
        .ndi-arrow {
          font-size: 0.75rem; opacity: 0; transform: translateX(-4px);
          transition: opacity 0.15s, transform 0.15s; color: var(--accent);
        }
        .nav-dropdown-item:hover .ndi-arrow { opacity: 1; transform: translateX(0) }
        .nav-divider { border: none; border-top: 1px solid var(--border); margin: 0.35rem 0 }

        /* ── Actions — flex row, never wraps ─────────────────────────── */
        .pp-nav-actions {
          display: flex; align-items: center; gap: 0.45rem;
          margin-left: auto;
          flex-shrink: 0; /* pinned right, never compressed */
          min-width: 0;
        }

        /* ── Theme toggle ─────────────────────────────────────────────── */
        .pp-icon-btn {
          position: relative; background: var(--surface);
          border: 1px solid var(--border); border-radius: 10px;
          width: 38px; height: 38px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;
          overflow: hidden;
        }
        .pp-icon-btn:hover {
          border-color: var(--accent); background: var(--accent-glow);
          transform: scale(1.05); box-shadow: 0 0 12px var(--accent-glow);
        }
        .pp-theme-btn { font-size: 1rem }
        .theme-icon {
          position: absolute; font-size: 1rem;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s;
        }
        .theme-icon--sun  { transform: translateY(0) scale(1); opacity: 1 }
        .theme-icon--moon { transform: translateY(100%) scale(0.5); opacity: 0 }
        body.light .theme-icon--sun  { transform: translateY(-100%) scale(0.5); opacity: 0 }
        body.light .theme-icon--moon { transform: translateY(0) scale(1); opacity: 1 }
        .pp-theme-btn.animating .theme-icon--sun,
        .pp-theme-btn.animating .theme-icon--moon {
          animation: themeSpin 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes themeSpin {
          0%   { transform: rotate(0deg) scale(1) }
          50%  { transform: rotate(180deg) scale(1.3) }
          100% { transform: rotate(360deg) scale(1) }
        }

        /* ── User pill ────────────────────────────────────────────────── */
        .pp-user-nav-item {
          position: relative; flex-shrink: 0;
          max-width: 200px; min-width: 0;
          overflow: visible; /* MUST be visible — clips dropdown if hidden */
        }
        .pp-user-btn {
          display: flex; align-items: center; gap: 0.45rem;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 2rem; padding: 0.25rem 0.75rem 0.25rem 0.28rem;
          cursor: pointer; font-family: 'Outfit', sans-serif;
          font-size: 0.84rem; color: var(--text);
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          max-width: 200px; min-width: 0; width: 100%;
          /* NO overflow:hidden — would clip the dropdown */
        }
        .pp-user-btn:hover, .pp-user-btn.active {
          border-color: var(--accent); background: var(--accent-glow); color: var(--accent);
          box-shadow: 0 0 16px rgba(var(--accent-rgb, 250, 180, 40), .15);
        }
        .pp-avatar {
          position: relative; width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), #ffd97a);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; font-weight: 700; color: #07101f;
          flex-shrink: 0; overflow: visible;
        }
        .pp-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover }
        .pp-avatar-letter { position: relative; z-index: 1 }
        .pp-avatar-ring {
          position: absolute; inset: -3px; border-radius: 50%;
          border: 2px solid transparent;
          background:
            linear-gradient(var(--surface), var(--surface)) padding-box,
            linear-gradient(135deg, var(--accent), #ffd97a) border-box;
          animation: ringPulse 2.5s ease-in-out infinite;
        }
        @keyframes ringPulse {
          0%, 100% { opacity: .4; transform: scale(1) }
          50%       { opacity: .9; transform: scale(1.08) }
        }
        .pp-username {
          min-width: 0; flex: 1 1 auto;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-weight: 500;
        }
        .pp-user-btn .pp-chevron--user { flex-shrink: 0 }

        /* ── Sign-in button ───────────────────────────────────────────── */
        .pp-signin-btn {
          position: relative; display: flex; align-items: center; gap: 0.4rem;
          background: linear-gradient(135deg, var(--accent), #ffd97a);
          color: #07101f; padding: 0.45rem 1.1rem; font-size: 0.84rem;
          border-radius: 2rem; font-weight: 700; text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: hidden; font-family: 'Outfit', sans-serif;
          flex-shrink: 0; white-space: nowrap;
        }
        .pp-signin-btn:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 6px 20px rgba(var(--accent-rgb, 250, 180, 40), .4);
        }
        .pp-signin-shine {
          position: absolute; top: 0; left: -75%; width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent);
          transform: skewX(-15deg); animation: shineSweep 3s ease-in-out infinite;
        }
        @keyframes shineSweep {
          0%      { left: -75% }
          40%,100% { left: 125% }
        }

        /* ── Hamburger ────────────────────────────────────────────────── */
        .pp-hamburger {
          display: none; flex-direction: column; justify-content: center;
          align-items: center; gap: 5px;
          width: 38px; height: 38px; flex-shrink: 0;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 11px; cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .pp-hamburger:hover { border-color: var(--accent); background: var(--accent-glow) }
        .ham-line {
          display: block; width: 18px; height: 2px;
          background: var(--text); border-radius: 2px;
          transition:
            transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
            opacity 0.2s, width 0.3s;
        }
        .pp-hamburger.open .ham-line:nth-child(1) { transform: translateY(7px) rotate(45deg) }
        .pp-hamburger.open .ham-line:nth-child(2) { opacity: 0; transform: scaleX(0); width: 0 }
        .pp-hamburger.open .ham-line:nth-child(3) { transform: translateY(-7px) rotate(-45deg) }

        /* ── Mobile backdrop ──────────────────────────────────────────── */
        .pp-mobile-backdrop {
          display: none; position: fixed; inset: 0; background: rgba(0,0,0,.6);
          backdrop-filter: blur(4px); z-index: 289; opacity: 0;
          transition: opacity 0.3s ease; pointer-events: none;
        }
        .pp-mobile-backdrop.visible { opacity: 1; pointer-events: auto }

        /* ── Mobile nav drawer ────────────────────────────────────────── */
        .pp-mobile-nav {
          display: none; position: fixed; top: 0; right: 0; bottom: 0;
          width: min(320px, 85vw); background: var(--modal-bg, #0c1829);
          border-left: 1px solid var(--border); z-index: 350;
          flex-direction: column; overflow-y: auto;
          transform: translateX(105%);
          transition: transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: -20px 0 60px rgba(0,0,0,.5);
          background-image: radial-gradient(
            ellipse 80% 40% at 50% 0%,
            rgba(var(--accent-rgb, 250, 180, 40), .06),
            transparent
          );
        }
        .pp-mobile-nav.open { transform: translateX(0) }
        .pp-mobile-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.2rem 1.25rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .pp-mobile-logo {
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.3rem;
          background: linear-gradient(110deg, var(--accent), #ffd97a);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          display: flex; align-items: center; gap: 0.5rem;
        }
        .pp-mobile-close {
          width: 34px; height: 34px; background: var(--surface);
          border: 1px solid var(--border); color: var(--text2);
          border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.2s, border-color 0.2s, color 0.2s, transform 0.2s;
          flex-shrink: 0;
        }
        .pp-mobile-close:hover {
          background: var(--danger, #ef4444); border-color: var(--danger, #ef4444);
          color: #fff; transform: rotate(90deg);
        }
        .pp-mobile-user {
          display: flex; align-items: center; gap: 0.85rem;
          padding: 1rem 1.25rem; background: var(--accent-glow);
          border-bottom: 1px solid var(--border);
          animation: slideInFromRight 0.4s ease both; animation-delay: 0.05s;
          overflow: hidden;
        }
        .pp-mobile-user-info { min-width: 0; overflow: hidden; flex: 1 }
        .pp-mobile-avatar {
          width: 40px; height: 40px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), #ffd97a);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.9rem; font-weight: 700; color: #07101f;
          flex-shrink: 0; overflow: hidden;
        }
        .pp-mobile-avatar img { width: 100%; height: 100%; object-fit: cover }
        .pp-mobile-username {
          font-size: 0.92rem; font-weight: 700; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pp-mobile-useremail {
          font-size: 0.72rem; color: var(--text2);
          overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; max-width: 100%;
        }
        .pp-mobile-body {
          flex: 1; padding: 1rem 0.85rem;
          display: flex; flex-direction: column; gap: 0.5rem;
        }
        .pp-mobile-group {
          animation: slideInFromRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: calc(0.08s + var(--group-i, 0) * 0.06s);
        }
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(24px) }
          to   { opacity: 1; transform: translateX(0) }
        }
        .pp-mobile-group-label {
          font-size: 0.68rem; font-weight: 700; color: var(--text2);
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 0.4rem 0.6rem 0.3rem;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .pp-mobile-group-items { display: flex; flex-direction: column; gap: 0.15rem }
        .pp-mobile-link {
          display: flex; align-items: center; gap: 0.7rem;
          padding: 0.62rem 0.75rem; border-radius: 10px; color: var(--text);
          font-size: 0.93rem; text-decoration: none; font-weight: 500;
          transition: background 0.15s, color 0.15s, transform 0.15s;
          animation: fadeInLink 0.4s ease both;
          animation-delay: calc(0.12s + var(--group-i, 0) * 0.06s + var(--link-i, 0) * 0.03s);
        }
        @keyframes fadeInLink {
          from { opacity: 0; transform: translateX(12px) }
          to   { opacity: 1; transform: translateX(0) }
        }
        .pp-mobile-link:hover { background: var(--accent-glow); color: var(--accent); transform: translateX(4px) }
        .pml-icon { font-size: 1rem; width: 22px; text-align: center; flex-shrink: 0 }
        .pml-arrow {
          margin-left: auto; font-size: 0.8rem; color: var(--accent);
          opacity: 0; transform: translateX(-4px);
          transition: opacity 0.15s, transform 0.15s;
        }
        .pp-mobile-link:hover .pml-arrow { opacity: 1; transform: translateX(0) }

        /* Mobile footer — sign out / sign in only (theme toggle is in top bar) */
        .pp-mobile-footer {
          padding: 1rem 1.25rem 1.5rem; border-top: 1px solid var(--border);
          flex-shrink: 0;
          animation: slideInFromRight 0.5s ease both; animation-delay: 0.35s;
        }
        .pp-mobile-signout-btn, .pp-mobile-signin-btn {
          width: 100%; padding: 0.72rem 1rem; border-radius: 12px;
          font-family: 'Outfit', sans-serif; font-size: 0.9rem; font-weight: 600; cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s, background 0.2s;
          text-align: center; text-decoration: none;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          border: 1px solid var(--border);
        }
        .pp-mobile-signout-btn {
          background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.3);
          color: var(--danger, #ef4444);
        }
        .pp-mobile-signout-btn:hover { background: rgba(239,68,68,.15); transform: translateY(-2px) }
        .pp-mobile-signin-btn {
          background: linear-gradient(135deg, var(--accent), #ffd97a);
          border-color: transparent; color: #07101f;
        }
        .pp-mobile-signin-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(var(--accent-rgb, 250, 180, 40), .35);
        }

        /* ── Responsive: 1100px ───────────────────────────────────────── */
        @media (max-width: 1100px) {
          .pp-desktop-nav { gap: 0.05rem; margin-left: 0.75rem }
          .pp-nav-btn, .pp-nav-link { font-size: 0.78rem; padding: 0.38rem 0.48rem }
          .pp-user-btn, .pp-user-nav-item { max-width: 150px }
        }

        /* ── Responsive: 900px — switch to hamburger ──────────────────── */
        @media (max-width: 900px) {
          .pp-desktop-nav { display: none }
          .pp-hamburger { display: flex }
          .pp-mobile-nav { display: flex }
          .pp-mobile-backdrop { display: block }

          /* On mobile, collapse the user pill to icon-only */
          .pp-username { display: none }
          .pp-chevron--user { display: none }
          .pp-user-btn {
            padding: 0.25rem;
            border-radius: 50%;
            width: 38px; height: 38px;
            justify-content: center;
          }
          .pp-user-nav-item { max-width: 38px }

          /* Tighten action gap so hamburger is always visible */
          .pp-nav-actions { gap: 0.35rem }
          .pp-nav-inner { padding: 0 1rem }
        }

        /* ── Responsive: 600px ────────────────────────────────────────── */
        @media (max-width: 600px) {
          .pp-logo-text { font-size: 1.05rem }
          .pp-logo-text small { display: none }
          /* Hide sign-in label, keep icon only */
          .pp-signin-label { display: none }
          .pp-signin-btn {
            padding: 0.45rem 0.65rem;
            border-radius: 50%;
            width: 38px; height: 38px;
            justify-content: center;
          }
        }

        /* ── Responsive: 400px ────────────────────────────────────────── */
        @media (max-width: 400px) {
          .pp-logo-mark { font-size: 1.35rem }
          .pp-logo-text { font-size: 0.95rem }
          /* At very small sizes hide sign-in entirely; user can sign in from drawer */
          .pp-signin-btn { display: none }
        }

        /* ── Reduce motion ────────────────────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .pp-logo-mark, .pp-logo-text, .pp-scroll-bar, .pp-signin-shine,
          .pp-avatar-ring, .pp-mobile-group, .pp-mobile-link,
          .nav-dropdown-item, .pp-mobile-footer, .pp-mobile-user {
            animation: none !important;
          }
          .pp-nav, .pp-mobile-nav, .pp-mobile-close, .pp-hamburger,
          .ham-line, .pp-nav-btn, .pp-nav-link, .nav-dropdown-item,
          .pp-mobile-link { transition-duration: 0.01ms !important }
        }
      `}</style>
    </>
  );
}
