import { ApiError } from '@/services/api/client'

export type ApiErrorContext = 'auth' | 'demo' | 'default' | 'upload' | 'research'

const COLD_START_MESSAGES: Record<ApiErrorContext, string[]> = {
  auth: [
    "Google's ready. Our server on Render? Still hitting snooze. Give it half a minute and sign in again.",
    "Render put our API to bed. It's waking up — like a partner who said they'd join the call at 9:00 and rolled in at 9:04.",
    "Sign-in bounced because Render was napping. Not you. Not Google. Just our cheap server stretching its legs.",
  ],
  demo: [
    "The demo's ready — our server on Render just isn't. It's waking up. Try again in a bit.",
    "Render is booting the backend from a very long power nap. Demo loads once it's caffeinated.",
    "Almost there. Render's doing that thing where it pretends it was ready the whole time.",
  ],
  default: [
    "Our server on Render was asleep. It's getting up now — usually takes under a minute. Try again.",
    "Render took this request on a coffee run. The server's back soon — hit retry like you'd ping a slow founder.",
    "Not broken — just Render waking up from nap mode. Same energy as waiting for a term sheet draft.",
    "The backend on Render is stretching. Give it a moment, then try again.",
  ],
  upload: [
    "Your recording's fine. Render's server just woke up mid-upload and got confused. One more try in a minute.",
    "Meeting audio uploaded — then Render yawned and rebooted. Classic. Try again shortly.",
    "Render was asleep when your audio arrived. It's up now (probably). Hit process again.",
  ],
  research: [
    "Can't research yet — Render's server is still in bed. Give it a minute, then go again.",
    "Render is waking up. Startup research needs a server that's actually awake — retry soon.",
    "Our backend on Render hit the snooze button. Research will work once it's up.",
  ],
}

export const LOADING_HINTS = [
  "Waking up our server on Render… it runs on founder-era hosting.",
  "Render's getting the API out of bed. First visit after a while takes a minute.",
  "Server's booting up on Render — like waiting for the partner to unmute.",
  "Our backend is stretching. Render free tier things. Almost there.",
  "Conviction is loading… Render is probably still making coffee for the server.",
  "Hang tight — Render may have put our API to sleep. It's waking up now.",
]

function pickMessage(context: ApiErrorContext): string {
  const list = COLD_START_MESSAGES[context]
  return list[Math.floor(Math.random() * list.length)]
}

export function getLoadingHint(): string {
  return LOADING_HINTS[Math.floor(Math.random() * LOADING_HINTS.length)]
}

function isColdStartLikely(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return true

  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase()
    return (
      msg.includes('fetch') ||
      msg.includes('network') ||
      msg.includes('load failed') ||
      msg.includes('failed to fetch')
    )
  }

  if (err instanceof ApiError) {
    if ([408, 502, 503, 504, 522, 524].includes(err.status)) return true
    if (err.status >= 500) return true
    const m = err.message.toLowerCase()
    if (
      m.includes('failed to fetch') ||
      m.includes('network') ||
      m.includes('econnrefused') ||
      m.includes('timed out')
    ) {
      return true
    }
  }

  return false
}

export function getFriendlyApiError(
  err: unknown,
  context: ApiErrorContext = 'default',
  fallback = 'Something went wrong. Try again in a moment.'
): string {
  if (isColdStartLikely(err)) {
    return pickMessage(context)
  }

  if (err instanceof ApiError) {
    try {
      const parsed = JSON.parse(err.message) as { detail?: string }
      if (parsed.detail && typeof parsed.detail === 'string') {
        return parsed.detail
      }
    } catch {
      // not JSON — use message below
    }
    if (err.status === 401) return 'Session expired — please sign in again.'
    if (err.status === 403) return "You don't have access to that."
    if (err.status === 404) return 'Not found — it may have been removed.'
    if (err.message && !err.message.startsWith('HTTP')) {
      return err.message
    }
  }

  if (err instanceof Error && err.message) {
    return err.message
  }

  return fallback
}
