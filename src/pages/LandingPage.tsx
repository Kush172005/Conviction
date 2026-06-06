import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  Globe,
  Mic,
  Quote,
  Sparkles,
  Zap,
  Building2,
  FileText,
  Search,
  Shield,
  Target,
  ChevronDown,
  Loader2,
  CircleHelp,
  AlertTriangle,
  ClipboardList,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoMark from "@/components/LogoMark";
import ScrollProgress from "@/components/motion/ScrollProgress";
import TiltCard from "@/components/motion/TiltCard";
import MagneticButton from "@/components/motion/MagneticButton";
import Marquee from "@/components/motion/Marquee";
import { useAuthStore } from "@/store";
import { authApi, mapBackendUser } from "@/services/api/auth";
import { getFriendlyApiError } from "@/lib/apiErrors";

gsap.registerPlugin(ScrollTrigger, useGSAP);

// ─── Data ────────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Mic,
    title: "Post-Call Brain Dump",
    description:
      "Hit record right after a founder call and speak freely. In under 60 seconds, your raw thoughts become a fully structured investment brief — with every signal that matters, none that doesn't.",
    tag: "Voice + Notes",
    accent: "from-red-500/15 to-red-500/3 border-red-500/20",
    iconBg: "bg-red-500/10 text-red-400",
    tagColor: "bg-red-500/10 text-red-400 border-red-500/20",
    glowColor: "shadow-[0_0_30px_hsl(0_72%_51%/0.08)]",
  },
  {
    icon: Search,
    title: "Startup Intelligence",
    description:
      "Enter any company URL. Conviction digs deep across the web and curates what matters for your thesis — founders, funding history, market position, and fit — surfaced in minutes, not hours.",
    tag: "Deep Research",
    accent: "from-blue-500/15 to-blue-500/3 border-blue-500/20",
    iconBg: "bg-blue-500/10 text-blue-400",
    tagColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    glowColor: "shadow-[0_0_30px_hsl(220_80%_60%/0.08)]",
  },
  {
    icon: Target,
    title: "Fund Thesis Match Engine",
    description:
      "Every company gets scored 0–100 against your fund's thesis — sector, stage, geography, and business model alignment — with specific, written reasons behind every point.",
    tag: "Thesis Scoring",
    accent:
      "from-conviction-500/15 to-conviction-500/3 border-conviction-500/20",
    iconBg: "bg-conviction-500/10 text-conviction-400",
    tagColor:
      "bg-conviction-500/10 text-conviction-300 border-conviction-500/20",
    glowColor: "shadow-[0_0_30px_hsl(248_92%_68%/0.1)]",
  },
  {
    icon: Brain,
    title: "Persistent Deal Memory",
    description:
      "A living intelligence timeline per company. See exactly how your conviction evolved from first call to term sheet. Every insight, concern, and milestone — permanently on record.",
    tag: "Memory Layer",
    accent: "from-emerald-500/15 to-emerald-500/3 border-emerald-500/20",
    iconBg: "bg-emerald-500/10 text-emerald-400",
    tagColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    glowColor: "shadow-[0_0_30px_hsl(160_84%_39%/0.08)]",
  },
  {
    icon: FileText,
    title: "IC Memo Generation",
    description:
      "From raw notes to a complete IC memo. Strengths, concerns, moat analysis, red flags, diligence questions, market sizing, and a clear recommendation — ready to share in minutes.",
    tag: "Auto Memos",
    accent: "from-amber-500/15 to-amber-500/3 border-amber-500/20",
    iconBg: "bg-amber-500/10 text-amber-400",
    tagColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    glowColor: "shadow-[0_0_30px_hsl(45_93%_47%/0.08)]",
  },
  {
    icon: Zap,
    title: "Automated Follow-Up Engine",
    description:
      "Every commitment you made on the call is captured and tracked. Draft follow-up emails are written for you, and overdue items surface before they become dropped balls.",
    tag: "Action Engine",
    accent: "from-purple-500/15 to-purple-500/3 border-purple-500/20",
    iconBg: "bg-purple-500/10 text-purple-400",
    tagColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    glowColor: "shadow-[0_0_30px_hsl(270_95%_75%/0.08)]",
  },
];

