import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Search,
  Building2,
  Globe,
  ArrowRight,
  PhoneCall,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import PageHeader from '@/components/layout/PageHeader'
import FadeIn, { FadeInStagger, FadeInItem } from '@/components/motion/FadeIn'
import { MOCK_COMPANIES } from '@/mocks/data'
import { cn, formatRelativeTime, STATUS_COLORS } from '@/lib/utils'
import type { Company, CompanyStatus } from '@/types'

const STATUS_LABELS: Record<CompanyStatus, string> = {
  active: 'Active',
  tracking: 'Tracking',
  passed: 'Passed',
  portfolio: 'Portfolio',
  archived: 'Archived',
}

const ALL_STATUSES: CompanyStatus[] = ['active', 'tracking', 'passed', 'portfolio', 'archived']

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
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
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
          <div className="flex items-center gap-2 mb-3">
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

function NewCompanyModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setIsCreating(true)
    await new Promise((r) => setTimeout(r, 600))
    onClose()
    navigate(`/companies/co_new`)
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
        <div>
          <h2 className="font-semibold text-foreground">Add a company</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Start tracking a new deal.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Company name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Veridian AI"
              autoFocus
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
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
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

export default function CompaniesPage() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | 'all'>('all')
  const [showNewModal, setShowNewModal] = useState(false)

  const filtered = MOCK_COMPANIES.filter((c) => {
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
          description={`${MOCK_COMPANIES.length} companies in your pipeline.`}
          actions={
            <Button variant="conviction" size="sm" onClick={() => setShowNewModal(true)}>
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

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
          {filtered.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-20 text-center"
            >
              <Building2 className="h-10 w-10 text-muted-foreground/40 mb-4" />
              <p className="text-sm font-medium text-foreground">No companies found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? 'Try a different search.' : 'Add your first company to get started.'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showNewModal && (
          <NewCompanyModal onClose={() => setShowNewModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
