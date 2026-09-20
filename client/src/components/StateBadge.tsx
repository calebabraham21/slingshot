import type { UnderdogState } from '../types'

const LABELS: Record<UnderdogState, string> = {
  upset_in_progress: 'Leading',
  striking_distance: 'Close',
  fading: 'Behind',
  pregame: 'Pregame',
  final: 'Final',
}

const STYLES: Record<UnderdogState, string> = {
  upset_in_progress: 'bg-emerald-950 text-emerald-200 border-emerald-800',
  striking_distance: 'bg-amber-950 text-amber-100 border-amber-900',
  fading: 'bg-zinc-900 text-zinc-400 border-zinc-700',
  pregame: 'bg-zinc-900 text-zinc-300 border-zinc-700',
  final: 'bg-zinc-900 text-zinc-500 border-zinc-800',
}

interface StateBadgeProps {
  state: UnderdogState
}

export function StateBadge({ state }: StateBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide ${STYLES[state]}`}
    >
      {LABELS[state]}
    </span>
  )
}
