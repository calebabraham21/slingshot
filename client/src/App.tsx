import { useEffect, useState } from 'react'
import { Header } from './components/Header'
import { GameCard } from './components/GameCard'
import { SportTabs, type SportFilter } from './components/SportTabs'
import { StatusTabs, type StatusFilter } from './components/StatusTabs'
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
          className="h-40 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900/50"
        />
      ))}
    </div>
  )
}

function EmptyState({
  sport,
  status,
}: {
  sport: SportFilter
  status: StatusFilter
}) {
  const sportLabel =
    sport === 'ALL' ? 'any sport' : sport === 'SOCCER' ? 'Soccer' : sport
  const statusLabel =
    status === 'live' ? 'live' : status === 'final' ? 'final' : ''
  return (
    <div className="rounded-xl border border-dashed border-zinc-700 px-6 py-16 text-center">
      <p className="text-base font-semibold text-zinc-300">No underdogs here</p>
      <p className="mt-2 text-sm text-zinc-500">
        Nothing {statusLabel ? `${statusLabel} ` : ''}for {sportLabel} right
        now. Try another filter.
      </p>
    </div>
  )
}

function filterByStatus(games: Game[], status: StatusFilter): Game[] {
  if (status === 'live') {
    return games.filter((g) => g.status === 'live')
  }
  if (status === 'final') {
    return games.filter((g) => g.status === 'final')
  }
  return games
}

export default function App() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState<SportFilter>('ALL')
  const [status, setStatus] = useState<StatusFilter>('live')

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

  const bySport =
    sport === 'ALL' ? games : games.filter((g) => g.sport === sport)
  const filtered = filterByStatus(bySport, status)
  const ranked = rankGames(filtered)

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100">
      <div className="relative">
        <Header />
        <div className="border-b border-zinc-800/90">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <StatusTabs value={status} onChange={setStatus} />
            <SportTabs value={sport} onChange={setSport} />
          </div>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          {loading ? (
            <LoadingList />
          ) : ranked.length === 0 ? (
            <EmptyState sport={sport} status={status} />
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
