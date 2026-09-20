import cors from 'cors'
import express from 'express'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import { getFeedSnapshot } from './services/feedStore.js'
import { startScheduler } from './services/scheduler.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const clientDist = join(__dirname, '../../client/dist')

const app = express()
app.use(cors({ origin: true }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

/** Serves the last computed feed only. Never calls The Odds API. */
app.get('/games', (_req, res) => {
  const { games, meta } = getFeedSnapshot()
  res.json({
    games,
    meta: {
      ...meta,
      fetchedAt: new Date().toISOString(),
    },
  })
})

if (existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get(/.*/, (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next()
      return
    }
    if (req.path === '/games' || req.path === '/health') {
      next()
      return
    }
    res.sendFile(join(clientDist, 'index.html'))
  })
  console.log(`[static] serving client from ${clientDist}`)
}

app.listen(config.port, () => {
  console.log(`Slingshot server listening on http://localhost:${config.port}`)
  console.log('GET /games  GET /health')
  startScheduler()
})
