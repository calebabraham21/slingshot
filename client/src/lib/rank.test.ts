import { describe, expect, it } from 'vitest'
import type { Game } from '../types'
import { rankGames, vsCloseDelta } from './rank'

function ncaaf(overrides: {
  id: string
  dogScore: number
  favScore: number
  fair: number
  live?: number
  period: number
  clockSeconds: number
}): Game {
  const { id, dogScore, favScore, fair, live, period, clockSeconds } =
    overrides
  return {
    id,
    sport: 'NCAAF',
    league: 'NCAAF',
    startTime: '2026-09-26T16:00:00Z',
    status: 'live',
    period,
    clockSeconds,
    clock: `${Math.floor(clockSeconds / 60)}:00 - ${period}`,
    home: { name: 'Favorite', abbreviation: 'FAV', score: favScore },
    away: { name: 'Underdog', abbreviation: 'DOG', score: dogScore },
    pregameMoneyline: { home: -400, away: 300 },
    pregameFairProb: { home: 1 - fair, away: fair },
    underdogSide: 'away',
    underdogState: 'still_in_it',
    ...(live != null
      ? {
          liveMarketProb: {
            home: 1 - live,
            away: live,
            source: 'polymarket' as const,
          },
        }
      : {}),
  }
}

describe('rankGames', () => {
  it('orders by vs-close delta high → low', () => {
    const plus45 = ncaaf({
      id: 'a',
      dogScore: 21,
      favScore: 7,
      fair: 0.2,
      live: 0.65,
      period: 3,
      clockSeconds: 5 * 60,
    })
    const plus20 = ncaaf({
      id: 'b',
      dogScore: 14,
      favScore: 10,
      fair: 0.25,
      live: 0.45,
      period: 2,
      clockSeconds: 8 * 60,
    })
    const minus10 = ncaaf({
      id: 'c',
      dogScore: 3,
      favScore: 24,
      fair: 0.3,
      live: 0.2,
      period: 3,
      clockSeconds: 2 * 60,
    })

    expect(vsCloseDelta(plus45)).toBeCloseTo(0.45, 2)
    expect(vsCloseDelta(plus20)).toBeCloseTo(0.2, 2)
    expect(vsCloseDelta(minus10)).toBeCloseTo(-0.1, 2)

    const ranked = rankGames([minus10, plus20, plus45])
    expect(ranked.map((g) => g.id)).toEqual(['a', 'b', 'c'])
  })
})
