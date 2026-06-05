import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ExternalLink,
  PhoneCall,
  Brain,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  User,
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

export default function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>()
  const navigate = useNavigate()

  const company = MOCK_COMPANIES.find((c) => c.id === companyId) || MOCK_COMPANIES[0]
  const calls = MOCK_CALLS.filter((c) => c.companyId === company.id)
  const memories = MOCK_MEMORY_ENTRIES.filter((m) => m.companyId === company.id)
  const decision = MOCK_DECISIONS.find((d) => d.companyId === company.id)
  const followUps = MOCK_FOLLOW_UPS.filter((f) => f.companyId === company.id)

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

      <FadeIn delay={0.05}>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
              <Badge className={cn('text-xs', STATUS_COLORS[company.status])}>
                {company.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {company.industry && <span>{company.industry}</span>}
              {company.stage && <><span>·</span><span className="capitalize">{company.stage}</span></>}
              {company.totalFunding && <><span>·</span><span>{company.totalFunding} raised</span></>}
              {company.location && <><span>·</span><span>{company.location}</span></>}
              {company.employeeCount && <><span>·</span><span>{company.employeeCount} employees</span></>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {company.website && (
              <Button variant="outline" size="sm" asChild>
                <a href={company.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Website
                </a>
              </Button>
            )}
            <Button variant="conviction" size="sm" onClick={() => navigate('/calls/new')}>
              <PhoneCall className="h-3.5 w-3.5" />
              Log call
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Decision summary if exists */}
      {decision && (
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
                onClick={() => navigate(`/calls/call_04/intelligence`)}
              >
                Full analysis
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-2xs text-muted-foreground mb-1">Recommendation</p>
                <p className="text-sm font-semibold text-emerald-400 capitalize">
                  {decision.recommendation.replace('_', ' ')}
                </p>
              </div>
              <div>
                <p className="text-2xs text-muted-foreground mb-1">Confidence</p>
                <p className="text-sm font-semibold text-conviction-300">{decision.confidence}%</p>
              </div>
              <div>
                <p className="text-2xs text-muted-foreground mb-1">Thesis Fit</p>
                <p className="text-sm font-medium text-foreground line-clamp-1">High</p>
              </div>
            </div>
          </div>
        </FadeIn>
      )}

      <Tabs defaultValue="overview">
        <FadeIn delay={0.12}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calls">Calls ({calls.length})</TabsTrigger>
            <TabsTrigger value="memory">Memory ({memories.length})</TabsTrigger>
            <TabsTrigger value="followups">Follow-Ups ({followUps.length})</TabsTrigger>
          </TabsList>
        </FadeIn>

        <TabsContent value="overview">
          <FadeInStagger staggerDelay={0.06}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Description */}
              <FadeInItem>
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Business Overview</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {company.description || 'No description yet.'}
                  </p>
                </div>
              </FadeInItem>

              {/* Founders */}
              <FadeInItem>
                <div className="rounded-lg border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Founder Team</h3>
                  <div className="space-y-3">
                    {company.founders.map((founder) => (
                      <div key={founder.name} className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-conviction-500/15 text-conviction-300 text-xs font-semibold">
                          {founder.name[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{founder.name}</span>
                            <span className="text-xs text-muted-foreground">{founder.role}</span>
                          </div>
                          {founder.background && (
                            <p className="text-xs text-muted-foreground mt-0.5">{founder.background}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeInItem>

              {/* Strengths */}
              {decision && (
                <FadeInItem>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {decision.strengths.map((s) => (
                        <li key={s} className="flex items-start gap-2 text-sm text-foreground">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeInItem>
              )}

              {/* Concerns */}
              {decision && (
                <FadeInItem>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      Concerns
                    </h3>
                    <ul className="space-y-2">
                      {decision.concerns.map((c) => (
                        <li key={c} className="flex items-start gap-2 text-sm text-foreground">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </FadeInItem>
              )}
            </div>
          </FadeInStagger>
        </TabsContent>

        <TabsContent value="calls">
          <div className="space-y-3">
            {calls.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">
                No calls logged yet.
                <br />
                <Button variant="link" className="mt-2 text-sm" onClick={() => navigate('/calls/new')}>
                  Log first call →
                </Button>
              </div>
            ) : (
              calls.map((call) => (
                <motion.div
                  key={call.id}
                  whileHover={{ y: -1 }}
                  onClick={() => call.decision && navigate(`/calls/${call.id}/intelligence`)}
                  className={cn(
                    'rounded-lg border border-border bg-card p-4 transition-all duration-150',
                    call.decision && 'cursor-pointer hover:shadow-card-hover hover:border-border/80'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-foreground truncate">{call.title}</span>
                        {call.decision && (
                          <Badge variant="success" className="text-2xs">
                            Analysed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="capitalize">{call.inputMode}</span>
                        <span>·</span>
                        <span>{formatDate(call.occurredAt)}</span>
                      </div>
                      {call.rawNotes && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {call.rawNotes}
                        </p>
                      )}
                    </div>
                    {call.decision && (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="memory">
          <div className="space-y-3">
            {memories.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">No memory entries yet.</div>
            ) : (
              memories.map((mem) => (
                <div key={mem.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {mem.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(mem.occurredAt)}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{mem.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{mem.summary}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="followups">
          <div className="space-y-3">
            {followUps.length === 0 ? (
              <div className="text-center py-16 text-sm text-muted-foreground">No follow-ups.</div>
            ) : (
              followUps.map((fu) => (
                <div key={fu.id} className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                        fu.status === 'overdue' ? 'bg-red-400' :
                        fu.status === 'completed' ? 'bg-emerald-400' : 'bg-amber-400'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{fu.action}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
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
                          variant={fu.status === 'overdue' ? 'destructive' : fu.status === 'completed' ? 'success' : 'warning'}
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
