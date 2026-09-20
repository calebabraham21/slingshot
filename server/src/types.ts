export type Sport = 'NBA' | 'NFL' | 'MLB' | 'NHL' | 'SOCCER'

export type GameStatus = 'pregame' | 'live' | 'final'

export type UnderdogState =
  | 'upset_in_progress'
  | 'striking_distance'
  | 'fading'
  | 'pregame'
  | 'final'

export type Side = 'home' | 'away'

export interface Team {
  name: string
  abbreviation: string
  score: number
  /** ESPN CDN logo URL when available. */
  logo?: string
}

export interface Game {
  id: string
  sport: Sport
  league: string
  startTime: string
  status: GameStatus
  clock?: string
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
}

export interface SportConfig {
  key: string
  sport: Sport
  league: string
  /** ESPN site/core API path segments, when available. */
  espn?: {
    sport: string
    league: string
  }
}
