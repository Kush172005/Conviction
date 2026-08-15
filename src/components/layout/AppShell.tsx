import { useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import LogoMark from '@/components/LogoMark'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import DemoBanner from './DemoBanner'
import SignOutButton from '@/components/auth/SignOutButton'
import ThemeToggle from '@/components/theme/ThemeToggle'
import ProductTour from '@/components/tour/ProductTour'
import { useAuthStore } from '@/store'
import { useTourStore } from '@/store/tourStore'

interface AppShellProps {
  children: React.ReactNode
}

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

function TourAutoStart() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isDemo = useAuthStore((s) => s.isDemo)
  const active = useTourStore((s) => s.active)
  const startTour = useTourStore((s) => s.startTour)
  const hasCompletedTour = useTourStore((s) => s.hasCompletedTour)

  useEffect(() => {
    if (!isAuthenticated || !user || active) return
    if (hasCompletedTour(user.id)) return
    if (!isDemo && !user.onboardingCompleted) return

    const timer = window.setTimeout(() => startTour(), 1200)
    return () => window.clearTimeout(timer)
  }, [isAuthenticated, user, isDemo, active, startTour, hasCompletedTour])

  return null
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const reduceMotion = useReducedMotion()

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      <DemoBanner />

      {/* Mobile top bar — logo only, bottom nav handles navigation */}
      <div className="flex h-12 items-center justify-between px-4 border-b border-border bg-surface-1 md:hidden flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <LogoMark variant="tile" className="h-6 w-6 flex-shrink-0" />
          <span className="font-semibold text-sm text-foreground tracking-tight">Conviction</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle compact />
          <SignOutButton compact />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden md:flex h-full">
          <Sidebar />
        </div>

        {/* Main content — extra bottom padding on mobile for bottom nav */}
        <main className="relative flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 line-grid opacity-[0.10] dark:opacity-[0.14]"
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={reduceMotion ? undefined : pageVariants}
              initial={reduceMotion ? false : 'initial'}
              animate="animate"
              exit={reduceMotion ? undefined : 'exit'}
              transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="relative z-10 min-h-0 h-full pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />

      <ProductTour />
      <TourAutoStart />
    </div>
  )
}
