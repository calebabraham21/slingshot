import type { Sport } from '../types.js'
import { normalizeTeamName } from './espn.js'

const GAMMA = 'https://gamma-api.polymarket.com'
const DATA_API = 'https://data-api.polymarket.com'
const HEADERS = {
  Accept: 'application/json',
  'User-Agent':
    'Mozilla/5.0 (compatible; Slingshot/1.0; +https://github.com/slingshot)',
}

const SPORT_SLUG_PREFIX: Partial<Record<Sport, string>> = {
  NCAAF: 'cfb',
  NFL: 'nfl',
  NBA: 'nba',
  MLB: 'mlb',
  NHL: 'nhl',
}

/** How long a successful event→game link is reused before re-searching. */
const LINK_TTL_MS = 6 * 60 * 60 * 1000
/** How long to remember “no Polymarket market” before trying again. */
const MISS_TTL_MS = 15 * 60 * 1000

export interface PolymarketMoneyline {
  home: number
  away: number
  eventSlug: string
  homeTokenId?: string
  awayTokenId?: string
}

interface SearchEvent {
  title?: string
  slug?: string
  closed?: boolean
  active?: boolean
}

interface GammaMarket {
  question?: string
  sportsMarketType?: string
  outcomes?: string | string[]
  outcomePrices?: string | string[]
  clobTokenIds?: string | string[]
  closed?: boolean
  active?: boolean
}

interface GammaEvent {
  title?: string
  slug?: string
  markets?: GammaMarket[]
}

interface LinkCacheEntry {
  eventSlug: string
  homeIndex: 0 | 1
  awayIndex: 0 | 1
  homeTokenId?: string
  awayTokenId?: string
  expiresAt: number
}

interface MissCacheEntry {
  expiresAt: number
}

const linkCache = new Map<string, LinkCacheEntry>()
const missCache = new Map<string, MissCacheEntry>()

function parseJsonArray(raw: string | string[] | undefined): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String)
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function dateCandidates(isoStart: string): string[] {
  const ms = Date.parse(isoStart)
  if (!Number.isFinite(ms)) return []
  const dates = new Set<string>()
  dates.add(new Date(ms).toISOString().slice(0, 10))
  const et = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(ms))
  dates.add(et)
  return [...dates]
}

function nameTokens(name: string): string[] {
  return normalizeTeamName(name)
    .split(' ')
    .filter((t) => t.length > 2 && !['the', 'and'].includes(t))
}

function titleMatchesTeams(
  title: string,
  awayName: string,
  homeName: string,
): boolean {
  const t = normalizeTeamName(title)
  const awayOk = nameTokens(awayName).some((tok) => t.includes(tok))
  const homeOk = nameTokens(homeName).some((tok) => t.includes(tok))
  return awayOk && homeOk
}

function slugLooksLikeGame(
  slug: string,
  sport: Sport,
  dates: string[],
): boolean {
  const prefix = SPORT_SLUG_PREFIX[sport]
  if (!prefix) return false
  if (!slug.startsWith(`${prefix}-`)) return false
  return dates.some((d) => slug.includes(d))
}

function outcomeIndex(
  outcomes: string[],
  teamNames: string[],
): 0 | 1 | null {
  const norms = outcomes.map((o) => normalizeTeamName(o))
  for (const team of teamNames) {
    const tokens = nameTokens(team)
    for (let i = 0; i < norms.length; i++) {
      const outcome = norms[i]!
      if (
        outcome === normalizeTeamName(team) ||
        tokens.some((tok) => outcome.includes(tok))
      ) {
        return i as 0 | 1
      }
    }
  }
  return null
}

