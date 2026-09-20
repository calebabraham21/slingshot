const KNOWN: Record<string, string> = {
  // NBA
  'Boston Celtics': 'BOS',
  'Brooklyn Nets': 'BKN',
  'New York Knicks': 'NYK',
  'Philadelphia 76ers': 'PHI',
  'Toronto Raptors': 'TOR',
  'Chicago Bulls': 'CHI',
  'Cleveland Cavaliers': 'CLE',
  'Detroit Pistons': 'DET',
  'Indiana Pacers': 'IND',
  'Milwaukee Bucks': 'MIL',
  'Atlanta Hawks': 'ATL',
  'Charlotte Hornets': 'CHA',
  'Miami Heat': 'MIA',
  'Orlando Magic': 'ORL',
  'Washington Wizards': 'WAS',
  'Denver Nuggets': 'DEN',
  'Minnesota Timberwolves': 'MIN',
  'Oklahoma City Thunder': 'OKC',
  'Portland Trail Blazers': 'POR',
  'Utah Jazz': 'UTA',
  'Golden State Warriors': 'GSW',
  'Los Angeles Clippers': 'LAC',
  'Los Angeles Lakers': 'LAL',
  'Phoenix Suns': 'PHX',
  'Sacramento Kings': 'SAC',
  'Dallas Mavericks': 'DAL',
  'Houston Rockets': 'HOU',
  'Memphis Grizzlies': 'MEM',
  'New Orleans Pelicans': 'NOP',
  'San Antonio Spurs': 'SAS',
  // NFL
  'Arizona Cardinals': 'ARI',
  'Atlanta Falcons': 'ATL',
  'Baltimore Ravens': 'BAL',
  'Buffalo Bills': 'BUF',
  'Carolina Panthers': 'CAR',
  'Chicago Bears': 'CHI',
  'Cincinnati Bengals': 'CIN',
  'Cleveland Browns': 'CLE',
  'Dallas Cowboys': 'DAL',
  'Denver Broncos': 'DEN',
  'Detroit Lions': 'DET',
  'Green Bay Packers': 'GB',
  'Houston Texans': 'HOU',
  'Indianapolis Colts': 'IND',
  'Jacksonville Jaguars': 'JAX',
  'Kansas City Chiefs': 'KC',
  'Las Vegas Raiders': 'LV',
  'Los Angeles Chargers': 'LAC',
  'Los Angeles Rams': 'LAR',
  'Miami Dolphins': 'MIA',
  'Minnesota Vikings': 'MIN',
  'New England Patriots': 'NE',
  'New Orleans Saints': 'NO',
  'New York Giants': 'NYG',
  'New York Jets': 'NYJ',
  'Philadelphia Eagles': 'PHI',
  'Pittsburgh Steelers': 'PIT',
  'San Francisco 49ers': 'SF',
  'Seattle Seahawks': 'SEA',
  'Tampa Bay Buccaneers': 'TB',
  'Tennessee Titans': 'TEN',
  'Washington Commanders': 'WAS',
}

/** Prefer a known abbreviation; otherwise derive a short code from the name. */
export function abbreviateTeam(name: string): string {
  if (KNOWN[name]) {
    return KNOWN[name]
  }

  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, ' ').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return 'UNK'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 3).toUpperCase()
  }

  // "New York Knicks" -> NYK style: first letters of first words + last word start
  if (parts.length >= 3) {
    return (parts[0][0] + parts[1][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  return (parts[0].slice(0, 2) + parts[1][0]).toUpperCase()
}
