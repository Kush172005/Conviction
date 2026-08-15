import { useEffect, useRef } from 'react'
import { useTheme } from '@/components/theme/ThemeProvider'
import type { CredentialResponse } from '@react-oauth/google'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: CredentialResponse) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string
              theme?: string
              size?: string
              width?: number
              text?: string
              shape?: string
            }
          ) => void
          cancel: () => void
        }
      }
    }
  }
}

interface GoogleSignInButtonProps {
  clientId: string
  disabled?: boolean
  onSuccess: (response: CredentialResponse) => void
  onError?: () => void
}

let activeClientId: string | null = null
let scriptLoadPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (scriptLoadPromise) return scriptLoadPromise

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    )
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve()
        return
      }
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google script failed')), {
        once: true,
      })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Sign-In'))
    document.head.appendChild(script)
  })

  return scriptLoadPromise
}

export default function GoogleSignInButton({
  clientId,
  disabled = false,
  onSuccess,
  onError,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const { resolved } = useTheme()

  onSuccessRef.current = onSuccess
  onErrorRef.current = onError

  useEffect(() => {
    const container = containerRef.current
    if (!clientId || !container) return

    let cancelled = false

    async function setup() {
      try {
        await loadGoogleScript()
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) return

        if (activeClientId !== clientId) {
          window.google.accounts.id.cancel()
          window.google.accounts.id.initialize({
            client_id: clientId,
            auto_select: false,
            cancel_on_tap_outside: true,
            callback: (response) => {
              if (response.credential) {
                onSuccessRef.current(response)
              } else {
                onErrorRef.current?.()
              }
            },
          })
          activeClientId = clientId
        }

        const host = containerRef.current
        const measured = Math.floor(
          (host.parentElement ?? host).getBoundingClientRect().width
        )
        host.innerHTML = ''
        host.dataset.gsiRendered = 'false'
        const width = Math.max(240, Math.min(400, measured || 336))
        window.google.accounts.id.renderButton(host, {
          type: 'standard',
          theme: resolved === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          width,
          text: 'continue_with',
          shape: 'rectangular',
        })
        host.dataset.gsiRendered = 'true'
      } catch {
        onErrorRef.current?.()
      }
    }

    setup()

    return () => {
      cancelled = true
    }
  }, [clientId, resolved])

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className={`flex justify-center w-full transition-opacity ${
          disabled ? 'pointer-events-none opacity-50' : ''
        }`}
      />
    </div>
  )
}