async function gammaGet<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${GAMMA}${path}`, { headers: HEADERS })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch {
    return null
  }
}

async function searchEvents(query: string): Promise<SearchEvent[]> {
  const data = await gammaGet<{ events?: SearchEvent[] }>(
    `/public-search?q=${encodeURIComponent(query)}`,
  )
  return data?.events ?? []
}

async function fetchEventBySlug(slug: string): Promise<GammaEvent | null> {
  const data = await gammaGet<GammaEvent[] | GammaEvent>(
    `/events?slug=${encodeURIComponent(slug)}`,
  )
  if (!data) return null
  if (Array.isArray(data)) return data[0] ?? null
  return data
}

function pickMoneyline(markets: GammaMarket[] | undefined): GammaMarket | null {
  if (!markets?.length) return null
  const typed = markets.find(
    (m) =>
      m.sportsMarketType === 'moneyline' &&
      m.closed !== true &&
      parseJsonArray(m.outcomes).length === 2,
  )
  if (typed) return typed

  return (
    markets.find((m) => {
      const outcomes = parseJsonArray(m.outcomes)
      return (
        m.closed !== true &&
        outcomes.length === 2 &&
        !/spread|o\/u|over|under|total/i.test(m.question ?? '')
      )
    }) ?? null
  )
}

function pricesFromMarket(
  market: GammaMarket,
  homeIndex: 0 | 1,
  awayIndex: 0 | 1,
): { home: number; away: number } | null {
  const prices = parseJsonArray(market.outcomePrices).map(Number)
  if (prices.length < 2) return null
  const home = prices[homeIndex]
  const away = prices[awayIndex]
  if (
    home == null ||
    away == null ||
    !Number.isFinite(home) ||
    !Number.isFinite(away)
  ) {
    return null
  }
  const sum = home + away
  if (sum <= 0) return null
  return { home: home / sum, away: away / sum }
}

function cacheKey(
  sport: Sport,
  awayName: string,
  homeName: string,
  startTime: string,
): string {
  const day = dateCandidates(startTime)[0] ?? startTime.slice(0, 10)
  return `${sport}|${normalizeTeamName(awayName)}|${normalizeTeamName(homeName)}|${day}`
}

async function resolveLink(input: {
  sport: Sport
  awayName: string
  homeName: string
  awayLabel: string
  homeLabel: string
  startTime: string
}): Promise<LinkCacheEntry | null> {
  const key = cacheKey(
    input.sport,
    input.awayName,
    input.homeName,
    input.startTime,
  )
  const cached = linkCache.get(key)
  if (cached && cached.expiresAt > Date.now()) {
    return cached
  }
  const miss = missCache.get(key)
  if (miss && miss.expiresAt > Date.now()) {
    return null
  }

  if (!SPORT_SLUG_PREFIX[input.sport]) {
    missCache.set(key, { expiresAt: Date.now() + MISS_TTL_MS })
    return null
  }

  const dates = dateCandidates(input.startTime)
  const queries = [
    `${input.awayLabel} ${input.homeLabel}`,
    `${input.awayName} ${input.homeName}`,
  ]

  let candidates: SearchEvent[] = []
  for (const q of queries) {
    const found = await searchEvents(q)
    if (found.length) {
      candidates = found
      break
    }
  }

  const ranked = candidates
    .filter((e) => e.slug && e.closed !== true)
    .map((e) => {
      const slug = e.slug!
      let score = 0
      if (slugLooksLikeGame(slug, input.sport, dates)) score += 50
      if (titleMatchesTeams(e.title ?? '', input.awayName, input.homeName)) {
        score += 30
      }
      if (titleMatchesTeams(e.title ?? '', input.awayLabel, input.homeLabel)) {
        score += 20
      }
      if (dates.some((d) => slug.includes(d))) score += 15
      return { event: e, score }
    })
    .filter((r) => r.score >= 45)
    .sort((a, b) => b.score - a.score)

  for (const { event } of ranked) {
    const full = await fetchEventBySlug(event.slug!)
    const moneyline = pickMoneyline(full?.markets)
    if (!moneyline) continue

    const outcomes = parseJsonArray(moneyline.outcomes)
    if (outcomes.length !== 2) continue

    const homeIndex = outcomeIndex(outcomes, [
      input.homeLabel,
      input.homeName,
    ])
    const awayIndex = outcomeIndex(outcomes, [
      input.awayLabel,
      input.awayName,
    ])
    if (homeIndex == null || awayIndex == null || homeIndex === awayIndex) {
      continue
    }

    const tokens = parseJsonArray(moneyline.clobTokenIds)
    const entry: LinkCacheEntry = {
      eventSlug: event.slug!,
      homeIndex,
      awayIndex,
      ...(tokens[homeIndex] ? { homeTokenId: tokens[homeIndex] } : {}),
      ...(tokens[awayIndex] ? { awayTokenId: tokens[awayIndex] } : {}),
      expiresAt: Date.now() + LINK_TTL_MS,
    }
    linkCache.set(key, entry)
    missCache.delete(key)
    return entry
  }

  missCache.set(key, { expiresAt: Date.now() + MISS_TTL_MS })
  return null
}

/** Point-in-time token price from Polymarket data API (0-1). */
export async function fetchTokenPriceAsOf(
  tokenId: string,
  asOfEpochSec: number,
): Promise<number | null> {
  try {
    const url = `${DATA_API}/v2/prices-history?token_id=${encodeURIComponent(tokenId)}&as_of=${asOfEpochSec}`
    const response = await fetch(url, { headers: HEADERS })
    if (!response.ok) return null
    const data = (await response.json()) as {
      data?: Array<{ price?: number | string }>
    }
    const last = data.data?.[data.data.length - 1]
    const price = last?.price != null ? Number(last.price) : NaN
    return Number.isFinite(price) ? price : null
  } catch {
    return null
  }
}

/**
 * Home/away probs as of a unix timestamp (e.g. ~90s before tip).
 * Falls back to null if history is unavailable.
 */
export async function fetchPolymarketMoneylineAsOf(
  input: {
    sport: Sport
    awayName: string
    homeName: string
    awayLabel: string
    homeLabel: string
    startTime: string
  },
  asOfEpochSec: number,
): Promise<PolymarketMoneyline | null> {
  const link = await resolveLink(input)
  if (!link?.homeTokenId || !link.awayTokenId) {
    return null
  }

  const [homeRaw, awayRaw] = await Promise.all([
    fetchTokenPriceAsOf(link.homeTokenId, asOfEpochSec),
    fetchTokenPriceAsOf(link.awayTokenId, asOfEpochSec),
  ])
  if (homeRaw == null || awayRaw == null) return null

  const sum = homeRaw + awayRaw
  if (sum <= 0) return null

  return {
    home: homeRaw / sum,
    away: awayRaw / sum,
    eventSlug: link.eventSlug,
    homeTokenId: link.homeTokenId,
    awayTokenId: link.awayTokenId,
  }
}

/**
 * Resolve current Polymarket moneyline implied probs for an ESPN game.
 */
export async function fetchPolymarketMoneyline(input: {
  sport: Sport
  awayName: string
  homeName: string
  awayLabel: string
  homeLabel: string
  startTime: string
}): Promise<PolymarketMoneyline | null> {
  const link = await resolveLink(input)
  if (!link) return null

  const event = await fetchEventBySlug(link.eventSlug)
  const moneyline = pickMoneyline(event?.markets)
  if (!moneyline) return null

  const prices = pricesFromMarket(moneyline, link.homeIndex, link.awayIndex)
  if (!prices) return null

  const tokens = parseJsonArray(moneyline.clobTokenIds)
  if (tokens[link.homeIndex] && !link.homeTokenId) {
    link.homeTokenId = tokens[link.homeIndex]
  }
  if (tokens[link.awayIndex] && !link.awayTokenId) {
    link.awayTokenId = tokens[link.awayIndex]
  }

  return {
    home: prices.home,
    away: prices.away,
    eventSlug: link.eventSlug,
    ...(link.homeTokenId ? { homeTokenId: link.homeTokenId } : {}),
    ...(link.awayTokenId ? { awayTokenId: link.awayTokenId } : {}),
  }
}

/** Fetch current moneylines for many games with limited concurrency. */
export async function fetchPolymarketMoneylines(
  games: Array<{
    id: string
    sport: Sport
    awayName: string
    homeName: string
    awayLabel: string
    homeLabel: string
    startTime: string
  }>,
  concurrency = 4,
): Promise<Map<string, PolymarketMoneyline>> {
  const out = new Map<string, PolymarketMoneyline>()
  let i = 0

  async function worker() {
    while (i < games.length) {
      const index = i++
      const g = games[index]!
      const ml = await fetchPolymarketMoneyline(g)
      if (ml) out.set(g.id, ml)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, games.length) }, () =>
      worker(),
    ),
  )
  return out
}

export function polymarketSportSupported(sport: Sport): boolean {
  return SPORT_SLUG_PREFIX[sport] != null
}
