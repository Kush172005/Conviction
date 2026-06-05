import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import FadeIn, { FadeInStagger, FadeInItem } from '@/components/motion/FadeIn'
import { MOCK_DEAL_INTELLIGENCE, MOCK_CALLS, MOCK_COMPANIES } from '@/mocks/data'
import { useAuthStore } from '@/store'
import { formatDate } from '@/lib/utils'

const RECOMMENDATION_CONFIG = {
  strong_invest: { label: 'Strong Invest', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  invest: { label: 'Invest', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  pass: { label: 'Pass', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  monitor: { label: 'Monitor', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  need_more_info: { label: 'Need More Info', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
}

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

export default function CallIntelligencePage() {
  const navigate = useNavigate()
  const { callId } = useParams<{ callId: string }>()
  const isDemo = useAuthStore((s) => s.isDemo)

  // For demo users: look up the call by route param, fall back to first mock call
  const call = MOCK_CALLS.find((c) => c.id === callId) ?? MOCK_CALLS[0]
  // Intel is always tied to the demo decision — for now show placeholder for unknown calls
  const intel = isDemo || callId === 'call_04' ? MOCK_DEAL_INTELLIGENCE : MOCK_DEAL_INTELLIGENCE

  const company = MOCK_COMPANIES.find((c) => c.id === call.companyId) ?? MOCK_COMPANIES[0]

  const [emailCopied, setEmailCopied] = useState(false)
  const [showEmail, setShowEmail] = useState(false)

  const rec = RECOMMENDATION_CONFIG[intel.recommendation]

  function copyEmail() {
    if (intel.draftEmail) {
      navigator.clipboard.writeText(intel.draftEmail)
      setEmailCopied(true)
      setTimeout(() => setEmailCopied(false), 2000)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <FadeIn>
        <button
          onClick={() => navigate(`/companies/${company.id}`)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to {company.name}
        </button>
      </FadeIn>

      {/* Header */}
      <FadeIn delay={0.05}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-conviction-400" />
              <h1 className="text-xl font-semibold text-foreground">Deal Intelligence</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {company.name} · {formatDate(intel.generatedAt)}
            </p>
          </div>
          <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${rec.bg}`}>
            <div className={`text-sm font-semibold ${rec.color}`}>{rec.label}</div>
            <div className="text-xs text-muted-foreground">{intel.confidence}% confidence</div>
          </div>
        </div>
      </FadeIn>

      {/* Confidence */}
      <FadeIn delay={0.08}>
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">Investment Confidence</span>
            <span className="text-sm font-semibold text-foreground">{intel.confidence}%</span>
          </div>
          <Progress value={intel.confidence} className="h-2" />
          <p className="mt-2 text-xs text-muted-foreground">
            Based on founder quality, market signals, traction evidence, and thesis alignment.
          </p>
        </div>
      </FadeIn>

      <div className="space-y-4">
        {/* Deal Summary */}
        <IntelCard title="Deal Summary" icon={Target} delay={0.1}>
          <p className="text-sm text-muted-foreground leading-relaxed">{intel.dealSummary}</p>
        </IntelCard>

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

        {/* Strengths & Concerns side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FadeIn delay={0.18}>
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Strengths
              </h3>
              <ul className="space-y-2.5">
                {intel.strengths.map((s, i) => (
                  <motion.li
                    key={s}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.07, duration: 0.3 }}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {s}
                  </motion.li>
                ))}
              </ul>
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Concerns
              </h3>
              <ul className="space-y-2.5">
                {intel.concerns.map((c, i) => (
                  <motion.li
                    key={c}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.3 }}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {c}
                  </motion.li>
                ))}
              </ul>
            </div>
          </FadeIn>
        </div>

        {/* Thesis Fit */}
        <IntelCard title="Investment Thesis Fit" icon={Lightbulb} delay={0.22} accent="border-conviction-500/20">
          <p className="text-sm text-foreground leading-relaxed">{intel.thesisFit}</p>
        </IntelCard>

        {/* Follow-Up Actions */}
        <FadeIn delay={0.24}>
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              Follow-Up Actions
            </h3>
            <ul className="space-y-2.5">
              {intel.followUpActions.map((action, i) => (
                <motion.li
                  key={action}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 + i * 0.06, duration: 0.3 }}
                  className="flex items-start gap-2.5 text-sm text-foreground"
                >
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-border text-2xs font-mono text-muted-foreground">
                    {i + 1}
                  </div>
                  {action}
                </motion.li>
              ))}
            </ul>
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
            </div>
          </FadeIn>
        )}
      </div>

      {/* Action bar */}
      <FadeIn delay={0.3}>
        <div className="mt-8 flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <p className="text-sm text-muted-foreground">
            Save this intelligence to the company memory timeline?
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(`/companies/${company.id}`)}>
              View company
            </Button>
            <Button variant="conviction" size="sm" onClick={() => navigate('/memory')}>
              Save to memory
              <CheckCircle2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
