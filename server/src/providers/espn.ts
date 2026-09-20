const ESPN_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.espn.com/',
}

const ESPN_HOSTS = [
  'https://site.api.espn.com',
  'https://site.web.api.espn.com',
]

export interface EspnSportPath {
  sport: string
  league: string
}

export interface EspnGameSnapshot {
  espnId: string
  homeName: string
  awayName: string
  homeAbbrev: string
  awayAbbrev: string
  homeLogo?: string
  awayLogo?: string
  homeScore: number
  awayScore: number
  startTime: string
  state: 'pre' | 'in' | 'post'
  clock?: string
  period?: number
  clockSeconds?: number
  delayed?: boolean
  homeMl?: number
  awayMl?: number
}

interface ScoreboardEvent {
  id: string
  date?: string
  status: {
    clock?: number
    displayClock?: string
    period?: number
    type: {
      id?: string
      name?: string
      state: string
      shortDetail?: string
      detail?: string
      description?: string
      completed?: boolean
    }
  }
  competitions: Array<{
    date?: string
    competitors: Array<{
      homeAway: 'home' | 'away'
      score?: string
      team: {
        displayName: string
        abbreviation: string
        logo?: string
        logos?: Array<{ href?: string; rel?: string[] }>
      }
    }>
    odds?: Array<{
      moneyline?: {
        home?: { close?: { odds?: string }; open?: { odds?: string } }
        away?: { close?: { odds?: string }; open?: { odds?: string } }
      }
      homeTeamOdds?: { moneyLine?: number }
      awayTeamOdds?: { moneyLine?: number }
    }>
  }>
}

interface CoreOddsResponse {
  items?: Array<{
    homeTeamOdds?: {
      moneyLine?: number
      close?: { moneyLine?: { american?: string; alternateDisplayValue?: string } }
      open?: { moneyLine?: { american?: string; alternateDisplayValue?: string } }
    }
    awayTeamOdds?: {
      moneyLine?: number
      close?: { moneyLine?: { american?: string; alternateDisplayValue?: string } }
      open?: { moneyLine?: { american?: string; alternateDisplayValue?: string } }
    }
  }>
}

function parseAmerican(raw: string | number | undefined | null): number | undefined {
  if (raw == null) {
    return undefined
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return raw
  }
  const cleaned = String(raw).trim().replace(/^\+/, '')
  if (!cleaned || cleaned === 'EVEN' || cleaned === 'ev') {
    return cleaned === 'EVEN' || cleaned === 'ev' ? 100 : undefined
  }
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : undefined
}

function teamLogo(team: {
  logo?: string
  logos?: Array<{ href?: string; rel?: string[] }>
}): string | undefined {
  if (team.logo) {
    return team.logo
  }
  const preferred =
    team.logos?.find((l) => l.rel?.includes('scoreboard')) ??
    team.logos?.find((l) => l.rel?.includes('default')) ??
    team.logos?.[0]
  return preferred?.href
}

function moneylineFromScoreboardOdds(
  odds: ScoreboardEvent['competitions'][0]['odds'],
): { home: number; away: number } | null {
  const row = odds?.[0]
  if (!row) {
    return null
  }

  const home =
    parseAmerican(row.moneyline?.home?.close?.odds) ??
    parseAmerican(row.moneyline?.home?.open?.odds) ??
    parseAmerican(row.homeTeamOdds?.moneyLine)
  const away =
    parseAmerican(row.moneyline?.away?.close?.odds) ??
    parseAmerican(row.moneyline?.away?.open?.odds) ??
    parseAmerican(row.awayTeamOdds?.moneyLine)

  if (home == null || away == null) {
    return null
  }
  return { home, away }
}

