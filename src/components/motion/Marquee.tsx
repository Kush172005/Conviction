import { Children, useRef } from 'react'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { cn } from '@/lib/utils'

gsap.registerPlugin(useGSAP)

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
  pauseOnHover = false,
  className = '',
}: MarqueeProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const childArray = Children.toArray(children)

  useGSAP(
    () => {
      const track = trackRef.current
      const firstSet = track?.querySelector('.marquee-set') as HTMLElement | null
      if (!track || !firstSet) return

      let xPos = 0
      const pxPerSecond = Math.max(speed, 24)

      const tick = () => {
        const distance = firstSet.offsetWidth
        if (distance === 0) return
        const delta = (pxPerSecond / 60) * gsap.ticker.deltaRatio(60)
        xPos += direction === 'left' ? -delta : delta
        xPos = gsap.utils.wrap(-distance, 0, xPos)
        gsap.set(track, { x: xPos })
      }

      gsap.ticker.add(tick)
      return () => {
        gsap.ticker.remove(tick)
      }
    },
    { scope: wrapRef, dependencies: [speed, direction, childArray.length] }
  )

  return (
    <div
      ref={wrapRef}
      className={cn('marquee-root relative overflow-hidden', className)}
      style={{
        '--marquee-gap': `${gap}px`,
        maskImage:
          'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
      } as React.CSSProperties}
    >
      <div ref={trackRef} className="marquee-track">
        <div className="marquee-set">{childArray}</div>
        <div className="marquee-set" aria-hidden="true">
          {childArray}
        </div>
      </div>
    </div>
  )
}
