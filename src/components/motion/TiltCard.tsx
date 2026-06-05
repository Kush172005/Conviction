import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'framer-motion'

interface TiltCardProps {
  children: React.ReactNode
  className?: string
  intensity?: number
}

export default function TiltCard({ children, className = '', intensity = 10 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)
  const glareOpacity = useMotionValue(0)

  const spring = { stiffness: 200, damping: 22 }
  const smoothX = useSpring(mouseX, spring)
  const smoothY = useSpring(mouseY, spring)
  const smoothGlare = useSpring(glareOpacity, { stiffness: 200, damping: 30 })

  const rotateX = useTransform(smoothY, [0, 1], [intensity, -intensity])
  const rotateY = useTransform(smoothX, [0, 1], [-intensity, intensity])

  const glareXPct = useTransform(smoothX, [0, 1], ['0%', '100%'])
  const glareYPct = useTransform(smoothY, [0, 1], ['0%', '100%'])
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareXPct} ${glareYPct}, rgba(255,255,255,0.07) 0%, transparent 65%)`

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
    glareOpacity.set(1)
  }

  const handleMouseLeave = () => {
    mouseX.set(0.5)
    mouseY.set(0.5)
    glareOpacity.set(0)
  }

  return (
    <motion.div
      ref={ref}
      className={`relative ${className}`}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: 'preserve-3d' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.015, z: 6 }}
      transition={{ scale: { type: 'spring', stiffness: 300, damping: 22 } }}
    >
      {children}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ background: glareBackground, opacity: smoothGlare }}
      />
    </motion.div>
  )
}
