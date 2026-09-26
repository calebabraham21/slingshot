import 'dotenv/config'
import type { SportConfig } from './types.js'

export const config = {
  port: Number(process.env.PORT ?? 3000),
  /** How long ESPN scoreboard responses are reused (ms). */
  scoresTtlMs: Number(process.env.SCORES_TTL_MS ?? 15 * 1000),
  /** How often the background worker refreshes ESPN + Polymarket + rebuilds. */
  scoresPollMs: Number(process.env.SCORES_POLL_MS ?? 15 * 1000),
  /**
   * Lock Polymarket moneyline % when a game is this close to tipoff.
   * Default: 2 minutes.
   */
  oddsLockWindowMs: Number(process.env.ODDS_LOCK_WINDOW_MS ?? 2 * 60 * 1000),
  /** Still accept a lock briefly after tip if we missed the pregame window. */
  oddsLockGraceMs: Number(process.env.ODDS_LOCK_GRACE_MS ?? 60 * 1000),
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
    key: 'americanfootball_ncaaf',
    sport: 'NCAAF',
    league: 'NCAAF',
    // groups=80 = FBS (Division I-A). Default scoreboard is a small featured slate.
    espn: {
      sport: 'football',
      league: 'college-football',
      query: { groups: '80', limit: '200' },
    },
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
]
