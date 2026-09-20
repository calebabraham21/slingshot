import type { Game } from '../types'
import { formatMoneyline } from '../lib/odds'
import {
  breedBlurb,
  breedLabel,
  dogBreed,
  dogMeter,
} from '../lib/underdogTier'
import { DogMeter } from './DogMeter'
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
    <div className="flex items-center gap-3 px-0.5 py-1.5">
      {logo ? (
        <img
          src={logo}
          alt=""
          width={40}
          height={40}
          className={`h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11 ${
            isUnderdog ? 'opacity-100' : 'opacity-50'
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
          isUnderdog ? 'font-semibold text-zinc-50' : 'font-medium text-zinc-500'
        }`}
      >
        {name}
        {isUnderdog && underdogMl != null && (
          <span className="ml-1.5 font-medium text-zinc-400">
            ({formatMoneyline(underdogMl)})
          </span>
        )}
      </span>
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
  const underdogMl =
    game.underdogSide === 'home'
      ? game.pregameMoneyline.home
      : game.pregameMoneyline.away
  const breed = dogBreed(game)
  const meter = dogMeter(game)
  const showScore = game.status !== 'pregame'
  const timeLabel =
    game.status === 'pregame'
      ? formatKickoff(game.startTime)
      : (game.clock ?? game.status)

  return (
    <article className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-4 sm:px-5 sm:py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
          <span className="font-medium uppercase tracking-wide text-zinc-400">
            {game.league}
          </span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{timeLabel}</span>
        </div>
        <StateBadge state={game.underdogState} />
      </div>

      <div className="space-y-0.5">
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

      <DogMeter
        value={meter}
        breedLabel={breedLabel(breed)}
        breedBlurb={breedBlurb(breed)}
      />
    </article>
  )
}
