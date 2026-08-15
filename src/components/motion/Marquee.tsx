import { Children } from 'react'
import { cn } from '@/lib/utils'

interface MarqueeProps {
  children: React.ReactNode
  speed?: number
  direction?: 'left' | 'right'
  gap?: number
  pauseOnHover?: boolean
  className?: string
}

export default function Marquee({
  children,
  speed = 40,
  direction = 'left',
  gap = 20,
  pauseOnHover = true,
  className = '',
}: MarqueeProps) {
  const childArray = Children.toArray(children)
  const duration = Math.max(18, 1120 / Math.max(speed, 1))

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{
        maskImage:
          'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
      }}
    >
      <div
        className={cn(
          'marquee-track',
          pauseOnHover && 'marquee-pause-hover',
          direction === 'right' && 'marquee-reverse'
        )}
        style={
          {
            '--marquee-duration': `${duration}s`,
            '--marquee-gap': `${gap}px`,
          } as React.CSSProperties
        }
      >
        <div className="marquee-set">{childArray}</div>
        <div className="marquee-set" aria-hidden="true">
          {childArray}
        </div>
      </div>
    </div>
  )
}
