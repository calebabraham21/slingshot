export function Header() {
  return (
    <header className="border-b border-zinc-800/90 bg-zinc-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a href="/" className="inline-flex items-center">
          <img
            src="/slingshot-logo-white.png"
            alt="Slingshot"
            className="h-9 w-auto sm:h-10"
          />
        </a>
        <p className="hidden text-sm text-zinc-500 sm:block">
          Live underdogs ranked by pregame odds
        </p>
      </div>
    </header>
  )
}
