import type { Game } from '../types'
import { formatMoneyline } from '../lib/odds'
import { StateBadge } from './StateBadge'

interface GameCardProps {
  game: Game
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
  name,
  logo,
  score,
  isUnderdog,
  showScore,
}: {
  name: string
  logo?: string
  score: number
  isUnderdog: boolean
  showScore: boolean
}) {
  return (
    <div className="flex items-center gap-3.5">
      {logo ? (
        <img
          src={logo}
          alt=""
          width={40}
          height={40}
          className={`h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11 ${
            isUnderdog ? 'opacity-100' : 'opacity-70'
          }`}
        />
      ) : (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold sm:h-11 sm:w-11 ${
            isUnderdog ? 'text-zinc-100' : 'text-zinc-500'
          }`}
        >
          {name.slice(0, 1)}
        </span>
      )}
      <span
        className={`min-w-0 flex-1 truncate text-base sm:text-[17px] ${
          isUnderdog ? 'font-semibold text-zinc-50' : 'font-medium text-zinc-400'
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
          className={`w-8 text-right text-lg font-bold tabular-nums sm:w-10 sm:text-xl ${
            isUnderdog ? 'text-zinc-50' : 'text-zinc-400'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  )
}

export function GameCard({ game }: GameCardProps) {
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
    <article className="rounded-2xl border border-zinc-800/90 bg-zinc-900/60 px-4 py-4 sm:px-5 sm:py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
          <span className="font-semibold uppercase tracking-wide text-zinc-400">
            {game.league}
          </span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{timeLabel}</span>
        </div>
        <StateBadge state={game.underdogState} />
      </div>

      <div className="space-y-3">
        <TeamRow
          name={game.away.name}
          logo={game.away.logo}
          score={game.away.score}
          isUnderdog={game.underdogSide === 'away'}
          showScore={showScore}
        />
        <TeamRow
          name={game.home.name}
          logo={game.home.logo}
          score={game.home.score}
          isUnderdog={game.underdogSide === 'home'}
          showScore={showScore}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800/80 pt-3.5 text-sm">
        <span className="truncate text-zinc-500">
          {underdog.name} pregame
        </span>
        <span className="shrink-0 font-semibold tabular-nums text-zinc-200">
          {formatMoneyline(underdogMl)}
          <span className="mx-1.5 text-zinc-600">·</span>
          {(underdogProb * 100).toFixed(0)}% win
        </span>
      </div>
    </article>
  )
}
