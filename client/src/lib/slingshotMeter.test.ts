import { describe, expect, it } from 'vitest'
import type { Game } from '../types'
import { slingshotMeter } from './slingshotMeter'

function nflDog(overrides: Partial<Game> & {
  homeScore: number
  awayScore: number
  fair: number
}): Game {
  const { homeScore, awayScore, fair, ...rest } = overrides
  return {
    id: 't',
    sport: 'NFL',
    league: 'NFL',
    startTime: '2026-09-20T17:00:00Z',
    status: 'live',
    period: 4,
    clockSeconds: 5 * 60,
    clock: '5:00 - 4th',
    home: { name: 'Home', abbreviation: 'HOM', score: homeScore },
    away: { name: 'Away', abbreviation: 'AWY', score: awayScore },
    pregameMoneyline: { home: 230, away: -280 },
    pregameFairProb: { home: fair, away: 1 - fair },
    underdogSide: 'home',
    underdogState: 'leading_early',
    ...rest,
  }
}

describe('slingshotMeter', () => {
  it('ranks a bigger leading dog above a smaller leading dog', () => {
    const browns = nflDog({ homeScore: 20, awayScore: 13, fair: 0.3 }) // ~+230
    const jaysStyle = nflDog({
      sport: 'MLB',
      league: 'MLB',
      period: 7,
      clockSeconds: 0,
      homeScore: 4,
      awayScore: 2,
      fair: 0.41, // ~+145
    })
    expect(slingshotMeter(browns)).toBeGreaterThan(slingshotMeter(jaysStyle))
  })
})
