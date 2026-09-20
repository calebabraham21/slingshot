import 'dotenv/config'
import type { SportConfig } from './types.js'

function required(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy server/.env.example to server/.env and fill it in.`,
    )
  }
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  oddsApiKey: () => required('ODDS_API_KEY'),
  bookmakers: process.env.ODDS_BOOKMAKERS?.trim() || 'draftkings',
  /** How long ESPN scoreboard responses are reused (ms). */
  scoresTtlMs: Number(process.env.SCORES_TTL_MS ?? 30 * 1000),
  /** How often the background worker refreshes ESPN + rebuilds the feed. */
  scoresPollMs: Number(process.env.SCORES_POLL_MS ?? 30 * 1000),
  /** How often we check for games entering the odds-lock window. */
  oddsCheckMs: Number(process.env.ODDS_CHECK_MS ?? 60 * 1000),
  /**
   * Fetch/lock Odds API moneylines only when a game is this close to tipoff.
   * Default: 10 minutes.
   */
  oddsLockWindowMs: Number(process.env.ODDS_LOCK_WINDOW_MS ?? 10 * 60 * 1000),
  /** Still try Odds API briefly after tip if we missed the pregame window. */
  oddsLockGraceMs: Number(process.env.ODDS_LOCK_GRACE_MS ?? 2 * 60 * 1000),
  /** Only keep games where the underdog's fair win prob is at or below this. */
  maxUnderdogFairProb: Number(process.env.MAX_UNDERDOG_FAIR_PROB ?? 0.42),
}

export const SPORTS: SportConfig[] = [
  {
    key: 'basketball_nba',
    sport: 'NBA',
    league: 'NBA',
    espn: { sport: 'basketball', league: 'nba' },
  },
  {
    key: 'americanfootball_nfl',
    sport: 'NFL',
    league: 'NFL',
    espn: { sport: 'football', league: 'nfl' },
  },
  {
    key: 'baseball_mlb',
    sport: 'MLB',
    league: 'MLB',
    espn: { sport: 'baseball', league: 'mlb' },
  },
  {
    key: 'icehockey_nhl',
    sport: 'NHL',
    league: 'NHL',
    espn: { sport: 'hockey', league: 'nhl' },
  },
  {
    key: 'soccer_epl',
    sport: 'SOCCER',
    league: 'EPL',
    espn: { sport: 'soccer', league: 'eng.1' },
  },
]
