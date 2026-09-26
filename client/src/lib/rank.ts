import type { Game } from '../types'
import { enrichGame } from './cardStatus'
import { estimateUnderdogWinProb } from './liveProb'

function underdogPregame(game: Game): number {
  return game.underdogSide === 'home'
    ? game.pregameFairProb.home
    : game.pregameFairProb.away
}

/** Live (or final) win % minus locked close — the “vs close” number on cards. */
export function vsCloseDelta(game: Game): number {
  if (game.status === 'pregame') return 0
  return estimateUnderdogWinProb(game) - underdogPregame(game)
}

/**
 * Rank by vs-close swing: biggest gains first, deepest fades last
 * (+45 before +43 … before −10).
 */
export function rankGames(games: Game[]): Game[] {
  const enriched = games.map(enrichGame)
  return [...enriched].sort((a, b) => {
    const deltaDiff = vsCloseDelta(b) - vsCloseDelta(a)
    if (deltaDiff !== 0) return deltaDiff
    // Tie-break: higher live win % first
    return estimateUnderdogWinProb(b) - estimateUnderdogWinProb(a)
  })
}
