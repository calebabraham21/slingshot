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
}

export interface SportConfig {
  key: string
  sport: Sport
  league: string
  espn?: {
    sport: string
    league: string
  }
}
