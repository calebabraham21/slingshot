import { config, SPORTS } from '../config.js'
import { fairProbs, impliedProbability, normalizeProbs } from '../lib/odds.js'
import { rankGames } from '../lib/rank.js'
import { deriveUnderdogState } from '../lib/underdogState.js'
import { matchKey } from '../providers/espn.js'
import { extractH2H, fetchOdds } from '../providers/oddsApi.js'
import type { EspnGameSnapshot } from '../providers/espn.js'
import type { Game, GameStatus, Side, SportConfig } from '../types.js'
import { getEspnGames, resolveEspnMoneyline } from './espnScores.js'
import { setFeedGames, setQuotaMeta } from './feedStore.js'
import {
  getLockedOdds,
  lockOdds,
  lockedOddsCount,
} from './oddsLock.js'

function trackQuota(meta: {
  remainingRequests: number | null
  usedRequests: number | null
}) {
  setQuotaMeta(meta)
  if (meta.remainingRequests != null) {
    console.log(
      `[odds-api] used=${meta.usedRequests ?? '?'} remaining=${meta.remainingRequests}`,
    )
  }
}

/** True when this tipoff is inside the lock window (default: last 10 min before start). */
export function isInOddsLockWindow(startTime: string, now = Date.now()): boolean {
  const msUntil = Date.parse(startTime) - now
  return (
    msUntil <= config.oddsLockWindowMs && msUntil >= -config.oddsLockGraceMs
  )
}

function statusFromEspn(state: EspnGameSnapshot['state']): GameStatus {
  if (state === 'post') {
    return 'final'
  }
  if (state === 'in') {
    return 'live'
  }
  return 'pregame'
}

function buildGame(
  sport: SportConfig,
  snap: EspnGameSnapshot,
  locked: { home: number; away: number; draw?: number },
): Game | null {
  const status = statusFromEspn(snap.state)

  let homeFair: number
  let awayFair: number
  let drawProb: number | undefined

  if (locked.draw != null) {
    const [h, a, d] = normalizeProbs([
      impliedProbability(locked.home),
      impliedProbability(locked.away),
      impliedProbability(locked.draw),
    ])
    homeFair = h
    awayFair = a
    drawProb = d
  } else {
    const probs = fairProbs(locked.home, locked.away)
    homeFair = probs.a
    awayFair = probs.b
  }

  const underdogSide: Side = homeFair <= awayFair ? 'home' : 'away'
  const underdogFair = underdogSide === 'home' ? homeFair : awayFair

  if (underdogFair > config.maxUnderdogFairProb) {
    return null
  }

  const underdogScore =
    underdogSide === 'home' ? snap.homeScore : snap.awayScore
  const favoriteScore =
    underdogSide === 'home' ? snap.awayScore : snap.homeScore
  const underdogState = deriveUnderdogState({
    status,
    underdogScore,
    favoriteScore,
  })

  return {
    id: `espn:${snap.espnId}`,
    sport: sport.sport,
    league: sport.league,
    startTime: snap.startTime,
    status,
    clock: snap.clock,
    ...(snap.period != null ? { period: snap.period } : {}),
    ...(snap.clockSeconds != null ? { clockSeconds: snap.clockSeconds } : {}),
    ...(snap.delayed ? { delayed: true } : {}),
    home: {
      name: snap.homeName,
      abbreviation: snap.homeAbbrev,
      score: snap.homeScore,
      ...(snap.homeLogo ? { logo: snap.homeLogo } : {}),
    },
    away: {
      name: snap.awayName,
      abbreviation: snap.awayAbbrev,
      score: snap.awayScore,
      ...(snap.awayLogo ? { logo: snap.awayLogo } : {}),
    },
    pregameMoneyline: {
      home: locked.home,
      away: locked.away,
    },
    pregameFairProb: {
      home: homeFair,
      away: awayFair,
    },
    ...(drawProb != null ? { drawProb } : {}),
    underdogSide,
    underdogState,
    ...(snap.footballSituation
      ? { footballSituation: snap.footballSituation }
      : {}),
  }
}

async function ensureLock(
  sport: SportConfig,
  snap: EspnGameSnapshot,
): Promise<{ home: number; away: number; draw?: number } | undefined> {
  const key = matchKey(snap.awayName, snap.homeName)
  const existing = getLockedOdds(key)
  if (existing) {
    return existing
  }

  // Never call Odds API here. For already-live gaps only, seed ESPN closing ML.
  if (snap.state === 'pre') {
    return undefined
  }

  const ml = await resolveEspnMoneyline(sport, snap)
  if (!ml) {
    return undefined
  }

  console.log(
    `[espn] seeded closing ML for ${snap.awayAbbrev} @ ${snap.homeAbbrev}: ${ml.away}/${ml.home}`,
  )
  return lockOdds(key, ml, 'espn')
}

/**
 * Rebuild the public feed from ESPN scores + existing locks.
 * Safe to call on every poll. Does not call The Odds API.
 */
export async function rebuildFeedFromCache(): Promise<void> {
  const espnSlates = await Promise.all(SPORTS.map((sport) => getEspnGames(sport)))
  const games: Game[] = []

  for (let index = 0; index < SPORTS.length; index++) {
    const sport = SPORTS[index]
    for (const snap of espnSlates[index]) {
      const locked = await ensureLock(sport, snap)
      if (!locked) {
        continue
      }
      const game = buildGame(sport, snap, locked)
      if (game) {
        games.push(game)
      }
    }
  }

  setFeedGames(rankGames(games), { lockedOdds: lockedOddsCount() })
}

/**
 * Fetch Odds API only for sports that have an unlocked game inside the lock window.
 * Locks only those near-tip games (not the whole slate).
 */
export async function lockImminentOdds(): Promise<void> {
  for (const sport of SPORTS) {
    const snaps = await getEspnGames(sport)
    const needsFetch = snaps.some((snap) => {
      if (getLockedOdds(matchKey(snap.awayName, snap.homeName))) {
        return false
      }
      return isInOddsLockWindow(snap.startTime)
    })

    if (!needsFetch) {
      continue
    }

    console.log(`[odds-api] locking window hit for ${sport.league}`)
    const { events, meta } = await fetchOdds(sport.key)
    trackQuota(meta)

    for (const event of events) {
      if (!isInOddsLockWindow(event.commence_time)) {
        continue
      }
      const prices = extractH2H(event)
      if (!prices) {
        continue
      }
      const key = matchKey(event.away_team, event.home_team)
      if (getLockedOdds(key)) {
        continue
      }
      lockOdds(key, prices, 'odds-api')
      console.log(
        `[odds-api] locked ${event.away_team} @ ${event.home_team}`,
      )
    }
  }
}
