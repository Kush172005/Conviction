import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Building2,
  PhoneCall,
  Brain,
  Sparkles,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useAuthStore, useUIStore } from '@/store'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/companies', icon: Building2, label: 'Companies' },
  { href: '/calls/new', icon: PhoneCall, label: 'Log Call' },
  { href: '/memory', icon: Brain, label: 'Memory' },
  { href: '/intelligence', icon: Sparkles, label: 'Intelligence' },
  { href: '/startup-intelligence', icon: Zap, label: 'Startup Intel' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

/** Shared 40×40 hit target for collapsed rail — icon centered via inline-flex */
const COLLAPSED_BTN =
  'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&>svg]:block [&>svg]:shrink-0'

function CollapsedNavItem({
  href,
  label,
  icon: Icon,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <li className="flex w-full justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={href}
            className={({ isActive }) =>
              cn(
                COLLAPSED_BTN,
                'transition-all duration-150',
                isActive
                  ? 'bg-secondary text-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              )
            }
          >
            <Icon className="h-[18px] w-[18px]" />
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </li>
  )
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const isDemo = useAuthStore((s) => s.isDemo)
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const navigate = useNavigate()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: sidebarCollapsed ? 88 : 220 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          'relative flex h-full flex-col border-r border-border bg-surface-1 flex-shrink-0',
          sidebarCollapsed && 'items-center'
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-border',
            sidebarCollapsed ? 'w-full justify-center px-0' : 'w-full px-4'
          )}
        >
          <AnimatePresence mode="wait">
            {!sidebarCollapsed ? (
              <motion.div
                key="full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex min-w-0 items-center gap-2.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-conviction">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="truncate font-semibold tracking-tight text-foreground">
                  Conviction
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={cn(COLLAPSED_BTN, 'bg-gradient-conviction shadow-lg shadow-primary/15')}
              >
                <TrendingUp className="h-[18px] w-[18px] text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New Call CTA */}
        <div
          className={cn(
            'w-full shrink-0',
            sidebarCollapsed ? 'flex justify-center px-0 pt-4 pb-2' : 'px-3 pt-3 pb-1'
          )}
        >
          {!sidebarCollapsed ? (
            <Button
              variant="conviction"
              size="sm"
              className="w-full"
              onClick={() => navigate('/calls/new')}
            >
              <Plus className="h-3.5 w-3.5" />
              Log Call
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="conviction"
                  size="icon"
                  className={cn(COLLAPSED_BTN, 'shadow-lg shadow-primary/10 [&_svg]:!size-4')}
                  onClick={() => navigate('/calls/new')}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Log Call</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Nav */}
        <nav
          className={cn(
            'thin-scrollbar flex-1 overflow-x-hidden overflow-y-auto',
            sidebarCollapsed ? 'w-full px-0 py-1' : 'px-2 py-2'
          )}
        >
          {sidebarCollapsed ? (
            <ul className="flex w-full flex-col items-center gap-1.5">
              {NAV_ITEMS.map((item) => (
                <CollapsedNavItem key={item.href} {...item} />
              ))}
            </ul>
          ) : (
            <ul className="space-y-0.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-sm transition-all duration-100',
                          isActive
                            ? 'bg-secondary font-medium text-foreground'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <motion.span
                        initial={false}
                        animate={{ opacity: 1 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          )}
        </nav>

        {/* User */}
        <div
          className={cn(
            'w-full shrink-0 space-y-1 border-t border-border',
            sidebarCollapsed ? 'flex justify-center p-4' : 'p-3'
          )}
        >
          {isDemo && !sidebarCollapsed && (
            <div className="px-2 pb-1">
              <Badge className="text-2xs w-full justify-center border-amber-500/30 bg-amber-500/15 text-amber-400">
                Demo workspace
              </Badge>
            </div>
          )}
          {user && (
            <div
              className={cn(
                'cursor-pointer rounded-md transition-colors hover:bg-secondary/60',
                sidebarCollapsed
                  ? 'flex h-10 w-10 items-center justify-center rounded-xl p-0'
                  : 'flex items-center gap-2.5 px-2 py-1.5'
              )}
              onClick={() => navigate('/settings')}
            >
              <Avatar className={cn('shrink-0', sidebarCollapsed ? 'h-8 w-8' : 'h-7 w-7')}>
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary/20 text-xs text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-w-0"
                >
                  <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
                  <p className="truncate text-2xs text-muted-foreground">{user.email}</p>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={cn(
            'absolute -right-3 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm ring-4 ring-background transition-colors hover:border-primary/40 hover:text-foreground',
            sidebarCollapsed ? 'top-5' : 'top-[52px]'
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </motion.aside>
    </TooltipProvider>
  )
}
