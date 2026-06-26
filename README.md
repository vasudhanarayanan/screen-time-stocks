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

## Tech Stack

- **Frontend:** React, Vite, [Lightweight Charts](https://github.com/nicehash/lightweight-charts) (TradingView)
- **Backend:** Express, SQLite (via better-sqlite3)
- **Styling:** Custom CSS with dark theme, JetBrains Mono for data

## Getting Started

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

## Project Structure

```
screen-time-stocks/
├── server/
│   └── src/
│       ├── index.js           # Express app entry
│       ├── db/
│       │   ├── schema.js      # SQLite schema + connection
│       │   └── seed.js        # Demo data generator
│       └── routes/
│           ├── users.js       # User CRUD + portfolio summary
│           ├── apps.js        # App tracking management
│           ├── snapshots.js   # Daily usage logging + price calc
│           └── markets.js     # Leaderboard groups
├── client/
│   └── src/
│       ├── App.jsx            # Layout + routing + auth context
│       ├── api.js             # API client
│       ├── components/
│       │   ├── Sparkline.jsx  # Mini inline charts
│       │   └── StockChart.jsx # Full detail chart
│       └── pages/
│           ├── Dashboard.jsx  # Portfolio overview
│           ├── StockDetail.jsx# Individual stock view
│           ├── LogTime.jsx    # Daily time entry
│           └── Leaderboard.jsx# Friend rankings
└── package.json
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/users/:id` | User profile + portfolio value |
| POST | `/api/apps` | Add app to track |
| POST | `/api/snapshots/batch` | Log daily usage for multiple apps |
| GET | `/api/apps/:id/history` | Price history for charts |
| POST | `/api/markets` | Create a leaderboard group |
| POST | `/api/markets/join` | Join via invite code |
| GET | `/api/markets/:id` | Leaderboard rankings |

## Future Ideas

- iOS Shortcut integration to auto-report screen time
- Push notifications ("$TKTOK is down 15% at market open")
- "Short selling" — bet a friend will exceed their goal
- Achievement badges ("Diamond Hands" = 30-day streak)
- Weekly "earnings report" email summaries
