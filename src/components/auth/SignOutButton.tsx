import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useAuthStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SignOutButtonProps {
  collapsed?: boolean
  compact?: boolean
  className?: string
}

export default function SignOutButton({ collapsed, compact, className }: SignOutButtonProps) {
  const isDemo = useAuthStore((s) => s.isDemo)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const label = isDemo ? 'Exit demo' : 'Sign out'

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors',
          className
        )}
        aria-label={label}
      >
        <LogOut className="h-4 w-4" />
        <span>{label}</span>
      </button>
    )
  }

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              'flex h-10 w-full items-center justify-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors',
              className
            )}
            aria-label={label}
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      className={cn(
        'w-full justify-start gap-2 border-border/80 text-muted-foreground hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5',
        className
      )}
    >
      <LogOut className="h-3.5 w-3.5" />
      {label}
    </Button>
  )
}
