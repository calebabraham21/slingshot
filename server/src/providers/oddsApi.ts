import { config } from '../config.js'

const BASE = 'https://api.the-odds-api.com/v4'

export interface OddsOutcome {
  name: string
  price: number
}

export interface OddsMarket {
  key: string
  outcomes: OddsOutcome[]
}

export interface OddsBookmaker {
  key: string
  title: string
  markets: OddsMarket[]
}

export interface OddsEvent {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: OddsBookmaker[]
}

export interface FetchMeta {
  remainingRequests: number | null
  usedRequests: number | null
}

async function oddsFetch<T>(
  path: string,
  params: Record<string, string>,
): Promise<{ data: T; meta: FetchMeta }> {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('apiKey', config.oddsApiKey())
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url)
  const remaining = response.headers.get('x-requests-remaining')
  const used = response.headers.get('x-requests-used')
  const meta: FetchMeta = {
    remainingRequests: remaining != null ? Number(remaining) : null,
    usedRequests: used != null ? Number(used) : null,
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(
      `Odds API ${response.status} for ${path}: ${body.slice(0, 200)}`,
    )
  }

  const data = (await response.json()) as T
  return { data, meta }
}

export async function fetchOdds(sportKey: string): Promise<{
  events: OddsEvent[]
  meta: FetchMeta
}> {
  const { data, meta } = await oddsFetch<OddsEvent[]>(
    `/sports/${sportKey}/odds`,
    {
      regions: 'us',
      markets: 'h2h',
      oddsFormat: 'american',
      bookmakers: config.bookmakers,
    },
  )
  return { events: data, meta }
}

/** Extract home/away American moneylines (and optional draw) from an odds event. */
export function extractH2H(event: OddsEvent): {
  home: number
  away: number
  draw?: number
} | null {
  const book = event.bookmakers[0]
  const market = book?.markets.find((m) => m.key === 'h2h')
  if (!market) {
    return null
  }

  const home = market.outcomes.find((o) => o.name === event.home_team)
  const away = market.outcomes.find((o) => o.name === event.away_team)
  const draw = market.outcomes.find((o) => o.name === 'Draw')

  if (home == null || away == null) {
    return null
  }

  return {
    home: home.price,
    away: away.price,
    ...(draw ? { draw: draw.price } : {}),
  }
}