function moneylineFromCore(data: CoreOddsResponse): { home: number; away: number } | null {
  const row = data.items?.[0]
  if (!row) {
    return null
  }

  const home =
    parseAmerican(row.homeTeamOdds?.close?.moneyLine?.american) ??
    parseAmerican(row.homeTeamOdds?.close?.moneyLine?.alternateDisplayValue) ??
    parseAmerican(row.homeTeamOdds?.open?.moneyLine?.american) ??
    parseAmerican(row.homeTeamOdds?.moneyLine)
  const away =
    parseAmerican(row.awayTeamOdds?.close?.moneyLine?.american) ??
    parseAmerican(row.awayTeamOdds?.close?.moneyLine?.alternateDisplayValue) ??
    parseAmerican(row.awayTeamOdds?.open?.moneyLine?.american) ??
    parseAmerican(row.awayTeamOdds?.moneyLine)

  if (home == null || away == null) {
    return null
  }
  return { home, away }
}

async function fetchScoreboardJson(
  path: EspnSportPath,
): Promise<{ events?: ScoreboardEvent[] }> {
  let lastError: Error | null = null

  for (const host of ESPN_HOSTS) {
    const url = `${host}/apis/site/v2/sports/${path.sport}/${path.league}/scoreboard`
    try {
      const response = await fetch(url, { headers: ESPN_HEADERS })
      if (!response.ok) {
        lastError = new Error(`ESPN scoreboard ${response.status} via ${host}`)
        continue
      }
      return (await response.json()) as { events?: ScoreboardEvent[] }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError ?? new Error(`ESPN scoreboard failed for ${path.sport}/${path.league}`)
}

export async function fetchEspnScoreboard(
  path: EspnSportPath,
): Promise<EspnGameSnapshot[]> {
  const data = await fetchScoreboardJson(path)
  const snapshots: EspnGameSnapshot[] = []

  for (const event of data.events ?? []) {
    const competition = event.competitions?.[0]
    if (!competition) {
      continue
    }
    const home = competition.competitors.find((c) => c.homeAway === 'home')
    const away = competition.competitors.find((c) => c.homeAway === 'away')
    if (!home || !away) {
      continue
    }

    const ml = moneylineFromScoreboardOdds(competition.odds)
    const stateRaw = event.status.type.state
    const state: EspnGameSnapshot['state'] =
      stateRaw === 'in' ? 'in' : stateRaw === 'post' ? 'post' : 'pre'
    const typeName = event.status.type.name ?? ''
    const delayed =
      typeName.includes('DELAYED') ||
      (event.status.type.shortDetail ?? '')
        .toLowerCase()
        .includes('delayed')

    snapshots.push({
      espnId: event.id,
      homeName: home.team.displayName,
      awayName: away.team.displayName,
      homeAbbrev: home.team.abbreviation,
      awayAbbrev: away.team.abbreviation,
      homeLogo: teamLogo(home.team),
      awayLogo: teamLogo(away.team),
      homeScore: Number(home.score ?? 0),
      awayScore: Number(away.score ?? 0),
      startTime: competition.date ?? event.date ?? new Date().toISOString(),
      state,
      clock: event.status.type.shortDetail ?? event.status.type.detail,
      period: event.status.period,
      clockSeconds:
        typeof event.status.clock === 'number'
          ? event.status.clock
          : undefined,
      ...(delayed ? { delayed: true } : {}),
      ...(ml ? { homeMl: ml.home, awayMl: ml.away } : {}),
    })
  }

  return snapshots
}

/** Closing (or open) moneyline for a single ESPN event. Useful once games go live. */
export async function fetchEspnClosingMoneyline(
  path: EspnSportPath,
  espnId: string,
): Promise<{ home: number; away: number } | null> {
  const url = `https://sports.core.api.espn.com/v2/sports/${path.sport}/leagues/${path.league}/events/${espnId}/competitions/${espnId}/odds`
  const response = await fetch(url, { headers: ESPN_HEADERS })
  if (!response.ok) {
    return null
  }
  const data = (await response.json()) as CoreOddsResponse
  return moneylineFromCore(data)
}

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function matchKey(awayName: string, homeName: string): string {
  return `${normalizeTeamName(awayName)}|${normalizeTeamName(homeName)}`
}
