import { Moon, Sun } from 'lucide-react'
import { useTheme, type ThemeOrigin } from '@/components/theme/ThemeProvider'
import { cn } from '@/lib/utils'

function originFromEvent(event: React.MouseEvent<HTMLElement>): ThemeOrigin {
  const rect = event.currentTarget.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}

export default function ThemeToggle({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { resolved, toggleResolved } = useTheme()
  const isDark = resolved === 'dark'

  return (
    <button
      type="button"
      onClick={(event) => toggleResolved(originFromEvent(event))}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-hover transition-colors',
        compact ? 'h-8 w-8' : 'h-9 w-9',
        className
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
