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
        className="mx-auto flex max-w-lg gap-1 overflow-x-auto px-3 py-2 scrollbar-none"
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
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
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
