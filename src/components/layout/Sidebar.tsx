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

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const isDemo = useAuthStore((s) => s.isDemo)
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const navigate = useNavigate()

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex h-full flex-col border-r border-border bg-surface-1 overflow-hidden flex-shrink-0"
      >
        {/* Logo */}
        <div className="flex h-14 items-center px-4 border-b border-border flex-shrink-0">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed ? (
              <motion.div
                key="full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2.5 min-w-0"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-conviction flex-shrink-0">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold text-foreground tracking-tight truncate">
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
                className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-conviction mx-auto"
              >
                <TrendingUp className="h-4 w-4 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New Call CTA */}
        <div className={cn('px-3 pt-3 pb-1 flex-shrink-0')}>
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
                  size="icon-sm"
                  className="w-full"
                  onClick={() => navigate('/calls/new')}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Log Call</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto thin-scrollbar px-2 py-2 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'flex h-9 w-full items-center justify-center rounded-md text-sm transition-all duration-100',
                          isActive
                            ? 'bg-secondary text-foreground'
                            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              )
            }
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex h-9 w-full items-center gap-2.5 rounded-md px-3 text-sm transition-all duration-100',
                    isActive
                      ? 'bg-secondary text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <motion.span
                  initial={false}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {item.label}
                </motion.span>
              </NavLink>
            )
          })}
        </nav>

        {/* User */}
        <div className={cn('border-t border-border p-3 flex-shrink-0 space-y-1')}>
          {isDemo && !sidebarCollapsed && (
            <div className="px-2 pb-1">
              <Badge className="text-2xs bg-amber-500/15 text-amber-400 border-amber-500/30 w-full justify-center">
                Demo workspace
              </Badge>
            </div>
          )}
          {user && (
            <div
              className={cn(
                'flex items-center gap-2.5 rounded-md px-2 py-1.5 cursor-pointer hover:bg-secondary/60 transition-colors',
                sidebarCollapsed && 'justify-center px-0'
              )}
              onClick={() => navigate('/settings')}
            >
              <Avatar className="h-7 w-7 flex-shrink-0">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="min-w-0"
                >
                  <p className="text-xs font-medium truncate text-foreground">{user.name}</p>
                  <p className="text-2xs text-muted-foreground truncate">{user.email}</p>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute top-[52px] -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground transition-colors"
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
