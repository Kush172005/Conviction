import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Globe,
  Mic,
  PhoneCall,
  Quote,
  Sparkles,
  TrendingUp,
  Zap,
  Building2,
  FileText,
  Search,
  Shield,
  Clock,
  Target,
  BarChart3,
  MessageSquare,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Mic,
    title: 'Post-Call Brain Dump',
    description:
      'Record a voice note or dump raw text right after a founder call. Whisper STT transcribes it, Gemini structures it into IC-ready deal intelligence in under 60 seconds.',
    tag: 'Voice + AI',
    accent: 'from-red-500/15 to-red-500/3 border-red-500/20',
    iconBg: 'bg-red-500/10 text-red-400',
    tagColor: 'bg-red-500/10 text-red-400 border-red-500/20',
  },
  {
    icon: Search,
    title: 'Startup Intelligence',
    description:
      'Enter any company URL. Our AI pipeline hits Tavily search, Google-grounded Gemini, and HF models to surface founders, funding, market position, and thesis fit — automatically.',
    tag: 'Deep Research',
    accent: 'from-blue-500/15 to-blue-500/3 border-blue-500/20',
    iconBg: 'bg-blue-500/10 text-blue-400',
    tagColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    icon: Target,
    title: 'Fund Thesis Match Engine',
    description:
      'Every company gets scored 0–100 against your fund\'s thesis. Sector, stage, geography, and business model alignment — with specific reasons for fit and misfit.',
    tag: 'Thesis Scoring',
    accent: 'from-conviction-500/15 to-conviction-500/3 border-conviction-500/20',
    iconBg: 'bg-conviction-500/10 text-conviction-400',
    tagColor: 'bg-conviction-500/10 text-conviction-300 border-conviction-500/20',
  },
  {
    icon: Brain,
    title: 'Persistent Deal Memory',
    description:
      'A living intelligence timeline per company. See how your conviction evolved from first call to term sheet. Every insight, concern, and milestone — permanently retrievable.',
    tag: 'Memory Layer',
    accent: 'from-emerald-500/15 to-emerald-500/3 border-emerald-500/20',
    iconBg: 'bg-emerald-500/10 text-emerald-400',
    tagColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    icon: FileText,
    title: 'IC Memo Generation',
    description:
      'From raw notes to a complete IC memo. Strengths, concerns, moat analysis, red flags, open diligence questions, market assessment, and a clear recommendation — all structured.',
    tag: 'Auto Memos',
    accent: 'from-amber-500/15 to-amber-500/3 border-amber-500/20',
    iconBg: 'bg-amber-500/10 text-amber-400',
    tagColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    icon: Zap,
    title: 'Automated Follow-Up Engine',
    description:
      'AI extracts every promised action, drafts founder follow-up emails, and surfaces overdue items before they fall through the cracks. Nothing leaves your pipeline accidentally.',
    tag: 'Action Engine',
    accent: 'from-purple-500/15 to-purple-500/3 border-purple-500/20',
    iconBg: 'bg-purple-500/10 text-purple-400',
    tagColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
]

const STATS = [
  { value: 60, suffix: 's', label: 'Call → structured intelligence' },
  { value: 100, suffix: '+', label: 'Data points extracted per company' },
  { value: 0, suffix: ' notes lost', label: 'With Conviction in your workflow' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: Mic,
    title: 'Capture in any format',
    description:
      'Hit record right after a founder call and brain-dump your thoughts. Or paste a transcript, type quick notes — Conviction accepts everything.',
    detail: 'Voice · Text · Transcript',
  },
  {
    step: '02',
    icon: Sparkles,
    title: 'AI structures it instantly',
    description:
      'Our multi-model pipeline (Whisper → Gemini → HF) extracts deal summary, founder assessment, thesis fit, red flags, strengths, concerns, and follow-up actions.',
    detail: 'Whisper · Gemini · Research',
  },
  {
    step: '03',
    icon: Brain,
    title: 'Build permanent deal memory',
    description:
      'Every call becomes a timestamped entry in your investment memory. Three months later, you\'ll know exactly where you stood and precisely why.',
    detail: 'Timeline · IC Memos · Memory',
  },
]

