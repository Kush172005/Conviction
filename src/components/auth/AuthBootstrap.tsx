import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store'
import { authApi, mapBackendUser } from '@/services/api/auth'

interface AuthBootstrapProps {
  children: React.ReactNode
}

export default function AuthBootstrap({ children }: AuthBootstrapProps) {
  const [ready, setReady] = useState(false)

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
        } catch {
          if (!cancelled) logout()
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading Conviction…</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
