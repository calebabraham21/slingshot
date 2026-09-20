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

/** Rank games for the live underdog feed. */
export function rankGames(games: Game[]): Game[] {
  return [...games].sort((a, b) => {
    const stateDiff =
      STATE_PRIORITY[a.underdogState] - STATE_PRIORITY[b.underdogState]
    if (stateDiff !== 0) {
      return stateDiff
    }
    return underdogFairProb(a) - underdogFairProb(b)
  })
}
