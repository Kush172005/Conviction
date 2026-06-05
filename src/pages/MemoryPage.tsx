import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Brain,
  Building2,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/layout/PageHeader'
import FadeIn from '@/components/motion/FadeIn'
import { MOCK_MEMORY_ENTRIES, MOCK_COMPANIES } from '@/mocks/data'
import { cn, formatDate } from '@/lib/utils'
import type { MemoryEntryType } from '@/types'

const TYPE_CONFIG: Record<MemoryEntryType, { label: string; color: string; dot: string }> = {
  call_note: { label: 'Call Note', color: 'text-blue-400', dot: 'bg-blue-400' },
  decision: { label: 'Decision', color: 'text-conviction-300', dot: 'bg-conviction-400' },
  concern: { label: 'Concern', color: 'text-amber-400', dot: 'bg-amber-400' },
  milestone: { label: 'Milestone', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  follow_up: { label: 'Follow-Up', color: 'text-muted-foreground', dot: 'bg-muted-foreground' },
  thesis_update: { label: 'Thesis Update', color: 'text-conviction-300', dot: 'bg-conviction-400' },
}

const SENTIMENT_DOT = {
  positive: 'text-emerald-400',
  negative: 'text-red-400',
  neutral: 'text-zinc-400',
  mixed: 'text-amber-400',
}

function groupByMonth(entries: typeof MOCK_MEMORY_ENTRIES) {
  const groups: Record<string, typeof MOCK_MEMORY_ENTRIES> = {}
  for (const entry of entries) {
    const key = new Date(entry.occurredAt).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  }
  return Object.entries(groups)
}

export default function MemoryPage() {
  const navigate = useNavigate()
  const [filterCompany, setFilterCompany] = useState<string>('all')

  const sorted = [...MOCK_MEMORY_ENTRIES].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  )

  const filtered = sorted.filter(
    (m) => filterCompany === 'all' || m.companyId === filterCompany
  )

  const grouped = groupByMonth(filtered)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <FadeIn>
        <PageHeader
          title="Memory"
          description="The full history of your investment thinking, across every company."
        />
      </FadeIn>

      {/* Company filter */}
      <FadeIn delay={0.05}>
        <div className="flex items-center gap-2 mb-8 flex-wrap">
          <button
            onClick={() => setFilterCompany('all')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filterCompany === 'all'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            All companies
          </button>
          {MOCK_COMPANIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setFilterCompany(c.id)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                filterCompany === c.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground'
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      </FadeIn>

      {/* Timeline */}
      {grouped.length === 0 ? (
        <FadeIn delay={0.1}>
          <div className="text-center py-20">
            <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground">No memory entries yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Log a call and the intelligence will appear here.
            </p>
          </div>
        </FadeIn>
      ) : (
        <div className="space-y-10">
          {grouped.map(([month, entries], groupIdx) => (
            <FadeIn key={month} delay={groupIdx * 0.08}>
              <div>
                {/* Month header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {month}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Entries */}
                <div className="relative space-y-0 pl-6">
                  {/* Timeline line */}
                  <div className="absolute left-2 top-3 bottom-3 w-px bg-border" />

                  {entries.map((entry, entryIdx) => {
                    const typeConfig = TYPE_CONFIG[entry.type]
                    const company = MOCK_COMPANIES.find((c) => c.id === entry.companyId)

                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: groupIdx * 0.08 + entryIdx * 0.05, duration: 0.3 }}
                        className="relative pb-6 last:pb-0"
                      >
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-4 top-1.5 h-3 w-3 rounded-full border-2 border-background ${typeConfig.dot}`}
                        />

                        {/* Card */}
                        <div className="rounded-lg border border-border bg-card p-4 ml-2 hover:border-border/80 hover:shadow-card-hover transition-all duration-150 cursor-pointer group"
                          onClick={() => company && navigate(`/companies/${company.id}`)}>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={`text-xs font-semibold uppercase tracking-wider ${typeConfig.color}`}>
                                  {typeConfig.label}
                                </span>
                                {company && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {company.name}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-semibold text-foreground">{entry.title}</h3>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-2xs text-muted-foreground">
                                {formatDate(entry.occurredAt)}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            {entry.summary}
                          </p>

                          <div className="flex items-center gap-3 mt-2.5">
                            {/* Importance dots */}
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-1 w-1 rounded-full ${
                                    i < entry.importance
                                      ? 'bg-conviction-400'
                                      : 'bg-border'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className={`text-2xs font-medium ${SENTIMENT_DOT[entry.sentiment]}`}>
                              {entry.sentiment}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  )
}
