import type { Game } from '../types'
import { fairProbs } from '../lib/odds'
import { enrichGame } from '../lib/cardStatus'

function withFairProbs(
  game: Omit<Game, 'pregameFairProb' | 'underdogState'> & {
    pregameFairProb?: Game['pregameFairProb']
    underdogState?: Game['underdogState']
  },
): Game {
  const probs = fairProbs(game.pregameMoneyline.home, game.pregameMoneyline.away)
  const underdogSide =
    game.underdogSide ?? (probs.a <= probs.b ? 'home' : 'away')
  return enrichGame({
    ...game,
    underdogSide,
    pregameFairProb: {
      home: probs.a,
      away: probs.b,
    },
    underdogState: game.underdogState ?? 'not_started',
  })
}

const rawGames: Array<
  Omit<Game, 'pregameFairProb' | 'underdogState'> & {
    underdogState?: Game['underdogState']
  }
> = [
  // Upset in progress: big dog leading late
  {
    id: 'nfl-upset',
    sport: 'NFL',
    league: 'NFL',
    startTime: '2026-09-20T17:00:00Z',
    status: 'live',
    period: 4,
    clockSeconds: 95,
    clock: '1:35 - 4th',
    home: { name: 'Carolina Panthers', abbreviation: 'CAR', score: 24 },
    away: { name: 'Kansas City Chiefs', abbreviation: 'KC', score: 17 },
    pregameMoneyline: { home: 380, away: -480 },
    underdogSide: 'home',
  },
  // Leading, early
  {
    id: 'nba-early-lead',
    sport: 'NBA',
    league: 'NBA',
    startTime: '2026-09-20T23:00:00Z',
    status: 'live',
    period: 1,
    clockSeconds: 7 * 60,
    clock: '7:00 - 1st',
    home: { name: 'Detroit Pistons', abbreviation: 'DET', score: 22 },
    away: { name: 'Boston Celtics', abbreviation: 'BOS', score: 18 },
    pregameMoneyline: { home: 420, away: -550 },
    underdogSide: 'home',
  },
  // Still in it: tie
  {
    id: 'nhl-tie',
    sport: 'NHL',
    league: 'NHL',
    startTime: '2026-09-20T23:30:00Z',
    status: 'live',
    period: 2,
    clockSeconds: 11 * 60,
    clock: '11:00 - 2nd',
    home: { name: 'San Jose Sharks', abbreviation: 'SJ', score: 2 },
    away: { name: 'Colorado Avalanche', abbreviation: 'COL', score: 2 },
    pregameMoneyline: { home: 245, away: -290 },
    underdogSide: 'home',
  },
  // Late big comeback chance (trailing by one score, late)
  {
    id: 'nfl-comeback',
    sport: 'NFL',
    league: 'NFL',
    startTime: '2026-09-20T20:25:00Z',
    status: 'live',
    period: 4,
    clockSeconds: 3 * 60,
    clock: '3:00 - 4th',
    home: { name: 'New England Patriots', abbreviation: 'NE', score: 20 },
    away: { name: 'Buffalo Bills', abbreviation: 'BUF', score: 24 },
    pregameMoneyline: { home: 220, away: -270 },
    underdogSide: 'home',
  },
  // Long shot trailing
  {
    id: 'mlb-longshot',
    sport: 'MLB',
    league: 'MLB',
    startTime: '2026-09-20T23:10:00Z',
    status: 'live',
    period: 7,
    clockSeconds: 0,
    clock: 'Bot 7',
    home: { name: 'Colorado Rockies', abbreviation: 'COL', score: 1 },
    away: { name: 'Los Angeles Dodgers', abbreviation: 'LAD', score: 4 },
    pregameMoneyline: { home: 210, away: -250 },
    underdogSide: 'home',
  },
  // Fading
  {
    id: 'nba-fading',
    sport: 'NBA',
    league: 'NBA',
    startTime: '2026-09-20T23:00:00Z',
    status: 'live',
    period: 4,
    clockSeconds: 2 * 60 + 48,
    clock: '2:48 - 4th',
    home: { name: 'Charlotte Hornets', abbreviation: 'CHA', score: 98 },
    away: { name: 'Oklahoma City Thunder', abbreviation: 'OKC', score: 118 },
    pregameMoneyline: { home: 650, away: -950 },
    underdogSide: 'home',
  },
  // Delayed
  {
    id: 'nfl-delayed',
    sport: 'NFL',
    league: 'NFL',
    startTime: '2026-09-20T17:00:00Z',
    status: 'live',
    period: 2,
    clockSeconds: 8 * 60,
    clock: 'Delayed',
    delayed: true,
    home: { name: 'Miami Dolphins', abbreviation: 'MIA', score: 3 },
    away: { name: 'San Francisco 49ers', abbreviation: 'SF', score: 14 },
    pregameMoneyline: { home: 600, away: -900 },
    underdogSide: 'home',
  },
  // Soccer still in it
  {
    id: 'soccer-live',
    sport: 'SOCCER',
    league: 'EPL',
    startTime: '2026-09-20T18:30:00Z',
    status: 'live',
    period: 2,
    clockSeconds: 23 * 60,
    clock: "67'",
    home: { name: 'Brighton', abbreviation: 'BHA', score: 1 },
    away: { name: 'Manchester City', abbreviation: 'MCI', score: 1 },
    pregameMoneyline: { home: 550, away: -200 },
    drawProb: 0.22,
    underdogSide: 'home',
  },
  // Not started
  {
    id: 'mlb-pre',
    sport: 'MLB',
    league: 'MLB',
    startTime: '2026-09-21T00:40:00Z',
    status: 'pregame',
    home: { name: 'Miami Marlins', abbreviation: 'MIA', score: 0 },
    away: { name: 'Atlanta Braves', abbreviation: 'ATL', score: 0 },
    pregameMoneyline: { home: 175, away: -205 },
    underdogSide: 'home',
  },
  {
    id: 'nba-pre',
    sport: 'NBA',
    league: 'NBA',
    startTime: '2026-09-21T02:00:00Z',
    status: 'pregame',
    home: { name: 'Utah Jazz', abbreviation: 'UTA', score: 0 },
    away: { name: 'Denver Nuggets', abbreviation: 'DEN', score: 0 },
    pregameMoneyline: { home: 310, away: -390 },
    underdogSide: 'home',
  },
  // Final upset
  {
    id: 'nfl-final-upset',
    sport: 'NFL',
    league: 'NFL',
    startTime: '2026-09-20T17:00:00Z',
    status: 'final',
    period: 4,
    clockSeconds: 0,
    clock: 'Final',
    home: { name: 'Tennessee Titans', abbreviation: 'TEN', score: 27 },
    away: { name: 'Philadelphia Eagles', abbreviation: 'PHI', score: 20 },
    pregameMoneyline: { home: 340, away: -430 },
    underdogSide: 'home',
  },
  // Final favorite held
  {
    id: 'soccer-final-held',
    sport: 'SOCCER',
    league: 'La Liga',
    startTime: '2026-09-20T19:00:00Z',
    status: 'final',
    period: 2,
    clockSeconds: 0,
    clock: 'FT',
    home: { name: 'Getafe', abbreviation: 'GET', score: 0 },
    away: { name: 'Real Madrid', abbreviation: 'RMA', score: 2 },
    pregameMoneyline: { home: 700, away: -250 },
    drawProb: 0.2,
    underdogSide: 'home',
  },
]

export const mockGames: Game[] = rawGames.map(withFairProbs)
