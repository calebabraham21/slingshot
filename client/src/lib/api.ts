import { mockGames } from '../data/mockGames'
import type { Game } from '../types'

/**
 * Single data entry point for the app.
 * Swap the body for a real fetch to the backend later without touching components.
 */
export async function getGames(): Promise<Game[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return mockGames
}
