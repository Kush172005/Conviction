import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, ArrowRight, Sparkles } from 'lucide-react'
import { useAuthStore } from '@/store'

/**
 * DemoGateOverlay
 * Renders a centred lock overlay on top of interactive content in demo mode.
 * Wrap any form or action area with a relative container and include this inside it.
 */
export function DemoGateOverlay({
  title = 'Sign in to use this feature',
  description = 'This is a live demo — create your own workspace to start capturing deal intelligence.',
  className = '',
}: {
  title?: string
  description?: string
  className?: string
}) {
  const isDemo = useAuthStore((s) => s.isDemo)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  if (!isDemo) return null

  function goToLogin() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 rounded-xl bg-background/80 backdrop-blur-sm p-8 text-center ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-conviction-500/10 border border-conviction-500/20">
        <Sparkles className="h-5 w-5 text-conviction-400" />
      </div>
      <div className="max-w-xs">
        <p className="text-sm font-semibold text-foreground mb-1.5">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <button
        onClick={goToLogin}
        className="flex items-center gap-2 rounded-lg bg-conviction-500 hover:bg-conviction-600 text-white text-sm font-medium px-5 py-2.5 transition-colors"
      >
        Set up my workspace
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  )
}

/**
 * useDemoGuard — returns a wrapped handler that blocks in demo mode and navigates to login.
 * Usage: const safeSubmit = useDemoGuard(realSubmitFn)
 */
export function useDemoGuard<T extends (...args: unknown[]) => unknown>(handler: T): T {
  const isDemo = useAuthStore((s) => s.isDemo)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  if (!isDemo) return handler

  return ((..._args: unknown[]) => {
    logout()
    navigate('/login', { replace: true })
  }) as T
}