const STATS = [
  { value: 60, suffix: "s", label: "Brain dump → structured investment brief" },
  { value: 100, suffix: "+", label: "Signals surfaced per company" },
  {
    value: 0,
    suffix: " notes lost",
    label: "With Conviction in your workflow",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    icon: Mic,
    title: "Capture in any format",
    description:
      "Type a quick brain dump, record a voice memo, or upload the full meeting audio — Conviction accepts everything, exactly as it comes out of your head.",
    detail: "Voice · Text · Recording",
  },
  {
    step: "02",
    icon: Sparkles,
    title: "Your notes become a deal brief",
    description:
      "In seconds, your raw input is shaped into a complete investment brief — deal summary, founder assessment, thesis fit score, red flags, strengths, concerns, and a draft IC recommendation.",
    detail: "Instant · Structured · IC-Ready",
  },
  {
    step: "03",
    icon: Brain,
    title: "Build a permanent deal record",
    description:
      "Every call becomes a timestamped entry in your investment memory. Three months later, you'll know exactly where you stood, precisely why, and what you promised to follow up on.",
    detail: "Timeline · IC Memos · Memory",
  },
];

const PROBLEM_CARDS = [
  {
    label: "Why did we pass on this?",
    context: "3 months after a strong initial call",
    icon: CircleHelp,
    accent: "border-amber-500/25 bg-amber-500/5",
    iconColor: "text-amber-400 bg-amber-500/15",
  },
  {
    label: "What were our concerns back in March?",
    context: "Preparing for IC meeting",
    icon: AlertTriangle,
    accent: "border-red-500/25 bg-red-500/5",
    iconColor: "text-red-400 bg-red-500/15",
  },
  {
    label: "Did we ever follow up about their GTM pivot?",
    context: "After a founder re-engages",
    icon: ClipboardList,
    accent: "border-blue-500/25 bg-blue-500/5",
    iconColor: "text-blue-400 bg-blue-500/15",
  },
  {
    label: "I had a strong thesis here but I can't remember it",
    context: "Reviewing a company with LP",
    icon: MessageCircle,
    accent: "border-conviction-500/25 bg-conviction-500/5",
    iconColor: "text-conviction-300 bg-conviction-500/15",
  },
] as const;

