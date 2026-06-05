import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Lock,
  MessageSquare,
  PhoneCall,
  Quote,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

gsap.registerPlugin(ScrollTrigger, useGSAP)

const FEATURES = [
  {
    icon: PhoneCall,
    title: 'Capture After Every Call',
    description:
      'Voice memo, quick text dump, or paste a transcript. Conviction extracts structured investment reasoning from whatever you give it.',
    accent: 'from-conviction-500/20 to-conviction-500/5',
  },
  {
    icon: Brain,
    title: 'Structure Deal Intelligence',
    description:
      'Instantly surfaces: strengths, concerns, thesis fit, founder assessment, market analysis, and a decision recommendation — all from your raw notes.',
    accent: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: Lock,
    title: 'Never Lose Conviction',
    description:
      'A persistent memory timeline per company. See how your view evolved from first call to term sheet. Forget nothing.',
    accent: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: Zap,
    title: 'Act on Follow-Ups',
    description:
      'Automatically surfaces promised actions, drafts founder emails, and surfaces overdue follow-ups before they fall through the cracks.',
    accent: 'from-amber-500/20 to-amber-500/5',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Log your reasoning',
    description:
      'Right after a founder call, brain-dump your thoughts. Voice note, quick text, or a full transcript — we accept it all.',
  },
  {
    step: '02',
    title: 'Conviction structures it',
    description:
      'AI extracts deal summary, founder assessment, strengths, concerns, thesis fit, and a decision recommendation into clean structured output.',
  },
  {
    step: '03',
    title: 'Build investment memory',
    description:
      "Every interaction becomes part of the company's intelligence timeline. Three months later, you'll know exactly where you stood and why.",
  },
]

