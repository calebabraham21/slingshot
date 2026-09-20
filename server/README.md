# Server

ESPN owns scores/clock/logos. The Odds API owns moneylines, locked only inside a pre-tip window (default 10 minutes). HTTP `/games` never calls The Odds API.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Background jobs

- ESPN / feed rebuild: every `SCORES_POLL_MS` (default 30s)
- Odds lock check: every `ODDS_CHECK_MS` (default 60s), fetch only if an unlocked game is within `ODDS_LOCK_WINDOW_MS` of tipoff

## Production

```bash
npm run build:client
npm start
```

Serves `../client/dist` and `/games` on the same port.
