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

/**
 * Convert two moneylines to fair (vig-free) probabilities that sum to 1.
 */
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

/** Format American moneyline as "+150" or "-200". */
export function formatMoneyline(ml: number): string {
  if (ml > 0) {
    return `+${ml}`
  }
  return `${ml}`
}
