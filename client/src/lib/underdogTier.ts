import type { Game } from '../types'

export type UnderdogTier = 'longshot' | 'solid' | 'slight'

/** How big a pregame dog this was. */
export function underdogTier(game: Game): UnderdogTier {
  const ml =
    game.underdogSide === 'home'
      ? game.pregameMoneyline.home
      : game.pregameMoneyline.away
  const fair =
    game.underdogSide === 'home'
      ? game.pregameFairProb.home
      : game.pregameFairProb.away

  if (ml >= 350 || fair <= 0.22) {
    return 'longshot'
  }
  if (ml >= 150 || fair <= 0.35) {
    return 'solid'
  }
  return 'slight'
}

export function tierLabel(tier: UnderdogTier): string {
  if (tier === 'longshot') {
    return 'Long shot'
  }
  if (tier === 'solid') {
    return 'Solid dog'
  }
  return 'Slight dog'
}

/** Highlight cards where a big dog is actually winning. */
export function isHighlightUpset(game: Game): boolean {
  return (
    game.underdogState === 'upset_in_progress' &&
    underdogTier(game) !== 'slight'
  )
}
