import { describe, expect, it } from 'vitest'
import type { Game } from '../types'
import { estimateUnderdogWinProb, getGameProgress } from './liveProb'

function baseNfl(overrides: Partial<Game> = {}): Game {
  return {
    id: 'test',
    sport: 'NFL',
    league: 'NFL',
    startTime: '2026-09-20T17:00:00Z',
    status: 'live',
    period: 1,
    clockSeconds: 15 * 60,
    clock: '15:00 - 1st',
    home: { name: 'Home', abbreviation: 'HOM', score: 0 },
    away: { name: 'Away', abbreviation: 'AWY', score: 0 },
    pregameMoneyline: { home: 200, away: -240 },
    pregameFairProb: { home: 0.35, away: 0.65 },
    underdogSide: 'home',
    underdogState: 'still_in_it',
    ...overrides,
  }
}

describe('estimateUnderdogWinProb', () => {
  it('equals pregame probability at the start of the game', () => {
    const game = baseNfl({
      status: 'live',
      period: 1,
      clockSeconds: 15 * 60,
      home: { name: 'Home', abbreviation: 'HOM', score: 0 },
      away: { name: 'Away', abbreviation: 'AWY', score: 0 },
      pregameFairProb: { home: 0.28, away: 0.72 },
    })
    expect(getGameProgress(game)).toBeCloseTo(0, 2)
    expect(estimateUnderdogWinProb(game)).toBeCloseTo(0.28, 2)
  })

  it('rises as the underdog lead grows', () => {
    const tied = baseNfl({
      period: 3,
      clockSeconds: 8 * 60,
      home: { name: 'Home', abbreviation: 'HOM', score: 14 },
      away: { name: 'Away', abbreviation: 'AWY', score: 14 },
      pregameFairProb: { home: 0.3, away: 0.7 },
    })
    const leading = {
      ...tied,
      home: { name: 'Home', abbreviation: 'HOM', score: 28 },
      away: { name: 'Away', abbreviation: 'AWY', score: 14 },
    }
    expect(estimateUnderdogWinProb(leading)).toBeGreaterThan(
      estimateUnderdogWinProb(tied),
    )
  })

  it('is above 97% for a 14 point NFL lead in the final minute', () => {
    const game = baseNfl({
      period: 4,
      clockSeconds: 60,
      home: { name: 'Home', abbreviation: 'HOM', score: 27 },
      away: { name: 'Away', abbreviation: 'AWY', score: 13 },
      pregameFairProb: { home: 0.25, away: 0.75 },
    })
    expect(getGameProgress(game)).toBeGreaterThan(0.95)
    expect(estimateUnderdogWinProb(game)).toBeGreaterThan(0.97)
  })

  it('is near 50% for a late tie, adjusted by pregame prob', () => {
    const even = baseNfl({
      period: 4,
      clockSeconds: 2 * 60,
      home: { name: 'Home', abbreviation: 'HOM', score: 20 },
      away: { name: 'Away', abbreviation: 'AWY', score: 20 },
      pregameFairProb: { home: 0.5, away: 0.5 },
    })
    expect(estimateUnderdogWinProb(even)).toBeCloseTo(0.5, 1)

    const dogWasLong = baseNfl({
      period: 4,
      clockSeconds: 2 * 60,
      home: { name: 'Home', abbreviation: 'HOM', score: 20 },
      away: { name: 'Away', abbreviation: 'AWY', score: 20 },
      pregameFairProb: { home: 0.2, away: 0.8 },
    })
    const p = estimateUnderdogWinProb(dogWasLong)
    expect(p).toBeGreaterThan(0.15)
    expect(p).toBeLessThan(0.5)
  })
})
