import type { Game } from '../types.js'

export interface FeedMeta {
  lockedOdds: number
  remainingRequests: number | null
  usedRequests: number | null
  updatedAt: string | null
  lastOddsFetchAt: string | null
}

interface FeedSnapshot {
  games: Game[]
  meta: FeedMeta
}

const emptyMeta: FeedMeta = {
  lockedOdds: 0,
  remainingRequests: null,
  usedRequests: null,
  updatedAt: null,
  lastOddsFetchAt: null,
}

let snapshot: FeedSnapshot = {
  games: [],
  meta: { ...emptyMeta },
}

/** Read-only feed for HTTP handlers. Never triggers Odds API. */
export function getFeedSnapshot(): FeedSnapshot {
  return snapshot
}

export function setFeedGames(
  games: Game[],
  partialMeta: Partial<FeedMeta> & { lockedOdds: number },
): void {
  snapshot = {
    games,
    meta: {
      ...snapshot.meta,
      ...partialMeta,
      updatedAt: new Date().toISOString(),
    },
  }
}

export function setQuotaMeta(meta: {
  remainingRequests: number | null
  usedRequests: number | null
}): void {
  snapshot = {
    ...snapshot,
    meta: {
      ...snapshot.meta,
      remainingRequests: meta.remainingRequests,
      usedRequests: meta.usedRequests,
      lastOddsFetchAt: new Date().toISOString(),
    },
  }
}
