import { describe, expect, it } from 'vitest'
import type { Game } from '../types'
import { rankGames } from './rank'
import { slingshotMeter } from './slingshotMeter'

function ncaaf(overrides: {
  id: string
  dogScore: number
  favScore: number
  fair: number
  period: number
  clockSeconds: number
}): Game {
  const { id, dogScore, favScore, fair, period, clockSeconds } = overrides
  return {
    id,
    sport: 'NCAAF',
    league: 'NCAAF',
    startTime: '2026-09-26T16:00:00Z',
    status: 'live',
    period,
    clockSeconds,
    clock: `${Math.floor(clockSeconds / 60)}:${String(clockSeconds % 60).padStart(2, '0')} - ${period}nd`,
    home: { name: 'Favorite', abbreviation: 'FAV', score: favScore },
    away: { name: 'Underdog', abbreviation: 'DOG', score: dogScore },
    pregameMoneyline: { home: -400, away: Math.round((1 - fair) / fair * 100) },
    pregameFairProb: { home: 1 - fair, away: fair },
    underdogSide: 'away',
    underdogState: 'still_in_it',
  }
}

describe('rankGames', () => {
  it('puts a +900 dog that is tied ahead of milder dogs with higher raw win%', () => {
    // South Alabama style: +900 (~10% fair), tied 7-7 in Q2
    const southAlabama = ncaaf({
      id: 'usa',
      dogScore: 7,
      favScore: 7,
      fair: 0.1,
      period: 2,
      clockSeconds: 8 * 60,
    })
    // Wake Forest style: +370 (~21% fair), up 10 mid-game — should still be #1
    const wakeForest = ncaaf({
      id: 'wake',
      dogScore: 17,
      favScore: 7,
      fair: 0.213,
      period: 2,
      clockSeconds: 6 * 60,
    })
    // Milder dog trailing: higher live % than USA but less of a story
    const mildTrailer = ncaaf({
      id: 'mild',
      dogScore: 10,
      favScore: 17,
      fair: 0.35,
      period: 2,
      clockSeconds: 5 * 60,
    })

    expect(slingshotMeter(wakeForest)).toBeGreaterThan(slingshotMeter(southAlabama))
    expect(slingshotMeter(southAlabama)).toBeGreaterThan(slingshotMeter(mildTrailer))

    const ranked = rankGames([mildTrailer, southAlabama, wakeForest])
    expect(ranked.map((g) => g.id)).toEqual(['wake', 'usa', 'mild'])
  })
})
