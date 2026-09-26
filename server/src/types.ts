export type Sport = 'NBA' | 'NFL' | 'NCAAF' | 'MLB' | 'NHL' | 'SOCCER'

export type GameStatus = 'pregame' | 'live' | 'final'

export type UnderdogState =
  | 'upset_in_progress'
  | 'leading_early'
  | 'still_in_it'
  | 'long_shot'
  | 'not_started'
  | 'fading'
  | 'final_upset'
  | 'final_favorite_held'

export type Side = 'home' | 'away'

export interface Team {
  name: string
  abbreviation: string
  score: number
  logo?: string
  /** Primary team color from ESPN (#rrggbb). */
  color?: string
  /** AP/curated Top 25 rank when available (1-25). */
  rank?: number
}

/** Live football drive context from ESPN (NFL / NCAAF). */
export interface FootballSituation {
  possession: Side
  downDistanceText: string
  shortDownDistanceText?: string
  possessionText?: string
  isRedZone?: boolean
  lastPlay?: string
  driveSummary?: string
  /** Absolute yards from home end zone (0 = home goal, 100 = away goal). */
  ballYardline?: number
  /** Drive start on the same absolute scale. */
  driveStartYardline?: number
}

export interface Game {
  id: string
  sport: Sport
  league: string
  startTime: string
  status: GameStatus
  clock?: string
  period?: number
  clockSeconds?: number
  delayed?: boolean
  /** TV/stream network from ESPN when available (e.g. "FOX", "ABC"). */
  broadcast?: string
  home: Team
  away: Team
  pregameMoneyline: {
    home: number
    away: number
  }
  pregameFairProb: {
    home: number
    away: number
  }
  drawProb?: number
  underdogSide: Side
  underdogState: UnderdogState
  footballSituation?: FootballSituation
  /**
   * Live moneyline implied win probs from Polymarket when a matching market exists.
   * Prefer this over the model estimate for display / ranking while live.
   */
  liveMarketProb?: {
    home: number
    away: number
    source: 'polymarket'
  }
}

export interface SportConfig {
  key: string
  sport: Sport
  league: string
  espn?: {
    sport: string
    league: string
    /** Optional ESPN scoreboard query params (e.g. groups=80 for FBS). */
    query?: Record<string, string>
  }
}
