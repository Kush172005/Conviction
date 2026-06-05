import { useNavigate } from 'react-router-dom'
import { Beaker, ArrowRight, X } from 'lucide-react'
import { useAuthStore } from '@/store'

export default function DemoBanner() {
  const isDemo = useAuthStore((s) => s.isDemo)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  if (!isDemo) return null

  function exitDemo() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300">
      <Beaker className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
      <span className="flex-1 min-w-0">
        <span className="font-semibold text-amber-300">Demo workspace</span>
        <span className="text-amber-300/70"> — you're exploring RTP Global's sample pipeline. Data is read-only.</span>
      </span>
      <button
        onClick={() => { logout(); navigate('/login', { replace: true }) }}
        className="flex items-center gap-1 rounded px-2 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-medium transition-colors whitespace-nowrap"
      >
        Sign in to create workspace
        <ArrowRight className="h-3 w-3" />
      </button>
      <button
        onClick={exitDemo}
        className="text-amber-400/60 hover:text-amber-400 transition-colors flex-shrink-0"
        aria-label="Exit demo"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
