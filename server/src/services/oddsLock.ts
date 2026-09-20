import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Locked pregame moneylines keyed by normalized matchup (`away|home`). */
export interface LockedOdds {
  home: number
  away: number
  draw?: number
  lockedAt: string
  source?: 'odds-api' | 'espn'
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCK_FILE = join(__dirname, '../../data/odds-locks.json')

const lockedOdds = new Map<string, LockedOdds>()

function loadFromDisk(): void {
  try {
    if (!existsSync(LOCK_FILE)) {
      return
    }
    const raw = JSON.parse(readFileSync(LOCK_FILE, 'utf8')) as Record<
      string,
      LockedOdds
    >
    for (const [id, value] of Object.entries(raw)) {
      // Skip legacy Odds-API event-id keys (32-char hex) from earlier builds.
      if (/^[a-f0-9]{32}$/i.test(id)) {
        continue
      }
      lockedOdds.set(id, value)
    }
    console.log(`[odds-lock] loaded ${lockedOdds.size} locked lines from disk`)
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

export function lockOddsIfPregame(
  matchupKey: string,
  commenceTime: string,
  prices: { home: number; away: number; draw?: number },
): LockedOdds | undefined {
  const existing = lockedOdds.get(matchupKey)
  if (existing) {
    return existing
  }

  // Only lock true pregame lines from the Odds API live odds feed.
  if (Date.parse(commenceTime) <= Date.now()) {
    return undefined
  }

  return lockOdds(matchupKey, prices, 'odds-api')
}

/**
 * Seed a lock from a trusted closing line (e.g. ESPN) when we missed pregame.
 * Never overwrites an existing lock.
 */
export function lockOdds(
  matchupKey: string,
  prices: { home: number; away: number; draw?: number },
  source: LockedOdds['source'] = 'espn',
): LockedOdds {
  const existing = lockedOdds.get(matchupKey)
  if (existing) {
    return existing
  }

  const locked: LockedOdds = {
    home: prices.home,
    away: prices.away,
    ...(prices.draw != null ? { draw: prices.draw } : {}),
    lockedAt: new Date().toISOString(),
    source,
  }
  lockedOdds.set(matchupKey, locked)
  persist()
  return locked
}

export function lockedOddsCount(): number {
  return lockedOdds.size
}
