import { config } from '../config.js'
import type { SportConfig } from '../types.js'
import {
  fetchEspnClosingMoneyline,
  fetchEspnScoreboard,
  matchKey,
  type EspnGameSnapshot,
} from '../providers/espn.js'

interface CacheBucket {
  fetchedAt: number
  games: EspnGameSnapshot[]
  byMatchup: Map<string, EspnGameSnapshot>
}

const cache = new Map<string, CacheBucket>()

async function loadSport(sport: SportConfig): Promise<CacheBucket> {
  const empty: CacheBucket = {
    fetchedAt: 0,
    games: [],
    byMatchup: new Map(),
  }

  if (!sport.espn) {
    return empty
  }

  const cached = cache.get(sport.key)
  if (cached && Date.now() - cached.fetchedAt < config.scoresTtlMs) {
    return cached
  }

  try {
    const fresh = await fetchEspnScoreboard(sport.espn)
    const prevById = new Map(
      (cached?.games ?? []).map((snap) => [snap.espnId, snap]),
    )
    const games = fresh.map((snap) => {
      if (snap.state !== 'in') {
        return snap
      }
      if (snap.footballSituation) {
        return snap
      }
      // Only reuse a prior drive if possession + ball spot still match.
      const previous = prevById.get(snap.espnId)?.footballSituation
      if (!previous) {
        return snap
      }
      return { ...snap, footballSituation: previous }
    })
    const byMatchup = new Map<string, EspnGameSnapshot>()
    for (const snap of games) {
      byMatchup.set(matchKey(snap.awayName, snap.homeName), snap)
    }
    const bucket: CacheBucket = {
      fetchedAt: Date.now(),
      games,
      byMatchup,
    }
    cache.set(sport.key, bucket)
    return bucket
  } catch (error) {
    console.warn(`[espn] scoreboard failed for ${sport.key}`, error)
    return cached ?? empty
  }
}

/** ESPN is the source of truth for today's slate, scores, and clock. */
export async function getEspnGames(
  sport: SportConfig,
): Promise<EspnGameSnapshot[]> {
  const bucket = await loadSport(sport)
  return bucket.games
}

export async function getEspnSnapshot(
  sport: SportConfig,
  awayName: string,
  homeName: string,
): Promise<EspnGameSnapshot | undefined> {
  const bucket = await loadSport(sport)
  return bucket.byMatchup.get(matchKey(awayName, homeName))
}

/** Prefer scoreboard ML; if missing (common once live), hit ESPN core odds once. */
export async function resolveEspnMoneyline(
  sport: SportConfig,
  snap: EspnGameSnapshot,
): Promise<{ home: number; away: number } | null> {
  if (snap.homeMl != null && snap.awayMl != null) {
    return { home: snap.homeMl, away: snap.awayMl }
  }
  if (!sport.espn) {
    return null
  }
  try {
    return await fetchEspnClosingMoneyline(sport.espn, snap.espnId)
  } catch (error) {
    console.warn(`[espn] closing ML failed for ${snap.espnId}`, error)
    return null
  }
}
