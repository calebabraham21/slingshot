export type StatusFilter = 'live' | 'final' | 'all'

const TABS: { id: StatusFilter; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'final', label: 'Final' },
  { id: 'all', label: 'All' },
]

interface StatusTabsProps {
  value: StatusFilter
  onChange: (status: StatusFilter) => void
}

export function StatusTabs({ value, onChange }: StatusTabsProps) {
  return (
    <div
      className="flex max-w-full min-w-0 overflow-x-auto rounded-lg border border-zinc-200 bg-white p-1 scrollbar-none dark:border-zinc-700 dark:bg-zinc-800"
      role="tablist"
      aria-label="Filter by game status"
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
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors sm:px-3.5 ${
              active
                ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {tab.id === 'live' && (
              <span
                className="live-dot h-1.5 w-1.5 shrink-0 rounded-full bg-red-500"
                aria-hidden="true"
              />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
