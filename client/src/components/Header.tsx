export function Header() {
  return (
    <header className="border-b border-zinc-800/90 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between px-4 py-5 sm:px-6 lg:px-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Slingshot
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Live underdogs ranked by pregame odds
          </p>
        </div>
      </div>
    </header>
  )
}
