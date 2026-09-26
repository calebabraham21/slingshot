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

export interface EspnFootballSituation {
  possession: 'home' | 'away'
  downDistanceText: string
  shortDownDistanceText?: string
  possessionText?: string
  isRedZone?: boolean
  lastPlay?: string
  driveSummary?: string
  /**
   * Absolute yards from the home end zone (0 = home goal, 100 = away goal).
   * ESPN scoreboard convention.
   */
  ballYardline?: number
  /** Drive start, same absolute scale as ballYardline. */
  driveStartYardline?: number
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
  /** Live football down/distance/possession when ESPN provides it. */
  footballSituation?: EspnFootballSituation
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
        id?: string
        displayName: string
        abbreviation: string
        logo?: string
        logos?: Array<{ href?: string; rel?: string[] }>
      }
    }>
    situation?: {
      down?: number
      distance?: number
      yardLine?: number
      downDistanceText?: string
      shortDownDistanceText?: string
      possessionText?: string
      isRedZone?: boolean
      possession?: string
      lastPlay?: {
        text?: string
        drive?: {
          description?: string
          start?: {
            yardLine?: number
            text?: string
          }
          end?: {
            yardLine?: number
            text?: string
          }
        }
      }
    }
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

function clampYardline(value: number | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) {
    return undefined
  }
  return Math.min(100, Math.max(0, value))
}

/**
 * Convert ESPN spot text ("OSU 19", "SHSU 25", "50") to absolute yards
 * from the home end zone (0 = home goal, 100 = away goal).
 */
function absoluteFromSpotText(
  text: string | undefined,
  homeAbbrev: string,
  awayAbbrev: string,
): number | undefined {
  if (!text) {
    return undefined
  }
  const cleaned = text.trim().toUpperCase()
  if (cleaned === '50') {
    return 50
  }
  const match = cleaned.match(/^([A-Z0-9&]+)\s+(\d{1,2})$/)
  if (!match) {
    return undefined
  }
  const side = match[1] ?? ''
  const yards = Number(match[2])
  if (!Number.isFinite(yards) || yards < 0 || yards > 50) {
    return undefined
  }
  const home = homeAbbrev.trim().toUpperCase()
  const away = awayAbbrev.trim().toUpperCase()
  if (side === home) {
    return yards
  }
  if (side === away) {
    return 100 - yards
  }
  return undefined
}

function footballSituationFromCompetition(
  competition: ScoreboardEvent['competitions'][0],
  homeTeamId: string | undefined,
  awayTeamId: string | undefined,
  homeAbbrev: string,
  awayAbbrev: string,
): EspnFootballSituation | undefined {
  const situation = competition.situation
  if (!situation) {
    return undefined
  }

  let possession: 'home' | 'away' | undefined
  if (situation.possession && homeTeamId && situation.possession === homeTeamId) {
    possession = 'home'
  } else if (
    situation.possession &&
    awayTeamId &&
    situation.possession === awayTeamId
  ) {
    possession = 'away'
  }

  const ballFromText = absoluteFromSpotText(
    situation.possessionText,
    homeAbbrev,
    awayAbbrev,
  )
  const ballYardline =
    clampYardline(situation.yardLine) ?? ballFromText

  const driveStartFromText = absoluteFromSpotText(
    situation.lastPlay?.drive?.start?.text,
    homeAbbrev,
    awayAbbrev,
  )
  let driveStartYardline =
    driveStartFromText ??
    clampYardline(situation.lastPlay?.drive?.start?.yardLine)

  // Keep drive start only if it sits "behind" the ball for this offense.
  // Home attacks toward the away end (absolute yardline increases).
  // Away attacks toward the home end (absolute yardline decreases).
  if (
    driveStartYardline != null &&
    ballYardline != null &&
    possession
  ) {
    const movingTheRightWay =
      possession === 'home'
        ? driveStartYardline <= ballYardline + 1
        : driveStartYardline >= ballYardline - 1
    if (!movingTheRightWay) {
      driveStartYardline = undefined
    }
  }
  // Touchback / bogus "TEAM 0" starts are useless for the graphic.
  if (
    driveStartYardline != null &&
    ballYardline != null &&
    Math.abs(driveStartYardline - ballYardline) < 1
  ) {
    driveStartYardline = undefined
  }

  const shortDown =
    situation.shortDownDistanceText?.trim() ||
    (situation.down != null &&
    situation.down > 0 &&
    situation.distance != null &&
    situation.distance >= 0
      ? `${situation.down}${situation.down === 1 ? 'st' : situation.down === 2 ? 'nd' : situation.down === 3 ? 'rd' : 'th'} & ${situation.distance}`
      : undefined)

  const text =
    situation.downDistanceText?.trim() ||
    [shortDown, situation.possessionText?.trim()]
      .filter(Boolean)
      .join(' at ')
      .trim() ||
    situation.possessionText?.trim() ||
    ''

  if (!possession || (!text && ballYardline == null)) {
    return undefined
  }

  const lastPlay = situation.lastPlay?.text?.trim()
  const driveSummary = situation.lastPlay?.drive?.description?.trim()

  return {
    possession,
    downDistanceText: text || situation.possessionText?.trim() || 'Ball in play',
    ...(shortDown ? { shortDownDistanceText: shortDown } : {}),
    ...(situation.possessionText
      ? { possessionText: situation.possessionText.trim() }
      : {}),
    ...(situation.isRedZone ? { isRedZone: true } : {}),
    ...(lastPlay ? { lastPlay } : {}),
    ...(driveSummary ? { driveSummary } : {}),
    ...(ballYardline != null ? { ballYardline } : {}),
    ...(driveStartYardline != null ? { driveStartYardline } : {}),
  }
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
    const footballSituation =
      state === 'in'
        ? footballSituationFromCompetition(
            competition,
            home.team.id,
            away.team.id,
            home.team.abbreviation,
            away.team.abbreviation,
          )
        : undefined

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
      ...(footballSituation ? { footballSituation } : {}),
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
