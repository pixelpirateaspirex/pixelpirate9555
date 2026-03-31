// src/context/ListsContext.jsx
import {
  createContext, useContext, useState, useEffect, useCallback,
} from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const ListsContext = createContext(null);

/* ── Local-storage cache helpers ──────────────────────────────────────────── */
const LS = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del: (k) => localStorage.removeItem(k),
};
const cKey = (uid, type) => `pp_list_${uid}_${type}`;

export function ListsProvider({ children }) {
  const { user, isLoggedIn } = useAuth();
  const uid = user?.uid || user?.email || null;

  const [watchlist,    setWatchlist]    = useState([]);
  const [readingList,  setReadingList]  = useState([]);
  const [songsHeard,   setSongsHeard]   = useState([]);
  const [syncing,      setSyncing]      = useState(false);

  // ── Fetch all lists from backend ───────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!isLoggedIn) return;
    setSyncing(true);
    try {
      const [wl, rl, sl] = await Promise.all([
        api.get('/lists/watchlist'),
        api.get('/lists/reading'),
        api.get('/lists/songs'),
      ]);
      setWatchlist(wl.data || []);
      setReadingList(rl.data || []);
      setSongsHeard(sl.data || []);
      if (uid) {
        LS.set(cKey(uid,'wl'), wl.data);
        LS.set(cKey(uid,'rl'), rl.data);
        LS.set(cKey(uid,'sl'), sl.data);
      }
    } catch {
      // fallback to local cache
      if (uid) {
        setWatchlist(LS.get(cKey(uid,'wl')) || []);
        setReadingList(LS.get(cKey(uid,'rl')) || []);
        setSongsHeard(LS.get(cKey(uid,'sl')) || []);
      }
    } finally {
      setSyncing(false);
    }
  }, [isLoggedIn, uid]);

  useEffect(() => {
    if (isLoggedIn && uid) {
      // Show cached immediately, then fetch fresh
      setWatchlist(LS.get(cKey(uid,'wl')) || []);
      setReadingList(LS.get(cKey(uid,'rl')) || []);
      setSongsHeard(LS.get(cKey(uid,'sl')) || []);
      fetchAll();
    } else {
      setWatchlist([]);
      setReadingList([]);
      setSongsHeard([]);
    }
  }, [isLoggedIn, uid]); // eslint-disable-line

  // ── Generic optimistic helper ─────────────────────────────────────────────
  const optimistic = (setter, newVal, lsKey) => {
    setter(newVal);
    if (uid) LS.set(lsKey, newVal);
  };

  // ── WATCHLIST ─────────────────────────────────────────────────────────────
  const addToWatchlist = useCallback(async (movie) => {
    const already = watchlist.some((m) => m.imdbID === movie.imdbID);
    if (already) return false;
    const entry = { ...movie, watched: false, addedAt: Date.now() };
    const next  = [entry, ...watchlist];
    optimistic(setWatchlist, next, cKey(uid,'wl'));
    try { await api.post('/lists/watchlist', entry); } catch { /* ignore */ }
    return true;
  }, [watchlist, uid]);

  const removeFromWatchlist = useCallback(async (imdbID) => {
    const next = watchlist.filter((m) => m.imdbID !== imdbID);
    optimistic(setWatchlist, next, cKey(uid,'wl'));
    try { await api.delete(`/lists/watchlist/${imdbID}`); } catch { /* ignore */ }
  }, [watchlist, uid]);

  const markWatched = useCallback(async (imdbID) => {
    const next = watchlist.map((m) =>
      m.imdbID === imdbID ? { ...m, watched: !m.watched, watchedAt: Date.now() } : m
    );
    optimistic(setWatchlist, next, cKey(uid,'wl'));
    const movie = next.find((m) => m.imdbID === imdbID);
    try { await api.patch(`/lists/watchlist/${imdbID}`, { watched: movie?.watched }); } catch { /* ignore */ }
  }, [watchlist, uid]);

  const isInWatchlist = useCallback(
    (imdbID) => watchlist.some((m) => m.imdbID === imdbID),
    [watchlist]
  );

  // ── READING LIST ──────────────────────────────────────────────────────────
  const addToReading = useCallback(async (book) => {
    const already = readingList.some((b) => b.bookId === book.bookId);
    if (already) return false;
    const entry = { ...book, status: 'Want to Read', addedAt: Date.now() };
    const next  = [entry, ...readingList];
    optimistic(setReadingList, next, cKey(uid,'rl'));
    try { await api.post('/lists/reading', entry); } catch { /* ignore */ }
    return true;
  }, [readingList, uid]);

  const removeFromReading = useCallback(async (bookId) => {
    const next = readingList.filter((b) => b.bookId !== bookId);
    optimistic(setReadingList, next, cKey(uid,'rl'));
    try { await api.delete(`/lists/reading/${bookId}`); } catch { /* ignore */ }
  }, [readingList, uid]);

  const updateReadingStatus = useCallback(async (bookId, status) => {
    const next = readingList.map((b) =>
      b.bookId === bookId ? { ...b, status, statusUpdatedAt: Date.now() } : b
    );
    optimistic(setReadingList, next, cKey(uid,'rl'));
    try { await api.patch(`/lists/reading/${bookId}`, { status }); } catch { /* ignore */ }
  }, [readingList, uid]);

  const isInReading = useCallback(
    (bookId) => readingList.some((b) => b.bookId === bookId),
    [readingList]
  );

  // ── SONGS HEARD ───────────────────────────────────────────────────────────
  const trackSong = useCallback(async (song) => {
    // Don't double-add the same track in the last 5 min
    const recent = songsHeard[0];
    if (recent && recent.trackId === song.trackId && Date.now() - recent.ts < 300_000) return;
    const entry = { ...song, ts: Date.now() };
    const next  = [entry, ...songsHeard].slice(0, 200);
    optimistic(setSongsHeard, next, cKey(uid,'sl'));
    try { await api.post('/lists/songs', entry); } catch { /* ignore */ }
  }, [songsHeard, uid]);

  const removeFromSongs = useCallback(async (trackId) => {
    const next = songsHeard.filter((s) => s.trackId !== trackId);
    optimistic(setSongsHeard, next, cKey(uid,'sl'));
    try { await api.delete(`/lists/songs/${trackId}`); } catch { /* ignore */ }
  }, [songsHeard, uid]);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const stats = {
    watchlistCount:   watchlist.length,
    watchedCount:     watchlist.filter((m) => m.watched).length,
    readingCount:     readingList.length,
    finishedCount:    readingList.filter((b) => b.status === 'Finished').length,
    songsCount:       songsHeard.length,
  };

  // ── Genre history for recommendations ─────────────────────────────────────
  const genreHistory = useCallback(() => {
    const gc = {};
    watchlist.forEach((m) => { if (m.genre) gc[m.genre] = (gc[m.genre] || 0) + 2; });
    readingList.forEach((b) => { if (b.genre) gc[b.genre] = (gc[b.genre] || 0) + 1; });
    return Object.entries(gc).sort((a, b) => b[1] - a[1]).map(([g]) => g);
  }, [watchlist, readingList]);

  const value = {
    watchlist, readingList, songsHeard, syncing, stats, genreHistory,
    fetchAll,
    addToWatchlist, removeFromWatchlist, markWatched, isInWatchlist,
    addToReading,   removeFromReading,   updateReadingStatus, isInReading,
    trackSong,      removeFromSongs,
  };

  return (
    <ListsContext.Provider value={value}>
      {children}
    </ListsContext.Provider>
  );
}

export function useLists() {
  const ctx = useContext(ListsContext);
  if (!ctx) throw new Error('useLists must be used inside ListsProvider');
  return ctx;
}
