import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Building2,
  ArrowRight,
  PhoneCall,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import PageHeader from '@/components/layout/PageHeader'
import FadeIn, { FadeInStagger, FadeInItem } from '@/components/motion/FadeIn'
import { MOCK_COMPANIES } from '@/mocks/data'
import { cn, formatRelativeTime, STATUS_COLORS } from '@/lib/utils'
import { useAuthStore } from '@/store'
import { companiesApi } from '@/services/api/companies'
import { getFriendlyApiError } from '@/lib/apiErrors'
import type { Company, CompanyStatus } from '@/types'

const STATUS_LABELS: Record<CompanyStatus, string> = {
  active: 'Active',
  tracking: 'Tracking',
  passed: 'Passed',
  portfolio: 'Portfolio',
  archived: 'Archived',
}

const ALL_STATUSES: CompanyStatus[] = ['active', 'tracking', 'passed', 'portfolio', 'archived']

// ─── Company Card ─────────────────────────────────────────────────────────────

function CompanyCard({ company }: { company: Company }) {
  const navigate = useNavigate()
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate(`/companies/${company.id}`)}
      className="group relative rounded-lg border border-border bg-card p-5 cursor-pointer overflow-hidden transition-all duration-200 hover:border-border/80 hover:shadow-card-hover"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-conviction-500/4 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{company.name}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
              {company.industry && <span>{company.industry}</span>}
              {company.stage && (
                <>
                  <span>·</span>
                  <span className="capitalize">{company.stage}</span>
                </>
              )}
              {company.location && (
                <>
                  <span>·</span>
                  <span>{company.location}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={cn('text-2xs', STATUS_COLORS[company.status])}>
              {STATUS_LABELS[company.status]}
            </Badge>
          </div>
        </div>

        {company.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {company.description}
          </p>
        )}

        {company.founders.length > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {company.founders.map((founder) => (
              <div
                key={founder.name}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1"
              >
                <div className="h-4 w-4 rounded-full bg-conviction-500/20 flex items-center justify-center text-2xs font-semibold text-conviction-300">
                  {founder.name[0]}
                </div>
                <span className="text-xs font-medium text-foreground">{founder.name}</span>
                <span className="text-2xs text-muted-foreground">{founder.role}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-2xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <PhoneCall className="h-3 w-3" />
              {company.callCount} call{company.callCount !== 1 ? 's' : ''}
            </span>
            {company.lastInteractionAt && (
              <span>{formatRelativeTime(company.lastInteractionAt)}</span>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── New Company Modal ────────────────────────────────────────────────────────

function NewCompanyModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (company: Company) => void
}) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [industry, setIndustry] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isDemo } = useAuthStore()

  async function handleCreate() {
    if (!name.trim()) return
    setIsCreating(true)
    setError(null)
    try {
      if (isDemo) {
        // Demo: fake delay then navigate to first mock company
        await new Promise((r) => setTimeout(r, 500))
        onClose()
        navigate(`/companies/${MOCK_COMPANIES[0].id}`)
        return
      }
      const company = await companiesApi.create({
        name: name.trim(),
        website: website.trim() || undefined,
        industry: industry.trim() || undefined,
      })
      onCreated(company)
      navigate(`/companies/${company.id}`)
    } catch {
      setError('Failed to create company. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-border bg-card shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Add a company</h2>
            <p className="text-sm text-muted-foreground mt-1">Start tracking a new deal.</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Company name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Veridian AI"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Website <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://veridian.ai"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Industry <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="AI Infrastructure, B2B SaaS…"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="conviction"
            className="flex-1"
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Create
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const { isDemo } = useAuthStore()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | 'all'>('all')
  const [showNewModal, setShowNewModal] = useState(false)

  useEffect(() => {
    if (isDemo) {
      setCompanies(MOCK_COMPANIES)
      setLoading(false)
      return
    }
    loadCompanies()
  }, [isDemo])

  async function loadCompanies() {
    setLoading(true)
    setError(null)
    try {
      const list = await companiesApi.list()
      setCompanies(list)
    } catch (err) {
      setError(getFriendlyApiError(err, 'default', "Couldn't load your pipeline. Please try again."))
    } finally {
      setLoading(false)
    }
  }

  function handleCompanyCreated(company: Company) {
    setCompanies((prev) => [company, ...prev])
  }

  const filtered = companies.filter((c) => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === 'all' || c.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <FadeIn>
        <PageHeader
          title="Companies"
          description={
            loading
              ? 'Loading your pipeline…'
              : `${companies.length} ${companies.length === 1 ? 'company' : 'companies'} in your pipeline.`
          }
          actions={
            <Button variant="conviction" size="sm" data-tour="tour-pipeline-add" onClick={() => setShowNewModal(true)}>
              <Plus className="h-3.5 w-3.5" />
              Add company
            </Button>
          }
        />
      </FadeIn>

      {/* Filters */}
      <FadeIn delay={0.05}>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search companies…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                filterStatus === 'all'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              All
            </button>
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors capitalize',
                  filterStatus === s
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </FadeIn>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-12 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading companies…
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle className="h-8 w-8 text-red-400/60" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={loadCompanies}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-tour="tour-pipeline-list">
          <AnimatePresence mode="popLayout">
            {filtered.map((company, index) => (
              <div
                key={company.id}
                data-company-id={company.id}
                data-tour={index === 0 ? 'tour-pipeline-card' : undefined}
              >
                <CompanyCard company={company} />
              </div>
            ))}
            {filtered.length === 0 && (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex flex-col items-center justify-center py-20 text-center"
              >
                <Building2 className="h-10 w-10 text-muted-foreground/40 mb-4" />
                <p className="text-sm font-medium text-foreground">
                  {companies.length === 0 ? 'No companies yet' : 'No companies found'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {companies.length === 0
                    ? 'Add your first company to start tracking deals.'
                    : search
                    ? 'Try a different search or filter.'
                    : 'Adjust your filter to see more companies.'}
                </p>
                {companies.length === 0 && (
                  <Button
                    variant="conviction"
                    size="sm"
                    className="mt-4"
                    onClick={() => setShowNewModal(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add first company
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {showNewModal && (
          <NewCompanyModal
            onClose={() => setShowNewModal(false)}
            onCreated={handleCompanyCreated}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
