import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  User,
  Globe,
  Calendar,
  Copy,
  Check,
  Mail,
  Target,
  TrendingUp,
  Sparkles,
  ChevronDown,
  HelpCircle,
  Rocket,
  ShieldAlert,
  BarChart3,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import FadeIn, { FadeInStagger, FadeInItem } from '@/components/motion/FadeIn'
import { MOCK_DEAL_INTELLIGENCE, MOCK_CALLS, MOCK_COMPANIES } from '@/mocks/data'
import { useAuthStore } from '@/store'
import { callsApi } from '@/services/api/calls'
import { formatDate } from '@/lib/utils'
import type { CallIntelligenceData } from '@/types'
import { cn } from '@/lib/utils'

const RECOMMENDATION_CONFIG = {
  strong_invest: { label: 'Strong Invest', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  invest: { label: 'Invest', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  pass: { label: 'Pass', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  monitor: { label: 'Monitor', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  need_more_info: { label: 'Need More Info', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
} as const

function IntelCard({
  title,
  icon: Icon,
  children,
  delay = 0,
  accent,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
  delay?: number
  accent?: string
}) {
  return (
    <FadeIn delay={delay}>
      <div className={`rounded-lg border bg-card p-5 ${accent || 'border-border'}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </h3>
        {children}
      </div>
    </FadeIn>
  )
}

function BulletList({
  items,
  delay = 0,
  dotColor = 'bg-muted-foreground',
}: {
  items: string[]
  delay?: number
  dotColor?: string
}) {
  return (
    <ul className="space-y-2.5">
      {items.map((s, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + i * 0.06, duration: 0.3 }}
          className="flex items-start gap-2 text-sm text-foreground"
        >
          <div className={`mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
          {s}
        </motion.li>
      ))}
    </ul>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 w-32 rounded bg-border" />
      <div className="h-8 w-64 rounded bg-border" />
      <div className="h-16 rounded-lg bg-border" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-28 rounded-lg bg-border" />
      ))}
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────

function IntelError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-6 w-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Could not load intelligence</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    </div>
  )
}

// ─── Key Metrics card ─────────────────────────────────────────────────────────

