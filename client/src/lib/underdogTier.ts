import type { Game, Sport } from '../types'

/** Breed labels for how big the pregame dog was. */
export type DogBreed = 'beagle' | 'shepherd' | 'wolfhound'

const SPORT_SCORE_UNIT: Record<Sport, number> = {
  NBA: 8,
  NFL: 7,
  MLB: 2,
  NHL: 1,
  SOCCER: 1,
}

export function dogBreed(game: Game): DogBreed {
  const ml =
    game.underdogSide === 'home'
      ? game.pregameMoneyline.home
      : game.pregameMoneyline.away
  const fair =
    game.underdogSide === 'home'
      ? game.pregameFairProb.home
      : game.pregameFairProb.away

  if (ml >= 350 || fair <= 0.22) {
    return 'wolfhound'
  }
  if (ml >= 150 || fair <= 0.35) {
    return 'shepherd'
  }
  return 'beagle'
}

export function breedLabel(breed: DogBreed): string {
  if (breed === 'wolfhound') {
    return 'Wolfhound'
  }
  if (breed === 'shepherd') {
    return 'Shepherd'
  }
  return 'Beagle'
}

export function breedBlurb(breed: DogBreed): string {
  if (breed === 'wolfhound') {
    return 'Huge dog'
  }
  if (breed === 'shepherd') {
    return 'Solid dog'
  }
  return 'Small dog'
}

/**
 * 0-100 "dog meter": how spicy this underdog situation is.
 * Blends pregame dog size with live score context (sport-aware margins).
 * A 0-0 NFL tie barely moves the needle; a +400 dog up late spikes it.
 */
export function dogMeter(game: Game): number {
  const fair =
    game.underdogSide === 'home'
      ? game.pregameFairProb.home
      : game.pregameFairProb.away

  // Bigger dog => higher base (fair 42% ~ low, fair 15% ~ high)
  const sizeScore = Math.round(
    Math.min(1, Math.max(0, (0.45 - fair) / 0.35)) * 45,
  )

  if (game.status === 'pregame') {
    return clamp(sizeScore + 10, 0, 100)
  }

  const underdogScore =
    game.underdogSide === 'home' ? game.home.score : game.away.score
  const favoriteScore =
    game.underdogSide === 'home' ? game.away.score : game.home.score
  const margin = underdogScore - favoriteScore
  const unit = SPORT_SCORE_UNIT[game.sport]
  const scoresUp = margin / unit

  let positionScore: number
  if (game.status === 'final') {
    positionScore = margin > 0 ? 55 : margin === 0 ? 25 : 5
  } else if (scoresUp >= 2) {
    positionScore = 55
  } else if (scoresUp >= 1) {
    positionScore = 45
  } else if (scoresUp > 0) {
    positionScore = 38
  } else if (scoresUp === 0) {
    // Low-scoring sports: a tie is not automatically exciting
    positionScore = unit >= 7 ? 18 : 28
  } else if (scoresUp > -1) {
    positionScore = 22
  } else if (scoresUp > -2) {
    positionScore = 12
  } else {
    positionScore = 4
  }

  // Reward big dogs that are actually winning
  const upsetBonus =
    margin > 0 && fair <= 0.28 ? 12 : margin > 0 && fair <= 0.35 ? 6 : 0

  return clamp(sizeScore + positionScore + upsetBonus, 0, 100)
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

/** @deprecated use dogBreed */
export type UnderdogTier = DogBreed
export const underdogTier = dogBreed
export const tierLabel = breedLabel
export function isHighlightUpset(_game: Game): boolean {
  return false
}
