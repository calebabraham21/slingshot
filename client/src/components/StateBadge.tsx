import type { UnderdogState } from '../types'
import type { CardStatusMeta } from '../lib/cardStatus'

const STYLES: Record<
  CardStatusMeta['tone'],
  { chip: string; edge: string }
> = {
  upset: {
    chip: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-700',
    edge: 'border-l-emerald-500',
  },
  leadingEarly: {
    chip: 'bg-emerald-50/80 text-emerald-700 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-100/90 dark:border-emerald-900',
    edge: 'border-l-emerald-700/80',
  },
  stillInIt: {
    chip: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800',
    edge: 'border-l-amber-500',
  },
  longShot: {
    chip: 'bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/80 dark:text-orange-200/90 dark:border-orange-900',
    edge: 'border-l-orange-700/70',
  },
  fading: {
    chip: 'bg-zinc-100 text-zinc-600 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700',
    edge: 'border-l-zinc-600',
  },
  notStarted: {
    chip: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700',
    edge: 'border-l-slate-500',
  },
  finalUpset: {
    chip: 'bg-amber-50 text-amber-900 border-amber-400 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-600',
    edge: 'border-l-amber-400',
  },
  finalHeld: {
    chip: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-500 dark:border-zinc-800',
    edge: 'border-l-zinc-700',
  },
}

const FALLBACK: Record<UnderdogState, CardStatusMeta['tone']> = {
  upset_in_progress: 'upset',
  leading_early: 'leadingEarly',
  still_in_it: 'stillInIt',
  long_shot: 'longShot',
  not_started: 'notStarted',
  fading: 'fading',
  final_upset: 'finalUpset',
  final_favorite_held: 'finalHeld',
}

interface StateBadgeProps {
  label: string
  tone: CardStatusMeta['tone']
}

export function StateBadge({ label, tone }: StateBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-medium tracking-wide ${STYLES[tone].chip}`}
    >
      {label}
    </span>
  )
}

export function cardEdgeClass(tone: CardStatusMeta['tone']): string {
  return STYLES[tone].edge
}

export function toneForState(state: UnderdogState): CardStatusMeta['tone'] {
  return FALLBACK[state]
}
