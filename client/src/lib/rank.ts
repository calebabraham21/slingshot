import type { Game } from '../types'
import { enrichGame } from './cardStatus'
import { slingshotMeter } from './slingshotMeter'

/**
 * Rank by “upset watch” score (slingshot meter): dog size × score situation × time.
 * Pure live win% buries huge dogs that are merely competitive (e.g. +900 tied).
 */
export function rankGames(games: Game[]): Game[] {
  const enriched = games.map(enrichGame)
  return [...enriched].sort(
    (a, b) => slingshotMeter(b) - slingshotMeter(a),
  )
}
