import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Zap, Globe, Linkedin, ChevronRight, X, RefreshCw, Trash2,
  Copy, Download, ExternalLink, AlertTriangle, Shield, TrendingUp,
  Users, Target, Building2, DollarSign, Newspaper, HelpCircle,
  CheckCircle2, XCircle, Clock, BarChart3, FileText, BookOpen,
  Star, ArrowLeft, RotateCcw, Database, CheckCheck,
} from 'lucide-react'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
         BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { startupIntelligenceApi } from '@/services/api/startupIntelligence'
import type {
  SIReportDetail, SIReportListItem, SIRecommendation,
  MoatStrength, RedFlagSeverity, SIProgressStage,
} from '@/types'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RECOMMENDATION_META: Record<SIRecommendation, { label: string; color: string; bg: string; border: string }> = {
  strong_invest: { label: 'Strong Invest', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  investigate:   { label: 'Investigate',   color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30'    },
  monitor:       { label: 'Monitor',       color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   },
  pass:          { label: 'Pass',          color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30'     },
}

const SEVERITY_META: Record<RedFlagSeverity, { color: string; bg: string; label: string }> = {
  low:      { color: 'text-blue-400',   bg: 'bg-blue-500/10',    label: 'Low'      },
  medium:   { color: 'text-amber-400',  bg: 'bg-amber-500/10',   label: 'Medium'   },
  high:     { color: 'text-orange-400', bg: 'bg-orange-500/10',  label: 'High'     },
  critical: { color: 'text-red-400',    bg: 'bg-red-500/10',     label: 'Critical' },
}

const MOAT_STRENGTH_COLOR: Record<MoatStrength, string> = {
  none:     '#3f3f46',
  weak:     '#ca8a04',
  moderate: '#2563eb',
  strong:   '#10b981',
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-400'
  if (score >= 50) return 'text-blue-400'
  if (score >= 30) return 'text-amber-400'
  return 'text-red-400'
}

function scoreBg(score: number) {
  if (score >= 70) return 'bg-emerald-500'
  if (score >= 50) return 'bg-blue-500'
  if (score >= 30) return 'bg-amber-500'
  return 'bg-red-500'
}

function pct(v: number) { return `${Math.round(v * 100)}%` }

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Badge({ label, color, bg, border }: { label: string; color: string; bg: string; border: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border', color, bg, border)}>
      {label}
    </span>
  )
}

function ProgressBar({ value, color = 'bg-blue-500' }: { value: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div
        className={cn('h-full rounded-full', color)}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  )
}

function AlignmentBar({ label, score, reasons }: { label: string; score: number; reasons: string[] }) {
  const pctVal = Math.round(score * 100)
  const color = pctVal >= 75 ? 'bg-emerald-500' : pctVal >= 50 ? 'bg-blue-500' : pctVal >= 25 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn('font-semibold', scoreColor(pctVal))}>{pctVal}%</span>
      </div>
      <ProgressBar value={pctVal} color={color} />
      {reasons[0] && <p className="text-xs text-muted-foreground/70 line-clamp-1">{reasons[0]}</p>}
    </div>
  )
}

function StageTimeline({ stages }: { stages: SIProgressStage[] }) {
  return (
    <div className="space-y-2">
      {stages.map((stage, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={cn('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0', {
            'bg-emerald-500/20 text-emerald-400': stage.status === 'completed',
            'bg-blue-500/20 text-blue-400 animate-pulse': stage.status === 'running',
            'bg-red-500/20 text-red-400': stage.status === 'failed',
            'bg-zinc-800 text-zinc-600': stage.status === 'pending',
            'bg-zinc-800 text-zinc-500': stage.status === 'skipped',
          })}>
            {stage.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
            {stage.status === 'running' && <Clock className="w-3 h-3" />}
            {stage.status === 'failed' && <XCircle className="w-3 h-3" />}
            {stage.status === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />}
            {stage.status === 'skipped' && <CheckCheck className="w-3 h-3" />}
          </div>
          <span className={cn('text-sm', {
            'text-foreground': stage.status === 'completed' || stage.status === 'running',
            'text-muted-foreground': stage.status === 'pending',
            'text-zinc-500 line-through': stage.status === 'skipped',
            'text-red-400': stage.status === 'failed',
          })}>
            {stage.name}
          </span>
          {stage.status === 'skipped' && (
            <span className="text-xs text-zinc-600">(cache hit)</span>
          )}
        </div>
      ))}
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, className }: {
  title: string; icon: React.ElementType; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 space-y-4', className)}>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-semibold text-sm text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}

// ─── Thesis Fit Score Gauge ───────────────────────────────────────────────────

function ThesisFitGauge({ score }: { score: number }) {
  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#27272a" strokeWidth="10" />
          <motion.circle
            cx="60" cy="60" r="50"
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            stroke={score >= 70 ? '#10b981' : score >= 50 ? '#3b82f6' : score >= 30 ? '#f59e0b' : '#ef4444'}
            strokeDasharray={`${2 * Math.PI * 50}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - score / 100) }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-3xl font-bold', scoreColor(score))}>{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center">Thesis Fit Score</p>
    </div>
  )
}

// ─── Moat Radar ───────────────────────────────────────────────────────────────

function MoatRadar({ moat }: { moat: SIReportDetail['moatAnalysis'] }) {
  if (!moat) return null
  const strengthToVal = (s: MoatStrength) =>
    ({ none: 0, weak: 30, moderate: 65, strong: 100 }[s] ?? 0)

  const data = [
    { label: 'Network\nEffects', value: strengthToVal(moat.networkEffects.strength as MoatStrength) },
    { label: 'Data\nMoat', value: strengthToVal(moat.dataMoat.strength as MoatStrength) },
    { label: 'Distribution', value: strengthToVal(moat.distribution.strength as MoatStrength) },
    { label: 'Switching\nCosts', value: strengthToVal(moat.switchingCosts.strength as MoatStrength) },
    { label: 'Brand', value: strengthToVal(moat.brand.strength as MoatStrength) },
    { label: 'Technical\nDepth', value: strengthToVal(moat.technicalDepth.strength as MoatStrength) },
    { label: 'Regulatory', value: strengthToVal(moat.regulatory.strength as MoatStrength) },
    { label: 'Partnerships', value: strengthToVal(moat.partnerships.strength as MoatStrength) },
  ]

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="#27272a" />
          <PolarAngleAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} />
          <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={1.5} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Alignment Breakdown Chart ────────────────────────────────────────────────

function AlignmentChart({ thesisMatch }: { thesisMatch: SIReportDetail['thesisMatch'] }) {
  if (!thesisMatch) return null
  const data = [
    { name: 'Sector', value: Math.round((thesisMatch.sectorAlignment?.score ?? 0) * 100) },
    { name: 'Stage', value: Math.round((thesisMatch.stageAlignment?.score ?? 0) * 100) },
    { name: 'Geography', value: Math.round((thesisMatch.geographyAlignment?.score ?? 0) * 100) },
    { name: 'Biz Model', value: Math.round((thesisMatch.businessModelAlignment?.score ?? 0) * 100) },
  ]
  const barColor = (v: number) => v >= 75 ? '#10b981' : v >= 50 ? '#3b82f6' : v >= 25 ? '#f59e0b' : '#ef4444'
  return (
    <div className="h-44">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barSize={28}>
          <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} hide />
          <Tooltip
            contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
            labelStyle={{ color: '#a1a1aa' }}
            itemStyle={{ color: '#e4e4e7' }}
            formatter={(v: number) => [`${v}%`, 'Score']}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => <Cell key={i} fill={barColor(entry.value)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ─── Report tabs ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'thesis', label: 'Thesis Fit', icon: Target },
  { id: 'memo', label: 'IC Memo', icon: FileText },
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'moat', label: 'Moat', icon: Shield },
  { id: 'red-flags', label: 'Red Flags', icon: AlertTriangle },
  { id: 'diligence', label: 'Diligence Qs', icon: HelpCircle },
  { id: 'sources', label: 'Sources', icon: BookOpen },
] as const

type TabId = typeof TABS[number]['id']

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StartupIntelligencePage() {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<SIReportDetail | null>(null)
  const [history, setHistory] = useState<SIReportListItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [isPolling, setIsPolling] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeTab = useRef<TabId>('thesis')
  const [tab, setTab] = useState<TabId>('thesis')
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list')

  // Form state
  const [companyName, setCompanyName] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [userContext, setUserContext] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  // Load history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    setIsLoadingHistory(true)
    try {
      const items = await startupIntelligenceApi.listReports()
      setHistory(items)
      // Auto-select most recent in-progress or completed report
      if (items.length > 0 && !selectedReportId) {
        const inProgress = items.find(r => r.status !== 'completed' && r.status !== 'failed')
        const first = inProgress ?? items[0]
        openReport(first.id)
      }
    } catch {
      // silently fail
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const pollReport = useCallback(async (id: string) => {
    try {
      const report = await startupIntelligenceApi.getReport(id)
      setSelectedReport(report)
      setHistory(prev => prev.map(r => r.id === id ? {
        ...r,
        status: report.status,
        progressPercent: report.progressPercent,
        currentStage: report.currentStage,
        thesisFitScore: report.thesisMatch?.thesisFitScore,
        recommendation: report.icMemo?.recommendation,
        completedAt: report.completedAt,
      } : r))

      if (report.status === 'completed' || report.status === 'failed') {
        stopPolling()
      }
    } catch {
      // keep polling
    }
  }, [])

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
    setIsPolling(false)
  }

  function startPolling(id: string) {
    stopPolling()
    setIsPolling(true)
    pollReport(id)
    pollRef.current = setInterval(() => pollReport(id), 1500)
  }

  async function openReport(id: string) {
    setSelectedReportId(id)
    setTab('thesis')
    setMobileView('detail')
    try {
      const report = await startupIntelligenceApi.getReport(id)
      setSelectedReport(report)
      if (report.status !== 'completed' && report.status !== 'failed') {
        startPolling(id)
      }
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    return () => stopPolling()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    if (!companyName.trim() || !websiteUrl.trim()) {
      setFormError('Company name and website URL are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const { report_id } = await startupIntelligenceApi.startReport({
        company_name: companyName.trim(),
        website_url: websiteUrl.trim(),
        linkedin_url: linkedinUrl.trim() || undefined,
        user_context: userContext.trim() || undefined,
      })

      // Add placeholder to history
      const placeholder: SIReportListItem = {
        id: report_id,
        companyName: companyName.trim(),
        websiteUrl: websiteUrl.trim(),
        status: 'queued',
        progressPercent: 0,
        currentStage: 'Queued',
        overallConfidence: 0,
        cacheUsed: false,
        createdAt: new Date().toISOString(),
      }
      setHistory(prev => [placeholder, ...prev])
      setSelectedReportId(report_id)
      setSelectedReport(null)

      // Reset form
      setCompanyName('')
      setWebsiteUrl('')
      setLinkedinUrl('')
      setUserContext('')

      // Start polling
      openReport(report_id)
    } catch (err: any) {
      setFormError(err?.message || 'Failed to start report. Is the backend running?')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await startupIntelligenceApi.deleteReport(id)
      setHistory(prev => prev.filter(r => r.id !== id))
      if (selectedReportId === id) {
        setSelectedReportId(null)
        setSelectedReport(null)
        stopPolling()
      }
    } catch {}
  }

  async function handleRetry(id: string) {
    try {
      await startupIntelligenceApi.retryReport(id)
      openReport(id)
    } catch {}
  }

  async function handleRefresh(id: string) {
    try {
      await startupIntelligenceApi.refreshReport(id)
      openReport(id)
    } catch {}
  }

  function downloadJson() {
    if (!selectedReport) return
    const blob = new Blob([JSON.stringify(selectedReport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedReport.companyName.replace(/\s+/g, '-').toLowerCase()}-report.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden">
      {/* ── Left panel: form + history ── */}
      <div className={cn(
        'md:w-80 w-full flex-shrink-0 border-b md:border-b-0 md:border-r border-border flex flex-col md:h-full',
        mobileView === 'detail' ? 'hidden md:flex' : 'flex',
      )}>
        {/* Form */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-sm">Startup Intelligence</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Company Name *</label>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Website URL *</label>
              <div className="relative">
                <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="acmecorp.com"
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">LinkedIn (optional)</label>
              <div className="relative">
                <Linkedin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={linkedinUrl}
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="linkedin.com/company/acme"
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Context (optional)</label>
              <textarea
                value={userContext}
                onChange={e => setUserContext(e.target.value)}
                placeholder="Why you're evaluating this company…"
                rows={2}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {formError && <p className="text-xs text-red-400">{formError}</p>}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Analyzing…</>
              ) : (
                <><Search className="w-3.5 h-3.5" /> Generate Report</>
              )}
            </button>
          </form>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <p className="text-xs text-muted-foreground px-1 mb-2">Report History</p>
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!isLoadingHistory && history.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No reports yet. Generate your first one.
            </div>
          )}
          {history.map(item => {
            const recMeta = item.recommendation ? RECOMMENDATION_META[item.recommendation] : null
            const isActive = item.id === selectedReportId
            return (
              <div
                key={item.id}
                onClick={() => openReport(item.id)}
                className={cn(
                  'group rounded-lg p-3 cursor-pointer transition-colors border',
                  isActive
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-transparent hover:border-border hover:bg-card',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.companyName}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.websiteUrl}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(item.id) }}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all p-0.5"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {item.status === 'completed' && item.thesisFitScore !== undefined && (
                    <span className={cn('text-xs font-bold', scoreColor(item.thesisFitScore))}>
                      {item.thesisFitScore}/100
                    </span>
                  )}
                  {recMeta && item.status === 'completed' && (
                    <span className={cn('text-xs font-medium', recMeta.color)}>{recMeta.label}</span>
                  )}
                  {item.status !== 'completed' && item.status !== 'failed' && (
                    <div className="flex items-center gap-1.5 flex-1">
                      <div className="flex-1">
                        <ProgressBar value={item.progressPercent} />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{item.progressPercent}%</span>
                    </div>
                  )}
                  {item.status === 'failed' && (
                    <span className="text-xs text-red-400">Failed</span>
                  )}
                  {item.cacheUsed && (
                    <Database className="w-3 h-3 text-zinc-500" aria-label="Cache used" />
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">{relativeTime(item.createdAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className={cn(
        'flex-1 overflow-y-auto',
        mobileView === 'list' ? 'hidden md:block' : 'block',
      )}>
        {!selectedReportId && (
          <EmptyState onNewReport={() => setMobileView('list')} />
        )}
        {selectedReportId && !selectedReport && (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
            <button
              onClick={() => setMobileView('list')}
              className="md:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Back to list
            </button>
          </div>
        )}
        {selectedReport && (
          <ReportView
            report={selectedReport}
            tab={tab}
            setTab={setTab}
            isPolling={isPolling}
            onRetry={() => handleRetry(selectedReport.id)}
            onRefresh={() => handleRefresh(selectedReport.id)}
            onDownload={downloadJson}
            onBack={() => setMobileView('list')}
          />
        )}
      </div>
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onNewReport }: { onNewReport: () => void }) {
  const examples = ['stripe.com', 'notion.so', 'linear.app', 'vercel.com']
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
        <Zap className="w-8 h-8 text-blue-400" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Startup Intelligence</h2>
      <p className="text-muted-foreground text-sm max-w-sm mb-6">
        Generate a VC-grade investment report for any startup. We'll analyze the company against your fund thesis and surface key signals.
      </p>
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {examples.map(ex => (
          <span key={ex} className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground">
            {ex}
          </span>
        ))}
      </div>
      <button
        onClick={onNewReport}
        className="md:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        <Search className="w-4 h-4" /> New Report
      </button>
    </div>
  )
}

// ─── Report view ──────────────────────────────────────────────────────────────

function ReportView({
  report, tab, setTab, isPolling, onRetry, onRefresh, onDownload, onBack,
}: {
  report: SIReportDetail
  tab: TabId
  setTab: (t: TabId) => void
  isPolling: boolean
  onRetry: () => void
  onRefresh: () => void
  onDownload: () => void
  onBack?: () => void
}) {
  const recMeta = report.icMemo ? RECOMMENDATION_META[report.icMemo.recommendation] : null
  const isComplete = report.status === 'completed'
  const isFailed = report.status === 'failed'
  const isRunning = !isComplete && !isFailed

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Mobile back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="md:hidden flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mb-1"
        >
          <ArrowLeft className="w-4 h-4" /> All Reports
        </button>
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold truncate">{report.companyName}</h1>
            {report.cacheUsed && (
              <span className="flex items-center gap-1 text-xs text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700">
                <Database className="w-3 h-3" /> cache
              </span>
            )}
          </div>
          <a
            href={report.websiteUrl.startsWith('http') ? report.websiteUrl : `https://${report.websiteUrl}`}
            target="_blank" rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 w-fit"
          >
            {report.websiteUrl} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
          {isFailed && (
            <button onClick={onRetry} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-card transition-colors">
              <RotateCcw className="w-3.5 h-3.5" /> Retry
            </button>
          )}
          {isComplete && (
            <>
              <button onClick={onRefresh} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-card transition-colors text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
              <button onClick={onDownload} className="hidden sm:flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-card transition-colors text-muted-foreground">
                <Download className="w-3.5 h-3.5" /> JSON
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress (while running) */}
      {isRunning && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
              <span className="font-medium text-sm">{report.currentStage}</span>
            </div>
            <span className="text-sm text-muted-foreground">{report.progressPercent}%</span>
          </div>
          <ProgressBar value={report.progressPercent} color="bg-blue-500" />
          <div className="mt-4">
            <StageTimeline stages={report.stages} />
          </div>
        </div>
      )}

      {/* Failed */}
      {isFailed && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-5 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-400 text-sm">Research failed</p>
            <p className="text-xs text-muted-foreground mt-1">{report.errorMessage || 'An unexpected error occurred. Click Retry to try again.'}</p>
          </div>
        </div>
      )}

      {/* Summary row (when complete) */}
      {isComplete && report.thesisMatch && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center">
            <ThesisFitGauge score={report.thesisMatch.thesisFitScore} />
          </div>
          {recMeta && report.icMemo && (
            <div className={cn('rounded-xl border p-4 flex flex-col items-center justify-center', recMeta.border, recMeta.bg)}>
              <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
              <p className={cn('text-lg font-bold', recMeta.color)}>{recMeta.label}</p>
            </div>
          )}
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-1">Evidence Confidence</p>
            <p className={cn('text-2xl font-bold', scoreColor(Math.round((report.overallConfidence ?? 0) * 100)))}>
              {pct(report.overallConfidence ?? 0)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center">
            <p className="text-xs text-muted-foreground mb-1">Sources</p>
            <p className="text-2xl font-bold text-foreground">{report.sources.length}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      {isComplete && (
        <>
          <div className="flex gap-0.5 overflow-x-auto border-b border-border pb-0 scrollbar-hide">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap transition-colors border-b-2 -mb-px',
                  tab === t.id
                    ? 'text-foreground border-blue-500'
                    : 'text-muted-foreground border-transparent hover:text-foreground',
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
                {t.id === 'red-flags' && report.redFlags.length > 0 && (
                  <span className="text-xs bg-red-500/20 text-red-400 rounded-full px-1.5">{report.redFlags.length}</span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {tab === 'thesis' && <ThesisTab report={report} />}
              {tab === 'memo' && <MemoTab report={report} />}
              {tab === 'overview' && <OverviewTab report={report} />}
              {tab === 'moat' && <MoatTab report={report} />}
              {tab === 'red-flags' && <RedFlagsTab report={report} />}
              {tab === 'diligence' && <DiligenceTab report={report} />}
              {tab === 'sources' && <SourcesTab report={report} />}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      {/* Partial stages when still running */}
      {isRunning && report.stages.length > 0 && (
        <div className="text-xs text-muted-foreground text-center pt-2">
          Polling every 1.5s…
        </div>
      )}
    </div>
  )
}

// ─── Tab: Thesis Fit ──────────────────────────────────────────────────────────

function ThesisTab({ report }: { report: SIReportDetail }) {
  const { thesisMatch } = report
  if (!thesisMatch) return <div className="text-muted-foreground text-sm">Thesis match data unavailable.</div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Thesis Fit Score" icon={Target}>
          <ThesisFitGauge score={thesisMatch.thesisFitScore} />
        </SectionCard>
        <SectionCard title="Alignment Breakdown" icon={BarChart3}>
          <AlignmentChart thesisMatch={thesisMatch} />
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Alignment Details" icon={Target}>
          <div className="space-y-3">
            {thesisMatch.sectorAlignment && (
              <AlignmentBar label="Sector" score={thesisMatch.sectorAlignment.score} reasons={thesisMatch.sectorAlignment.reasons} />
            )}
            {thesisMatch.stageAlignment && (
              <AlignmentBar label="Stage" score={thesisMatch.stageAlignment.score} reasons={thesisMatch.stageAlignment.reasons} />
            )}
            {thesisMatch.geographyAlignment && (
              <AlignmentBar label="Geography" score={thesisMatch.geographyAlignment.score} reasons={thesisMatch.geographyAlignment.reasons} />
            )}
            {thesisMatch.businessModelAlignment && (
              <AlignmentBar label="Business Model" score={thesisMatch.businessModelAlignment.score} reasons={thesisMatch.businessModelAlignment.reasons} />
            )}
          </div>
        </SectionCard>

        <div className="space-y-4">
          {thesisMatch.keyFitReasons.length > 0 && (
            <SectionCard title="Key Fit Signals" icon={CheckCircle2}>
              <ul className="space-y-1.5">
                {thesisMatch.keyFitReasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{r}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
          {thesisMatch.keyMisfitReasons.length > 0 && (
            <SectionCard title="Key Misfit Signals" icon={XCircle}>
              <ul className="space-y-1.5">
                {thesisMatch.keyMisfitReasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{r}</span>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: IC Memo ─────────────────────────────────────────────────────────────

function MemoTab({ report }: { report: SIReportDetail }) {
  const { icMemo } = report
  if (!icMemo) return <div className="text-muted-foreground text-sm">IC memo unavailable.</div>
  const meta = RECOMMENDATION_META[icMemo.recommendation]

  return (
    <div className="space-y-4">
      <div className={cn('rounded-xl border p-5 flex items-start justify-between gap-4', meta.border, meta.bg)}>
        <div>
          <p className="text-xs text-muted-foreground mb-1">IC Recommendation</p>
          <p className={cn('text-2xl font-bold', meta.color)}>{meta.label}</p>
          <p className="text-sm text-muted-foreground mt-2">{icMemo.recommendationRationale}</p>
        </div>
        <Badge {...meta} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Key Strengths" icon={TrendingUp}>
          <ul className="space-y-2">
            {icMemo.keyStrengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Star className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Key Risks" icon={AlertTriangle}>
          <ul className="space-y-2">
            {icMemo.keyRisks.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-400 mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Thesis Fit Summary" icon={Target}>
        <p className="text-sm text-muted-foreground leading-relaxed">{icMemo.thesisFitSummary}</p>
      </SectionCard>

      <SectionCard title="Suggested Next Step" icon={ChevronRight}>
        <p className="text-sm text-muted-foreground">{icMemo.suggestedNextStep}</p>
        <p className="text-sm text-muted-foreground mt-2">{icMemo.diligencePlan}</p>
      </SectionCard>

      <SectionCard title="Full IC Memo" icon={FileText}>
        <div className="flex justify-end mb-2">
          <button
            onClick={() => copyText(icMemo.fullMemoText)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Copy className="w-3 h-3" /> Copy
          </button>
        </div>
        <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed border border-border rounded-lg p-4 bg-background">
          {icMemo.fullMemoText}
        </pre>
      </SectionCard>
    </div>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ report }: { report: SIReportDetail }) {
  const { report: r } = report
  if (!r) return <div className="text-muted-foreground text-sm">Report data unavailable.</div>

  const sections = [
    { title: 'Executive Summary', icon: FileText, content: r.executiveSummary },
    { title: 'Company Overview', icon: Building2, content: r.companyOverview },
    { title: 'Founder Assessment', icon: Users, content: r.founderAssessment },
    { title: 'Market Analysis', icon: TrendingUp, content: r.marketAnalysis },
    { title: 'Competitor Landscape', icon: Target, content: r.competitorLandscape },
    { title: 'Business Model', icon: DollarSign, content: r.businessModel },
    { title: 'Funding & Investors', icon: DollarSign, content: r.fundingAndInvestors },
    { title: 'Growth & Hiring', icon: TrendingUp, content: r.growthAndHiring },
    { title: 'News & Sentiment', icon: Newspaper, content: r.newsAndSentiment },
    { title: 'Investment Opportunities', icon: Star, content: r.opportunities },
  ]

  return (
    <div className="space-y-4">
      {sections.filter(s => s.content?.trim()).map(section => (
        <SectionCard key={section.title} title={section.title} icon={section.icon}>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{section.content}</p>
        </SectionCard>
      ))}
    </div>
  )
}

// ─── Tab: Moat ────────────────────────────────────────────────────────────────

function MoatTab({ report }: { report: SIReportDetail }) {
  const { moatAnalysis } = report
  if (!moatAnalysis) return <div className="text-muted-foreground text-sm">Moat analysis unavailable.</div>

  const dimensions = [
    { key: 'networkEffects', label: 'Network Effects', data: moatAnalysis.networkEffects },
    { key: 'dataMoat', label: 'Data Moat', data: moatAnalysis.dataMoat },
    { key: 'distribution', label: 'Distribution', data: moatAnalysis.distribution },
    { key: 'switchingCosts', label: 'Switching Costs', data: moatAnalysis.switchingCosts },
    { key: 'brand', label: 'Brand / Community', data: moatAnalysis.brand },
    { key: 'technicalDepth', label: 'Technical Depth', data: moatAnalysis.technicalDepth },
    { key: 'regulatory', label: 'Regulatory', data: moatAnalysis.regulatory },
    { key: 'partnerships', label: 'Partnerships', data: moatAnalysis.partnerships },
  ] as const

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Moat Radar" icon={Shield}>
          <MoatRadar moat={moatAnalysis} />
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className={cn('text-3xl font-bold', scoreColor(moatAnalysis.overallMoatScore))}>{moatAnalysis.overallMoatScore}</span>
            <span className="text-muted-foreground text-sm">/ 100 overall moat</span>
          </div>
        </SectionCard>
        <SectionCard title="Moat Summary" icon={Shield}>
          <p className="text-sm text-muted-foreground leading-relaxed">{moatAnalysis.moatSummary}</p>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {dimensions.map(dim => (
          <div key={dim.key} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{dim.label}</span>
              <span className={cn('text-xs font-semibold capitalize px-2 py-0.5 rounded-full', {
                'bg-zinc-800 text-zinc-400': dim.data.strength === 'none',
                'bg-amber-500/10 text-amber-400': dim.data.strength === 'weak',
                'bg-blue-500/10 text-blue-400': dim.data.strength === 'moderate',
                'bg-emerald-500/10 text-emerald-400': dim.data.strength === 'strong',
              })}>
                {dim.data.strength}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{dim.data.evidence}</p>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${dim.data.confidence * 100}%`,
                    backgroundColor: MOAT_STRENGTH_COLOR[dim.data.strength as MoatStrength],
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{pct(dim.data.confidence)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Red Flags ───────────────────────────────────────────────────────────

function RedFlagsTab({ report }: { report: SIReportDetail }) {
  const { redFlags } = report
  if (!redFlags.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-3" />
        <p className="text-sm text-muted-foreground">No red flags detected from available public data.</p>
      </div>
    )
  }

  const sorted = [...redFlags].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return order[a.severity] - order[b.severity]
  })

  return (
    <div className="space-y-3">
      {sorted.map((flag, i) => {
        const meta = SEVERITY_META[flag.severity as RedFlagSeverity]
        return (
          <div key={i} className={cn('rounded-xl border p-4', meta.bg, 'border-border')}>
            <div className="flex items-start gap-3">
              <AlertTriangle className={cn('w-4 h-4 flex-shrink-0 mt-0.5', meta.color)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-xs font-semibold uppercase tracking-wider', meta.color)}>{meta.label}</span>
                  <span className="text-xs text-muted-foreground capitalize">{flag.category.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-sm font-medium mb-1">{flag.explanation}</p>
                <p className="text-xs text-muted-foreground">{flag.supportingEvidence}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${flag.confidence * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground">{pct(flag.confidence)}</span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Tab: Diligence Questions ─────────────────────────────────────────────────

function DiligenceTab({ report }: { report: SIReportDetail }) {
  const { diligenceQuestions } = report
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  const sorted = [...diligenceQuestions].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  const categories = Array.from(new Set(sorted.map(q => q.category)))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{diligenceQuestions.length} questions across {categories.length} categories</p>
        <button
          onClick={() => copyText(sorted.map((q, i) => `${i + 1}. [${q.priority.toUpperCase()}] ${q.question}`).join('\n'))}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Copy className="w-3 h-3" /> Copy all
        </button>
      </div>
      <div className="space-y-2">
        {sorted.map((q, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5', {
                'bg-red-500/10 text-red-400': q.priority === 'high',
                'bg-amber-500/10 text-amber-400': q.priority === 'medium',
                'bg-zinc-800 text-zinc-400': q.priority === 'low',
              })}>
                {q.priority.toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{q.question}</p>
                <p className="text-xs text-muted-foreground mt-1">{q.whyImportant}</p>
                <span className="text-xs text-muted-foreground/60 capitalize mt-1 inline-block">
                  {q.category.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Tab: Sources ─────────────────────────────────────────────────────────────

function providerStatusColor(status: string) {
  if (status === 'ok') return 'text-emerald-400 bg-emerald-500/10'
  if (status === 'skipped') return 'text-zinc-400 bg-zinc-800'
  if (status === 'calling') return 'text-blue-400 bg-blue-500/10'
  return 'text-amber-400 bg-amber-500/10'
}

function SourcesTab({ report }: { report: SIReportDetail }) {
  const { sources, providerLog } = report
  const typeOrder: Record<string, number> = { website: 0, crunchbase: 1, news: 2, linkedin_public: 3, search_result: 4 }
  const sorted = [...sources].sort((a, b) => {
    const ao = typeOrder[a.sourceType] ?? 99
    const bo = typeOrder[b.sourceType] ?? 99
    if (ao !== bo) return ao - bo
    return b.sourceQualityScore - a.sourceQualityScore
  })

  return (
    <div className="space-y-4">
      {providerLog.length > 0 && (
        <SectionCard title="Provider Activity Log" icon={Database}>
          <p className="text-xs text-muted-foreground mb-3">
            Every API/tool called during this report — check backend terminal for full logs.
          </p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {providerLog.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono">
                <span className={cn('px-1.5 py-0.5 rounded uppercase flex-shrink-0', providerStatusColor(entry.status))}>
                  {entry.status}
                </span>
                <span className="text-blue-400 flex-shrink-0">{entry.provider}</span>
                <span className="text-muted-foreground flex-shrink-0">{entry.action}</span>
                <span className="text-muted-foreground/80 truncate">{entry.detail}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      <p className="text-sm text-muted-foreground">{sources.length} sources collected</p>
      {sorted.map((source, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-md bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2 mb-1">
                <a
                  href={source.url}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium hover:text-blue-400 transition-colors truncate flex items-center gap-1"
                >
                  {source.title || source.domain}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-xs text-muted-foreground capitalize">{source.sourceType.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-1">
                    <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${source.sourceQualityScore * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{pct(source.sourceQualityScore)}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70">{source.domain}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{source.snippet}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
