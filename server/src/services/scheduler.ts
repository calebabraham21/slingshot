import { config } from '../config.js'
import { lockImminentOdds, rebuildFeedFromCache } from './gameFeed.js'

let started = false

async function safeRun(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (error) {
    console.error(`[scheduler] ${label} failed`, error)
  }
}

/** Background worker: ESPN/scores often, Odds API only near tipoff. */
export function startScheduler(): void {
  if (started) {
    return
  }
  started = true

  void safeRun('initial-feed', async () => {
    await rebuildFeedFromCache()
    await lockImminentOdds()
    await rebuildFeedFromCache()
  })

  setInterval(() => {
    void safeRun('scores-poll', rebuildFeedFromCache)
  }, config.scoresPollMs)

  setInterval(() => {
    void safeRun('odds-window', async () => {
      await lockImminentOdds()
      await rebuildFeedFromCache()
    })
  }, config.oddsCheckMs)

  console.log(
    `[scheduler] ESPN every ${config.scoresPollMs}ms; Odds API check every ${config.oddsCheckMs}ms (lock window ${config.oddsLockWindowMs}ms)`,
  )
}