const TESTIMONIALS = [
  {
    quote:
      "We tracked 200+ companies last year. By Q3, half our team couldn't remember why we passed on deals we'd spent weeks evaluating. Conviction solved that.",
    author: 'Partner at a Series A fund',
    fund: 'Top 10 fintech-focused VC',
  },
  {
    quote:
      "The moment I have an insight on a call, it used to disappear into a Notion doc I'd never reopen. Now it becomes institutional memory instantly.",
    author: 'Principal, Growth Equity',
    fund: '$2B AUM fund',
  },
  {
    quote:
      "Deal continuity is the unsexy problem nobody talks about. Conviction made it disappear. We ship better memos, faster, with full audit trails.",
    author: 'VP of Investments',
    fund: 'Early-stage consumer fund',
  },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const problemRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const howRef = useRef<HTMLDivElement>(null)
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Hero entrance
        const heroTl = gsap.timeline({ delay: 0.1 })
        heroTl
          .from('.hero-badge', { autoAlpha: 0, y: 16, duration: 0.6, ease: 'power2.out' })
          .from('.hero-headline', { autoAlpha: 0, y: 24, duration: 0.7, ease: 'power2.out' }, '-=0.3')
          .from('.hero-subheadline', { autoAlpha: 0, y: 16, duration: 0.6, ease: 'power2.out' }, '-=0.4')
          .from('.hero-cta', { autoAlpha: 0, y: 12, duration: 0.5, ease: 'power2.out' }, '-=0.3')
          .from('.hero-product-preview', { autoAlpha: 0, y: 32, duration: 0.8, ease: 'power2.out' }, '-=0.3')

        // Problem section — fading fragments
        ScrollTrigger.batch('.problem-fragment', {
          onEnter: (els) => {
            gsap.fromTo(
              els,
              { autoAlpha: 0, y: 20 },
              { autoAlpha: 1, y: 0, stagger: 0.12, duration: 0.6, ease: 'power2.out' }
            )
          },
          start: 'top 85%',
          once: true,
        })

        // Features reveal
        ScrollTrigger.batch('.feature-card', {
          onEnter: (els) => {
            gsap.fromTo(
              els,
              { autoAlpha: 0, y: 28 },
              { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.55, ease: 'power2.out' }
            )
          },
          start: 'top 88%',
          once: true,
        })

        // How it works steps
        ScrollTrigger.batch('.how-step', {
          onEnter: (els) => {
            gsap.fromTo(
              els,
              { autoAlpha: 0, x: -20 },
              { autoAlpha: 1, x: 0, stagger: 0.15, duration: 0.6, ease: 'power2.out' }
            )
          },
          start: 'top 88%',
          once: true,
        })

        // Testimonials
        ScrollTrigger.batch('.testimonial-card', {
          onEnter: (els) => {
            gsap.fromTo(
              els,
              { autoAlpha: 0, y: 24 },
              { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.55, ease: 'power2.out' }
            )
          },
          start: 'top 88%',
          once: true,
        })

        // CTA
        gsap.from('.cta-content', {
          autoAlpha: 0,
          y: 20,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.cta-content',
            start: 'top 85%',
            once: true,
          },
        })
      })
    },
    { scope: containerRef }
  )

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-conviction">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">Conviction</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Button>
            <Button
              variant="conviction"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Get access
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-14"
      >
        {/* Background grid */}
        <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-conviction-500/6 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-conviction-500/20 bg-conviction-500/8 px-4 py-1.5 text-xs font-medium text-conviction-300">
            <Sparkles className="h-3 w-3" />
            Deal Continuity Copilot for Venture Capital
          </div>

          <h1 className="hero-headline text-balance font-semibold tracking-tight leading-[1.1]">
            <span className="block text-5xl md:text-6xl lg:text-7xl text-foreground">
              Every founder conversation
            </span>
            <span className="block text-5xl md:text-6xl lg:text-7xl text-foreground mt-2">
              contains{' '}
              <span className="gradient-text">investment intelligence.</span>
            </span>
            <span className="block text-4xl md:text-5xl lg:text-6xl text-muted-foreground mt-3">
              Most of it gets lost.
            </span>
          </h1>

          <p className="hero-subheadline max-w-xl mx-auto text-lg text-muted-foreground leading-relaxed">
            Conviction captures investment reasoning immediately after meetings and converts it into
            structured deal intelligence — so you never lose the thinking behind a decision.
          </p>

          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="conviction"
              size="lg"
              className="h-12 px-8 text-base"
              onClick={() => navigate('/login')}
            >
              Start capturing decisions
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base"
              onClick={() => navigate('/dashboard')}
            >
              View live demo
            </Button>
          </div>

          {/* Product preview */}
          <div className="hero-product-preview relative mt-12 mx-auto max-w-3xl">
            <div className="relative rounded-xl border border-border overflow-hidden shadow-2xl surface-elevated">
              {/* Mock product UI */}
              <div className="bg-surface-1 border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/60" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 rounded-md bg-surface-2 flex items-center px-3">
                    <span className="text-xs text-muted-foreground">conviction.vc/companies/veridian-ai</span>
                  </div>
                </div>
              </div>
              <div className="bg-background p-5 grid grid-cols-12 gap-4 min-h-[340px]">
                {/* Left sidebar */}
                <div className="col-span-3 space-y-1">
                  {['Dashboard', 'Companies', 'Log Call', 'Memory', 'Intelligence'].map((item, i) => (
                    <div
                      key={item}
                      className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${i === 1 ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground'}`}
                    >
                      <div className={`h-1.5 w-1.5 rounded-full ${i === 1 ? 'bg-conviction-400' : 'bg-transparent'}`} />
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main content */}
                <div className="col-span-9 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Veridian AI</div>
                      <div className="text-xs text-muted-foreground">AI Infrastructure · Seed · $2.4M raised</div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs text-emerald-400 font-medium">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Active
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Recommendation', value: 'Invest', color: 'text-emerald-400' },
                      { label: 'Confidence', value: '78%', color: 'text-conviction-300' },
                      { label: 'Calls Logged', value: '4', color: 'text-foreground' },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-md border border-border bg-card p-2.5">
                        <div className="text-2xs text-muted-foreground">{stat.label}</div>
                        <div className={`text-sm font-semibold mt-0.5 ${stat.color}`}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-md border border-border bg-card p-3">
                    <div className="text-2xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Latest Conviction</div>
                    <p className="text-xs text-foreground leading-relaxed">
                      Exceptional founder-market fit. Priya lived this problem at Google Brain. $180K ARR from 3 F500 customers with $0 in sales spend validates the thesis strongly.
                    </p>
                    <div className="mt-2 flex gap-1.5">
                      {['JPMorgan pilot', 'EU AI Act', 'F500 pipeline'].map((tag) => (
                        <span key={tag} className="rounded-full bg-conviction-500/10 border border-conviction-500/20 px-1.5 py-0.5 text-2xs text-conviction-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-card p-3">
                    <div className="text-2xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Open Follow-Ups</div>
                    <div className="space-y-1.5">
                      {[
                        { text: 'IC prep call — unit economics + multimodel roadmap', priority: 'high' },
                        { text: 'Competitive mapping: Lakera, Guardrails AI, Azure', priority: 'high' },
                      ].map((item) => (
                        <div key={item.text} className="flex items-start gap-2">
                          <div className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                          <span className="text-xs text-foreground">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent pointer-events-none rounded-b-xl" />
          </div>
        </div>
      </section>

      {/* Problem */}
      <section ref={problemRef} className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 problem-fragment">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              The reasoning disappears.
              <br />
              <span className="text-muted-foreground">Every time.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Investment professionals meet 5–15 founders every week. The insights from those conversations are invaluable — and almost all of them evaporate within 72 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                label: 'Why did we pass on this?',
                context: '3 months after a strong initial call',
                icon: '🤔',
              },
              {
                label: 'What were our concerns back in March?',
                context: 'Preparing for IC meeting',
                icon: '😰',
              },
              {
                label: "Did we ever follow up about their GTM pivot?",
                context: 'After a founder re-engages',
                icon: '📋',
              },
              {
                label: "I know I had a strong thesis here but I can't remember it",
                context: 'Reviewing a company with LP',
                icon: '💭',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="problem-fragment rounded-xl border border-border bg-card p-5 flex gap-4"
              >
                <div className="text-2xl flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">"{item.label}"</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.context}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="problem-fragment mt-10 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <p className="text-base font-medium text-foreground">
              This is not a transcription problem.
            </p>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
              Recording meetings doesn't help if you never re-watch them. The insight needs to be structured and retrievable — immediately after the conversation.
            </p>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 px-6 relative bg-surface-1/40">
        <div className="max-w-4xl mx-auto text-center">
          <div className="problem-fragment inline-flex items-center gap-2 rounded-full border border-conviction-500/20 bg-conviction-500/8 px-4 py-1.5 text-xs font-medium text-conviction-300 mb-6">
            <Sparkles className="h-3 w-3" />
            The Solution
          </div>
          <h2 className="problem-fragment text-3xl md:text-4xl font-semibold tracking-tight mb-6">
            Conviction converts your raw thoughts into{' '}
            <span className="gradient-text">permanent deal intelligence.</span>
          </h2>
          <p className="problem-fragment text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Within seconds of a founder call, capture your reasoning in any format. Conviction structures it into a full deal profile — and builds a living memory that evolves with every interaction.
          </p>
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="feature-card text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Every feature built for<br />
              <span className="text-muted-foreground">investment professionals.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="feature-card group relative rounded-xl border border-border bg-card p-6 overflow-hidden transition-all duration-200 hover:border-border/80 hover:shadow-card-hover"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary mb-4">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section ref={howRef} className="py-28 px-6 bg-surface-1/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="how-step text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              From raw notes to deal memory
              <br />
              <span className="text-muted-foreground">in under 60 seconds.</span>
            </h2>
          </div>

          <div className="space-y-0">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="how-step relative flex gap-8 pb-12 last:pb-0">
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-px bg-border" />
                )}
                {/* Step number */}
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card text-sm font-mono font-semibold text-muted-foreground">
                  {step.step}
                </div>
                <div className="pt-2.5 min-w-0">
                  <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef} className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="testimonial-card text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Built for how VCs actually work.
            </h2>
            <p className="testimonial-card text-muted-foreground max-w-lg mx-auto">
              Early access partners tell us what they experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className="testimonial-card rounded-xl border border-border bg-card p-6 flex flex-col"
              >
                <Quote className="h-5 w-5 text-conviction-400/60 mb-4 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed flex-1 mb-6">
                  "{t.quote}"
                </p>
                <div>
                  <p className="text-sm font-medium text-foreground">{t.author}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.fund}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section ref={ctaRef} className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-conviction-500/8 blur-[100px] pointer-events-none" />

        <div className="cta-content relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance">
            Never lose the reasoning
            <br />
            <span className="gradient-text">behind a decision.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Join the VC teams using Conviction to capture, structure, and preserve deal intelligence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="conviction"
              size="lg"
              className="h-12 px-8 text-base"
              onClick={() => navigate('/login')}
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base"
              onClick={() => navigate('/dashboard')}
            >
              Explore the demo
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            {['No credit card required', 'Private & secure', 'Cancel anytime'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-conviction">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">Conviction</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Never lose the reasoning behind an investment decision.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
