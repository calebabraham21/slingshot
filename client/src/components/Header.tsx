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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a href="/" className="inline-flex items-center">
          <img
            src={logoSrc}
            alt="Slingshot"
            className="h-14 w-auto sm:h-16 md:h-20"
          />
        </a>
        <div className="flex items-center gap-3">
          <p className="hidden text-sm text-zinc-500 sm:block">
            Who’s the biggest underdog right now?
          </p>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  )
}
