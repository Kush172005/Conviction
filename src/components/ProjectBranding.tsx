import LogoMark from '@/components/LogoMark'
import { cn } from '@/lib/utils'

export function ProjectBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/50 px-2.5 py-1 text-2xs font-medium text-muted-foreground backdrop-blur-sm',
        className
      )}
    >
      <span className="text-muted-foreground/70">Venture Capital</span>
      <span className="font-semibold text-foreground">Deal Memory</span>
    </div>
  )
}

export function ProjectPitchStrip({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'py-10 md:py-12 px-6 border-y border-border/40 bg-gradient-to-b from-surface-1/30 to-transparent',
        className
      )}
    >
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Venture Capital Deal Flow & Intelligence Platform
        </p>

        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3.5 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-conviction">
              <LogoMark className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">Conviction</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          A modern deal memory and intelligence platform built to solve the key challenges in a VC firm's daily workflow, spanning call note logging, deal memory synthesis, and automated startup intelligence.
        </p>
      </div>
    </section>
  )
}

export function FooterCredit({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground text-center', className)}>
      Conviction · VC Deal Intelligence Platform · 2026
    </p>
  )
}
