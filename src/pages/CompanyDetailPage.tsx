import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ExternalLink,
  PhoneCall,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import PageHeader from '@/components/layout/PageHeader'
import FadeIn, { FadeInStagger, FadeInItem } from '@/components/motion/FadeIn'
import {
  MOCK_COMPANIES,
  MOCK_CALLS,
  MOCK_MEMORY_ENTRIES,
  MOCK_DECISIONS,
  MOCK_FOLLOW_UPS,
} from '@/mocks/data'
import { cn, formatDate, formatRelativeTime, STATUS_COLORS } from '@/lib/utils'
import { useAuthStore } from '@/store'
import { companiesApi } from '@/services/api/companies'
import { callsApi } from '@/services/api/calls'
import { memoryApi } from '@/services/api/memory'
import { followUpsApi } from '@/services/api/followUps'
import { getFriendlyApiError } from '@/lib/apiErrors'
import type { Company, Call, MemoryEntry, FollowUp } from '@/types'
import type { LatestDecision } from '@/services/api/companies'

const RECOMMENDATION_COLORS: Record<string, string> = {
  strong_invest: 'text-emerald-400',
  invest: 'text-emerald-400',
  monitor: 'text-amber-400',
  pass: 'text-red-400',
  need_more_info: 'text-blue-400',
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_invest: 'Strong Invest',
  invest: 'Invest',
  monitor: 'Monitor',
  pass: 'Pass',
  need_more_info: 'Need More Info',
}

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()
  const { isDemo } = useAuthStore()

  // State
  const [company, setCompany] = useState<Company | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [memories, setMemories] = useState<MemoryEntry[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [latestDecision, setLatestDecision] = useState<LatestDecision | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!companyId) return
    setLoading(true)
    setError(null)

    try {
      if (isDemo) {
        // Demo: use mock data, fall back to first company for unknown IDs
        const mockCompany = MOCK_COMPANIES.find((c) => c.id === companyId) ?? MOCK_COMPANIES[0]
        const mockDecision = MOCK_DECISIONS.find((d) => d.companyId === mockCompany.id)
        setCompany(mockCompany)
        setCalls(MOCK_CALLS.filter((c) => c.companyId === mockCompany.id))
        setMemories(MOCK_MEMORY_ENTRIES.filter((m) => m.companyId === mockCompany.id))
        setFollowUps(MOCK_FOLLOW_UPS.filter((f) => f.companyId === mockCompany.id))
        if (mockDecision) {
          setLatestDecision({
            decisionId: mockDecision.id,
            callId: mockDecision.callId,
            recommendation: mockDecision.recommendation,
            confidence: mockDecision.confidence,
            thesisFit: mockDecision.thesisFit,
            rationale: mockDecision.rationale,
            createdAt: mockDecision.createdAt,
          })
        }
        return
      }

      // Real user: parallel API calls
      const [companyData, callsData, memoriesData, followUpsData, decisionData] =
        await Promise.allSettled([
          companiesApi.get(companyId),
          callsApi.listByCompany(companyId),
          memoryApi.list(companyId),
          followUpsApi.list(companyId),
          companiesApi.latestDecision(companyId),
        ])

      if (companyData.status === 'rejected') {
        throw new Error('Company not found')
      }
      setCompany((companyData as PromiseFulfilledResult<Company>).value)
      setCalls(callsData.status === 'fulfilled' ? callsData.value : [])
      setMemories(memoriesData.status === 'fulfilled' ? memoriesData.value : [])
      setFollowUps(followUpsData.status === 'fulfilled' ? followUpsData.value : [])
      setLatestDecision(
        decisionData.status === 'fulfilled' ? decisionData.value : null
      )
    } catch (err: unknown) {
      const e = err as Error
      setError(getFriendlyApiError(err, 'default', "Couldn't load this company. Please try again."))
    } finally {
      setLoading(false)
    }
  }, [companyId, isDemo])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-20 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading company…
        </div>
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/companies')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to companies
        </button>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <AlertCircle className="h-8 w-8 text-red-400/60" />
          <p className="text-sm text-muted-foreground">{error || 'Company not found.'}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/companies')}>
              <ArrowLeft className="h-3.5 w-3.5" />
              All companies
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const recColor = latestDecision
    ? (RECOMMENDATION_COLORS[latestDecision.recommendation] || 'text-muted-foreground')
    : ''

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <FadeIn>
        <button
          onClick={() => navigate('/companies')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to companies
        </button>
      </FadeIn>

      {/* Header */}
      <FadeIn delay={0.05}>
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-4 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
              <Badge className={cn('text-xs', STATUS_COLORS[company.status])}>
                {company.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {company.industry && <span>{company.industry}</span>}
              {company.stage && (
                <><span>·</span><span className="capitalize">{company.stage}</span></>
              )}
              {company.totalFunding && (
                <><span>·</span><span>{company.totalFunding} raised</span></>
              )}
              {company.location && (
                <><span>·</span><span>{company.location}</span></>
              )}
              {company.employeeCount && (
                <><span>·</span><span>{company.employeeCount} employees</span></>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            {company.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Website
                </a>
              </Button>
            )}
            <Button
              variant="conviction"
              size="sm"
              className="flex-1 sm:flex-none"
              onClick={() => navigate('/calls/new')}
            >
              <PhoneCall className="h-3.5 w-3.5" />
              Log call
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Latest Decision summary */}
      {latestDecision && (
        <FadeIn delay={0.1}>
          <div className="mb-6 rounded-lg border border-conviction-500/20 bg-conviction-500/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-conviction-400" />
                <span className="text-sm font-semibold text-foreground">Latest Decision</span>
              </div>
              <Button
                variant="ghost-muted"
                size="sm"
                className="text-xs h-7"
                onClick={() =>
                  navigate(`/calls/${latestDecision.callId}/intelligence`)
                }
              >
                Full analysis
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-2xs text-muted-foreground mb-1">Recommendation</p>
                <p className={cn('text-sm font-semibold capitalize', recColor)}>
                  {RECOMMENDATION_LABELS[latestDecision.recommendation] ||
                    latestDecision.recommendation.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <p className="text-2xs text-muted-foreground mb-1">Confidence</p>
                <p className="text-sm font-semibold text-conviction-300">
                  {latestDecision.confidence}%
                </p>
              </div>
              <div>
                <p className="text-2xs text-muted-foreground mb-1">Date</p>
                <p className="text-sm font-medium text-muted-foreground">
                  {formatDate(latestDecision.createdAt)}
                </p>
              </div>
            </div>
            {latestDecision.rationale && (
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                {latestDecision.rationale}
              </p>
            )}
          </div>
        </FadeIn>
      )}

      <Tabs defaultValue="overview">
        <FadeIn delay={0.12}>
          <div className="overflow-x-auto mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calls">
              Calls {calls.length > 0 && `(${calls.length})`}
            </TabsTrigger>
            <TabsTrigger value="memory">
              Memory {memories.length > 0 && `(${memories.length})`}
            </TabsTrigger>
            <TabsTrigger value="followups">
              Follow-Ups {followUps.length > 0 && `(${followUps.length})`}
            </TabsTrigger>
          </TabsList>
          </div>
        </FadeIn>

        {/* ── Overview ──────────────────────────────────────────────────── */}
        <TabsContent value="overview">
          <FadeInStagger staggerDelay={0.06}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <FadeInItem>
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Business Overview</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {company.description || 'No description yet. Log a call to generate AI insights.'}
                  </p>
                </div>
              </FadeInItem>

              <FadeInItem>
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Founder Team</h3>
                  {company.founders.length > 0 ? (
                    <div className="space-y-3">
                      {company.founders.map((founder) => (
                        <div key={founder.name} className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-conviction-500/15 text-conviction-300 text-xs font-semibold">
                            {founder.name[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">
                                {founder.name}
                              </span>
                              <span className="text-xs text-muted-foreground">{founder.role}</span>
                            </div>
                            {founder.background && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {founder.background}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No founder info yet. Add founders or generate intelligence from a call.
                    </p>
                  )}
                </div>
              </FadeInItem>

              {/* Strengths from decision */}
              {latestDecision && (
                <>
                  {/* No strengths/concerns here since we only have the summary */}
                  <FadeInItem className="lg:col-span-2">
                    <div className="rounded-lg border border-conviction-500/20 bg-conviction-500/5 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-conviction-400" />
                          Investment Thesis Fit
                        </h3>
                        <Button
                          variant="ghost-muted"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() =>
                            navigate(`/calls/${latestDecision.callId}/intelligence`)
                          }
                        >
                          View full analysis
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                        {latestDecision.thesisFit || 'Thesis analysis available in the full intelligence report.'}
                      </p>
                    </div>
                  </FadeInItem>
                </>
              )}

              {/* Empty state when no calls */}
              {!latestDecision && calls.length === 0 && (
                <FadeInItem className="lg:col-span-2">
                  <div className="rounded-lg border border-dashed border-border p-8 flex flex-col items-center gap-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-conviction-500/10">
                      <Sparkles className="h-5 w-5 text-conviction-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">No intelligence yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Log a call to generate AI-powered deal intelligence.
                      </p>
                    </div>
                    <Button variant="conviction" size="sm" onClick={() => navigate('/calls/new')}>
                      <Plus className="h-3.5 w-3.5" />
                      Log first call
                    </Button>
                  </div>
                </FadeInItem>
              )}
            </div>
          </FadeInStagger>
        </TabsContent>

        {/* ── Calls ─────────────────────────────────────────────────────── */}
        <TabsContent value="calls">
          <div className="space-y-3">
            {calls.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                No calls logged yet.
                <br />
                <Button
                  variant="link"
                  className="mt-2 text-sm"
                  onClick={() => navigate('/calls/new')}
                >
                  Log first call →
                </Button>
              </div>
            ) : (
              calls.map((call) => (
                <motion.div
                  key={call.id}
                  whileHover={{ y: -1 }}
                  onClick={() =>
                    call.status === 'completed'
                      ? navigate(`/calls/${call.id}/intelligence`)
                      : undefined
                  }
                  className={cn(
                    'rounded-lg border border-border bg-card p-4 transition-all duration-150',
                    call.status === 'completed' &&
                      'cursor-pointer hover:shadow-card-hover hover:border-border/80'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground truncate">
                          {call.title}
                        </span>
                        {call.status === 'completed' && (
                          <Badge variant="success" className="text-2xs">
                            Analysed
                          </Badge>
                        )}
                        {call.status === 'processing' && (
                          <Badge className="text-2xs bg-blue-500/10 border-blue-500/20 text-blue-400">
                            Processing
                          </Badge>
                        )}
                        {call.status === 'failed' && (
                          <Badge variant="destructive" className="text-2xs">
                            Failed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          {call.inputMode === 'voice'
                            ? 'Voice memo'
                            : call.inputMode === 'recording'
                            ? 'Meeting recording'
                            : call.inputMode === 'transcript'
                            ? 'Transcript (legacy)'
                            : 'Brain dump'}
                        </span>
                        <span>·</span>
                        <span>{formatDate(call.occurredAt)}</span>
                      </div>
                      {call.rawNotes && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {call.rawNotes}
                        </p>
                      )}
                    </div>
                    {call.status === 'completed' && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Memory ────────────────────────────────────────────────────── */}
        <TabsContent value="memory">
          <div className="space-y-3">
            {memories.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                No memory entries yet. Process a call to generate insights.
              </div>
            ) : (
              memories.map((mem) => (
                <div key={mem.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {mem.type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(mem.occurredAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{mem.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{mem.summary}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* ── Follow-Ups ────────────────────────────────────────────────── */}
        <TabsContent value="followups">
          <div className="space-y-3">
            {followUps.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                No follow-ups yet. Process a call to generate action items.
              </div>
            ) : (
              followUps.map((fu) => (
                <div key={fu.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'mt-1 h-2 w-2 rounded-full shrink-0',
                        fu.status === 'overdue'
                          ? 'bg-red-400'
                          : fu.status === 'completed'
                          ? 'bg-emerald-400'
                          : 'bg-amber-400'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{fu.action}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="capitalize font-medium">{fu.priority} priority</span>
                        {fu.dueDate && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due {formatDate(fu.dueDate)}
                            </span>
                          </>
                        )}
                        <Badge
                          variant={
                            fu.status === 'overdue'
                              ? 'destructive'
                              : fu.status === 'completed'
                              ? 'success'
                              : 'warning'
                          }
                          className="text-2xs capitalize"
                        >
                          {fu.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
