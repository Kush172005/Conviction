import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  Building2,
  PhoneCall,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Plus,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import PageHeader from '@/components/layout/PageHeader'
import FadeIn, { FadeInStagger, FadeInItem } from '@/components/motion/FadeIn'
import { useAuthStore } from '@/store'
import {
  MOCK_DASHBOARD_STATS,
  MOCK_COMPANIES,
  MOCK_FOLLOW_UPS,
} from '@/mocks/data'
import { formatRelativeTime, STATUS_COLORS } from '@/lib/utils'
import { dashboardApi } from '@/services/api/dashboard'
import { companiesApi } from '@/services/api/companies'
import { followUpsApi } from '@/services/api/followUps'
import type { Company, FollowUp, DashboardStats } from '@/types'

const DEMO_KPI_CARDS = [
  {
    label: 'Companies Tracked',
    value: MOCK_DASHBOARD_STATS.companiesTracked,
    icon: Building2,
    delta: '+2 this month',
    deltaPositive: true,
    href: '/companies',
  },
  {
    label: 'Calls Logged',
    value: MOCK_DASHBOARD_STATS.callsLogged,
    icon: PhoneCall,
    delta: '+3 this week',
    deltaPositive: true,
    href: '/calls/new',
  },
  {
    label: 'Open Follow-Ups',
    value: MOCK_DASHBOARD_STATS.openFollowUps,
    icon: AlertCircle,
    delta: '1 overdue',
    deltaPositive: false,
    href: '/companies',
  },
  {
    label: 'Active Decisions',
    value: MOCK_DASHBOARD_STATS.activeDecisions,
    icon: Lightbulb,
    delta: '1 recommended to IC',
    deltaPositive: true,
    href: '/companies',
  },
]

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  call: PhoneCall,
  decision: Lightbulb,
  follow_up: CheckCircle2,
  company: Building2,
}

// ─── Animated KPI card with GSAP counter ─────────────────────────────────────

