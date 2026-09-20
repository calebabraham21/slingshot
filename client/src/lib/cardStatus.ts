import type { Game, UnderdogState } from '../types'
import {
  estimateUnderdogWinProb,
  progressLabel,
} from './liveProb'

/**
 * Tunable card-status thresholds. Adjust by feel.
 * Chances are 0-1 (est. underdog win probability).
 */
export const CARD_STATUS_THRESHOLDS = {
  /** Underdog leading + est. chance at/above this => Howling (unless Early) */
  upsetChance: 0.6,
  /** Trailing / tied still alive if est. chance at/above this => Growling */
  stillInItChance: 0.25,
  /** Below Growling but at/above this => Chirping; under this => Hushed */
  longShotChance: 0.08,
} as const

export interface CardStatusMeta {
  state: UnderdogState
  label: string
  tone:
    | 'upset'
    | 'leadingEarly'
    | 'stillInIt'
    | 'longShot'
    | 'fading'
    | 'notStarted'
    | 'finalUpset'
    | 'finalHeld'
}

export function underdogLead(game: Game): number {
  const dog = game.underdogSide === 'home' ? game.home.score : game.away.score
  const fav = game.underdogSide === 'home' ? game.away.score : game.home.score
  return dog - fav
}

export function deriveCardStatus(game: Game): CardStatusMeta {
  if (game.status === 'pregame') {
    return {
      state: 'not_started',
      label: 'On the leash',
      tone: 'notStarted',
    }
  }

  const liveChance = estimateUnderdogWinProb(game)
  const lead = underdogLead(game)
  const phase = progressLabel(game)

  if (game.status === 'final') {
    if (lead > 0) {
      return { state: 'final_upset', label: 'Howled', tone: 'finalUpset' }
    }
    return {
      state: 'final_favorite_held',
      label: 'Silenced',
      tone: 'finalHeld',
    }
  }

  if (lead > 0) {
    if (
      liveChance >= CARD_STATUS_THRESHOLDS.upsetChance &&
      phase !== 'Early'
    ) {
      return {
        state: 'upset_in_progress',
        label: 'Howling',
        tone: 'upset',
      }
    }
    return {
      state: 'leading_early',
      label: 'Barking',
      tone: 'leadingEarly',
    }
  }

  if (lead === 0 || liveChance >= CARD_STATUS_THRESHOLDS.stillInItChance) {
    return {
      state: 'still_in_it',
      label: 'Growling',
      tone: 'stillInIt',
    }
  }

  if (liveChance >= CARD_STATUS_THRESHOLDS.longShotChance) {
    return {
      state: 'long_shot',
      label: 'Chirping',
      tone: 'longShot',
    }
  }

  return {
    state: 'fading',
    label: 'Hushed',
    tone: 'fading',
  }
}

/** Recompute underdogState from scores + live estimate. */
export function enrichGame(game: Game): Game {
  const { state } = deriveCardStatus(game)
  return { ...game, underdogState: state }
}
