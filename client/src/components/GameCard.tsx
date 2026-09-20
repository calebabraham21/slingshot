import type { Game } from '../types'
import { formatMoneyline } from '../lib/odds'
import { StateBadge } from './StateBadge'

interface GameCardProps {
  game: Game
  rank: number
}

function formatKickoff(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function TeamRow({
  abbreviation,
  name,
  score,
  isUnderdog,
  showScore,
}: {
  abbreviation: string
  name: string
  score: number
  isUnderdog: boolean
  showScore: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`w-10 shrink-0 text-sm font-bold tabular-nums ${
          isUnderdog ? 'text-zinc-50' : 'text-zinc-400'
        }`}
      >
        {abbreviation}
      </span>
      <span
        className={`min-w-0 flex-1 truncate text-sm ${
          isUnderdog ? 'font-semibold text-zinc-100' : 'text-zinc-400'
        }`}
      >
        {name}
        {isUnderdog && (
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-lime-400">
            Dog
          </span>
        )}
      </span>
      {showScore && (
        <span
          className={`w-7 text-right text-base font-bold tabular-nums ${
            isUnderdog ? 'text-zinc-50' : 'text-zinc-400'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  )
}

export function GameCard({ game, rank }: GameCardProps) {
  const underdog =
    game.underdogSide === 'home' ? game.home : game.away
  const underdogMl =
    game.underdogSide === 'home'
      ? game.pregameMoneyline.home
      : game.pregameMoneyline.away
  const underdogProb =
    game.underdogSide === 'home'
      ? game.pregameFairProb.home
      : game.pregameFairProb.away
  const showScore = game.status !== 'pregame'
  const timeLabel =
    game.status === 'pregame'
      ? formatKickoff(game.startTime)
      : (game.clock ?? game.status)

  return (
    <article className="rounded-xl border border-zinc-800/90 bg-zinc-900/60 px-3.5 py-3.5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-mono text-[11px] text-zinc-600">#{rank}</span>
          <span className="font-semibold uppercase tracking-wide text-zinc-400">
            {game.league}
          </span>
          <span aria-hidden="true">·</span>
          <span>{timeLabel}</span>
        </div>
        <StateBadge state={game.underdogState} />
      </div>

      <div className="space-y-2">
        <TeamRow
          abbreviation={game.away.abbreviation}
          name={game.away.name}
          score={game.away.score}
          isUnderdog={game.underdogSide === 'away'}
          showScore={showScore}
        />
        <TeamRow
          abbreviation={game.home.abbreviation}
          name={game.home.name}
          score={game.home.score}
          isUnderdog={game.underdogSide === 'home'}
          showScore={showScore}
        />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-zinc-800/80 pt-3 text-xs">
        <span className="text-zinc-500">
          {underdog.abbreviation} pregame
        </span>
        <span className="font-semibold tabular-nums text-zinc-200">
          {formatMoneyline(underdogMl)}
          <span className="mx-1.5 text-zinc-600">·</span>
          {(underdogProb * 100).toFixed(0)}% win
        </span>
      </div>
    </article>
  )
}
