import type { GameStatus, Sport, UnderdogState } from '../types.js'

/** Max deficit (favorite leads by this many) still counted as striking distance. */
const STRIKING_DISTANCE: Record<Sport, number> = {
  NBA: 10,
  NFL: 8,
  MLB: 2,
  NHL: 1,
  SOCCER: 1,
}

export function deriveStatus(
  commenceTime: string,
  completed: boolean,
  hasScores: boolean,
): GameStatus {
  if (completed) {
    return 'final'
  }
  if (hasScores || Date.parse(commenceTime) <= Date.now()) {
    return 'live'
  }
  return 'pregame'
}

/**
 * Rule-based underdog state from score margin.
 * Clock/period comes from ESPN; this classifier is still margin-based for now.
 */
export function deriveUnderdogState(args: {
  status: GameStatus
  underdogScore: number
  favoriteScore: number
  sport: Sport
}): UnderdogState {
  const { status, underdogScore, favoriteScore, sport } = args

  if (status === 'pregame') {
    return 'pregame'
  }
  if (status === 'final') {
    return 'final'
  }

  const margin = underdogScore - favoriteScore
  if (margin > 0) {
    return 'upset_in_progress'
  }
  if (margin === 0) {
    return 'striking_distance'
  }
  if (Math.abs(margin) <= STRIKING_DISTANCE[sport]) {
    return 'striking_distance'
  }
  return 'fading'
}
