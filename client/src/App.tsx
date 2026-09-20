import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { GameCard } from './components/GameCard'
import { SportTabs, type SportFilter } from './components/SportTabs'
import { getGames } from './lib/api'
import { rankGames } from './lib/rank'
import type { Game } from './types'

function LoadingList() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading games">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-xl border border-zinc-800/60 bg-zinc-900/40"
        />
      ))}
    </div>
  )
}

function EmptyState({ sport }: { sport: SportFilter }) {
  const label = sport === 'ALL' ? 'any sport' : sport === 'SOCCER' ? 'Soccer' : sport
  return (
    <div className="rounded-xl border border-dashed border-zinc-700/80 px-6 py-14 text-center">
      <p className="text-sm font-semibold text-zinc-300">No underdogs here</p>
      <p className="mt-1.5 text-sm text-zinc-500">
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
    setLoading(true)
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
    return () => {
      cancelled = true
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
        <main className="mx-auto max-w-lg px-4 py-4">
          {loading ? (
            <LoadingList />
          ) : ranked.length === 0 ? (
            <EmptyState sport={sport} />
          ) : (
            <ul className="space-y-3">
              {ranked.map((game, index) => (
                <li key={game.id}>
                  <GameCard game={game} rank={index + 1} />
                </li>
              ))}
            </ul>
          )}
        </main>
      </div>
    </div>
  )
}
