import type { Game } from '../types'
import { estimateUnderdogWinProb, getGameProgress } from './liveProb'

/**
 * Tunable weights for the Slingshot meter (0-100).
 * Higher = more “this is the upset to watch.”
 */
export const SLINGSHOT_METER_WEIGHTS = {
  /** How much pregame dog size matters (lower fair prob => bigger dog) */
  dogSize: 0.42,
  /** How much current est. win chance matters when leading */
  liveChance: 0.33,
  /** How much game progress matters when the dog is ahead */
  progressWhenLeading: 0.25,
  /** Cap used when mapping fair prob to size (fair at/below this is “max dog”) */
  maxDogFair: 0.12,
  /** Fair prob at/above this is barely a dog for meter size */
  minDogFair: 0.45,
} as const

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n))
}

function underdogFair(game: Game): number {
  return game.underdogSide === 'home'
    ? game.pregameFairProb.home
    : game.pregameFairProb.away
}

function underdogLead(game: Game): number {
  const dog = game.underdogSide === 'home' ? game.home.score : game.away.score
  const fav = game.underdogSide === 'home' ? game.away.score : game.home.score
  return dog - fav
}

/** 0-1: how big the pregame dog was. +900 scores higher than +370. */
export function dogSizeScore(game: Game): number {
  const fair = underdogFair(game)
  const { minDogFair, maxDogFair } = SLINGSHOT_METER_WEIGHTS
  if (fair >= minDogFair) return 0
  if (fair <= maxDogFair) return 1
  return (minDogFair - fair) / (minDogFair - maxDogFair)
}

/**
 * Ultimate 0-100 Slingshot meter / feed rank score.
 * Combines dog size, live win chance (est.), and game situation.
 */
export function slingshotMeter(game: Game): number {
  const size = dogSizeScore(game)
  const live = estimateUnderdogWinProb(game)
  const progress = getGameProgress(game)
  const lead = underdogLead(game)
  const w = SLINGSHOT_METER_WEIGHTS

  if (game.status === 'pregame') {
    return Math.round(size * 42)
  }

  if (game.status === 'final') {
    if (lead > 0) {
      // Completed upset: size dominates, always hot for big dogs
      return Math.round(55 + size * 45)
    }
    return Math.round(size * 12 + live * 8)
  }

  // Live — leading: classic upset-in-progress
  if (lead > 0) {
    const score =
      size * w.dogSize +
      live * w.liveChance +
      progress * w.progressWhenLeading
    // Extra kick when a bigger dog is actually winning later
    const kick = size * live * progress * 0.22
    return Math.round(clamp01(score + kick) * 100)
  }

  // Tied: huge dogs hanging around are headline material even if win% is still low
  if (lead === 0) {
    const score = size * 0.52 + live * 0.28 + progress * 0.2
    return Math.round(clamp01(score) * 90)
  }

  // Trailing: remaining hope × dog size (close games stay visible)
  const score = size * 0.35 + live * 0.5 + (1 - progress) * live * 0.15
  return Math.round(clamp01(score) * 72)
}
