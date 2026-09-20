import type { Game } from '../types'
import { enrichGame } from './cardStatus'
import { estimateUnderdogWinProb } from './liveProb'

/**
 * Rank by underdog win chance (est.) high → low.
 * Same number shown on cards; applies on every filter/tab.
 */
export function rankGames(games: Game[]): Game[] {
  const enriched = games.map(enrichGame)
  return [...enriched].sort(
    (a, b) => estimateUnderdogWinProb(b) - estimateUnderdogWinProb(a),
  )
}
