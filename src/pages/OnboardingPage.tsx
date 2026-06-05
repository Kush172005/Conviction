import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { ArrowRight, Check, TrendingUp, Sparkles, Globe2, Cpu, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAuthStore, useOnboardingStore } from '@/store'
import { authApi } from '@/services/api/auth'
import { ApiError } from '@/services/api/client'

// ─── Thesis templates ────────────────────────────────────────────────────────

interface ThesisTemplate {
  id: string
  icon: React.ElementType
  label: string
  tagline: string
  thesis: string
  sectors: string[]
  stages: string[]
  checkSize: string
  geos: string[]
  style: string
  color: string
}

const THESIS_TEMPLATES: ThesisTemplate[] = [
  {
    id: 'b2b-saas',
    icon: Sparkles,
    label: 'B2B SaaS & Developer Tools',
    tagline: 'Seed → Series B · $500K–$5M',
    thesis:
      'We invest in category-defining B2B software companies with strong founder-market fit, deep technical moats, and the potential to become global infrastructure. Our focus is on developer tools, vertical SaaS, and AI-native applications that make teams measurably faster.',
    sectors: ['B2B SaaS', 'Developer Tools', 'AI Infrastructure'],
    stages: ['seed', 'series-a', 'series-b'],
    checkSize: '$1M-$5M',
    geos: ['US', 'Europe'],
    style: 'lead',
    color: 'from-violet-500/20 to-purple-500/10 border-violet-500/30',
  },
  {
    id: 'ai-deeptech',
    icon: Cpu,
    label: 'AI & Deep Tech Infrastructure',
    tagline: 'Pre-seed → Series A · $1M–$10M',
    thesis:
      'We back foundational AI and deep tech teams building the infrastructure layer that the next decade of software will run on. From frontier model tooling and chips to biotech and climate tech — we invest in science-heavy founders with asymmetric technical advantages.',
    sectors: ['AI Infrastructure', 'Deep Tech', 'Climate Tech'],
    stages: ['pre-seed', 'seed', 'series-a'],
    checkSize: '$1M-$5M',
    geos: ['US', 'Europe', 'Global'],
    style: 'lead',
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
  },
  {
    id: 'emerging-markets',
    icon: Globe2,
    label: 'Emerging Markets Growth',
    tagline: 'Series A → C · $5M–$25M',
    thesis:
      'We invest in high-growth technology companies across India, Southeast Asia, and Africa that are building for underserved populations with real unit economics. Our portfolio companies typically have strong local network effects, regulatory advantages, and a clear path to regional dominance before going global.',
    sectors: ['FinTech', 'HealthTech', 'Future of Work', 'B2B SaaS'],
    stages: ['series-a', 'series-b', 'series-c'],
    checkSize: '$5M-$25M',
    geos: ['India', 'Southeast Asia', 'Africa'],
    style: 'lead',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
  },
  {
    id: 'consumer-creator',
    icon: Users,
    label: 'Consumer & Creator Economy',
    tagline: 'Seed · $250K–$2M',
    thesis:
      'We invest in consumer technology and creator-economy platforms at the seed stage, backing founders who understand how attention, identity, and community evolve online. We look for products with viral loops, strong retention, and the potential to become the defining social platform for a new generation.',
    sectors: ['Consumer', 'MarTech', 'EdTech', 'Web3'],
    stages: ['pre-seed', 'seed'],
    checkSize: '$250k-$1M',
    geos: ['US', 'Europe'],
    style: 'both',
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30',
  },
]

// ─── Form types ───────────────────────────────────────────────────────────────

