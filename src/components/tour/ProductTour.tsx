import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import LogoMark from '@/components/LogoMark'
import { useAuthStore, useUIStore } from '@/store'
import { useTourStore } from '@/store/tourStore'
import { TOUR_STEPS } from './tourSteps'
import { cn } from '@/lib/utils'

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING = 12
const DIM_COLOR = 'rgba(0, 0, 0, 0.42)'
const CENTER_DIM = 'rgba(0, 0, 0, 0.22)'
const BLUR = 'blur(3px)'

const CARD_Z = 300
const RING_Z = 210
const DIM_Z = 200

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth < 768
}

function getVisibleTarget(target: string | string[] | undefined): HTMLElement | null {
  if (!target) return null
  const ids = Array.isArray(target) ? target : [target]
  for (const id of ids) {
    const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`)
    for (const node of nodes) {
      const rect = node.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        return node
      }
    }
  }
  return null
}

function getScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement
  while (parent) {
    const { overflowY } = getComputedStyle(parent)
    if (overflowY === 'auto' || overflowY === 'scroll') return parent
    parent = parent.parentElement
  }
  return null
}

function readSpotlight(el: HTMLElement): SpotlightRect {
  const rect = el.getBoundingClientRect()
  return {
    top: Math.max(8, rect.top - PADDING),
    left: Math.max(8, rect.left - PADDING),
    width: Math.min(rect.width + PADDING * 2, window.innerWidth - 16),
    height: rect.height + PADDING * 2,
  }
}

/** One-shot instant scroll — no smooth, no follow-up adjustments */
function scrollTargetOnce(el: HTMLElement) {
  const mobile = isMobileViewport()
  const topPad = mobile ? 100 : 88
  const bottomPad = mobile ? 280 : 120

  const scrollParent = getScrollParent(el)
  const rect = el.getBoundingClientRect()
  const viewportH = window.innerHeight
  const safeZoneBottom = viewportH - bottomPad

  let scrollDelta = 0
  if (rect.top < topPad) {
    scrollDelta = rect.top - topPad
  } else if (rect.bottom > safeZoneBottom) {
    scrollDelta = rect.bottom - safeZoneBottom
  }

  if (scrollDelta === 0) return

  if (scrollParent) {
    scrollParent.scrollTop += scrollDelta
  } else {
    window.scrollBy(0, scrollDelta)
  }
}

function SpotlightPanels({ rect }: { rect: SpotlightRect }) {
  const panelStyle = {
    background: DIM_COLOR,
    backdropFilter: BLUR,
    WebkitBackdropFilter: BLUR,
  } as React.CSSProperties

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: DIM_Z }}>
      <div
        className="fixed left-0 right-0 top-0 pointer-events-auto"
        style={{ ...panelStyle, height: rect.top }}
      />
      <div
        className="fixed left-0 pointer-events-auto"
        style={{ ...panelStyle, top: rect.top, width: rect.left, height: rect.height }}
      />
      <div
        className="fixed right-0 pointer-events-auto"
        style={{
          ...panelStyle,
          top: rect.top,
          left: rect.left + rect.width,
          height: rect.height,
        }}
      />
      <div
        className="fixed left-0 right-0 bottom-0 pointer-events-auto"
        style={{ ...panelStyle, top: rect.top + rect.height }}
      />
    </div>
  )
}

export default function ProductTour() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const { active, stepIndex, nextStep, prevStep, skipTour, completeTour } = useTourStore()
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed)

  const step = TOUR_STEPS[stepIndex]
  const isLast = stepIndex === TOUR_STEPS.length - 1
  const isFirst = stepIndex === 0
  const isMobile = isMobileViewport()

  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const [ready, setReady] = useState(false)
  const firstCompanyIdRef = useRef<string | null>(null)

  const handleSkipRef = useRef(() => {})
  handleSkipRef.current = () => {
    if (user) skipTour(user.id)
  }

  /** Update spotlight position only — never scrolls (prevents jitter loop) */
  const measureOnly = useCallback(() => {
    if (!step?.target) {
      setSpotlight(null)
      return
    }
    const el = getVisibleTarget(step.target)
    if (!el) {
      setSpotlight(null)
      return
    }
    setSpotlight(readSpotlight(el))
  }, [step])

  /** Run once per step: scroll then measure */
  const setupStep = useCallback(() => {
    if (!step?.target) {
      setSpotlight(null)
      setReady(true)
      return
    }

    const el = getVisibleTarget(step.target)
    if (!el) {
      setSpotlight(null)
      setReady(true)
      return
    }

    scrollTargetOnce(el)
    setSpotlight(readSpotlight(el))
    setReady(true)
  }, [step])

  useLayoutEffect(() => {
    if (!active) return
    const card = document.querySelector('[data-tour="tour-pipeline-card"]')
    const id = card?.closest('[data-company-id]')?.getAttribute('data-company-id')
    if (id) firstCompanyIdRef.current = id
  }, [active, stepIndex])

  useLayoutEffect(() => {
    if (!active) return
    setReady(false)
    const delay = step?.route?.includes('__first__') ? 500 : step?.route ? 400 : 100
    const t = window.setTimeout(setupStep, delay)
    return () => window.clearTimeout(t)
  }, [active, stepIndex, step, setupStep, location.pathname])

  useEffect(() => {
    if (!active || !step?.route) return
    const route =
      step.route === '/companies/__first__'
        ? firstCompanyIdRef.current
          ? `/companies/${firstCompanyIdRef.current}`
          : '/companies/co_01'
        : step.route
    navigate(route)
  }, [active, stepIndex, step?.route, navigate])

  useEffect(() => {
    if (!active) return
    setSidebarCollapsed(false)

    let resizeTimer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(measureOnly, 150)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleSkipRef.current()
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [active, measureOnly, setSidebarCollapsed, user, skipTour])

  if (!active || !user || !step) return null

  function handleNext() {
    if (isLast) {
      completeTour(user!.id)
    } else {
      nextStep(TOUR_STEPS.length - 1)
    }
  }

  function handleSkip() {
    skipTour(user!.id)
  }

  const isCenter = step.placement === 'center'
  const showSpotlight = !isCenter && spotlight
  const progress = ((stepIndex + 1) / TOUR_STEPS.length) * 100

  return (
    <div className="fixed inset-0" style={{ zIndex: DIM_Z }} role="dialog" aria-modal="true" aria-label="Product tour">
      {isCenter && (
        <div
          className="fixed inset-0 pointer-events-auto"
          style={{
            background: CENTER_DIM,
            backdropFilter: BLUR,
            WebkitBackdropFilter: BLUR,
            zIndex: DIM_Z,
          }}
        />
      )}

      {showSpotlight && ready && spotlight && <SpotlightPanels rect={spotlight} />}

      <AnimatePresence mode="wait">
        {showSpotlight && ready && spotlight && (
          <motion.div
            key={step.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed pointer-events-none rounded-xl"
            style={{
              zIndex: RING_Z,
              top: spotlight.top,
              left: spotlight.left,
              width: spotlight.width,
              height: spotlight.height,
              boxShadow:
                '0 0 0 2px rgba(99, 102, 241, 0.95), 0 0 0 5px rgba(99, 102, 241, 0.2), 0 0 28px rgba(99, 102, 241, 0.4)',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {ready && (
          <motion.div
            key={`card-${step.id}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              'fixed border border-border bg-card shadow-2xl pointer-events-auto overflow-y-auto',
              isCenter && isMobile
                ? 'left-4 right-4 top-4 max-h-[calc(100dvh-2rem)] rounded-xl p-4'
                : isCenter
                ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md max-h-[calc(100vh-2rem)] rounded-xl p-5'
                : isMobile
                ? 'left-4 right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] max-h-[40dvh] rounded-xl p-4'
                : 'right-6 top-1/2 -translate-y-1/2 w-[21rem] max-w-[calc(100vw-3rem)] rounded-xl p-5'
            )}
            style={{ zIndex: CARD_Z }}
          >
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-conviction">
                  <LogoMark className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stepIndex + 1} / {TOUR_STEPS.length}
                  </p>
                  <h3 className="text-sm font-semibold text-foreground leading-snug">
                    {step.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1 shrink-0"
                aria-label="Skip tour"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>

            {step.tips && step.tips.length > 0 && (
              <ul className="mt-2.5 space-y-1">
                {step.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-foreground/80">
                    <Check className="h-3.5 w-3.5 text-conviction-400 shrink-0 mt-0.5" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 mb-3">
              <div className="h-1 rounded-full bg-border overflow-hidden">
                <motion.div
                  className="h-full bg-conviction-500 rounded-full"
                  initial={false}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              >
                Skip
              </button>
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <Button variant="outline" size="sm" onClick={prevStep}>
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </Button>
                )}
                <Button variant="conviction" size="sm" onClick={handleNext}>
                  {isLast ? 'Get started' : 'Next'}
                  {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
