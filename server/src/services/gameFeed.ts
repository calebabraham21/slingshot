import { config, SPORTS } from '../config.js'
import { americanFromProb } from '../lib/odds.js'
import { rankGames } from '../lib/rank.js'
import { deriveUnderdogState } from '../lib/underdogState.js'
import { matchKey } from '../providers/espn.js'
import {
  fetchPolymarketMoneylineAsOf,
  fetchPolymarketMoneylines,
  polymarketSportSupported,
  type PolymarketMoneyline,
} from '../providers/polymarket.js'
import type { EspnGameSnapshot } from '../providers/espn.js'
import type { Game, GameStatus, Side, SportConfig } from '../types.js'
import { getEspnGames } from './espnScores.js'
import { setFeedGames } from './feedStore.js'
import {
  getLockedOdds,
  lockOdds,
  lockedOddsCount,
  type LockedOdds,
} from './oddsLock.js'

/** True when tipoff is inside the Polymarket lock window (default: last 2 min). */
export function isInOddsLockWindow(startTime: string, now = Date.now()): boolean {
  const msUntil = Date.parse(startTime) - now
  return (
    msUntil <= config.oddsLockWindowMs && msUntil >= -config.oddsLockGraceMs
  )
}

function statusFromEspn(state: EspnGameSnapshot['state']): GameStatus {
  if (state === 'post') return 'final'
  if (state === 'in') return 'live'
  return 'pregame'
}

function snapNames(snap: EspnGameSnapshot) {
  return {
    awayName: snap.awayName,
    homeName: snap.homeName,
    awayLabel: snap.awayLabel,
    homeLabel: snap.homeLabel,
    startTime: snap.startTime,
  }
}

function buildGame(
  sport: SportConfig,
  snap: EspnGameSnapshot,
  locked: LockedOdds,
  live: PolymarketMoneyline | null,
): Game | null {
  const status = statusFromEspn(snap.state)
  const homeFair = locked.home
  const awayFair = locked.away

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

  const liveHome = live?.home ?? homeFair
  const liveAway = live?.away ?? awayFair

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
      name: snap.homeLabel,
      abbreviation: snap.homeAbbrev,
      score: snap.homeScore,
      ...(snap.homeLogo ? { logo: snap.homeLogo } : {}),
      ...(snap.homeColor ? { color: snap.homeColor } : {}),
      ...(snap.homeRank != null ? { rank: snap.homeRank } : {}),
    },
    away: {
      name: snap.awayLabel,
      abbreviation: snap.awayAbbrev,
      score: snap.awayScore,
      ...(snap.awayLogo ? { logo: snap.awayLogo } : {}),
      ...(snap.awayColor ? { color: snap.awayColor } : {}),
      ...(snap.awayRank != null ? { rank: snap.awayRank } : {}),
    },
    pregameMoneyline: {
      home: americanFromProb(homeFair),
      away: americanFromProb(awayFair),
    },
    pregameFairProb: {
      home: homeFair,
      away: awayFair,
    },
    underdogSide,
    underdogState,
    ...(snap.footballSituation
      ? { footballSituation: snap.footballSituation }
      : {}),
    ...(status !== 'pregame'
      ? {
          liveMarketProb: {
            home: liveHome,
            away: liveAway,
            source: 'polymarket' as const,
          },
        }
      : {}),
  }
}

async function ensurePolymarketLock(
  sport: SportConfig,
  snap: EspnGameSnapshot,
  current: PolymarketMoneyline | null,
): Promise<LockedOdds | undefined> {
  const key = matchKey(snap.awayName, snap.homeName)
  const existing = getLockedOdds(key)
  if (existing) {
    return existing
  }

  const lookup = {
    sport: sport.sport,
    ...snapNames(snap),
  }

  if (snap.state === 'pre' && isInOddsLockWindow(snap.startTime) && current) {
    console.log(
      `[polymarket] locked pregame ${snap.awayAbbrev} @ ${snap.homeAbbrev}: ` +
        `${(current.away * 100).toFixed(1)}% / ${(current.home * 100).toFixed(1)}%`,
    )
    return lockOdds(
      key,
      { home: current.home, away: current.away },
      { eventSlug: current.eventSlug },
    )
  }

  if (snap.state !== 'pre') {
    const tipMs = Date.parse(snap.startTime)
    if (Number.isFinite(tipMs)) {
      const asOf = Math.floor((tipMs - 90_000) / 1000)
      const hist = await fetchPolymarketMoneylineAsOf(lookup, asOf)
      if (hist) {
        console.log(
          `[polymarket] backfilled close ${snap.awayAbbrev} @ ${snap.homeAbbrev}: ` +
            `${(hist.away * 100).toFixed(1)}% / ${(hist.home * 100).toFixed(1)}%`,
        )
        return lockOdds(
          key,
          { home: hist.home, away: hist.away },
          { eventSlug: hist.eventSlug },
        )
      }
    }

    if (current) {
      console.log(
        `[polymarket] seeded live close ${snap.awayAbbrev} @ ${snap.homeAbbrev} (no history)`,
      )
      return lockOdds(
        key,
        { home: current.home, away: current.away },
        { eventSlug: current.eventSlug },
      )
    }
  }

  return undefined
}

/**
 * Rebuild the public feed from ESPN scores + Polymarket probs.
 * Safe to call on every poll. Does not call The Odds API.
 */
export async function rebuildFeedFromCache(): Promise<void> {
  const espnSlates = await Promise.all(SPORTS.map((sport) => getEspnGames(sport)))

  type Candidate = {
    id: string
    sport: SportConfig
    snap: EspnGameSnapshot
  }

  const candidates: Candidate[] = []

  for (let index = 0; index < SPORTS.length; index++) {
    const sport = SPORTS[index]!
    if (!polymarketSportSupported(sport.sport)) {
      continue
    }

    for (const snap of espnSlates[index]!) {
      const key = matchKey(snap.awayName, snap.homeName)
      const alreadyLocked = getLockedOdds(key)
      const nearTip =
        snap.state === 'pre' && isInOddsLockWindow(snap.startTime)
      const needsMarket =
        alreadyLocked != null || nearTip || snap.state !== 'pre'
      if (!needsMarket) {
        continue
      }
      candidates.push({
        id: `espn:${snap.espnId}`,
        sport,
        snap,
      })
    }
  }

  const currentById = await fetchPolymarketMoneylines(
    candidates.map(({ id, sport, snap }) => ({
      id,
      sport: sport.sport,
      ...snapNames(snap),
    })),
  )

  const games: Game[] = []
  for (const { id, sport, snap } of candidates) {
    const current = currentById.get(id) ?? null
    const locked = await ensurePolymarketLock(sport, snap, current)
    if (!locked) {
      continue
    }
    const game = buildGame(sport, snap, locked, current)
    if (game) {
      games.push(game)
    }
  }

  console.log(
    `[polymarket] feed ${games.length} games (${lockedOddsCount()} locks, ${currentById.size} live markets)`,
  )
  setFeedGames(rankGames(games), { lockedOdds: lockedOddsCount() })
}

/** @deprecated Odds API removed — locks happen inside rebuildFeedFromCache. */
export async function lockImminentOdds(): Promise<void> {}