function KeyMetricsCard({ metrics, delay }: { metrics: Record<string, string>; delay: number }) {
  const entries = Object.entries(metrics).filter(([, v]) => v && v !== 'Not mentioned')
  if (entries.length === 0) return null

  const labels: Record<string, string> = {
    arr_or_revenue: 'ARR / Revenue',
    growth_rate: 'Growth Rate',
    customers: 'Customers',
    team_size: 'Team Size',
    runway: 'Runway',
    valuation: 'Valuation / Round',
  }

  return (
    <IntelCard title="Key Metrics from Notes" icon={BarChart3} delay={delay}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {entries.map(([key, val]) => (
          <div key={key} className="rounded-md bg-secondary/50 px-3 py-2.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {labels[key] || key.replace(/_/g, ' ')}
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{val}</p>
          </div>
        ))}
      </div>
    </IntelCard>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CallIntelligencePage() {
  const navigate = useNavigate()
  const { callId } = useParams<{ callId: string }>()
  const location = useLocation()
  const { isDemo } = useAuthStore()

  const [intel, setIntel] = useState<CallIntelligenceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [emailCopied, setEmailCopied] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const [showProviderLog, setShowProviderLog] = useState(false)

  const loadIntelligence = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // ── Demo mode: use mock data ──────────────────────────────────────────
      if (isDemo || callId === 'call_04') {
        const mock = MOCK_DEAL_INTELLIGENCE
        const mockCall = MOCK_CALLS.find((c) => c.id === callId) ?? MOCK_CALLS[0]
        const mockCompany = MOCK_COMPANIES.find((c) => c.id === mockCall.companyId) ?? MOCK_COMPANIES[0]

        setIntel({
          callId: mockCall.id,
          companyId: mockCall.companyId,
          companyName: mockCompany.name,
          callTitle: mockCall.title,
          inputMode: mockCall.inputMode,
          occurredAt: mockCall.occurredAt,
          decisionId: 'dec_demo',
          recommendation: mock.recommendation,
          confidence: mock.confidence,
          rationale: mock.dealSummary || '',
          dealSummary: mock.dealSummary,
          founderAssessment: mock.founderAssessment,
          businessOverview: mock.businessOverview,
          marketAssessment: mock.marketAssessment,
          thesisFit: mock.thesisFit,
          strengths: mock.strengths,
          concerns: mock.concerns,
          opportunities: [
            'Regulatory tailwinds from EU AI Act create urgency in 2026',
            'Strong network for warm intros to F500 security teams',
            'Potential to expand into AI red-teaming and eval tooling',
          ],
          risks: [
            'Hyperscaler native tooling from Azure/Google within 18-24 months',
            'Small team capacity relative to enterprise pilot demands',
          ],
          openQuestions: [
            'How defensible is the evaluation framework vs. open-source alternatives?',
            'What is the target NRR once accounts are fully onboarded?',
            'Is there a PLG motion possible alongside enterprise sales?',
          ],
          keyMetrics: {
            arr_or_revenue: '$180K ARR',
            customers: '3 F500 pilots',
            team_size: '12 people',
            growth_rate: 'Not mentioned',
            runway: 'Not mentioned',
            valuation: 'Not mentioned',
          },
          followUps: [],
          followUpActions: mock.followUpActions,
          suggestedFollowUpDate: mock.suggestedFollowUpDate,
          draftEmail: mock.draftEmail,
          decisionCreatedAt: mock.generatedAt,
          providerLog: [],
        })
        return
      }

      // ── Check if navigation state already has intel (fresh from processing) ──
      const navIntel = location.state?.intel as CallIntelligenceData | undefined
      if (navIntel && navIntel.callId === callId) {
        setIntel(navIntel)
        return
      }

      // ── Fetch from API ───────────────────────────────────────────────────
      if (!callId) throw new Error('No call ID in URL')
      const data = await callsApi.getIntelligence(callId)
      setIntel(data)
    } catch (err: unknown) {
      const error = err as Error
      if (error.message?.includes('404') || error.message?.includes('No intelligence')) {
        setError('No intelligence found for this call. Process it first from the Log Call page.')
      } else {
        setError(error.message || 'Could not load intelligence. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [callId, isDemo, location.state])

  useEffect(() => {
    loadIntelligence()
  }, [loadIntelligence])

  function copyEmail() {
    if (intel?.draftEmail) {
      navigator.clipboard.writeText(intel.draftEmail)
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 2000)
    }
  }

  if (loading) return <LoadingSkeleton />
  if (error || !intel) return (
    <IntelError
      message={error || 'Intelligence data unavailable.'}
      onRetry={loadIntelligence}
    />
  )

  const rec = RECOMMENDATION_CONFIG[intel.recommendation as keyof typeof RECOMMENDATION_CONFIG]
    ?? RECOMMENDATION_CONFIG.need_more_info

  const backPath = intel.companyId ? `/companies/${intel.companyId}` : '/companies'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <FadeIn>
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {intel.companyName}
        </button>
      </FadeIn>

      {/* Header */}
      <FadeIn delay={0.05}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-conviction-400 shrink-0" />
              <h1 className="text-xl font-semibold text-foreground truncate">Deal Intelligence</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {intel.companyName} · {formatDate(intel.decisionCreatedAt)}
            </p>
            {intel.callTitle && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{intel.callTitle}</p>
            )}
          </div>
          <div
            className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 shrink-0 ${rec.bg}`}
          >
            <div className={`text-sm font-semibold ${rec.color}`}>{rec.label}</div>
            <div className="text-xs text-muted-foreground">{intel.confidence}% confidence</div>
          </div>
        </div>
      </FadeIn>

      {/* Confidence bar */}
      <FadeIn delay={0.08}>
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Investment Confidence</span>
            <span className={cn('text-sm font-semibold', rec.color)}>{intel.confidence}%</span>
          </div>
          <Progress value={intel.confidence} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {intel.rationale}
          </p>
        </div>
      </FadeIn>

      <div className="space-y-4">
        {/* Deal Summary */}
        <IntelCard title="Deal Summary" icon={Target} delay={0.1}>
          <p className="text-sm text-muted-foreground leading-relaxed">{intel.dealSummary}</p>
        </IntelCard>

        {/* Key Metrics */}
        {intel.keyMetrics && Object.keys(intel.keyMetrics).length > 0 && (
          <KeyMetricsCard metrics={intel.keyMetrics} delay={0.11} />
        )}

        {/* Founder Assessment */}
        <IntelCard title="Founder Assessment" icon={User} delay={0.12}>
          <p className="text-sm text-muted-foreground leading-relaxed">{intel.founderAssessment}</p>
        </IntelCard>

        {/* Business Overview */}
        <IntelCard title="Business Overview" icon={TrendingUp} delay={0.14}>
          <p className="text-sm text-muted-foreground leading-relaxed">{intel.businessOverview}</p>
        </IntelCard>

        {/* Market */}
        <IntelCard title="Market Assessment" icon={Globe} delay={0.16}>
          <p className="text-sm text-muted-foreground leading-relaxed">{intel.marketAssessment}</p>
        </IntelCard>

        {/* Strengths & Concerns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FadeIn delay={0.18}>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5 h-full">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Strengths
              </h3>
              <BulletList items={intel.strengths} delay={0.18} dotColor="bg-emerald-400" />
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5 h-full">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Concerns
              </h3>
              <BulletList items={intel.concerns} delay={0.2} dotColor="bg-amber-400" />
            </div>
          </FadeIn>
        </div>

        {/* Opportunities & Risks */}
        {(intel.opportunities.length > 0 || intel.risks.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {intel.opportunities.length > 0 && (
              <FadeIn delay={0.21}>
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-5 h-full">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <Rocket className="h-4 w-4 text-blue-400" />
                    Opportunities
                  </h3>
                  <BulletList items={intel.opportunities} delay={0.21} dotColor="bg-blue-400" />
                </div>
              </FadeIn>
            )}

            {intel.risks.length > 0 && (
              <FadeIn delay={0.22}>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-5 h-full">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                    <ShieldAlert className="h-4 w-4 text-red-400" />
                    Key Risks
                  </h3>
                  <BulletList items={intel.risks} delay={0.22} dotColor="bg-red-400" />
                </div>
              </FadeIn>
            )}
          </div>
        )}

        {/* Thesis Fit */}
        <IntelCard
          title="Investment Thesis Fit"
          icon={Lightbulb}
          delay={0.23}
          accent="border-conviction-500/20"
        >
          <p className="text-sm text-foreground leading-relaxed">{intel.thesisFit}</p>
        </IntelCard>

        {/* Open Questions */}
        {intel.openQuestions.length > 0 && (
          <IntelCard title="Open Diligence Questions" icon={HelpCircle} delay={0.235}>
            <ul className="space-y-2.5">
              {intel.openQuestions.map((q, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.235 + i * 0.06, duration: 0.3 }}
                  className="flex items-start gap-2.5 text-sm text-foreground"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-mono text-muted-foreground">
                    {i + 1}
                  </div>
                  {q}
                </motion.li>
              ))}
            </ul>
          </IntelCard>
        )}

        {/* Follow-Up Actions */}
        <FadeIn delay={0.24}>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              Follow-Up Actions
            </h3>
            {intel.followUpActions.length > 0 ? (
              <ul className="space-y-2.5">
                {intel.followUpActions.map((action, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 + i * 0.06, duration: 0.3 }}
                    className="flex items-start gap-2.5 text-sm text-foreground"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-mono text-muted-foreground">
                      {i + 1}
                    </div>
                    {action}
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No specific actions extracted from notes.</p>
            )}
            {intel.suggestedFollowUpDate && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
                <Calendar className="h-3.5 w-3.5" />
                Suggested follow-up: {formatDate(intel.suggestedFollowUpDate)}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Draft Email */}
        {intel.draftEmail && (
          <FadeIn delay={0.26}>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Draft Follow-Up Email
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost-muted"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setShowEmail((v) => !v)}
                  >
                    {showEmail ? 'Hide' : 'Show'}
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${showEmail ? 'rotate-180' : ''}`}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={copyEmail}
                  >
                    {emailCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <AnimatePresence>
                {showEmail && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-md bg-secondary/50 p-4"
                  >
                    <pre className="text-sm text-foreground font-mono leading-relaxed whitespace-pre-wrap">
                      {intel.draftEmail}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>
        )}

        {/* Transcript (if available) */}
        {intel.transcriptText && (
          <FadeIn delay={0.27}>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Voice Transcript</h3>
                <Button
                  variant="ghost-muted"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowTranscript((v) => !v)}
                >
                  {showTranscript ? 'Hide' : 'Show'}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${showTranscript ? 'rotate-180' : ''}`}
                  />
                </Button>
              </div>
              <AnimatePresence>
                {showTranscript && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-md bg-secondary/50 p-4 max-h-64 overflow-y-auto"
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {intel.transcriptText}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>
        )}

        {/* Provider Activity Log */}
        {intel.providerLog.length > 0 && (
          <FadeIn delay={0.28}>
            <div className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-muted-foreground">AI Provider Activity</h3>
                <Button
                  variant="ghost-muted"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setShowProviderLog((v) => !v)}
                >
                  {showProviderLog ? 'Hide' : `Show (${intel.providerLog.length})`}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${showProviderLog ? 'rotate-180' : ''}`}
                  />
                </Button>
              </div>
              <AnimatePresence>
                {showProviderLog && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5 max-h-64 overflow-y-auto"
                  >
                    {intel.providerLog.map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-md bg-secondary/30 px-3 py-2 text-xs font-mono"
                      >
                        <span
                          className={cn(
                            'shrink-0 font-semibold',
                            entry.status === 'ok' ? 'text-emerald-400' :
                            entry.status === 'error' ? 'text-red-400' :
                            entry.status === 'skipped' ? 'text-muted-foreground' :
                            'text-amber-400'
                          )}
                        >
                          [{entry.status.toUpperCase()}]
                        </span>
                        <span className="text-conviction-400 shrink-0">{entry.provider}</span>
                        <span className="text-muted-foreground shrink-0">·</span>
                        <span className="text-foreground">{entry.action}</span>
                        {entry.detail && (
                          <span className="text-muted-foreground truncate">{entry.detail}</span>
                        )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </FadeIn>
        )}
      </div>

      {/* Action bar */}
      <FadeIn delay={0.3}>
        <div className="mt-8 flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">
            Intelligence saved to {intel.companyName} memory timeline.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(backPath)}>
              View company
            </Button>
            <Button variant="conviction" size="sm" onClick={() => navigate('/memory')}>
              View memory
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
