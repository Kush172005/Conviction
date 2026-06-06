import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye } from 'lucide-react'
import { useAuthStore } from '@/store'

export default function DemoBanner() {
  const isDemo = useAuthStore((s) => s.isDemo)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  if (!isDemo) return null

  function goToLogin() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 bg-conviction-500/8 border-b border-conviction-500/20 text-xs flex-shrink-0">
      <div className="flex items-center gap-1.5 text-conviction-300 flex-shrink-0">
        <Eye className="h-3.5 w-3.5" />
        <span className="font-semibold">Demo workspace</span>
      </div>
      <span className="text-conviction-300/60 hidden sm:inline">—</span>
      <span className="text-conviction-300/70 flex-1 min-w-0 truncate hidden sm:inline">
        Exploring RTP Global's live pipeline. Browse freely — sign in to start your own workspace.
      </span>
      <button
        onClick={goToLogin}
        className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1 bg-conviction-500/15 hover:bg-conviction-500/25 text-conviction-300 font-medium transition-colors whitespace-nowrap flex-shrink-0 border border-conviction-500/20"
      >
        <span className="hidden sm:inline">Set up my workspace</span>
        <span className="sm:hidden">Sign in</span>
        <ArrowRight className="h-3 w-3" />
      </button>
    </div>
  )
}