type Step0Data = { selectedTemplateId: string }
type Step1Data = {
  fundName: string
  investorName: string
  investmentThesis: string
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -32 : 32, opacity: 0 }),
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const { currentStep, setStep, complete, isComplete, reset } = useOnboardingStore()

  const [direction, setDirection] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<ThesisTemplate | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const { register, handleSubmit, getValues, setValue } = useForm<Step1Data>({
    defaultValues: { fundName: '', investorName: user?.name || '' },
  })

  // If already onboarded, skip to dashboard
  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/dashboard', { replace: true })
    }
  }, [user?.onboardingCompleted, navigate])

  // Step 2: success screen — auto redirect
  useEffect(() => {
    if (currentStep === 2 && (isComplete || isRedirecting)) {
      const t = setTimeout(() => navigate('/dashboard', { replace: true }), 1600)
      return () => clearTimeout(t)
    }
    // Stale step 2 from a crashed session — restart
    if (currentStep === 2 && !isComplete && !isRedirecting) {
      reset()
    }
  }, [currentStep, isComplete, isRedirecting, navigate, reset])

  function pickTemplate(t: ThesisTemplate) {
    setSelectedTemplate(t)
    setValue('investmentThesis', t.thesis)
    if (!getValues('fundName')) setValue('fundName', '')
    if (!getValues('investorName')) setValue('investorName', user?.name || '')
  }

  function goToPersonalize() {
    if (!selectedTemplate) return
    setDirection(1)
    setStep(1)
  }

  function goPrev() {
    setDirection(-1)
    setStep(currentStep - 1)
  }

  async function onFinish(data: Step1Data) {
    if (!selectedTemplate) return
    setIsSaving(true)

    const payload = {
      fund_name: data.fundName || 'My Fund',
      investor_name: data.investorName || user?.name || 'Investor',
      investment_thesis: data.investmentThesis || selectedTemplate.thesis,
      preferred_sectors: selectedTemplate.sectors,
      preferred_stages: selectedTemplate.stages,
      typical_check_size: selectedTemplate.checkSize,
      geographies: selectedTemplate.geos,
      investment_style: selectedTemplate.style,
    }

    try {
      try {
        await authApi.createInvestorProfile(payload)
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          await authApi.updateInvestorProfile(payload)
        }
      }
      const updatedUser = await authApi.updateMe({ onboarding_completed: true })
      updateUser({ onboardingCompleted: updatedUser.onboarding_completed })
    } catch {
      // Offline-resilient: mark complete locally and continue
      updateUser({ onboardingCompleted: true })
    } finally {
      setIsSaving(false)
    }

    complete()
    setIsRedirecting(true)
    setDirection(1)
    setStep(2)
  }

  const steps = ['Choose thesis', 'Personalize', 'Done']

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-conviction-500/6 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-conviction mb-4">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Set up your workspace{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Conviction personalises every deal analysis to your thesis. Takes 60 seconds.
          </p>
        </div>

        {/* Progress pills */}
        {currentStep < 2 && (
          <div className="flex items-center justify-center gap-2 mb-8">
            {steps.slice(0, 2).map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full flex items-center justify-center text-2xs font-semibold transition-all',
                      i < currentStep
                        ? 'bg-conviction-500 text-white'
                        : i === currentStep
                        ? 'bg-conviction-500/20 border border-conviction-500 text-conviction-400'
                        : 'bg-border text-muted-foreground'
                    )}
                  >
                    {i < currentStep ? <Check className="h-2.5 w-2.5" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      'text-xs',
                      i === currentStep ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {label}
                  </span>
                </div>
                {i < 1 && <div className="h-px w-8 bg-border" />}
              </div>
            ))}
          </div>
        )}

        <div className="overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* ─── Step 0: Choose thesis ──────────────────────────────── */}
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {THESIS_TEMPLATES.map((t) => {
                      const Icon = t.icon
                      const isSelected = selectedTemplate?.id === t.id
                      return (
                        <motion.button
                          key={t.id}
                          type="button"
                          onClick={() => pickTemplate(t)}
                          whileHover={{ y: -1 }}
                          transition={{ duration: 0.12 }}
                          className={cn(
                            'relative text-left rounded-xl border p-4 transition-all duration-150 overflow-hidden',
                            isSelected
                              ? `bg-gradient-to-br ${t.color} shadow-sm`
                              : 'border-border bg-card hover:border-muted-foreground/40 hover:bg-secondary/40'
                          )}
                        >
                          {isSelected && (
                            <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-conviction-500">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <div className="flex items-center gap-2.5 mb-2.5">
                            <div
                              className={cn(
                                'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
                                isSelected ? 'bg-white/10' : 'bg-secondary'
                              )}
                            >
                              <Icon className={cn('h-4 w-4', isSelected ? 'text-white' : 'text-muted-foreground')} />
                            </div>
                            <div className="min-w-0">
                              <p className={cn('text-sm font-semibold leading-tight', isSelected ? 'text-foreground' : 'text-foreground')}>
                                {t.label}
                              </p>
                              <p className={cn('text-xs mt-0.5', isSelected ? 'text-muted-foreground' : 'text-muted-foreground')}>
                                {t.tagline}
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            {t.thesis}
                          </p>
                        </motion.button>
                      )
                    })}
                  </div>

                  <Button
                    className="w-full"
                    onClick={goToPersonalize}
                    disabled={!selectedTemplate}
                  >
                    Continue with {selectedTemplate?.label ?? 'selected thesis'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <p className="text-center text-xs text-muted-foreground">
                    You can edit your thesis and sectors in Settings at any time.
                  </p>
                </div>
              )}

              {/* ─── Step 1: Personalize ────────────────────────────────── */}
              {currentStep === 1 && (
                <form onSubmit={handleSubmit(onFinish)}>
                  <div className="rounded-xl border border-border bg-card p-6 space-y-5">
                    {selectedTemplate && (
                      <div className={cn('rounded-lg border bg-gradient-to-r p-3 flex items-center gap-3', selectedTemplate.color)}>
                        <selectedTemplate.icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">{selectedTemplate.label}</p>
                          <p className="text-2xs text-muted-foreground">{selectedTemplate.tagline}</p>
                        </div>
                        <button
                          type="button"
                          onClick={goPrev}
                          className="ml-auto text-2xs text-muted-foreground hover:text-foreground underline underline-offset-2 flex-shrink-0"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    <div>
                      <h2 className="font-semibold text-foreground">Personalize your workspace</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        This helps Conviction attribute insights and decisions to your fund.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label>Fund name</Label>
                        <Input
                          {...register('fundName')}
                          placeholder="e.g. Sequoia Capital"
                          autoFocus
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Your name</Label>
                        <Input
                          {...register('investorName')}
                          placeholder={user?.name || 'e.g. Sarah Chen'}
                          defaultValue={user?.name || ''}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <Label>Investment thesis</Label>
                        <span className="text-2xs text-muted-foreground">Pre-filled from template — edit freely</span>
                      </div>
                      <Textarea
                        {...register('investmentThesis')}
                        className="min-h-[120px] resize-none text-sm"
                        defaultValue={selectedTemplate?.thesis ?? ''}
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="outline" className="w-24" onClick={goPrev}>
                        Back
                      </Button>
                      <Button type="submit" className="flex-1" disabled={isSaving}>
                        {isSaving ? (
                          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <>
                            Launch my workspace
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              )}

              {/* ─── Step 2: Done ───────────────────────────────────────── */}
              {currentStep === 2 && (
                <div className="rounded-xl border border-border bg-card p-10 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 mx-auto"
                  >
                    <Check className="h-8 w-8 text-emerald-400" />
                  </motion.div>
                  <div>
                    <h2 className="font-semibold text-foreground text-lg">
                      Your workspace is ready.
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Taking you to your investment dashboard…
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 border-t-conviction-400 animate-spin" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
