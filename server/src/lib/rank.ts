import type { Game, UnderdogState } from '../types.js'

const STATE_PRIORITY: Record<UnderdogState, number> = {
  upset_in_progress: 0,
  leading_early: 1,
  still_in_it: 2,
  long_shot: 3,
  not_started: 4,
  fading: 5,
  final_upset: 6,
  final_favorite_held: 7,
}

function underdogFairProb(game: Game): number {
  return game.underdogSide === 'home'
    ? game.pregameFairProb.home
    : game.pregameFairProb.away
}

function underdogLead(game: Game): number {
  const dog = game.underdogSide === 'home' ? game.home.score : game.away.score
  const fav = game.underdogSide === 'home' ? game.away.score : game.home.score
  return dog - fav
}

/**
 * Rank for the live underdog feed.
 * Prefer competitive / leading dogs, then bigger pregame dogs (lower fair).
 * Client re-ranks with slingshotMeter; this keeps API order in the same spirit.
 */
export function rankGames(games: Game[]): Game[] {
  return [...games].sort((a, b) => {
    const stateDiff =
      STATE_PRIORITY[a.underdogState] - STATE_PRIORITY[b.underdogState]
    if (stateDiff !== 0) {
      return stateDiff
    }
    // Within a state, bigger dogs first. Leading dogs: also prefer larger leads.
    const leadDiff = underdogLead(b) - underdogLead(a)
    if (
      (a.underdogState === 'upset_in_progress' ||
        a.underdogState === 'leading_early') &&
      leadDiff !== 0
    ) {
      // Secondary: dog size still matters among leaders
      const sizeDiff = underdogFairProb(a) - underdogFairProb(b)
      if (Math.abs(sizeDiff) > 0.05) return sizeDiff
      return leadDiff
    }
    return underdogFairProb(a) - underdogFairProb(b)
  })
}
