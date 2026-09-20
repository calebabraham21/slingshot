# Slingshot

Lightweight web app that tracks pregame underdogs across NBA, NFL, MLB, NHL, and soccer, then ranks them in one live feed.

Pregame odds only. No live win probability model.

## Stack

- **Client:** Vite, React, TypeScript, Tailwind CSS
- **Server:** Express + ESPN scoreboards (scores/clock/logos) + The Odds API (moneylines locked near tipoff)

## How credits work

Friends refreshing the site do **not** hit The Odds API.

- Browser only calls our `/games` endpoint (cached feed)
- Server polls ESPN for scores about every 30s (free)
- Server checks Odds API only when a game is inside the last **10 minutes** before tip, then locks that line forever

## Local dev

### Server

```bash
cd server
cp .env.example .env
# set ODDS_API_KEY
npm install
npm run dev
```

### Client

```bash
cd client
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:3000
npm install
npm run dev
```

## Deploy (Railway, one public URL)

1. Push this repo to GitHub
2. Create a Railway project from the repo
3. Set the service **Root Directory** to `server`
4. Add env var `ODDS_API_KEY`
5. Deploy

Build installs the client, builds it into `client/dist`, and the server serves the UI + `/games` from one URL.

Share that Railway URL with friends.