function AnimatedKPICard({
  label,
  value,
  icon: Icon,
  delta,
  deltaPositive,
  href,
}: {
  label: string
  value: number
  icon: React.ElementType
  delta?: string
  deltaPositive?: boolean
  href: string
}) {
  const navigate = useNavigate()
  const numRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(cardRef, { once: true })

  useGSAP(() => {
    if (!isInView || !numRef.current) return
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(numRef.current, {
        textContent: 0,
        duration: 1.4,
        ease: 'power2.out',
        snap: { textContent: 1 },
        delay: 0.1,
      })
    })
  }, { dependencies: [isInView], scope: cardRef })

  return (
    <motion.div
      ref={cardRef}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      onClick={() => navigate(href)}
      className="group relative rounded-lg border border-border bg-card p-5 cursor-pointer overflow-hidden transition-all duration-200 hover:border-border/80 hover:shadow-card-hover"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-conviction-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div ref={numRef} className="text-3xl font-semibold text-foreground tabular-nums">
          {value}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
        {delta && (
          <div className={`text-2xs mt-2 font-medium ${deltaPositive ? 'text-emerald-400' : 'text-amber-400'}`}>
            {delta}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Empty state for new real users ─────────────────────────────────────────

function NewUserDashboard({ name }: { name: string }) {
  const navigate = useNavigate()
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <FadeIn>
        <PageHeader
          title={`Welcome to Conviction, ${name.split(' ')[0]}.`}
          description="Your AI-powered deal intelligence workspace is ready."
        />
      </FadeIn>

      {/* Zero-state KPIs */}
      <FadeInStagger staggerDelay={0.06} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {DEMO_KPI_CARDS.map((card) => {
          const Icon = card.icon
          return (
            <FadeInItem key={card.label}>
              <div className="rounded-lg border border-border bg-card p-5 opacity-40">
                <div className="flex items-center justify-between mb-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-semibold text-foreground tabular-nums">0</div>
                <div className="text-xs text-muted-foreground mt-1">{card.label}</div>
              </div>
            </FadeInItem>
          )
        })}
      </FadeInStagger>

      {/* Get started steps */}
      <FadeIn delay={0.2}>
        <div className="rounded-xl border border-conviction-500/20 bg-conviction-500/5 p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-conviction-500/15">
              <Sparkles className="h-4.5 w-4.5 text-conviction-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Start tracking your first deal</p>
              <p className="text-xs text-muted-foreground">
                Conviction builds your memory layer as you log conversations.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                step: '1',
                title: 'Add a company',
                desc: "Track any founder or company you're in diligence with.",
                cta: 'Add company',
                href: '/companies',
              },
              {
                step: '2',
                title: 'Log a call',
                desc: 'Paste a transcript, type notes, or describe the conversation.',
                cta: 'Log call',
                href: '/calls/new',
              },
              {
                step: '3',
                title: 'Get AI intelligence',
                desc: 'Conviction extracts decisions, follow-ups, and thesis alignment.',
                cta: 'Log a call',
                href: '/calls/new',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-lg border border-border bg-card p-4 cursor-pointer hover:border-conviction-500/40 transition-colors"
                onClick={() => navigate(item.href)}
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-conviction-500/20 text-conviction-400 text-xs font-semibold mb-3">
                  {item.step}
                </div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                <button className="mt-3 text-xs text-conviction-400 hover:text-conviction-300 flex items-center gap-1">
                  {item.cta} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </FadeIn>

      <FadeIn delay={0.3}>
        <div className="flex items-center gap-3">
          <Button variant="conviction" onClick={() => navigate('/calls/new')}>
            <Plus className="h-3.5 w-3.5" />
            Log your first call
          </Button>
          <Button variant="outline" onClick={() => navigate('/companies')}>
            <Building2 className="h-3.5 w-3.5" />
            Add a company
          </Button>
        </div>
      </FadeIn>
    </div>
  )
}

// ─── Live Dashboard (real user with data) ───────────────────────────────────

function LiveDashboard({
  stats,
  companies,
  followUps,
  greeting,
  userName,
}: {
  stats: DashboardStats
  companies: Company[]
  followUps: FollowUp[]
  greeting: string
  userName: string
}) {
  const navigate = useNavigate()
  const openFollowUps = followUps.filter((f) => f.status !== 'completed')
  const activeCompanies = companies
    .filter((c) => c.status === 'active' || c.status === 'tracking')
    .slice(0, 4)

  const kpiCards = [
    {
      label: 'Companies Tracked',
      value: stats.companiesTracked,
      icon: Building2,
      href: '/companies',
    },
    {
      label: 'Calls Logged',
      value: stats.callsLogged,
      icon: PhoneCall,
      href: '/calls/new',
    },
    {
      label: 'Open Follow-Ups',
      value: stats.openFollowUps,
      icon: AlertCircle,
      href: '/companies',
    },
    {
      label: 'Active Deals',
      value: stats.activeDecisions,
      icon: Lightbulb,
      href: '/companies',
    },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <FadeIn>
        <PageHeader
          title={`${greeting}, ${userName.split(' ')[0]}.`}
          description="Your deal flow at a glance."
          actions={
            <Button variant="conviction" size="sm" onClick={() => navigate('/calls/new')}>
              <PhoneCall className="h-3.5 w-3.5" />
              Log a call
            </Button>
          }
        />
      </FadeIn>

      {/* KPI Cards */}
      <FadeInStagger staggerDelay={0.07} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => (
          <FadeInItem key={card.label}>
            <AnimatedKPICard
              label={card.label}
              value={card.value}
              icon={card.icon}
              href={card.href}
            />
          </FadeInItem>
        ))}
      </FadeInStagger>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Pipeline */}
        <div className="lg:col-span-2">
          <FadeIn delay={0.2}>
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Active Pipeline</h2>
                <Button
                  variant="ghost-muted"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => navigate('/companies')}
                >
                  All companies
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              {activeCompanies.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No active companies yet.</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-1 text-xs"
                    onClick={() => navigate('/companies')}
                  >
                    Add a company →
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activeCompanies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/companies/${company.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {company.industry || 'No industry set'}
                          {company.lastInteractionAt && ` · ${formatRelativeTime(company.lastInteractionAt)}`}
                        </p>
                      </div>
                      <Badge className={`text-2xs ${STATUS_COLORS[company.status]}`}>
                        {company.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FadeIn>
        </div>

        {/* Open Follow-Ups */}
        <FadeIn delay={0.25}>
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Open Follow-Ups</h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-2xs font-semibold text-amber-400">
                {openFollowUps.length}
              </span>
            </div>
            {openFollowUps.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-400/60 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {openFollowUps.slice(0, 5).map((fu) => (
                  <div key={fu.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-2">
                      <div
                        className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${
                          fu.status === 'overdue' ? 'bg-red-400' : 'bg-amber-400'
                        }`}
                      />
                      <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                        {fu.action}
                      </p>
                    </div>
                    {fu.dueDate && (
                      <div className="mt-1.5 flex items-center gap-1 pl-3.5">
                        {fu.status === 'overdue' && (
                          <Badge variant="destructive" className="text-2xs">Overdue</Badge>
                        )}
                        <span className="text-2xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(fu.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeIn>
      </div>

      {/* Log Call CTA */}
      <FadeIn delay={0.3}>
        <div className="mt-6 rounded-lg border border-conviction-500/20 bg-conviction-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-conviction-500/15 flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-conviction-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Capture your next conversation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Log a voice note, brain dump, or transcript from your next founder call.
              </p>
            </div>
          </div>
          <Button variant="conviction" size="sm" className="w-full sm:w-auto" onClick={() => navigate('/calls/new')}>
            Log call
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </FadeIn>
    </div>
  )
}

// ─── Main dashboard ──────────────────────────────────────────────────────────

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const isDemo = useAuthStore((s) => s.isDemo)
  const navigate = useNavigate()

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [loadingLive, setLoadingLive] = useState(false)

  const hours = new Date().getHours()
  const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (isDemo) return  // demo uses mock data

    setLoadingLive(true)
    Promise.allSettled([
      dashboardApi.stats(),
      companiesApi.list(),
      followUpsApi.list(),
    ]).then(([statsResult, companiesResult, followUpsResult]) => {
      if (statsResult.status === 'fulfilled') setStats(statsResult.value)
      if (companiesResult.status === 'fulfilled') setCompanies(companiesResult.value)
      if (followUpsResult.status === 'fulfilled') setFollowUps(followUpsResult.value)
    }).finally(() => setLoadingLive(false))
  }, [isDemo])

  // Demo user — show full mock workspace
  if (isDemo) return (
    <div className="p-6 max-w-6xl mx-auto">
      <FadeIn>
        <PageHeader
          title={`${greeting}, ${user?.name?.split(' ')[0] || 'there'}.`}
          description="Your deal flow at a glance."
          actions={
            <Button variant="conviction" size="sm" onClick={() => navigate('/calls/new')}>
              <PhoneCall className="h-3.5 w-3.5" />
              Log a call
            </Button>
          }
        />
      </FadeIn>

      {/* KPI Cards */}
      <FadeInStagger staggerDelay={0.07} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {DEMO_KPI_CARDS.map((card) => (
          <FadeInItem key={card.label}>
            <AnimatedKPICard
              label={card.label}
              value={card.value}
              icon={card.icon}
              delta={card.delta}
              deltaPositive={card.deltaPositive}
              href={card.href}
            />
          </FadeInItem>
        ))}
      </FadeInStagger>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <FadeIn delay={0.2}>
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>
                <Button variant="ghost-muted" size="sm" className="text-xs h-7">
                  View all
                </Button>
              </div>
              <div className="divide-y divide-border">
                {MOCK_DASHBOARD_STATS.recentActivity.map((activity) => {
                  const Icon = ACTIVITY_ICONS[activity.type] ?? PhoneCall
                  return (
                    <div key={activity.id} className="flex items-start gap-3 px-5 py-4 hover:bg-secondary/30 transition-colors cursor-pointer">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-secondary mt-0.5">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{activity.description}</p>
                        {activity.companyName && (
                          <span className="inline-flex items-center mt-1 text-2xs text-conviction-300 font-medium">
                            {activity.companyName}
                          </span>
                        )}
                      </div>
                      <div className="text-2xs text-muted-foreground flex-shrink-0">
                        {formatRelativeTime(activity.timestamp)}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Companies */}
          <FadeIn delay={0.25}>
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Active Pipeline</h2>
                <Button
                  variant="ghost-muted"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => navigate('/companies')}
                >
                  All
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="divide-y divide-border">
                {MOCK_COMPANIES.filter((c) => c.status === 'active' || c.status === 'tracking')
                  .slice(0, 4)
                  .map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/companies/${company.id}`)}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{company.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{company.industry}</p>
                      </div>
                      <Badge className={`text-2xs ${STATUS_COLORS[company.status]}`}>
                        {company.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>
          </FadeIn>

          {/* Open Follow-Ups */}
          <FadeIn delay={0.3}>
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Open Follow-Ups</h2>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/15 text-2xs font-semibold text-amber-400">
                  {MOCK_FOLLOW_UPS.filter((f) => f.status !== 'completed').length}
                </span>
              </div>
              <div className="divide-y divide-border">
                {MOCK_FOLLOW_UPS.filter((f) => f.status !== 'completed').map((fu) => (
                  <div key={fu.id} className="px-5 py-3.5">
                    <div className="flex items-start gap-2">
                      <div
                        className={`mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                          fu.status === 'overdue' ? 'bg-red-400' : 'bg-amber-400'
                        }`}
                      />
                      <p className="text-xs text-foreground leading-relaxed line-clamp-2">{fu.action}</p>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 pl-3.5">
                      {fu.status === 'overdue' && (
                        <Badge variant="destructive" className="text-2xs">Overdue</Badge>
                      )}
                      {fu.dueDate && (
                        <span className="text-2xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(fu.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </div>

      <FadeIn delay={0.35}>
        <div className="mt-6 rounded-lg border border-conviction-500/20 bg-conviction-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-conviction-500/15 flex-shrink-0">
              <TrendingUp className="h-4 w-4 text-conviction-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Capture your next conversation</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Log a voice note, brain dump, or transcript from your next founder call.
              </p>
            </div>
          </div>
          <Button variant="conviction" size="sm" className="w-full sm:w-auto" onClick={() => navigate('/calls/new')}>
            Log call
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </FadeIn>
    </div>
  )

  // Real user — show live dashboard or loading or empty state
  if (loadingLive) {
    return (
      <div className="p-6 max-w-6xl mx-auto flex items-center gap-2 py-20 justify-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading your workspace…
      </div>
    )
  }

  // Has at least 1 company → show live dashboard
  if (stats && companies.length > 0) {
    return (
      <LiveDashboard
        stats={stats}
        companies={companies}
        followUps={followUps}
        greeting={greeting}
        userName={user?.name || 'there'}
      />
    )
  }

  // No data yet → guided empty state
  return <NewUserDashboard name={user?.name || 'there'} />
}