const TESTIMONIALS = [
  {
    quote:
      'We tracked 200+ companies last year. By Q3, half our team couldn\'t remember why we passed on deals we\'d spent weeks evaluating. Conviction solved that.',
    author: 'Partner at a Series A fund',
    fund: 'Top 10 fintech-focused VC',
    initials: 'PA',
  },
  {
    quote:
      'The startup intelligence feature saves us 3–4 hours per company. Point it at a URL and get a full diligence brief in minutes. Thesis fit scoring is insanely useful.',
    author: 'Principal, Growth Equity',
    fund: '$2B AUM fund',
    initials: 'PG',
  },
  {
    quote:
      'Deal continuity is the unsexy problem nobody talks about. Conviction made it disappear. We ship better memos, faster, with full audit trails.',
    author: 'VP of Investments',
    fund: 'Early-stage consumer fund',
    initials: 'VP',
  },
]

const PIPELINE_PREVIEW = [
  { label: 'Recommendation', value: 'Invest', color: 'text-emerald-400' },
  { label: 'Confidence', value: '82%', color: 'text-conviction-300' },
  { label: 'Thesis Fit', value: '91/100', color: 'text-blue-400' },
]

// ─── Mini components ─────────────────────────────────────────────────────────

function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(ref.current, {
        textContent: 0,
        duration: 1.8,
        ease: 'power2.out',
        snap: { textContent: 1 },
        scrollTrigger: { trigger: ref.current, start: 'top 85%', once: true },
      })
    })
  })
  return (
    <div className="text-center">
      <div className="flex items-end justify-center gap-0.5">
        <span ref={ref} className="text-5xl font-semibold tabular-nums gradient-text leading-none">
          {value}
        </span>
        <span className="text-2xl font-semibold text-muted-foreground leading-none pb-1">{suffix}</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'voice' | 'research' | 'memory'>('voice')

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Hero entrance — staggered timeline
        const heroTl = gsap.timeline({ delay: 0.05 })
        heroTl
          .from('.hero-badge', { autoAlpha: 0, y: 14, duration: 0.5, ease: 'power2.out' })
          .from('.hero-headline', { autoAlpha: 0, y: 28, duration: 0.65, ease: 'power2.out' }, '-=0.25')
          .from('.hero-sub', { autoAlpha: 0, y: 18, duration: 0.55, ease: 'power2.out' }, '-=0.35')
          .from('.hero-cta', { autoAlpha: 0, y: 12, duration: 0.45, ease: 'power2.out' }, '-=0.3')
          .from('.hero-preview', { autoAlpha: 0, y: 40, duration: 0.8, ease: 'power2.out' }, '-=0.3')
          .from('.hero-scroll', { autoAlpha: 0, duration: 0.4 }, '-=0.1')

        // Floating glow parallax
        gsap.to('.hero-glow', {
          y: -60,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero-glow',
            start: 'top top',
            end: 'bottom top',
            scrub: 1.5,
          },
        })

        // Stats counter section
        gsap.from('.stats-section', {
          autoAlpha: 0,
          y: 30,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.stats-section', start: 'top 85%', once: true },
        })

        // Problem fragments
        ScrollTrigger.batch('.problem-fragment', {
          onEnter: (els) =>
            gsap.fromTo(els, { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.6, ease: 'power2.out' }),
          start: 'top 87%',
          once: true,
        })

        // Feature cards
        ScrollTrigger.batch('.feature-card', {
          onEnter: (els) =>
            gsap.fromTo(els, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.55, ease: 'power2.out' }),
          start: 'top 88%',
          once: true,
        })

        // How-it-works steps — slide in from left
        ScrollTrigger.batch('.how-step', {
          onEnter: (els) =>
            gsap.fromTo(els, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, stagger: 0.18, duration: 0.65, ease: 'power2.out' }),
          start: 'top 88%',
          once: true,
        })

        // Testimonial cards
        ScrollTrigger.batch('.testimonial-card', {
          onEnter: (els) =>
            gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.55, ease: 'power2.out' }),
          start: 'top 88%',
          once: true,
        })

        // CTA section
        gsap.from('.cta-content', {
          autoAlpha: 0,
          y: 24,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: { trigger: '.cta-content', start: 'top 85%', once: true },
        })
      })
    },
    { scope: containerRef }
  )

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-conviction">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">Conviction</span>
            <span className="hidden sm:inline-flex items-center rounded-full border border-conviction-500/20 bg-conviction-500/8 px-2 py-0.5 text-2xs font-medium text-conviction-300 ml-1">
              for VC
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-muted-foreground hover:text-foreground hidden sm:flex"
            >
              Sign in
            </Button>
            <Button variant="conviction" size="sm" onClick={() => navigate('/login')}>
              Get access
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-14 pb-16">
        {/* Animated background */}
        <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />
        <div className="hero-glow absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full bg-conviction-500/7 blur-[130px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/4 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-[250px] h-[250px] rounded-full bg-emerald-500/4 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-7 mt-5">
          {/* Badge */}
          <div className="hero-badge inline-flex items-center gap-2 rounded-full border border-conviction-500/25 bg-conviction-500/8 px-4 py-1.5 text-xs font-medium text-conviction-300">
            <Sparkles className="h-3 w-3" />
            AI-Powered Deal Intelligence for Venture Capital
          </div>

          {/* Headline */}
          <h1 className="hero-headline text-balance font-semibold tracking-tight leading-[1.08]">
            <span className="block text-5xl md:text-6xl lg:text-7xl text-foreground">
              Every founder call
            </span>
            <span className="block text-5xl md:text-6xl lg:text-7xl text-foreground mt-2">
              generates{' '}
              <span className="gradient-text">investment intelligence.</span>
            </span>
            <span className="block text-4xl md:text-5xl lg:text-6xl text-muted-foreground/80 mt-3">
              Stop losing it.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="hero-sub max-w-2xl mx-auto text-lg text-muted-foreground leading-relaxed">
            Conviction captures your post-call reasoning, researches companies from scratch, scores
            thesis fit, generates IC memos, and builds a permanent deal memory — so your team
            never debates "why did we pass?" again.
          </p>

          {/* CTAs */}
          <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="conviction"
              size="lg"
              className="h-12 px-8 text-base shadow-lg"
              onClick={() => navigate('/login')}
            >
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base"
              onClick={() => navigate('/dashboard')}
            >
              <Building2 className="h-4 w-4" />
              View live demo
            </Button>
          </div>

          {/* Trust signals */}
          <div className="hero-cta flex items-center justify-center gap-5 text-xs text-muted-foreground">
            {['No credit card', 'Private & secure', 'Works with any VC workflow'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>

          {/* Product preview — tabbed */}
          <div className="hero-preview relative mt-8 mx-auto max-w-4xl w-full">
            {/* Tab switcher */}
            <div className="flex justify-center gap-1 mb-4">
              {([
                { id: 'voice', label: 'Post-Call Brain Dump', icon: Mic },
                { id: 'research', label: 'Startup Intelligence', icon: Globe },
                { id: 'memory', label: 'Deal Memory', icon: Brain },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeTab === id
                      ? 'border-conviction-500/40 bg-conviction-500/12 text-conviction-300'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </button>
              ))}
            </div>

            {/* Preview window */}
            <div className="relative rounded-xl border border-border overflow-hidden shadow-2xl surface-elevated">
              {/* Window chrome */}
              <div className="bg-surface-1 border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/50" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/50" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 rounded-md bg-surface-2 flex items-center px-3">
                    <span className="text-xs text-muted-foreground">
                      {activeTab === 'voice' && 'conviction.vc/calls/new'}
                      {activeTab === 'research' && 'conviction.vc/startup-intelligence'}
                      {activeTab === 'memory' && 'conviction.vc/companies/shipstack'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {activeTab === 'voice' && (
                  <motion.div
                    key="voice"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="bg-background p-5 grid grid-cols-12 gap-4 min-h-[300px]"
                  >
                    <div className="col-span-3 space-y-1">
                      {['Dashboard', 'Companies', 'Log Call', 'Memory', 'Startup Intel'].map((item, i) => (
                        <div key={item} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${i === 2 ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground'}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${i === 2 ? 'bg-conviction-400' : 'bg-transparent'}`} />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="col-span-9 space-y-3">
                      <p className="text-xs font-semibold text-foreground">Post-Call Brain Dump</p>
                      <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                          <Mic className="h-3.5 w-3.5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">Recording in progress…</p>
                          <p className="text-2xs text-red-400 mt-0.5">● 0:47 — ShipStack founder call</p>
                        </div>
                      </div>
                      <div className="rounded-md border border-border bg-card p-3 space-y-2">
                        <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">AI Extraction — Live</p>
                        {[
                          { label: 'Recommendation', value: 'Invest', color: 'text-emerald-400' },
                          { label: 'Confidence', value: '78%', color: 'text-conviction-300' },
                          { label: 'Thesis Fit Score', value: '88/100', color: 'text-blue-400' },
                        ].map((stat) => (
                          <div key={stat.label} className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{stat.label}</span>
                            <span className={`text-xs font-semibold ${stat.color}`}>{stat.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-md border border-conviction-500/20 bg-conviction-500/5 p-2.5">
                        <p className="text-2xs text-conviction-300 leading-relaxed line-clamp-2">
                          "Strong founder-market fit. Arjun has deep logistics expertise, Rohan brings the GTM. Revenue growing 3x YoY. Moat defensible through proprietary carrier relationships."
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'research' && (
                  <motion.div
                    key="research"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="bg-background p-5 grid grid-cols-12 gap-4 min-h-[300px]"
                  >
                    <div className="col-span-3 space-y-1">
                      {['Dashboard', 'Companies', 'Log Call', 'Memory', 'Startup Intel'].map((item, i) => (
                        <div key={item} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${i === 4 ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground'}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${i === 4 ? 'bg-conviction-400' : 'bg-transparent'}`} />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="col-span-9 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-7 rounded-md bg-surface-2 flex items-center px-2.5">
                          <Globe className="h-3 w-3 text-muted-foreground mr-1.5" />
                          <span className="text-xs text-muted-foreground">emergentlabs.ai</span>
                        </div>
                        <div className="rounded-md bg-conviction-500/15 border border-conviction-500/30 px-2.5 h-7 flex items-center text-xs text-conviction-300 font-medium">Analyse</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Founders', value: 'Priya K., Rahul M.', icon: '👤' },
                          { label: 'Stage', value: 'Seed · $3.2M raised', icon: '💰' },
                          { label: 'Thesis Fit', value: '94 / 100', icon: '🎯' },
                          { label: 'Competitors', value: 'Scale AI, Labelbox', icon: '⚔️' },
                        ].map((item) => (
                          <div key={item.label} className="rounded-md border border-border bg-card p-2">
                            <p className="text-2xs text-muted-foreground">{item.icon} {item.label}</p>
                            <p className="text-xs font-medium text-foreground mt-0.5 truncate">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                        <p className="text-2xs font-medium text-emerald-400 mb-1">AI Synthesis</p>
                        <p className="text-2xs text-foreground/80 leading-relaxed line-clamp-2">
                          Strong founder-market fit. Priya's Google Brain background directly addresses the data quality problem. $180K ARR from 3 F500 customers validates enterprise demand.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'memory' && (
                  <motion.div
                    key="memory"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="bg-background p-5 grid grid-cols-12 gap-4 min-h-[300px]"
                  >
                    <div className="col-span-3 space-y-1">
                      {['Dashboard', 'Companies', 'Log Call', 'Memory', 'Startup Intel'].map((item, i) => (
                        <div key={item} className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${i === 1 ? 'bg-secondary text-foreground font-medium' : 'text-muted-foreground'}`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${i === 1 ? 'bg-conviction-400' : 'bg-transparent'}`} />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="col-span-9 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">ShipStack · Deal Timeline</p>
                        <span className="text-2xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">Active</span>
                      </div>
                      <div className="space-y-1.5 pl-3 relative">
                        <div className="absolute left-0 top-1 bottom-1 w-px bg-border" />
                        {[
                          { type: 'Decision', title: 'Recommend: Invest · 82% confidence', date: 'Jun 5', color: 'bg-conviction-400' },
                          { type: 'Call Note', title: 'Unit economics improving. CAC dropped 40%', date: 'May 22', color: 'bg-blue-400' },
                          { type: 'Concern', title: 'Fundraising timing vs. product maturity', date: 'May 10', color: 'bg-amber-400' },
                          { type: 'Milestone', title: 'First enterprise customer signed — $180K ARR', date: 'Apr 28', color: 'bg-emerald-400' },
                        ].map((entry) => (
                          <div key={entry.title} className="flex gap-2.5 relative">
                            <div className={`absolute -left-4 top-1.5 h-2 w-2 rounded-full ${entry.color} border border-background`} />
                            <div className="rounded border border-border bg-card px-2.5 py-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-2xs text-muted-foreground uppercase tracking-wide">{entry.type}</span>
                                <span className="text-2xs text-muted-foreground ml-auto flex-shrink-0">{entry.date}</span>
                              </div>
                              <p className="text-xs text-foreground leading-snug truncate">{entry.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom gradient fade */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Scroll hint */}
          <div className="hero-scroll flex flex-col items-center gap-2 pt-2 text-muted-foreground">
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section className="stats-section py-20 px-6 border-y border-border/50 bg-surface-1/30">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
          {STATS.map((stat) => (
            <StatCounter key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* ── Problem ───────────────────────────────────────────────── */}
      <section className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 problem-fragment">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">The Problem</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              The reasoning disappears.{' '}
              <span className="text-muted-foreground">Every time.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Investment professionals meet 5–15 founders every week. The insights from those conversations are invaluable — and almost all of them evaporate within 72 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Why did we pass on this?', context: '3 months after a strong initial call', icon: '🤔' },
              { label: "What were our concerns back in March?", context: 'Preparing for IC meeting', icon: '😰' },
              { label: "Did we ever follow up about their GTM pivot?", context: 'After a founder re-engages', icon: '📋' },
              { label: "I had a strong thesis here but I can't remember it", context: 'Reviewing a company with LP', icon: '💭' },
            ].map((item) => (
              <div key={item.label} className="problem-fragment rounded-xl border border-border bg-card p-5 flex gap-4 hover:border-border/80 transition-colors">
                <div className="text-2xl flex-shrink-0">{item.icon}</div>
                <div>
                  <p className="text-sm font-medium text-foreground">"{item.label}"</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.context}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="problem-fragment mt-8 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <p className="text-sm font-semibold text-foreground">This is not a transcription problem.</p>
            <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed">
              Recording meetings doesn't help if you never re-watch them. The insight needs to be structured and retrievable — immediately after the conversation. That's what Conviction does.
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-surface-1/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="feature-card text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Platform Capabilities</p>
            <h2 className="feature-card text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Six ways Conviction makes you
              <br />
              <span className="gradient-text">a better investor.</span>
            </h2>
            <p className="feature-card text-muted-foreground max-w-xl mx-auto">
              Every feature is built around how VC professionals actually work — not how software companies think they should.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className={`feature-card group relative rounded-xl border bg-card p-6 overflow-hidden transition-all duration-200 hover:shadow-card-hover cursor-default ${feature.accent}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${feature.accent}`} />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.iconBg}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`text-2xs font-semibold rounded-full border px-2 py-0.5 ${feature.tagColor}`}>
                        {feature.tag}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="how-step text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">How It Works</p>
            <h2 className="how-step text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              From raw thoughts to deal memory
              <br />
              <span className="text-muted-foreground">in under 60 seconds.</span>
            </h2>
          </div>

          <div className="space-y-0">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="how-step relative flex gap-8 pb-14 last:pb-0">
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="absolute left-6 top-14 bottom-0 w-px bg-gradient-to-b from-border to-transparent" />
                  )}
                  <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-card">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="pt-2 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-mono text-muted-foreground/50">{step.step}</span>
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                      <span className="text-2xs text-muted-foreground border border-border rounded-full px-2 py-0.5 hidden sm:inline">
                        {step.detail}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── AI Models section ─────────────────────────────────────── */}
      <section className="py-20 px-6 bg-surface-1/30 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 problem-fragment">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Powered by</p>
            <h3 className="text-xl font-semibold text-foreground">
              Best-in-class AI models, optimised for venture capital
            </h3>
          </div>
          <div className="problem-fragment grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Whisper v3 Turbo', role: 'Voice transcription', provider: 'Hugging Face', icon: Mic },
              { name: 'Gemini 2.5 Flash', role: 'Deal intelligence', provider: 'Google', icon: Sparkles },
              { name: 'Gemini 2.5 Flash', role: 'Startup research', provider: 'Google + Grounding', icon: Search },
              { name: 'Qwen 2.5 7B', role: 'Structured extraction', provider: 'Open Source', icon: BarChart3 },
            ].map((model) => {
              const Icon = model.icon
              return (
                <div key={model.name + model.role} className="rounded-xl border border-border bg-card p-4 text-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary mx-auto mb-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs font-semibold text-foreground">{model.name}</p>
                  <p className="text-2xs text-muted-foreground mt-1">{model.role}</p>
                  <p className="text-2xs text-conviction-300/70 mt-1">{model.provider}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────── */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="testimonial-card text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Early Partners</p>
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
                className="testimonial-card group rounded-xl border border-border bg-card p-6 flex flex-col hover:border-conviction-500/20 transition-colors duration-200"
              >
                <Quote className="h-5 w-5 text-conviction-400/50 mb-4 flex-shrink-0 group-hover:text-conviction-400/80 transition-colors" />
                <p className="text-sm text-foreground leading-relaxed flex-1 mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-conviction-500/15 text-conviction-300 text-xs font-semibold flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground leading-tight">{t.author}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.fund}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-conviction-500/8 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[200px] rounded-full bg-blue-500/5 blur-[80px] pointer-events-none" />

        <div className="cta-content relative z-10 max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-conviction-500/20 bg-conviction-500/8 px-4 py-1.5 text-xs font-medium text-conviction-300">
            <Shield className="h-3 w-3" />
            Private, secure, and built for professional investment teams
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-[1.08]">
            Stop losing the reasoning
            <br />
            <span className="gradient-text">behind every decision.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
            Join VC teams using Conviction to capture, structure, and preserve deal intelligence across their entire pipeline.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="conviction"
              size="lg"
              className="h-12 px-8 text-base shadow-lg"
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
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
            {['No credit card required', 'Private & secure', '6 AI-powered features', 'Cancel anytime'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-conviction">
              <TrendingUp className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-foreground">Conviction</span>
            <span className="text-xs text-muted-foreground">— Deal Intelligence for VC</span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Never lose the reasoning behind an investment decision.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button onClick={() => navigate('/login')} className="hover:text-foreground transition-colors">Sign in</button>
            <button onClick={() => navigate('/dashboard')} className="hover:text-foreground transition-colors">Demo</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
