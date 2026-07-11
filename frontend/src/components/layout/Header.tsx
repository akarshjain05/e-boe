import { useTheme } from '@/contexts/ThemeContext'
import { Bell, Search, Sun, Moon } from 'lucide-react'

export function Header() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl px-6 sticky top-0 z-10">
      <div className="flex flex-1 items-center gap-4">
        <form className="w-full max-w-sm">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="search"
              placeholder="Search bills, customers..."
              className="w-full rounded-full border-none bg-zinc-100 dark:bg-zinc-900 pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-shadow"
            />
          </div>
        </form>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2.5 flex h-2 w-2 rounded-full bg-indigo-600"></span>
        </button>
      </div>
    </header>
  )
}
