import type { UnderdogState } from '../types'

const LABELS: Record<UnderdogState, string> = {
  upset_in_progress: 'Upset live',
  striking_distance: 'Striking distance',
  fading: 'Fading',
  pregame: 'Pregame',
  final: 'Final',
}

const STYLES: Record<UnderdogState, string> = {
  upset_in_progress: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  striking_distance: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  fading: 'bg-zinc-500/15 text-zinc-400 ring-zinc-500/25',
  pregame: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  final: 'bg-zinc-700/40 text-zinc-500 ring-zinc-600/40',
}

interface StateBadgeProps {
  state: UnderdogState
}

export function StateBadge({ state }: StateBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ring-1 ring-inset ${STYLES[state]}`}
    >
      {LABELS[state]}
    </span>
  )
}
