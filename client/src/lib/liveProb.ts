import type { Game, Sport } from '../types'

/** Tunable sport margin volatility (final score differential SD). */
export const MARGIN_SIGMA: Record<Sport, number> = {
  NFL: 13.5,
  NBA: 12,
  NHL: 2.3,
  MLB: 4.3,
  SOCCER: 1.7,
}

const PERIOD_SECONDS: Record<Sport, { periods: number; seconds: number }> = {
  NFL: { periods: 4, seconds: 15 * 60 },
  NBA: { periods: 4, seconds: 12 * 60 },
  NHL: { periods: 3, seconds: 20 * 60 },
  MLB: { periods: 9, seconds: 0 },
  SOCCER: { periods: 2, seconds: 45 * 60 },
}

/**
 * Approximate standard normal CDF via erf.
 * Soccer draws make this model rough; we still use the same 2-way formula.
 */
export function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2))
}

/** Inverse standard normal CDF (Acklam approximation). */
export function invNormalCdf(p: number): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  if (p === 0.5) return 0

  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ]
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ]
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ]
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142503,
    3.754408661907416,
  ]

  const plow = 0.02425
  const phigh = 1 - plow

  let q: number
  let r: number

  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p))
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  }

  if (p > phigh) {
    q = Math.sqrt(-2 * Math.log(1 - p))
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    )
  }

  q = p - 0.5
  r = q * q
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  )
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * ax)
  const y =
    1 -
    (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-ax * ax))
  return sign * y
}

function underdogScores(game: Game): { dog: number; fav: number; pregame: number } {
  const dog = game.underdogSide === 'home' ? game.home.score : game.away.score
  const fav = game.underdogSide === 'home' ? game.away.score : game.home.score
  const pregame =
    game.underdogSide === 'home'
      ? game.pregameFairProb.home
      : game.pregameFairProb.away
  return { dog, fav, pregame }
}

/**
 * Parse ESPN-style clock strings when structured fields are missing.
 * Examples: "0:08 - 2nd", "Q3 4:12", "2nd 11:05", "Bot 7", "67'"
 */
export function parseClockFallback(
  sport: Sport,
  clock?: string,
): { period?: number; clockSeconds?: number } {
  if (!clock) return {}
  const text = clock.trim()

  if (sport === 'SOCCER') {
    const m = text.match(/(\d+)\s*'?/)
    if (m) {
      const minute = Number(m[1])
      return {
        period: minute <= 45 ? 1 : 2,
        clockSeconds: minute <= 45 ? (45 - minute) * 60 : Math.max(0, 90 - minute) * 60,
      }
    }
  }

  if (sport === 'MLB') {
    const inn = text.match(/(?:Top|Bot|Mid)\s*(\d+)/i) ?? text.match(/(\d+)(?:st|nd|rd|th)/i)
    if (inn) {
      return { period: Number(inn[1]), clockSeconds: 0 }
    }
  }

  const q = text.match(/(?:Q|Period\s*)?(\d+)(?:st|nd|rd|th)?/i)
  const t = text.match(/(\d+):(\d+)/)
  const period = q ? Number(q[1]) : undefined
  const clockSeconds = t ? Number(t[1]) * 60 + Number(t[2]) : undefined
  return { period, clockSeconds }
}

/** Fraction of regulation complete, 0 to 1. */
export function getGameProgress(game: Game): number {
  if (game.status === 'pregame') return 0
  if (game.status === 'final') return 1

  const cfg = PERIOD_SECONDS[game.sport]
  let period = game.period
  let clockSeconds = game.clockSeconds

  if (period == null || clockSeconds == null) {
    const parsed = parseClockFallback(game.sport, game.clock)
    period = period ?? parsed.period
    clockSeconds = clockSeconds ?? parsed.clockSeconds
  }

  if (game.clock?.toLowerCase().includes('half')) {
    return 0.5
  }

  if (period == null) return 0.35

  if (game.sport === 'MLB') {
    const innings = Math.min(Math.max(period, 1), 9)
    // Treat each inning as equal; no reliable out count from feed.
    return Math.min(1, (innings - 0.5) / 9)
  }

  if (game.sport === 'SOCCER') {
    const minuteFromClock = (() => {
      const m = game.clock?.match(/(\d+)/)
      return m ? Number(m[1]) : null
    })()
    if (minuteFromClock != null) {
      return Math.min(1, minuteFromClock / 90)
    }
    const p = Math.min(Math.max(period, 1), 2)
    const rem = clockSeconds ?? 0
    const elapsedInHalf = cfg.seconds - rem
    return Math.min(1, ((p - 1) * cfg.seconds + elapsedInHalf) / (2 * cfg.seconds))
  }

  const p = Math.min(Math.max(period, 1), cfg.periods)
  const rem = Math.min(Math.max(clockSeconds ?? 0, 0), cfg.seconds)
  const elapsedInPeriod = cfg.seconds - rem
  const total = cfg.periods * cfg.seconds
  return Math.min(1, Math.max(0, ((p - 1) * cfg.seconds + elapsedInPeriod) / total))
}

export type ProgressLabel = 'Early' | 'Mid' | 'Late' | 'Final'

export function progressLabel(game: Game): ProgressLabel {
  if (game.status === 'final') return 'Final'
  if (game.status === 'pregame') return 'Early'
  const p = getGameProgress(game)
  if (p < 1 / 3) return 'Early'
  if (p < 2 / 3) return 'Mid'
  return 'Late'
}

/**
 * Estimate underdog win probability from pregame fair prob, lead, and time left.
 * Soccer is approximate (ignores draws as a third outcome).
 */
export function estimateUnderdogWinProb(game: Game): number {
  const { dog, fav, pregame } = underdogScores(game)
  const lead = dog - fav

  if (game.status === 'final') {
    if (lead > 0) return 1
    if (lead < 0) return 0
    return 0.5
  }

  if (game.status === 'pregame') {
    return pregame
  }

  const progress = getGameProgress(game)
  const remFrac = 1 - progress
  const sigma = MARGIN_SIGMA[game.sport]
  const z0 = invNormalCdf(Math.min(0.999, Math.max(0.001, pregame)))

  if (remFrac <= 1e-6) {
    if (lead > 0) return 0.99
    if (lead < 0) return 0.01
    return Math.min(0.99, Math.max(0.01, pregame))
  }

  const denom = sigma * Math.sqrt(remFrac)
  const p = normalCdf((lead + z0 * sigma * remFrac) / denom)
  return Math.min(0.99, Math.max(0.01, p))
}
