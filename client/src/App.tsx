import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { GameCard } from './components/GameCard'
import { SportTabs, type SportFilter } from './components/SportTabs'
import { getGames } from './lib/api'
import { rankGames } from './lib/rank'
import type { Game } from './types'

const REFRESH_MS = 30_000

function LoadingList() {
  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      aria-busy="true"
      aria-label="Loading games"
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-2xl border border-zinc-800/60 bg-zinc-900/40"
        />
      ))}
    </div>
  )
}

function EmptyState({ sport }: { sport: SportFilter }) {
  const label = sport === 'ALL' ? 'any sport' : sport === 'SOCCER' ? 'Soccer' : sport
  return (
    <div className="rounded-2xl border border-dashed border-zinc-700/80 px-6 py-16 text-center">
      <p className="text-base font-semibold text-zinc-300">No underdogs here</p>
      <p className="mt-2 text-sm text-zinc-500">
        Nothing ranked for {label} right now. Try another filter.
      </p>
    </div>
  )
}

export default function App() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState<SportFilter>('ALL')

  useEffect(() => {
    let cancelled = false

    const load = (showLoading: boolean) => {
      if (showLoading) {
        setLoading(true)
      }
      getGames()
        .then((data) => {
          if (!cancelled) {
            setGames(data)
          }
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false)
          }
        })
    }

    load(true)
    const id = window.setInterval(() => load(false), REFRESH_MS)

    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [])

  const filtered =
    sport === 'ALL' ? games : games.filter((g) => g.sport === sport)
  const ranked = rankGames(filtered)

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(132,204,22,0.07),_transparent_55%)]" />
      <div className="relative">
        <Header />
        <SportTabs value={sport} onChange={setSport} />
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {loading ? (
            <LoadingList />
          ) : ranked.length === 0 ? (
            <EmptyState sport={sport} />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {ranked.map((game) => (
                <li key={game.id}>
                  <GameCard game={game} />
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  )
}
