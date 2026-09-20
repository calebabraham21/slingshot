export function Header() {
  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-lg items-baseline justify-between px-4 py-4">
        <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-50">
          Slingshot
        </h1>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
          Underdog feed
        </p>
      </div>
    </header>
  )
}
