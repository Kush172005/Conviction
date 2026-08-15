import { cn } from '@/lib/utils'

interface LogoMarkProps {
  className?: string
  variant?: 'mark' | 'tile'
}

export default function LogoMark({ className, variant = 'mark' }: LogoMarkProps) {
  if (variant === 'tile') {
    return (
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn('logo-mark-tile block text-primary', className)}
        aria-hidden="true"
      >
        <rect width="32" height="32" rx="7" fill="hsl(var(--logo-tile))" />
        <rect
          x="0.5"
          y="0.5"
          width="31"
          height="31"
          rx="6.5"
          className="logo-tile-stroke"
        />
        <path
          d="M 13.54 25.18 A 9.5 9.5 0 1 1 18.46 25.18"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path d="M 16 12 L 20 16 L 16 20 L 12 16 Z" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('block', className)}
      aria-hidden="true"
    >
      <path
        d="M 13.54 25.18 A 9.5 9.5 0 1 1 18.46 25.18"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d="M 16 12 L 20 16 L 16 20 L 12 16 Z" fill="currentColor" />
    </svg>
  )
}
