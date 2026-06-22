import { ArrowUpRight } from 'lucide-react'
import LogoMark from '@/components/LogoMark'
import { cn } from '@/lib/utils'

const RTP_GLOBAL_URL = 'https://rtp.vc'

export function RtpGlobalBadge({ className }: { className?: string }) {
  return (
    <a
      href={RTP_GLOBAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/50 px-2.5 py-1 text-2xs font-medium text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground hover:border-border hover:bg-card',
        className
      )}
    >
      <span className="text-muted-foreground/70">Built for</span>
      <span className="font-semibold text-foreground">RTP Global</span>
      <ArrowUpRight className="h-3 w-3 opacity-50" />
    </a>
  )
}

export function RtpGlobalCoBrandStrip({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'py-10 md:py-12 px-6 border-y border-border/40 bg-gradient-to-b from-surface-1/30 to-transparent',
        className
      )}
    >
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          Case study submission
        </p>

        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-conviction">
              <LogoMark className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">Conviction</span>
          </div>

          <span className="text-muted-foreground/35 text-xl font-light select-none">×</span>

          <a
            href={RTP_GLOBAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 transition-colors hover:border-border hover:bg-card group"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground/90 text-background text-xs font-bold tracking-tight">
              R
            </div>
            {/* <span className="text-sm font-semibold text-foreground group-hover:text-foreground">
              RTP Global
            </span> */}
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>

        <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
          A working prototype built for{' '}
          {/* <a
            href={RTP_GLOBAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground/90 underline-offset-2 hover:underline"
          >
            RTP Global
          </a> */}
          &apos;s case study — pick a real VC problem, ship something useful, show how you think.
        </p>
      </div>
    </section>
  )
}

export function RtpGlobalFooterCredit({ className }: { className?: string }) {
  return (
    <p className={cn('text-xs text-muted-foreground text-center', className)}>
      Built for{' '}
      <a
        href={RTP_GLOBAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-foreground/80 hover:text-foreground transition-colors"
      >
        RTP Global
      </a>
      <span className="text-muted-foreground/50 mx-1.5">·</span>
      Case study 2026
    </p>
  )
}
