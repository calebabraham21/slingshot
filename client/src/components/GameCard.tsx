import type { FootballSituation, Game } from '../types'
import { formatMoneyline } from '../lib/odds'
import { deriveCardStatus } from '../lib/cardStatus'
import { estimateUnderdogWinProb } from '../lib/liveProb'

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

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 16"
      className={className}
      aria-hidden="true"
      fill="currentColor"
    >
      <ellipse cx="12" cy="8" rx="11" ry="6.5" />
      <path
        d="M8.2 8h7.6M10 5.6l1.1 2.4L10 10.4M14 5.6l-1.1 2.4L14 10.4"
        fill="none"
        stroke="white"
        strokeWidth="1.15"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="dark:stroke-zinc-900"
      />
    </svg>
  )
}

function TeamRow({
  name,
  logo,
  score,
  isUnderdog,
  underdogMl,
  emphasis,
  showScore,
  hasBall,
  rank,
  reserveRank,
}: {
  name: string
  logo?: string
  score: number
  isUnderdog: boolean
  underdogMl?: number
  emphasis: 'leader' | 'trailer' | 'tied'
  showScore: boolean
  hasBall?: boolean
  rank?: number
  reserveRank?: boolean
}) {
  const bright = emphasis === 'leader' || emphasis === 'tied'
  return (
    <div className="flex items-center gap-3 px-0.5 py-1.5">
      {logo ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 sm:h-11 sm:w-11 dark:bg-zinc-700/80">
          <img
            src={logo}
            alt=""
            width={40}
            height={40}
            className={`h-8 w-8 object-contain sm:h-9 sm:w-9 ${
              bright ? 'opacity-100' : 'opacity-45'
            }`}
          />
        </span>
      ) : (
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xs font-bold dark:bg-zinc-800 sm:h-11 sm:w-11 ${
            bright
              ? 'text-zinc-800 dark:text-zinc-100'
              : 'text-zinc-500'
          }`}
        >
          {name.slice(0, 1)}
        </span>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {reserveRank && (
          <span
            className="inline-flex w-6 shrink-0 justify-center text-[11px] font-bold tabular-nums text-zinc-800 dark:text-zinc-100"
            title={rank != null ? `Rank ${rank}` : undefined}
          >
            {rank ?? ''}
          </span>
        )}
        <span
          className={`min-w-0 truncate text-base sm:text-[17px] ${
            bright
              ? 'font-semibold text-zinc-900 dark:text-zinc-50'
              : 'font-medium text-zinc-500'
          }`}
        >
          {name}
        </span>
        {hasBall && (
          <span title="Has the ball" className="inline-flex shrink-0">
            <FootballIcon className="h-3.5 w-5 text-amber-800 dark:text-amber-400" />
          </span>
        )}
        {isUnderdog && underdogMl != null && (
          <span className="shrink-0 rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
            {formatMoneyline(underdogMl)}
          </span>
        )}
      </div>
      {showScore && (
        <span
          className={`w-9 text-right tabular-nums sm:w-11 ${
            bright
              ? 'text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl'
              : 'text-lg font-semibold text-zinc-500 sm:text-xl'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  )
}

function footballIdleLabel(game: Game): string {
  if (game.status === 'final') return 'Final'
  if (game.delayed) return 'Delayed'
  const clock = (game.clock ?? '').toLowerCase()
  if (clock.includes('half')) return 'Halftime'
  if (clock.includes('end of') || clock.includes('end of quarter')) {
    return 'End of quarter'
  }
  if (clock.includes('two-minute') || clock.includes('2-minute')) {
    return 'Two-minute warning'
  }
  return 'No active drive'
}

function FootballSituationBlock({
  situation,
  idleLabel,
  awayAbbrev,
  homeAbbrev,
  awayColor,
  homeColor,
}: {
  situation?: FootballSituation
  idleLabel?: string
  awayAbbrev: string
  homeAbbrev: string
  awayColor?: string
  homeColor?: string
}) {
  const active = situation != null
  const down = active
    ? (situation.shortDownDistanceText ?? situation.downDistanceText)
    : (idleLabel ?? 'No active drive')
  const spot = active ? situation.possessionText : undefined

  // ESPN yardLine is yards from the HOME goal. UI: away end left, home end right.
  const toLeftPct = (fromHomeGoal: number) =>
    Math.min(100, Math.max(0, 100 - fromHomeGoal))

  const ballLeftRaw =
    active && situation.ballYardline != null
      ? toLeftPct(situation.ballYardline)
      : null
  const ballLeft =
    ballLeftRaw == null ? null : Math.min(96, Math.max(4, ballLeftRaw))
  let startLeft =
    active && situation.driveStartYardline != null
      ? toLeftPct(situation.driveStartYardline)
      : null
  if (startLeft != null) {
    startLeft = Math.min(96, Math.max(4, startLeft))
  }

  const arrowPointsRight = situation?.possession === 'away'

  if (ballLeft != null && startLeft != null) {
    const movingRight = ballLeft > startLeft + 1.5
    const movingLeft = ballLeft < startLeft - 1.5
    const ok = arrowPointsRight ? movingRight : movingLeft
    if (!ok) {
      startLeft = null
    }
  }

  const hasDrivePath =
    ballLeft != null &&
    startLeft != null &&
    Math.abs(ballLeft - startLeft) >= 1.5

  const pathLeft = hasDrivePath
    ? Math.min(startLeft!, ballLeft!)
    : null
  const pathWidth = hasDrivePath
    ? Math.abs(ballLeft! - startLeft!)
    : 0

  const hasTeamColors = Boolean(awayColor && homeColor)
  const fieldBackground =
    'linear-gradient(90deg, #166534 0%, #15803d 12%, #16a34a 50%, #15803d 88%, #166534 100%)'

  return (
    <div className="mt-3 w-full border-t border-zinc-200 pt-2.5 dark:border-zinc-700">
      <div className="mb-2 flex min-h-[28px] w-full items-center justify-center">
        <p
          className={`text-center text-sm font-semibold ${
            active && situation.isRedZone
              ? 'rounded bg-red-600 px-2 py-0.5 text-white'
              : active
                ? 'text-zinc-800 dark:text-zinc-100'
                : 'font-medium text-zinc-500 dark:text-zinc-400'
          }`}
        >
          {down}
          {spot ? (
            <span
              className={
                situation?.isRedZone
                  ? 'font-normal text-white/85'
                  : 'font-normal text-zinc-500 dark:text-zinc-400'
              }
            >
              {' '}
              at {spot}
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex w-full items-stretch gap-1.5">
        <span
          className="flex w-3 shrink-0 items-center justify-center text-[9px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          aria-hidden="true"
        >
          {awayAbbrev}
        </span>

        <div
          className="relative h-10 min-w-0 flex-1 overflow-hidden rounded-md border border-emerald-800/40"
          style={{ background: fieldBackground }}
          role="img"
          aria-label={
            active
              ? `Field position: ${down}${spot ? ` at ${spot}` : ''}. ${awayAbbrev} left, ${homeAbbrev} right.`
              : `${idleLabel ?? 'No active drive'}. ${awayAbbrev} left, ${homeAbbrev} right.`
          }
        >
          {hasTeamColors && (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-[10%]"
                style={{ backgroundColor: awayColor }}
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 w-[10%]"
                style={{ backgroundColor: homeColor }}
                aria-hidden="true"
              />
            </>
          )}

          {/* Yard hash marks */}
          <div className="pointer-events-none absolute inset-y-0 left-[25%] w-px bg-white/25" />
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/40" />
          <div className="pointer-events-none absolute inset-y-0 left-[75%] w-px bg-white/25" />

          {hasDrivePath && pathLeft != null && (
            <div
              className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-amber-300/90 shadow-sm"
              style={{
                left: `${pathLeft}%`,
                width: `${pathWidth}%`,
              }}
            />
          )}

          {startLeft != null && (
            <div
              className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80"
              style={{ left: `${startLeft}%` }}
              title="Drive start"
            />
          )}

          {ballLeft != null && (
            <div
              className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center"
              style={{ left: `${ballLeft}%` }}
            >
              {hasDrivePath && !arrowPointsRight && (
                <span className="mr-0.5 text-[10px] font-bold leading-none text-amber-200">
                  ◀
                </span>
              )}
              <span
                className="block h-3 w-3 rounded-full border-2 border-white bg-amber-400 shadow"
                title="Ball"
              />
              {hasDrivePath && arrowPointsRight && (
                <span className="ml-0.5 text-[10px] font-bold leading-none text-amber-200">
                  ▶
                </span>
              )}
            </div>
          )}
        </div>

        <span
          className="flex w-3 shrink-0 items-center justify-center text-[9px] font-bold tracking-wider text-zinc-500 dark:text-zinc-400"
          style={{ writingMode: 'vertical-rl' }}
          aria-hidden="true"
        >
          {homeAbbrev}
        </span>
      </div>

      {active && situation.driveSummary ? (
        <p className="mt-1.5 min-h-[1rem] w-full text-center text-xs leading-relaxed text-zinc-500">
          Drive: {situation.driveSummary}
        </p>
      ) : (
        <p className="mt-1.5 min-h-[1rem] w-full text-center text-xs leading-relaxed text-transparent">
          &nbsp;
        </p>
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
  const deltaLabel =
    delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '0'
  const deltaTone =
    delta > 0
      ? 'text-emerald-700 dark:text-emerald-300'
      : delta < 0
        ? 'text-rose-700/80 dark:text-rose-300/80'
        : 'text-zinc-500'

  return (
    <div className="mt-3 min-w-0 border-t border-zinc-200 pt-2.5 dark:border-zinc-700">
      {/* One shared column so labels, numbers, and bar share the same edges */}
      <div className="mx-auto w-full max-w-sm min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            Win chance
          </span>
          {showDelta ? (
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              vs close
            </span>
          ) : (
            <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
              Current
            </span>
          )}
        </div>

        <div className="mt-0.5 flex items-baseline justify-between gap-3">
          <div className="min-w-0 flex items-baseline gap-1.5 tabular-nums text-zinc-500">
            {showDelta ? (
              <>
                <span className="text-sm">{prePct}%</span>
                <span className="text-zinc-400 dark:text-zinc-500" aria-hidden>
                  →
                </span>
                <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {livePct}%
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {livePct}%
              </span>
            )}
          </div>
          {showDelta && (
            <div
              className={`shrink-0 text-2xl font-bold tabular-nums tracking-tight ${deltaTone}`}
            >
              {deltaLabel}
            </div>
          )}
        </div>

        <div className="relative mt-2 h-2 w-full overflow-hidden rounded-full border border-zinc-300 bg-zinc-100 dark:border-zinc-500 dark:bg-zinc-900/80">
          <div
            className="h-full rounded-full bg-zinc-800 dark:bg-zinc-100"
            style={{ width: `${fill}%` }}
          />
          {showDelta && (
            <div
              className="absolute top-0 h-full w-0.5 bg-zinc-500 dark:bg-amber-300/90"
              style={{ left: `calc(${tick}% - 1px)` }}
              title={`Close ${prePct}%`}
            />
          )}
        </div>
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
  const situation = game.footballSituation
  const reserveRank = game.home.rank != null || game.away.rank != null
  const showFootballField =
    (game.sport === 'NFL' || game.sport === 'NCAAF') &&
    game.status !== 'pregame'

  const timeLabel =
    game.status === 'pregame'
      ? formatKickoff(game.startTime)
      : (game.clock ?? game.status)

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-xl border bg-white px-3 py-4 shadow-sm sm:px-5 sm:py-5 dark:bg-zinc-800 dark:shadow-none ${
        status.state === 'upset_in_progress'
          ? 'upset-hot border-emerald-400/80 dark:border-emerald-700/70'
          : 'border-zinc-200 dark:border-zinc-700'
      }`}
    >
      <div className="mb-3 flex min-w-0 items-start justify-between gap-3 text-sm text-zinc-500">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            {game.league}
          </span>
          <span className="min-w-0 truncate text-zinc-500 dark:text-zinc-400">
            {timeLabel}
          </span>
          {game.delayed && (
            <span className="rounded border border-zinc-300 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-600 dark:text-zinc-300">
              Delayed
            </span>
          )}
        </div>
        {game.broadcast && (
          <span
            className="shrink-0 text-right text-xs font-semibold tracking-wide text-zinc-600 dark:text-zinc-300"
            title={`Airing on ${game.broadcast}`}
          >
            {game.broadcast}
          </span>
        )}
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
          hasBall={situation?.possession === 'away'}
          rank={game.away.rank}
          reserveRank={reserveRank}
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
          hasBall={situation?.possession === 'home'}
          rank={game.home.rank}
          reserveRank={reserveRank}
        />
      </div>

      {showFootballField && (
        <FootballSituationBlock
          situation={situation}
          idleLabel={situation ? undefined : footballIdleLabel(game)}
          awayAbbrev={game.away.abbreviation}
          homeAbbrev={game.home.abbreviation}
          awayColor={game.away.color}
          homeColor={game.home.color}
        />
      )}

      <WinChanceBlock
        pregame={pregame}
        live={game.status === 'pregame' ? pregame : liveChance}
        showDelta={game.status !== 'pregame'}
      />
    </article>
  )
}
