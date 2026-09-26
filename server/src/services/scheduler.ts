import { config } from '../config.js'
import { rebuildFeedFromCache } from './gameFeed.js'

let started = false

async function safeRun(label: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (error) {
    console.error(`[scheduler] ${label} failed`, error)
  }
}

/** Background worker: ESPN scores + Polymarket probs on one poll loop. */
export function startScheduler(): void {
  if (started) {
    return
  }
  started = true

  void safeRun('initial-feed', rebuildFeedFromCache)

  setInterval(() => {
    void safeRun('scores-poll', rebuildFeedFromCache)
  }, config.scoresPollMs)

  console.log(
    `[scheduler] ESPN + Polymarket every ${config.scoresPollMs}ms (lock window ${config.oddsLockWindowMs}ms)`,
  )
}
