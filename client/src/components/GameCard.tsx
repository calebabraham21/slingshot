import type { Game } from '../types'
import { formatMoneyline } from '../lib/odds'
import {
  isHighlightUpset,
  tierLabel,
  underdogTier,
} from '../lib/underdogTier'
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
  underdogMl,
  showScore,
}: {
  name: string
  logo?: string
  score: number
  isUnderdog: boolean
  underdogMl?: number
  showScore: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-lg px-2 py-1.5 ${
        isUnderdog ? 'bg-zinc-800/50' : ''
      }`}
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          width={40}
          height={40}
          className={`h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11 ${
            isUnderdog ? 'opacity-100' : 'opacity-55'
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
      <div className="min-w-0 flex-1">
        <div
          className={`truncate text-base sm:text-[17px] ${
            isUnderdog ? 'font-semibold text-zinc-50' : 'font-medium text-zinc-500'
          }`}
        >
          {name}
        </div>
        {isUnderdog && underdogMl != null && (
          <div className="mt-0.5 text-xs text-zinc-400">
            Underdog · {formatMoneyline(underdogMl)} pregame
          </div>
        )}
      </div>
      {showScore && (
        <span
          className={`w-8 text-right text-lg font-bold tabular-nums sm:w-10 sm:text-xl ${
            isUnderdog ? 'text-zinc-50' : 'text-zinc-500'
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
  const tier = underdogTier(game)
  const highlight = isHighlightUpset(game)
  const showScore = game.status !== 'pregame'
  const timeLabel =
    game.status === 'pregame'
      ? formatKickoff(game.startTime)
      : (game.clock ?? game.status)

  return (
    <article
      className={`rounded-xl border bg-zinc-900/80 px-4 py-4 sm:px-5 sm:py-5 ${
        highlight
          ? 'border-emerald-800/80 shadow-[inset_3px_0_0_0_rgb(52,211,153)]'
          : 'border-zinc-800'
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
            <span className="font-medium uppercase tracking-wide text-zinc-400">
              {game.league}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{timeLabel}</span>
          </div>
          {highlight && (
            <p className="text-sm font-medium text-emerald-200/90">
              {tier === 'longshot'
                ? 'Long-shot underdog is winning'
                : 'Underdog is winning'}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StateBadge state={game.underdogState} />
          <span className="text-[11px] font-medium text-zinc-500">
            {tierLabel(tier)}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <TeamRow
          name={game.away.name}
          logo={game.away.logo}
          score={game.away.score}
          isUnderdog={game.underdogSide === 'away'}
          underdogMl={
            game.underdogSide === 'away' ? underdogMl : undefined
          }
          showScore={showScore}
        />
        <TeamRow
          name={game.home.name}
          logo={game.home.logo}
          score={game.home.score}
          isUnderdog={game.underdogSide === 'home'}
          underdogMl={
            game.underdogSide === 'home' ? underdogMl : undefined
          }
          showScore={showScore}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-800 pt-3 text-sm">
        <span className="truncate text-zinc-500">
          {underdog.name}
        </span>
        <span className="shrink-0 tabular-nums text-zinc-300">
          <span className="font-semibold text-zinc-100">
            {formatMoneyline(underdogMl)}
          </span>
          <span className="mx-1.5 text-zinc-600">·</span>
          {(underdogProb * 100).toFixed(0)}% to win pregame
        </span>
      </div>
    </article>
  )
}
