import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Sparkles, ArrowRight, Brain, TrendingUp, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/layout/PageHeader'
import FadeIn, { FadeInStagger, FadeInItem } from '@/components/motion/FadeIn'
import { MOCK_COMPANIES } from '@/mocks/data'

export default function IntelligencePage() {
  const navigate = useNavigate()

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <FadeIn>
        <PageHeader
          title="Intelligence"
          description="Cross-portfolio signals and AI-powered investment insights."
        />
      </FadeIn>

      {/* Coming soon state */}
      <FadeIn delay={0.1}>
        <div className="mb-8 rounded-xl border border-conviction-500/20 bg-conviction-500/5 p-8 text-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-conviction-500/15 mb-4">
            <Sparkles className="h-7 w-7 text-conviction-400" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Portfolio Intelligence — Coming Next
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            Cross-company trend detection, thesis drift alerts, comparable company analysis,
            and AI-powered deal scoring across your entire pipeline.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: 'Ask anything about your portfolio', icon: Search },
              { label: 'Cross-company pattern detection', icon: Brain },
              { label: 'Thesis alignment scoring', icon: TrendingUp },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground"
                >
                  <Icon className="h-3 w-3" />
                  {item.label}
                </div>
              )
            })}
          </div>
        </div>
      </FadeIn>

      {/* Company quick-intelligence */}
      <FadeIn delay={0.15}>
        <h2 className="text-sm font-semibold text-foreground mb-4">
          Company Intelligence — Available Now
        </h2>
      </FadeIn>

      <FadeInStagger staggerDelay={0.06}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_COMPANIES.slice(0, 4).map((company) => (
            <FadeInItem key={company.id}>
              <motion.div
                whileHover={{ y: -1 }}
                onClick={() => navigate(`/companies/${company.id}`)}
                className="group rounded-lg border border-border bg-card p-4 cursor-pointer hover:shadow-card-hover hover:border-border/80 transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{company.name}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{company.description}</p>
                <div className="mt-2 flex items-center gap-2 text-2xs text-muted-foreground">
                  <span>{company.callCount} calls</span>
                  <span>·</span>
                  <span className="capitalize">{company.status}</span>
                </div>
              </motion.div>
            </FadeInItem>
          ))}
        </div>
      </FadeInStagger>
    </div>
  )
}
