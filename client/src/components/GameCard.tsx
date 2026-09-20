import type { Game } from '../types'
import { formatMoneyline } from '../lib/odds'
import { deriveCardStatus } from '../lib/cardStatus'
import {
  estimateUnderdogWinProb,
  getGameProgress,
  progressLabel,
} from '../lib/liveProb'
import { StateBadge, cardEdgeClass } from './StateBadge'

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

function teamEmphasis(
  showScore: boolean,
  own: number,
  other: number,
): 'leader' | 'trailer' | 'tied' {
  if (!showScore || own === other) return 'tied'
  return own > other ? 'leader' : 'trailer'
}

function TeamRow({
  name,
  logo,
  score,
  isUnderdog,
  underdogMl,
  emphasis,
  showScore,
}: {
  name: string
  logo?: string
  score: number
  isUnderdog: boolean
  underdogMl?: number
  emphasis: 'leader' | 'trailer' | 'tied'
  showScore: boolean
}) {
  const bright = emphasis === 'leader' || emphasis === 'tied'
  return (
    <div className="flex items-center gap-3 px-0.5 py-1.5">
      {logo ? (
        <img
          src={logo}
          alt=""
          width={40}
          height={40}
          className={`h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11 ${
            bright ? 'opacity-100' : 'opacity-45'
          }`}
        />
      ) : (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold sm:h-11 sm:w-11 ${
            bright ? 'text-zinc-100' : 'text-zinc-500'
          }`}
        >
          {name.slice(0, 1)}
        </span>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className={`truncate text-base sm:text-[17px] ${
            bright
              ? 'font-semibold text-zinc-50'
              : 'font-medium text-zinc-500'
          }`}
        >
          {name}
        </span>
        {isUnderdog && underdogMl != null && (
          <span className="shrink-0 rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-zinc-300">
            DOG {formatMoneyline(underdogMl)}
          </span>
        )}
      </div>
      {showScore && (
        <span
          className={`w-9 text-right tabular-nums sm:w-11 ${
            bright
              ? 'text-xl font-bold text-zinc-50 sm:text-2xl'
              : 'text-lg font-semibold text-zinc-500 sm:text-xl'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  )
}

function WinChanceBlock({
  pregame,
  live,
  showDelta,
}: {
  pregame: number
  live: number
  showDelta: boolean
}) {
  const prePct = Math.round(pregame * 100)
  const livePct = Math.round(live * 100)
  const delta = livePct - prePct
  const fill = Math.min(100, Math.max(0, livePct))
  const tick = Math.min(100, Math.max(0, prePct))

  return (
    <div className="mt-4 border-t border-zinc-800 pt-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-3xl font-bold tabular-nums tracking-tight text-zinc-50">
            {livePct}%
          </div>
          <div className="mt-0.5 text-xs text-zinc-500">
            Underdog win chance (est.)
          </div>
        </div>
        {showDelta && (
          <div
            className={`shrink-0 text-sm font-medium tabular-nums ${
              delta > 0
                ? 'text-emerald-300'
                : delta < 0
                  ? 'text-zinc-400'
                  : 'text-zinc-500'
            }`}
          >
            {delta > 0 ? '↑' : delta < 0 ? '↓' : '·'} {Math.abs(delta)}%
            <span className="ml-1 text-zinc-600">
              {prePct}% to {livePct}%
            </span>
          </div>
        )}
      </div>
      <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-zinc-200"
          style={{ width: `${fill}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-zinc-500"
          style={{ left: `calc(${tick}% - 1px)` }}
          title={`Pregame ${prePct}%`}
        />
      </div>
    </div>
  )
}

function ProgressBlock({ game }: { game: Game }) {
  const progress = getGameProgress(game)
  const label = progressLabel(game)
  const segments = 3
  const filled = Math.min(
    segments,
    Math.max(0, Math.ceil(progress * segments)),
  )

  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
        <span>Game progress</span>
        <span className="font-medium text-zinc-400">{label}</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-sm ${
              i < filled ? 'bg-zinc-600' : 'bg-zinc-800'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export function GameCard({ game }: GameCardProps) {
  const status = deriveCardStatus(game)
  const underdogMl =
    game.underdogSide === 'home'
      ? game.pregameMoneyline.home
      : game.pregameMoneyline.away
  const pregame =
    game.underdogSide === 'home'
      ? game.pregameFairProb.home
      : game.pregameFairProb.away
  const liveChance = estimateUnderdogWinProb(game)
  const showScore = game.status !== 'pregame'

  const timeLabel =
    game.status === 'pregame'
      ? formatKickoff(game.startTime)
      : (game.clock ?? game.status)

  return (
    <article
      className={`rounded-xl border border-zinc-800 border-l-4 bg-zinc-900/80 px-4 py-4 sm:px-5 sm:py-5 ${cardEdgeClass(status.tone)}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-zinc-500">
          <span className="font-medium uppercase tracking-wide text-zinc-400">
            {game.league}
          </span>
          <span className="truncate text-zinc-400">{timeLabel}</span>
          {game.delayed && (
            <span className="rounded border border-zinc-600 px-1.5 py-0.5 text-[10px] font-medium text-zinc-300">
              Delayed
            </span>
          )}
        </div>
        <StateBadge label={status.label} tone={status.tone} />
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
          emphasis={teamEmphasis(showScore, game.away.score, game.home.score)}
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
          emphasis={teamEmphasis(showScore, game.home.score, game.away.score)}
          showScore={showScore}
        />
      </div>

      <WinChanceBlock
        pregame={pregame}
        live={game.status === 'pregame' ? pregame : liveChance}
        showDelta={game.status !== 'pregame'}
      />

      {game.status !== 'pregame' && <ProgressBlock game={game} />}
    </article>
  )
}
