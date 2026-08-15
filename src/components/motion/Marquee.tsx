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
  pauseOnHover = true,
  className = '',
}: MarqueeProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const childArray = Children.toArray(children)
  const duration = Math.max(22, Math.min(35, 840 / Math.max(speed, 1)))

  useGSAP(
    () => {
      const track = trackRef.current
      const wrap = wrapRef.current
      if (!track || !wrap) return

      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(track, { xPercent: 0, x: 0 })
      })

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.set(track, { xPercent: 0 })
        const tween = gsap.to(track, {
          xPercent: -50,
          duration,
          ease: 'none',
          repeat: -1,
        })
        if (direction === 'right') tween.timeScale(-1)

        if (!pauseOnHover) return

        const pause = () => tween.pause()
        const play = () => tween.play()
        wrap.addEventListener('mouseenter', pause)
        wrap.addEventListener('mouseleave', play)
        return () => {
          wrap.removeEventListener('mouseenter', pause)
          wrap.removeEventListener('mouseleave', play)
        }
      })
    },
    { scope: wrapRef, dependencies: [duration, direction, pauseOnHover] }
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
