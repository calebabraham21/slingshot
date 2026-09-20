export function Header() {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-baseline justify-between px-4 py-5 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Slingshot
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 sm:text-sm">
          Underdog feed
        </p>
      </div>
    </header>
  )
}
