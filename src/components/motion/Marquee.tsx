import { useRef, Children } from 'react'
import { motion, useAnimationFrame, useMotionValue } from 'framer-motion'

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
  const innerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)
  const currentX = useRef(0)
  const paused = useRef(false)

  useAnimationFrame((_, delta) => {
    if (paused.current || !innerRef.current) return
    const halfW = innerRef.current.scrollWidth / 2
    if (halfW === 0) return
    const step = (speed * delta) / 1000
    currentX.current += direction === 'left' ? -step : step
    if (currentX.current <= -halfW) currentX.current += halfW
    if (currentX.current >= 0) currentX.current -= halfW
    x.set(currentX.current)
  })

  const childArray = Children.toArray(children)

  return (
    <div
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => { if (pauseOnHover) paused.current = true }}
      onMouseLeave={() => { if (pauseOnHover) paused.current = false }}
    >
      <motion.div
        ref={innerRef}
        className="flex will-change-transform"
        style={{ x, gap: `${gap}px` }}
      >
        {childArray}
        {childArray}
      </motion.div>
    </div>
  )
}
