# Slingshot

Lightweight web app that tracks pregame underdogs across NBA, NFL, MLB, NHL, and soccer, then ranks them in one live feed. Open it and instantly see which big underdogs are currently winning or still within striking distance.

Pregame odds only. No live win probability model.

## Stack

- **Client:** Vite, React, TypeScript, Tailwind CSS
- **Server:** Coming later (polls odds/scores, ranked games API)

## Run the client

```bash
cd client
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm test
```

Runs the odds utility unit tests.

## Project layout

```
slingshot/
  client/   React frontend
  server/   API stub (empty for now)
```
