/** Convert American moneyline odds to implied probability (0-1). */
export function impliedProbability(moneyline: number): number {
  if (moneyline === 0) {
    throw new Error('Moneyline cannot be zero')
  }
  if (moneyline > 0) {
    return 100 / (moneyline + 100)
  }
  return Math.abs(moneyline) / (Math.abs(moneyline) + 100)
}

/** Convert two moneylines to fair (vig-free) probabilities that sum to 1. */
export function fairProbs(
  mlA: number,
  mlB: number,
): { a: number; b: number } {
  const rawA = impliedProbability(mlA)
  const rawB = impliedProbability(mlB)
  const total = rawA + rawB
  return {
    a: rawA / total,
    b: rawB / total,
  }
}

/** Normalize any number of implied probs so they sum to 1. */
export function normalizeProbs(raw: number[]): number[] {
  const total = raw.reduce((sum, n) => sum + n, 0)
  if (total <= 0) {
    throw new Error('Cannot normalize empty or zero probabilities')
  }
  return raw.map((n) => n / total)
}
