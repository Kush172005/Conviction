import { useAuthStore } from '@/store'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'
const DEFAULT_TIMEOUT_MS = 20_000
const LONG_TIMEOUT_MS = 180_000
const COLD_START_TIMEOUT_MS = 90_000
const COLD_START_MAX_RETRIES = 5
const COLD_START_RETRY_DELAYS_MS = [1500, 2500, 4000, 6000, 10000]

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

interface RequestOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>
  timeoutMs?: number
  skipContentType?: boolean
  coldStart?: boolean
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRetryableError(err: unknown): boolean {
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

async function requestOnce<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, skipContentType = false, ...fetchOptions } = options
  const token = useAuthStore.getState().token

  const headers: Record<string, string> = { ...(options.headers || {}) }
  if (!skipContentType) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new ApiError(res.status, text || `HTTP ${res.status}`)
    }

    const text = await res.text()
    return (text ? JSON.parse(text) : undefined) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out waiting for the server.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const coldStart = options.coldStart ?? false
  const timeoutMs = options.timeoutMs ?? (coldStart ? COLD_START_TIMEOUT_MS : DEFAULT_TIMEOUT_MS)
  const maxRetries = coldStart ? COLD_START_MAX_RETRIES : 0

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await requestOnce<T>(path, { ...options, timeoutMs })
    } catch (err) {
      lastError = err
      const canRetry = attempt < maxRetries && isRetryableError(err)
      if (!canRetry) throw err
      await sleep(COLD_START_RETRY_DELAYS_MS[attempt] ?? 10000)
    }
  }

  throw lastError
}

async function uploadFormData<T>(path: string, formData: FormData, timeoutMs = LONG_TIMEOUT_MS): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new ApiError(res.status, text || `HTTP ${res.status}`)
    }

    const text = await res.text()
    return (text ? JSON.parse(text) : undefined) as T
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError(408, 'Upload timed out waiting for the server.')
    }
    throw err
  } finally {
    clearTimeout(timeoutId)
  }
}

/** Ping the API so Render starts waking before the user clicks sign-in */
export async function wakeServer(): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), COLD_START_TIMEOUT_MS)
    const res = await fetch(`${BASE_URL}/health`, { signal: controller.signal })
    clearTimeout(timeoutId)
    return res.ok
  } catch {
    return false
  }
}

export interface ApiCallOpts {
  timeoutMs?: number
  coldStart?: boolean
}

export const api = {
  get: <T>(path: string, opts?: ApiCallOpts) =>
    request<T>(path, { coldStart: opts?.coldStart, timeoutMs: opts?.timeoutMs }),
  post: <T>(path: string, body?: unknown, opts?: ApiCallOpts) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      coldStart: opts?.coldStart,
      timeoutMs: opts?.timeoutMs,
    }),
  patch: <T>(path: string, body?: unknown, opts?: ApiCallOpts) =>
    request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      coldStart: opts?.coldStart,
      timeoutMs: opts?.timeoutMs,
    }),
  delete: <T>(path: string, opts?: ApiCallOpts) =>
    request<T>(path, { method: 'DELETE', coldStart: opts?.coldStart, timeoutMs: opts?.timeoutMs }),
  upload: <T>(path: string, formData: FormData, timeoutMs?: number) =>
    uploadFormData<T>(path, formData, timeoutMs),
}

export { ApiError }
