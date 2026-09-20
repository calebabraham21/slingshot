import type { Sport } from '../types'

export type SportFilter = 'ALL' | Sport

const TABS: { id: SportFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'NBA', label: 'NBA' },
  { id: 'NFL', label: 'NFL' },
  { id: 'MLB', label: 'MLB' },
  { id: 'NHL', label: 'NHL' },
  { id: 'SOCCER', label: 'Soccer' },
]

interface SportTabsProps {
  value: SportFilter
  onChange: (sport: SportFilter) => void
}

export function SportTabs({ value, onChange }: SportTabsProps) {
  return (
    <div className="border-b border-zinc-800/80">
      <div
        className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-3 scrollbar-none sm:px-6 lg:px-8"
        role="tablist"
        aria-label="Filter by sport"
      >
        {TABS.map((tab) => {
          const active = tab.id === value
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={`shrink-0 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors sm:px-4 ${
                active
                  ? 'bg-zinc-100 text-zinc-950'
                  : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
