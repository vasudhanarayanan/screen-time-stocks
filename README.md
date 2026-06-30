# Screen Time Stocks

Your screen time, gamified as a stock portfolio. Each app you track is a "stock" — its price rises when you beat your daily goal and crashes when you doomscroll.

![Dashboard](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20SQLite-blue)

## How It Works

- **Set goals** — Define a daily time budget per app (e.g., Instagram < 30 min)
- **Log usage** — Enter your actual screen time each day (manual or batch)
- **Watch the market** — Prices fluctuate based on goal vs. actual usage
- **Compete** — Create or join friend groups via invite codes and compare portfolios

### Price Formula

```
ratio = goal_minutes / actual_minutes
daily_change = clamp((ratio - 1) * volatility, -30%, +30%)
new_price = prev_price * (1 + daily_change)
```

Beat your goal → stock goes up. Exceed it → stock crashes. Streaks compound gains.

## Features

| Feature | Description |
|---------|-------------|
| Portfolio Dashboard | All your app stocks with sparkline charts and daily % change |
| Stock Detail View | TradingView-style area charts, 52-day high/low, streak tracking |
| Daily Logging | Log screen time per app, add new apps with custom tickers |
| Leaderboards | Create/join markets with invite codes, ranked by portfolio value |
| Google OAuth | Real authentication with JWT sessions and cross-device sync |
| Live Leaderboard | WebSocket-powered real-time updates when friends log time |
| iOS Shortcuts | API endpoint for automated screen time logging from iOS |

## Tech Stack

- **Frontend:** React, Vite, [Lightweight Charts](https://github.com/nicehash/lightweight-charts) (TradingView), Socket.IO Client
- **Backend:** Express, SQLite (via better-sqlite3), Socket.IO, JWT
- **Auth:** Google OAuth 2.0 (ID token verification) + API keys for automation
- **Styling:** Custom CSS with dark theme, JetBrains Mono for data

## Live Demo

**[screen-time-stocks.up.railway.app](https://screen-time-stocks-production.up.railway.app)**

## Getting Started

### Local Development

```bash
# Clone
git clone https://github.com/vasudhanarayanan/screen-time-stocks.git
cd screen-time-stocks

# Install dependencies
cd server && npm install
cd ../client && npm install

# Seed demo data (30 days of simulated usage)
cd ../server && npm run seed

# Run (two terminals)
cd server && npm run dev    # API on localhost:3001
cd client && npm run dev    # UI on localhost:5173
```

Open http://localhost:5173

### Environment Variables

Copy `.env.example` and fill in your values:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `VITE_GOOGLE_CLIENT_ID` | Same client ID (used by the React client at build time) |
| `JWT_SECRET` | Secret for signing auth tokens (generate with `openssl rand -hex 32`) |
| `DATABASE_PATH` | Path to SQLite file (defaults to `server/data.db`) |

### Deployment (Railway)

The app is configured for one-click deployment on [Railway](https://railway.app):

1. Connect your GitHub repo in Railway
2. Set the environment variables above in **Service Variables**
3. Add a **Volume** mounted at `/data` for persistent SQLite storage
4. Set `DATABASE_PATH` to `/data/app.db`
5. Generate a domain under **Settings → Networking**
6. Add your Railway domain to Google OAuth authorized origins

## Project Structure

```
screen-time-stocks/
├── server/
│   └── src/
│       ├── index.js           # Express + HTTP + WebSocket entry
│       ├── auth.js            # JWT signing/verification + middleware
│       ├── websocket.js       # Socket.IO setup + market rooms
│       ├── db/
│       │   ├── schema.js      # SQLite schema + connection
│       │   └── seed.js        # Demo data generator
│       └── routes/
│           ├── auth.js        # Google OAuth + demo login + API keys
│           ├── users.js       # User CRUD + portfolio summary
│           ├── apps.js        # App tracking management
│           ├── snapshots.js   # Daily usage logging + price calc + WS emit
│           ├── markets.js     # Leaderboard groups
│           └── shortcuts.js   # iOS Shortcuts endpoint
├── client/
│   └── src/
│       ├── App.jsx            # Layout + routing + Google OAuth provider
│       ├── api.js             # Authenticated API client
│       ├── hooks/
│       │   ├── useAuth.js     # Auth state management
│       │   └── useSocket.js   # WebSocket hook for live updates
│       ├── components/
│       │   ├── Sparkline.jsx  # Mini inline charts
│       │   └── StockChart.jsx # Full detail chart
│       └── pages/
│           ├── Login.jsx      # Google + demo login
│           ├── Dashboard.jsx  # Portfolio overview
│           ├── StockDetail.jsx# Individual stock view
│           ├── LogTime.jsx    # Daily time entry
│           ├── Leaderboard.jsx# Live friend rankings
│           └── Settings.jsx   # API key + Shortcuts setup
├── .env.example
└── package.json
```

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/google` | — | Login with Google ID token |
| POST | `/api/auth/demo` | — | Demo login (no OAuth needed) |
| GET | `/api/auth/me` | JWT | Current user profile + API key |
| GET | `/api/users/:id` | JWT | User profile + portfolio value |
| POST | `/api/apps` | JWT | Add app to track |
| POST | `/api/snapshots/batch` | JWT | Log daily usage for multiple apps |
| GET | `/api/apps/:id/history` | JWT | Price history for charts |
| POST | `/api/markets` | JWT | Create a leaderboard group |
| POST | `/api/markets/join` | JWT | Join via invite code |
| GET | `/api/markets/:id` | JWT | Leaderboard rankings |
| POST | `/api/shortcuts/log` | API Key | Log from iOS Shortcuts |
| GET | `/api/shortcuts/status` | API Key | Quick portfolio status |

## iOS Shortcuts Integration

1. Go to **Settings** in the app to copy your API key
2. Create an iOS Shortcut with **Get Contents of URL**:
   - URL: `https://<your-railway-domain>/api/shortcuts/log`
   - Method: `POST`
   - Headers: `Authorization: Bearer <your-api-key>`
   - Body: `{"entries": [{"app": "Instagram", "minutes": 30}, {"app": "TikTok", "minutes": 15}]}`
3. Set up a **Personal Automation** (e.g., at 10 PM daily)

The endpoint auto-creates apps it hasn't seen before (with a 30-min default goal).

## WebSocket Events

The server emits `price-update` events to all members of a market room when any member logs screen time. Clients receive live leaderboard updates without polling.

## Future Ideas

- Push notifications ("$TKTOK is down 15% at market open")
- "Short selling" — bet a friend will exceed their goal
- Achievement badges ("Diamond Hands" = 30-day streak)
- Weekly "earnings report" email summaries
