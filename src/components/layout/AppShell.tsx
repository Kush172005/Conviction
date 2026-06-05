import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import DemoBanner from './DemoBanner'

interface AppShellProps {
  children: React.ReactNode
}

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation()

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      <DemoBanner />

      {/* Mobile top bar — logo only, bottom nav handles navigation */}
      <div className="flex h-12 items-center px-4 border-b border-border bg-surface-1 md:hidden flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-conviction flex-shrink-0">
            <TrendingUp className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">Conviction</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden md:flex h-full">
          <Sidebar />
        </div>

        {/* Main content — extra bottom padding on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="h-full pb-16 md:pb-0"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}
