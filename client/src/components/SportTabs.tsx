import type { Sport } from '../types'

export type SportFilter = 'ALL' | Sport

const ALL_TABS: { id: SportFilter; label: string }[] = [
  { id: 'ALL', label: 'All sports' },
  { id: 'NBA', label: 'NBA' },
  { id: 'NFL', label: 'NFL' },
  { id: 'NCAAF', label: 'CFB' },
  { id: 'MLB', label: 'MLB' },
  { id: 'NHL', label: 'NHL' },
]

interface SportTabsProps {
  value: SportFilter
  onChange: (sport: SportFilter) => void
  /** Sports that have games for the current status filter. */
  availableSports: Sport[]
}

export function SportTabs({
  value,
  onChange,
  availableSports,
}: SportTabsProps) {
  const available = new Set(availableSports)
  const tabs = ALL_TABS.filter(
    (tab) => tab.id === 'ALL' || available.has(tab.id),
  )

  // Hide the whole row if nothing is in this status slice.
  if (availableSports.length === 0) {
    return null
  }

  return (
    <div
      className="-mx-4 flex max-w-[100vw] gap-1 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:max-w-none sm:px-0"
      role="tablist"
      aria-label="Filter by sport"
    >
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
