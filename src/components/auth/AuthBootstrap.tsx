import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store'
import { authApi, mapBackendUser } from '@/services/api/auth'
import { getFriendlyApiError, getLoadingHint } from '@/lib/apiErrors'

interface AuthBootstrapProps {
  children: React.ReactNode
}

export default function AuthBootstrap({ children }: AuthBootstrapProps) {
  const [ready, setReady] = useState(false)
  const [slowBoot, setSlowBoot] = useState(false)
  const [bootHint, setBootHint] = useState<string | null>(null)
  const [loadingHint] = useState(getLoadingHint)

  useEffect(() => {
    const slowTimer = setTimeout(() => setSlowBoot(true), 5000)
    return () => clearTimeout(slowTimer)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      // Wait for zustand persist rehydration
      if (!useAuthStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          const unsub = useAuthStore.persist.onFinishHydration(() => {
            unsub()
            resolve()
          })
        })
      }

      const { token, isDemo, login, logout } = useAuthStore.getState()

      if (token) {
        try {
          useAuthStore.setState({ token })
          const user = await authApi.getMe()
          if (!cancelled) {
            login(mapBackendUser(user), token, isDemo)
          }
        } catch (err) {
          if (!cancelled) {
            setBootHint(
              getFriendlyApiError(err, 'default', "Couldn't restore your session. Please sign in again.")
            )
            logout()
          }
        }
      }

      if (!cancelled) setReady(true)
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">
            {slowBoot && !bootHint ? loadingHint : 'Loading Conviction…'}
          </p>
          {bootHint && (
            <p className="text-xs text-amber-400/90 leading-relaxed">{bootHint}</p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
