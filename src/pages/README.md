# Pixel Pirates — Frontend (Part 1)

> Dark naval theme · React 18 · Vite · Firebase Auth · MongoDB via REST API

---

## 📁 Files in this half

```
src/
├── config/
│   └── firebase.js          ← Firebase app singleton
├── utils/
│   └── api.js               ← Axios instance + JWT interceptors
├── context/
│   ├── ToastContext.jsx      ← Global toast notifications
│   ├── AuthContext.jsx       ← Firebase + backend JWT auth
│   └── ListsContext.jsx      ← Watchlist / Reading / Songs (MongoDB)
├── components/
│   └── Navbar.jsx            ← 3 mega-dropdowns + auth + mobile
├── pages/
│   ├── LoginPage.jsx         ← Sign In / Sign Up (email + Google)
│   └── PasswordPages.jsx     ← Forgot + Reset password
├── App.jsx                   ← Router tree + context providers
├── main.jsx                  ← Entry point
└── index.css                 ← Global styles (CSS variables, cards, buttons…)
```

---

## 🚀 Quick Start

```bash
# 1. Install deps
npm install

# 2. Copy env template and fill values
cp .env.example .env

# 3. Start dev server (proxies /api → localhost:5000)
npm run dev
```

---

## 🔌 Backend API Contract

Your Express/MongoDB backend should expose these endpoints:

### Auth
| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| POST | `/api/auth/firebase` | `{idToken}` | `{token, user}` |
| GET  | `/api/auth/me`        | —           | `{user}` |
| PATCH | `/api/auth/me`       | `{name}`    | `{user}` |
| POST | `/api/auth/forgot-password` | `{email}` | `{ok}` |
| POST | `/api/auth/reset-password`  | `{token, newPassword}` | `{ok}` |

### Lists
| Method | Endpoint | Body | Returns |
|--------|----------|------|---------|
| GET    | `/api/lists/watchlist`         | —      | `[movie]`  |
| POST   | `/api/lists/watchlist`         | movie  | `movie`    |
| PATCH  | `/api/lists/watchlist/:imdbID` | `{watched}` | `movie` |
| DELETE | `/api/lists/watchlist/:imdbID` | —      | `{ok}`     |
| GET    | `/api/lists/reading`           | —      | `[book]`   |
| POST   | `/api/lists/reading`           | book   | `book`     |
| PATCH  | `/api/lists/reading/:bookId`   | `{status}` | `book` |
| DELETE | `/api/lists/reading/:bookId`   | —      | `{ok}`     |
| GET    | `/api/lists/songs`             | —      | `[song]`   |
| POST   | `/api/lists/songs`             | song   | `song`     |
| DELETE | `/api/lists/songs/:trackId`    | —      | `{ok}`     |

All protected endpoints require `Authorization: Bearer <jwt>`.

---

## 🎨 Design tokens (CSS variables)

```css
--bg          #07101f      /* page background */
--accent      #f5c542      /* gold accent */
--text        #eef2f9      /* primary text */
--text2       #7c8fa6      /* secondary text */
--card-radius 14px
--nav-h       64px
```

Light mode class `body.light` overrides all variables automatically.

---

## 🗺️ Route tree

| Path | Component | Auth? |
|------|-----------|-------|
| `/` | HomePage | No |
| `/login` | LoginPage | No |
| `/forgot-password` | ForgotPasswordPage | No |
| `/reset-password` | ResetPasswordPage | No |
| `/movies` | MoviesPage | No |
| `/songs` | SongsPage | No |
| `/books` | BooksPage | No |
| `/games` | GamesPage | No |
| `/events` | EventsPage | No |
| `/lists` | MyListsPage | **Yes** |
| `/recommendations` | RecommendPage | **Yes** |
| `/quiz` | QuizPage | **Yes** |
| `/premium` | PremiumPage | No |
| `/about` | AboutPage | No |
| `/contact` | ContactPage | No |

---

## ⚓ Part 2 covers

- `ChatBot.jsx` — Groq AI chatbot (floating FAB)
- `PremiumPage.jsx` — Stripe Checkout + success/cancel
- `GamesPage.jsx` — RAWG API with 8 genre tabs
- `EventsPage.jsx` — India events (Live/Upcoming/Concerts/E-Sports/Festivals)
- `QuizPage.jsx` — Backend-persisted quiz state
- `HomePage.jsx` / `MoviesPage.jsx` / `SongsPage.jsx` / `BooksPage.jsx` / `MyListsPage.jsx`