const TESTIMONIALS = [
  {
    quote:
      "We tracked 200+ companies last year. By Q3, half our team couldn't remember why we passed on deals we'd spent weeks evaluating. Conviction solved that.",
    author: "Partner at a Series A fund",
    fund: "Top 10 fintech-focused VC",
    initials: "PA",
  },
  {
    quote:
      "The startup intelligence feature saves us 3–4 hours per company. Point it at a URL and get a full diligence brief in minutes. Thesis fit scoring is insanely useful.",
    author: "Principal, Growth Equity",
    fund: "$2B AUM fund",
    initials: "PG",
  },
  {
    quote:
      "Deal continuity is the unsexy problem nobody talks about. Conviction made it disappear. We ship better memos, faster, with full audit trails.",
    author: "VP of Investments",
    fund: "Early-stage consumer fund",
    initials: "VP",
  },
  {
    quote:
      "I used to dread IC prep — digging through Notion, Slack, email to reconstruct why we were even looking at something. Now it's all there, structured, in 60 seconds.",
    author: "Associate, B2B SaaS fund",
    fund: "$500M Series B focus",
    initials: "AS",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  className = "",
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-8%" });

  return (
    <motion.div
      ref={ref}
      className={`text-center mb-10 md:mb-12 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="inline-flex items-center gap-2 mb-3">
        <span className="h-px w-8 bg-gradient-to-r from-transparent to-conviction-500/50" />
        <p className="text-[11px] font-semibold text-conviction-300 uppercase tracking-[0.2em]">
          {eyebrow}
        </p>
        <span className="h-px w-8 bg-gradient-to-l from-transparent to-conviction-500/50" />
      </div>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mt-3 leading-relaxed">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

function StatCounter({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-10%" });

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!ref.current) return;
      gsap.from(ref.current, {
        textContent: 0,
        duration: 2,
        ease: "power3.out",
        snap: { textContent: 1 },
        scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
      });
    });
  });

  return (
    <motion.div
      ref={containerRef}
      className="text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-end justify-center gap-0.5">
        <span
          ref={ref}
          className="text-5xl font-semibold tabular-nums gradient-text gradient-text-safe leading-none"
        >
          {value}
        </span>
        <span className="text-2xl font-semibold text-muted-foreground leading-none pb-1">
          {suffix}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </motion.div>
  );
}

function HowItWorksStep({
  step,
  icon: Icon,
  title,
  description,
  detail,
  isLast,
}: (typeof HOW_IT_WORKS)[0] & { isLast: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });
  const lineRef = useRef<HTMLDivElement>(null);
  const lineInView = useInView(lineRef, { once: true, margin: "-20%" });

  return (
    <motion.div
      ref={ref}
      className="relative flex gap-5 pb-8 last:pb-0"
      initial={{ opacity: 0, x: -24 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {!isLast && (
        <motion.div
          ref={lineRef}
          className="absolute left-6 top-14 bottom-0 w-px bg-gradient-to-b from-border to-transparent origin-top connector-line"
          initial={{ scaleY: 0 }}
          animate={lineInView ? { scaleY: 1 } : {}}
          transition={{ duration: 0.9, ease: "easeInOut", delay: 0.3 }}
        />
      )}
      <motion.div
        className="flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border border-conviction-500/25 bg-gradient-to-br from-conviction-500/15 to-transparent shadow-[0_0_24px_hsl(248_92%_68%/0.08)]"
        whileHover={{ scale: 1.08, borderColor: "hsl(248 92% 68% / 0.5)" }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Icon className="h-5 w-5 text-conviction-300" />
      </motion.div>
      <div className="pt-1 min-w-0">
        <div className="flex items-center gap-3 mb-1.5 flex-wrap">
          <span className="text-[10px] font-mono font-semibold text-conviction-400/80">
            {step}
          </span>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <span className="text-2xs text-muted-foreground border border-border rounded-full px-2 py-0.5 hidden sm:inline">
            {detail}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<"voice" | "research" | "memory">(
    "voice"
  );
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const login = useAuthStore((s) => s.login);

  async function handleDemoAccess() {
    const { isAuthenticated, isDemo } = useAuthStore.getState();
    if (isAuthenticated && isDemo) {
      navigate("/dashboard");
      return;
    }
    setDemoLoading(true);
    setDemoError(null);
    try {
      const tokenResponse = await authApi.mockLogin();
      useAuthStore.setState({
        token: tokenResponse.access_token,
        isAuthenticated: true,
      });
      const backendUser = await authApi.getMe();
      login(mapBackendUser(backendUser), tokenResponse.access_token, true);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setDemoError(
        getFriendlyApiError(
          err,
          "demo",
          "Couldn't load the demo. Please try again in a moment."
        )
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setDemoLoading(false);
    }
  }

  // Scroll-based nav shadow
  const { scrollY } = useScroll();
  const navShadowOpacity = useTransform(scrollY, [0, 60], [0, 1]);

  // Hero glow parallax via Framer Motion (smoother than GSAP scrub)
  const { scrollYProgress: heroProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "30% start"],
  });
  const glowY = useTransform(heroProgress, [0, 1], ["0%", "-18%"]);
  const glowScale = useTransform(heroProgress, [0, 1], [1, 1.15]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Stats counter section
        gsap.from(".stats-section", {
          autoAlpha: 0,
          y: 24,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".stats-section",
            start: "top 85%",
            once: true,
          },
        });

        // Problem fragments
        ScrollTrigger.batch(".problem-fragment", {
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { autoAlpha: 0, y: 20 },
              {
                autoAlpha: 1,
                y: 0,
                stagger: 0.09,
                duration: 0.55,
                ease: "power2.out",
              }
            ),
          start: "top 87%",
          once: true,
        });

        // Feature cards — keep for non-TiltCard fallback
        ScrollTrigger.batch(".feature-card", {
          onEnter: (els) =>
            gsap.fromTo(
              els,
              { autoAlpha: 0, y: 28 },
              {
                autoAlpha: 1,
                y: 0,
                stagger: 0.07,
                duration: 0.5,
                ease: "power2.out",
              }
            ),
          start: "top 89%",
          once: true,
        });

        // CTA section
        gsap.from(".cta-content", {
          autoAlpha: 0,
          y: 28,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".cta-content",
            start: "top 85%",
            once: true,
          },
        });
      });
    },
    { scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background text-foreground overflow-x-hidden"
    >
      <ScrollProgress />

      {/* ── Nav ───────────────────────────────────────────────────── */}
      <motion.nav
        style={{ "--nav-shadow": navShadowOpacity } as React.CSSProperties}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40"
        animate={{ borderBottomColor: "hsl(var(--border) / 0.4)" }}
      >
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            opacity: navShadowOpacity,
            boxShadow:
              "0 1px 0 hsl(var(--border)/0.6), 0 4px 24px hsl(0 0% 0%/0.25)",
          }}
        />
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between relative z-10">
          <motion.div
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-conviction">
              <LogoMark className="h-4 w-4" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              Conviction
            </span>
            <span className="hidden sm:inline-flex items-center rounded-full border border-conviction-500/20 bg-conviction-500/8 px-2 py-0.5 text-2xs font-medium text-conviction-300 ml-1">
              for VC
            </span>
          </motion.div>
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
              className="text-muted-foreground hover:text-foreground hidden sm:flex"
            >
              Sign in
            </Button>
            <MagneticButton strength={0.25}>
              <Button
                variant="conviction"
                size="sm"
                onClick={() => navigate("/login")}
              >
                Get access
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </MagneticButton>
          </motion.div>
        </div>
      </motion.nav>

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-10 md:pt-28 md:pb-12 px-6 overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-20 pointer-events-none" />
        <motion.div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(100%,720px)] h-[420px] rounded-full opacity-80 pointer-events-none"
          style={{
            y: glowY,
            scale: glowScale,
            background:
              "radial-gradient(ellipse at center, hsl(248 92% 68% / 0.12) 0%, hsl(248 92% 68% / 0.04) 45%, transparent 70%)",
          }}
        />
        <motion.div
          className="absolute top-10 right-[10%] w-[240px] h-[240px] rounded-full opacity-60 pointer-events-none float-fast"
          style={{
            background:
              "radial-gradient(circle, hsl(220 80% 60% / 0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          <div className="hero-fade-in inline-flex items-center gap-2 rounded-full border border-conviction-500/25 bg-conviction-500/8 px-4 py-1.5 text-xs font-medium text-conviction-300">
            <Sparkles className="h-3 w-3" />
            Deal intelligence for venture capital
          </div>

          <h1 className="hero-fade-in hero-fade-in-delay-1 text-balance font-semibold tracking-tight leading-[1.06]">
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] text-foreground">
              Every founder call generates{" "}
              <span className="text-conviction-300">
                investment intelligence.
              </span>
            </span>
            <span className="block text-3xl sm:text-4xl md:text-5xl text-muted-foreground/75 mt-2">
              Stop losing it.
            </span>
          </h1>

          <p className="hero-fade-in hero-fade-in-delay-2 max-w-xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
            Capture post-call reasoning, research any startup, score thesis fit,
            and build a permanent deal memory — so your team never asks
            &ldquo;why did we pass?&rdquo; again.
          </p>

          <div className="hero-fade-in hero-fade-in-delay-3 flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <MagneticButton strength={0.4}>
              <Button
                variant="conviction"
                size="lg"
                className="h-11 px-7 text-base shadow-lg ring-pulse"
                onClick={() => navigate("/login")}
              >
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </MagneticButton>
            <MagneticButton strength={0.3}>
              <Button
                variant="outline"
                size="lg"
                className="h-11 px-7 text-base"
                onClick={handleDemoAccess}
                disabled={demoLoading}
              >
                {demoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                View live demo
              </Button>
            </MagneticButton>
          </div>

          {demoError && (
            <div className="hero-fade-in max-w-md mx-auto flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-left text-xs text-amber-200/90">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{demoError}</span>
            </div>
          )}

          <div className="hero-fade-in hero-fade-in-delay-4 flex items-center justify-center gap-4 text-xs text-muted-foreground flex-wrap">
            {["No credit card", "Private & secure", "Built for VC teams"].map(
              (item) => (
                <div key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  {item}
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Product preview ───────────────────────────────────────── */}
      <section className="relative px-6 pb-10 md:pb-14">
        <div className="max-w-4xl mx-auto">
          <div className="hero-fade-in hero-fade-in-delay-5 relative w-full">
            <div className="flex justify-center gap-1 mb-3">
              {(
                [
                  { id: "voice", label: "Post-Call Brain Dump", icon: Mic },
                  {
                    id: "research",
                    label: "Startup Intelligence",
                    icon: Globe,
                  },
                  { id: "memory", label: "Deal Memory", icon: Brain },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <motion.button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    activeTab === id
                      ? "border-conviction-500/40 bg-conviction-500/12 text-conviction-300"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {label}
                </motion.button>
              ))}
            </div>

            <div className="relative rounded-xl border border-border/80 overflow-hidden shadow-2xl surface-elevated ring-1 ring-conviction-500/10">
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
                      {activeTab === "voice" && "conviction.vc/calls/new"}
                      {activeTab === "research" &&
                        "conviction.vc/startup-intelligence"}
                      {activeTab === "memory" &&
                        "conviction.vc/companies/shipstack"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {activeTab === "voice" && (
                  <motion.div
                    key="voice"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-background p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-4 min-h-[300px]"
                  >
                    <div className="hidden sm:block sm:col-span-3 space-y-1">
                      {[
                        "Dashboard",
                        "Pipeline",
                        "Log a Call",
                        "Deal Memory",
                        "Research",
                      ].map((item, i) => (
                        <div
                          key={item}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
                            i === 2
                              ? "bg-secondary text-foreground font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              i === 2 ? "bg-conviction-400" : "bg-transparent"
                            }`}
                          />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="sm:col-span-9 space-y-3">
                      <p className="text-xs font-semibold text-foreground">
                        Post-Call Brain Dump
                      </p>
                      <div className="rounded-md border border-red-500/20 bg-red-500/5 p-3 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 recording-active">
                          <Mic className="h-3.5 w-3.5 text-red-400" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            Recording in progress…
                          </p>
                          <p className="text-2xs text-red-400 mt-0.5">
                            ● 0:47 — ShipStack founder call
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md border border-border bg-card p-3 space-y-2">
                        <p className="text-2xs font-medium text-muted-foreground uppercase tracking-wider">
                          Deal brief — live
                        </p>
                        {[
                          {
                            label: "Recommendation",
                            value: "Invest",
                            color: "text-emerald-400",
                          },
                          {
                            label: "Confidence",
                            value: "78%",
                            color: "text-conviction-300",
                          },
                          {
                            label: "Thesis Fit Score",
                            value: "88/100",
                            color: "text-blue-400",
                          },
                        ].map((stat) => (
                          <div
                            key={stat.label}
                            className="flex items-center justify-between"
                          >
                            <span className="text-xs text-muted-foreground">
                              {stat.label}
                            </span>
                            <span
                              className={`text-xs font-semibold ${stat.color}`}
                            >
                              {stat.value}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-md border border-conviction-500/20 bg-conviction-500/5 p-2.5">
                        <p className="text-2xs text-conviction-300 leading-relaxed line-clamp-2">
                          "Strong founder-market fit. Arjun has deep logistics
                          expertise, Rohan brings the GTM. Revenue growing 3x
                          YoY. Moat defensible through proprietary carrier
                          relationships."
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "research" && (
                  <motion.div
                    key="research"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-background p-5 grid grid-cols-12 gap-4 min-h-[300px]"
                  >
                    <div className="col-span-3 space-y-1">
                      {[
                        "Dashboard",
                        "Pipeline",
                        "Log a Call",
                        "Deal Memory",
                        "Research",
                      ].map((item, i) => (
                        <div
                          key={item}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
                            i === 4
                              ? "bg-secondary text-foreground font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              i === 4 ? "bg-conviction-400" : "bg-transparent"
                            }`}
                          />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="col-span-9 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-7 rounded-md bg-surface-2 flex items-center px-2.5">
                          <Globe className="h-3 w-3 text-muted-foreground mr-1.5" />
                          <span className="text-xs text-muted-foreground">
                            emergentlabs.ai
                          </span>
                        </div>
                        <div className="rounded-md bg-conviction-500/15 border border-conviction-500/30 px-2.5 h-7 flex items-center text-xs text-conviction-300 font-medium">
                          Analyse
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          {
                            label: "Founders",
                            value: "Priya K., Rahul M.",
                            icon: "👤",
                          },
                          {
                            label: "Stage",
                            value: "Seed · $3.2M raised",
                            icon: "💰",
                          },
                          {
                            label: "Thesis Fit",
                            value: "94 / 100",
                            icon: "🎯",
                          },
                          {
                            label: "Competitors",
                            value: "Scale AI, Labelbox",
                            icon: "⚔️",
                          },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-md border border-border bg-card p-2"
                          >
                            <p className="text-2xs text-muted-foreground">
                              {item.icon} {item.label}
                            </p>
                            <p className="text-xs font-medium text-foreground mt-0.5 truncate">
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                        <p className="text-2xs font-medium text-emerald-400 mb-1">
                          Research summary
                        </p>
                        <p className="text-2xs text-foreground/80 leading-relaxed line-clamp-2">
                          Strong founder-market fit. Priya's Google Brain
                          background directly addresses the data quality
                          problem. $180K ARR from 3 F500 customers validates
                          enterprise demand.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "memory" && (
                  <motion.div
                    key="memory"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-background p-5 grid grid-cols-12 gap-4 min-h-[300px]"
                  >
                    <div className="col-span-3 space-y-1">
                      {[
                        "Dashboard",
                        "Pipeline",
                        "Log a Call",
                        "Deal Memory",
                        "Research",
                      ].map((item, i) => (
                        <div
                          key={item}
                          className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs ${
                            i === 1
                              ? "bg-secondary text-foreground font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              i === 1 ? "bg-conviction-400" : "bg-transparent"
                            }`}
                          />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="col-span-9 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-foreground">
                          ShipStack · Deal Timeline
                        </p>
                        <span className="text-2xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                          Active
                        </span>
                      </div>
                      <div className="space-y-1.5 pl-3 relative">
                        <div className="absolute left-0 top-1 bottom-1 w-px bg-border" />
                        {[
                          {
                            type: "Decision",
                            title: "Recommend: Invest · 82% confidence",
                            date: "Jun 5",
                            color: "bg-conviction-400",
                          },
                          {
                            type: "Call Note",
                            title: "Unit economics improving. CAC dropped 40%",
                            date: "May 22",
                            color: "bg-blue-400",
                          },
                          {
                            type: "Concern",
                            title: "Fundraising timing vs. product maturity",
                            date: "May 10",
                            color: "bg-amber-400",
                          },
                          {
                            type: "Milestone",
                            title:
                              "First enterprise customer signed — $180K ARR",
                            date: "Apr 28",
                            color: "bg-emerald-400",
                          },
                        ].map((entry) => (
                          <div
                            key={entry.title}
                            className="flex gap-2.5 relative"
                          >
                            <div
                              className={`absolute -left-4 top-1.5 h-2 w-2 rounded-full ${entry.color} border border-background`}
                            />
                            <div className="rounded border border-border bg-card px-2.5 py-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-2xs text-muted-foreground uppercase tracking-wide">
                                  {entry.type}
                                </span>
                                <span className="text-2xs text-muted-foreground ml-auto flex-shrink-0">
                                  {entry.date}
                                </span>
                              </div>
                              <p className="text-xs text-foreground leading-snug truncate">
                                {entry.title}
                              </p>
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

          <motion.div
            className="flex flex-col items-center gap-1 pt-4 text-muted-foreground/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────── */}
      <section className="stats-section py-10 md:py-12 px-6 border-y border-border/50 bg-gradient-to-b from-surface-1/40 via-surface-1/20 to-transparent">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 divide-y md:divide-y-0 md:divide-x divide-border/50">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="py-4 md:py-0 md:px-6 first:md:pl-0 last:md:pr-0"
            >
              <StatCounter {...stat} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Problem ───────────────────────────────────────────────── */}
      <section className="py-14 md:py-16 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            className="problem-fragment"
            eyebrow="The Problem"
            title={
              <>
                The reasoning disappears.{" "}
                <span className="text-muted-foreground">Every time.</span>
              </>
            }
            subtitle="VC teams meet 5–15 founders a week. The insights from those conversations are invaluable — and almost all of them evaporate within 72 hours."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PROBLEM_CARDS.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  className={`problem-fragment group rounded-xl border p-4 flex gap-3.5 cursor-default transition-all duration-200 ${item.accent}`}
                  whileHover={{
                    y: -3,
                    boxShadow: "0 12px 40px hsl(0 0% 0% / 0.35)",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.iconColor}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug">
                      &ldquo;{item.label}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.context}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            className="problem-fragment mt-5 rounded-xl border border-conviction-500/20 bg-gradient-to-r from-conviction-500/8 via-transparent to-blue-500/5 p-5 md:p-6 text-center"
            whileHover={{ borderColor: "hsl(248 92% 68% / 0.35)" }}
          >
            <p className="text-sm font-semibold text-foreground">
              This isn&apos;t a transcription problem.
            </p>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-lg mx-auto leading-relaxed">
              Recording meetings doesn&apos;t help if you never re-watch them.
              The insight needs to be structured and retrievable — right after
              the conversation. That&apos;s what Conviction does.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────── */}
      <section className="py-14 md:py-16 px-6 bg-surface-1/30 border-y border-border/40">
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            className="feature-card"
            eyebrow="Platform"
            title={
              <>
                Six ways Conviction makes you{" "}
                <span className="gradient-text gradient-text-safe">
                  a better investor.
                </span>
              </>
            }
            subtitle="Every feature is built around how VC professionals actually work — not how software companies think they should."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <TiltCard key={feature.title} intensity={8}>
                  <div
                    className={`feature-card group relative rounded-xl border bg-card p-5 overflow-hidden cursor-default h-full ${feature.accent} ${feature.glowColor} transition-shadow duration-300 hover:shadow-xl`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${feature.accent}`}
                    />
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <motion.div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${feature.iconBg}`}
                          whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }}
                          transition={{ duration: 0.4 }}
                        >
                          <Icon className="h-5 w-5" />
                        </motion.div>
                        <span
                          className={`text-2xs font-semibold rounded-full border px-2 py-0.5 ${feature.tagColor}`}
                        >
                          {feature.tag}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────── */}
      <section className="py-14 md:py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <SectionHeader
            eyebrow="How It Works"
            title={
              <>
                From raw thoughts to deal memory{" "}
                <span className="text-muted-foreground">
                  in under 60 seconds.
                </span>
              </>
            }
          />

          <div className="rounded-2xl border border-border/80 bg-card/50 p-5 md:p-6">
            {HOW_IT_WORKS.map((step, i) => (
              <HowItWorksStep
                key={step.step}
                {...step}
                isLast={i === HOW_IT_WORKS.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials (Marquee) ─────────────────────────────────── */}
      <section className="py-14 md:py-16 px-6 overflow-hidden bg-surface-1/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Early Partners"
            title="Built for how VCs actually work."
            subtitle="Early access partners on what changes when deal reasoning stops disappearing."
          />
        </div>

        <Marquee speed={28} gap={16} className="pb-1">
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.author}
              className="w-72 md:w-80 flex-shrink-0 rounded-xl border border-border/80 bg-card p-5 flex flex-col hover:border-conviction-500/30 hover:bg-card/90 transition-colors duration-200 cursor-default"
              whileHover={{
                y: -4,
                boxShadow: "0 16px 48px hsl(0 0% 0% / 0.4)",
              }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
            >
              <Quote className="h-5 w-5 text-conviction-400/50 mb-4 flex-shrink-0" />
              <p className="text-sm text-foreground leading-relaxed flex-1 mb-6">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-conviction-500/15 text-conviction-300 text-xs font-semibold flex-shrink-0">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground leading-tight">
                    {t.author}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.fund}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </Marquee>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────── */}
      <section className="py-16 md:py-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-15 pointer-events-none" />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(100%,600px)] h-[360px] rounded-full pointer-events-none float-slow"
          style={{
            background:
              "radial-gradient(ellipse at center, hsl(248 92% 68% / 0.14) 0%, hsl(248 92% 68% / 0.04) 50%, transparent 72%)",
          }}
        />

        <div className="cta-content relative z-10 max-w-3xl mx-auto text-center space-y-5">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-conviction-500/20 bg-conviction-500/8 px-4 py-1.5 text-xs font-medium text-conviction-300"
            whileHover={{ scale: 1.04, borderColor: "hsl(248 92% 68% / 0.4)" }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Shield className="h-3 w-3" />
            Private, secure, and built for professional investment teams
          </motion.div>

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-balance leading-[1.08]">
            Stop losing the reasoning{" "}
            <span className="gradient-text gradient-text-safe">
              behind every decision.
            </span>
          </h2>

          <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed">
            Join VC teams using Conviction to capture, structure, and preserve
            deal intelligence across their entire pipeline.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <MagneticButton strength={0.4}>
              <div className="animated-gradient-border rounded-lg">
                <Button
                  variant="conviction"
                  size="lg"
                  className="h-12 px-8 text-base shadow-lg relative z-10"
                  onClick={() => navigate("/login")}
                >
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </MagneticButton>
            <MagneticButton strength={0.3}>
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base"
                onClick={handleDemoAccess}
                disabled={demoLoading}
              >
                {demoLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Explore the demo"
                )}
              </Button>
            </MagneticButton>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-muted-foreground">
            {[
              "No credit card required",
              "Private & secure",
              "6 core features",
              "Cancel anytime",
            ].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="border-t border-border py-6 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-conviction">
              <LogoMark className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Conviction
            </span>
            <span className="text-xs text-muted-foreground">
              — Deal Intelligence for VC
            </span>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Never lose the reasoning behind an investment decision.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button
              onClick={() => navigate("/login")}
              className="hover:text-foreground transition-colors"
            >
              Sign in
            </button>
            <button
              onClick={handleDemoAccess}
              className="hover:text-foreground transition-colors"
            >
              Demo
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
