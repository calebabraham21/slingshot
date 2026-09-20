import type { GameStatus, UnderdogState } from '../types.js'

/**
 * Lightweight server-side placeholder. The client recomputes status with
 * live win-chance estimates via deriveCardStatus / enrichGame.
 */
export function deriveUnderdogState(args: {
  status: GameStatus
  underdogScore: number
  favoriteScore: number
}): UnderdogState {
  const { status, underdogScore, favoriteScore } = args
  if (status === 'pregame') return 'not_started'
  if (status === 'final') {
    return underdogScore > favoriteScore
      ? 'final_upset'
      : 'final_favorite_held'
  }
  if (underdogScore > favoriteScore) return 'leading_early'
  if (underdogScore === favoriteScore) return 'still_in_it'
  return 'fading'
}
