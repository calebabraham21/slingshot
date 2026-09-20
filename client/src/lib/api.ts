import { mockGames } from '../data/mockGames'
import type { Game } from '../types'

interface GamesResponse {
  games: Game[]
}

function apiBase(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (raw == null || raw === '') {
    return ''
  }
  return raw.replace(/\/$/, '')
}

/**
 * Fetches the server feed only. Never talks to The Odds API from the browser.
 * In production (same host), uses relative `/games`.
 */
export async function getGames(): Promise<Game[]> {
  const base = apiBase()

  try {
    const response = await fetch(`${base}/games`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const data = (await response.json()) as GamesResponse
    if (!Array.isArray(data.games)) {
      throw new Error('Invalid /games payload')
    }
    return data.games
  } catch (error) {
    console.warn('[api] backend unavailable, using mock games', error)
    await new Promise((resolve) => setTimeout(resolve, 200))
    return mockGames
  }
}
