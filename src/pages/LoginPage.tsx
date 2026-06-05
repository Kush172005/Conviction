import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { CredentialResponse } from '@react-oauth/google'
import { TrendingUp, ArrowRight, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { useAuthStore, useOnboardingStore } from '@/store'
import { authApi, mapBackendUser } from '@/services/api/auth'
import { ApiError } from '@/services/api/client'

function parseApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.message) as { detail?: string }
      return parsed.detail || err.message
    } catch {
      return err.message || fallback
    }
  }
  if (err instanceof Error) return err.message
  return fallback
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already logged in — redirect appropriately
  useEffect(() => {
    if (isAuthenticated && user) {
      const isDemo = useAuthStore.getState().isDemo
      if (isDemo || user.onboardingCompleted) {
        navigate('/dashboard', { replace: true })
      } else {
        navigate('/onboarding', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  async function completeRealLogin(token: string, onboardingCompleted: boolean) {
    useAuthStore.setState({ token, isAuthenticated: true })
    const backendUser = await authApi.getMe()
    login(mapBackendUser(backendUser), token, false)

    if (!onboardingCompleted) {
      const { currentStep } = useOnboardingStore.getState()
      if (currentStep >= 2) useOnboardingStore.getState().reset()
      navigate('/onboarding', { replace: true })
    } else {
      navigate('/dashboard', { replace: true })
    }
  }

  async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
    if (!credentialResponse.credential) {
      setError('Google did not return a valid credential. Please try again.')
      return
    }
    setIsGoogleLoading(true)
    setError(null)
    try {
      const tokenResponse = await authApi.googleLogin(credentialResponse.credential)
      await completeRealLogin(tokenResponse.access_token, tokenResponse.onboarding_completed)
    } catch (err) {
      setError(
        parseApiError(
          err,
          'Google sign-in failed. Check that the backend is running and your Google Client ID matches this app.'
        )
      )
    } finally {
      setIsGoogleLoading(false)
    }
  }

  async function handleDemoLogin() {
    setIsDemoLoading(true)
    setError(null)
    try {
      const tokenResponse = await authApi.mockLogin()
      useAuthStore.setState({ token: tokenResponse.access_token, isAuthenticated: true })
      const backendUser = await authApi.getMe()
      // isDemo = true — skip onboarding, go straight to dashboard
      login(mapBackendUser(backendUser), tokenResponse.access_token, true)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(parseApiError(err, 'Demo login failed. Make sure the backend is running.'))
    } finally {
      setIsDemoLoading(false)
    }
  }

  const clientIdSuffix = GOOGLE_CLIENT_ID?.split('.')[0]?.slice(-8)

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-conviction-500/6 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-conviction mb-4 brand-glow-anim">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Conviction</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Never lose the reasoning behind a decision.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="text-center">
            <h2 className="text-base font-semibold text-foreground">Welcome</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your investment workspace
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-red-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google sign-in — new user flow */}
          {GOOGLE_CLIENT_ID ? (
            <div className="space-y-2">
              <div className="relative">
                <GoogleSignInButton
                  clientId={GOOGLE_CLIENT_ID}
                  disabled={isGoogleLoading || isDemoLoading}
                  onSuccess={handleGoogleSuccess}
                  onError={() =>
                    setError(
                      'Google sign-in failed. In Google Cloud Console, add http://localhost:5173 to Authorized JavaScript origins for client ending in …' +
                        (clientIdSuffix ?? '????')
                    )
                  }
                />
                {isGoogleLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-md bg-card/80">
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin" />
                  </div>
                )}
              </div>
              <p className="text-2xs text-center text-muted-foreground font-mono opacity-50">
                OAuth client: …{clientIdSuffix}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 text-xs text-amber-400">
              Google OAuth is not configured. Add{' '}
              <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> to your frontend{' '}
              <code className="font-mono">.env</code> and restart the dev server.
            </div>
          )}

          <div className="relative flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Demo login */}
          <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2.5">
            <div>
              <p className="text-xs font-medium text-foreground">Explore the demo workspace</p>
              <p className="text-2xs text-muted-foreground mt-0.5">
                See the full product with RTP Global's sample deal pipeline — no account needed.
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full h-9"
              onClick={handleDemoLogin}
              disabled={isDemoLoading || isGoogleLoading}
            >
              {isDemoLoading ? (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-foreground animate-spin" />
              ) : (
                <>
                  Load demo workspace
                  <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Your data is encrypted and private.</span>
        </div>
      </motion.div>
    </div>
  )
}
