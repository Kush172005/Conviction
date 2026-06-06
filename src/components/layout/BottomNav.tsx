import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Building2, PhoneCall, Zap, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home', tourId: 'tour-nav-dashboard' },
  { href: '/companies', icon: Building2, label: 'Pipeline', tourId: 'tour-nav-pipeline' },
  { href: '/calls/new', icon: PhoneCall, label: 'Log Call', primary: true, tourId: 'tour-log-call' },
  { href: '/startup-intelligence', icon: Zap, label: 'Research', tourId: 'tour-nav-research' },
  { href: '/settings', icon: Settings, label: 'Settings', tourId: 'tour-nav-settings' },
]

export default function BottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface-1 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {ITEMS.map((item) => {
        const Icon = item.icon
        if (item.primary) {
          return (
            <NavLink
              key={item.href}
              to={item.href}
              data-tour={item.tourId}
              className="flex flex-1 flex-col items-center justify-center py-2 gap-0.5"
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full transition-all',
                      isActive
                        ? 'bg-gradient-conviction shadow-lg scale-105'
                        : 'bg-gradient-conviction shadow-md'
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={cn('text-[10px] font-medium', isActive ? 'text-primary' : 'text-muted-foreground')}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        }
        return (
          <NavLink
            key={item.href}
            to={item.href}
            data-tour={item.tourId}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center py-2 gap-0.5 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-5 w-5 transition-transform', isActive && 'scale-110')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
