import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Locked pregame win probabilities (0-1) from Polymarket, keyed by matchup.
 * Legacy Odds-API moneyline locks (values outside 0-1) are ignored on load.
 */
export interface LockedOdds {
  home: number
  away: number
  lockedAt: string
  source: 'polymarket'
  eventSlug?: string
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCK_FILE = join(__dirname, '../../data/odds-locks.json')

const lockedOdds = new Map<string, LockedOdds>()

function isProbLock(value: unknown): value is LockedOdds {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.home === 'number' &&
    typeof v.away === 'number' &&
    v.home > 0 &&
    v.home < 1 &&
    v.away > 0 &&
    v.away < 1 &&
    typeof v.lockedAt === 'string'
  )
}

function loadFromDisk(): void {
  try {
    if (!existsSync(LOCK_FILE)) {
      return
    }
    const raw = JSON.parse(readFileSync(LOCK_FILE, 'utf8')) as Record<
      string,
      unknown
    >
    let skipped = 0
    for (const [id, value] of Object.entries(raw)) {
      if (/^[a-f0-9]{32}$/i.test(id)) {
        skipped++
        continue
      }
      if (!isProbLock(value)) {
        skipped++
        continue
      }
      lockedOdds.set(id, {
        home: value.home,
        away: value.away,
        lockedAt: value.lockedAt,
        source: 'polymarket',
        ...(typeof (value as LockedOdds).eventSlug === 'string'
          ? { eventSlug: (value as LockedOdds).eventSlug }
          : {}),
      })
    }
    console.log(
      `[odds-lock] loaded ${lockedOdds.size} Polymarket locks` +
        (skipped ? ` (skipped ${skipped} legacy)` : ''),
    )
  } catch (error) {
    console.warn('[odds-lock] failed to load locks', error)
  }
}

function persist(): void {
  try {
    mkdirSync(dirname(LOCK_FILE), { recursive: true })
    const obj = Object.fromEntries(lockedOdds.entries())
    writeFileSync(LOCK_FILE, JSON.stringify(obj, null, 2))
  } catch (error) {
    console.warn('[odds-lock] failed to persist locks', error)
  }
}

loadFromDisk()

export function getLockedOdds(matchupKey: string): LockedOdds | undefined {
  return lockedOdds.get(matchupKey)
}

/**
 * Freeze pregame Polymarket probs. Never overwrites an existing lock.
 */
export function lockOdds(
  matchupKey: string,
  prices: { home: number; away: number },
  meta?: { eventSlug?: string },
): LockedOdds {
  const existing = lockedOdds.get(matchupKey)
  if (existing) {
    return existing
  }

  const locked: LockedOdds = {
    home: prices.home,
    away: prices.away,
    lockedAt: new Date().toISOString(),
    source: 'polymarket',
    ...(meta?.eventSlug ? { eventSlug: meta.eventSlug } : {}),
  }
  lockedOdds.set(matchupKey, locked)
  persist()
  return locked
}

export function lockedOddsCount(): number {
  return lockedOdds.size
}
