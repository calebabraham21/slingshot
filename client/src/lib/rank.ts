import type { Game, UnderdogState } from '../types'
import { enrichGame } from './cardStatus'
import { slingshotMeter } from './slingshotMeter'

function bucket(state: UnderdogState): number {
  if (state === 'not_started') return 1
  if (state === 'final_upset' || state === 'final_favorite_held') return 2
  // All live statuses compete on the Slingshot meter
  return 0
}

/**
 * Live games rank by Slingshot meter (biggest upset energy first).
 * Pregame and finals are separate buckets below.
 */
export function rankGames(games: Game[]): Game[] {
  const enriched = games.map(enrichGame)
  return [...enriched].sort((a, b) => {
    const bucketDiff = bucket(a.underdogState) - bucket(b.underdogState)
    if (bucketDiff !== 0) {
      return bucketDiff
    }
    return slingshotMeter(b) - slingshotMeter(a)
  })
}
