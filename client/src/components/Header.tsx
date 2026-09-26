import { ThemeToggle } from './ThemeToggle'
import type { Theme } from '../lib/theme'

interface HeaderProps {
  theme: Theme
  onToggleTheme: () => void
}

export function Header({ theme, onToggleTheme }: HeaderProps) {
  const logoSrc =
    theme === 'dark'
      ? '/slingshot-logo-white.png'
      : '/slingshot-logo-black.png'

  return (
    <header className="border-b border-zinc-200/90 bg-zinc-50 dark:border-zinc-700/90 dark:bg-zinc-900">
      <div className="mx-auto flex w-full min-w-0 max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <a href="/" className="inline-flex min-w-0 max-w-[70%] items-center">
          <img
            src={logoSrc}
            alt="Slingshot"
            className="h-11 w-auto max-w-full object-contain object-left sm:h-16 md:h-20"
          />
        </a>
        <div className="flex shrink-0 items-center gap-3">
          <p className="hidden text-sm text-zinc-500 sm:block">
            Who’s the biggest underdog right now?
          </p>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}
