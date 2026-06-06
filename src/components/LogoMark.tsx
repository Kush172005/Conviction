interface LogoMarkProps {
  className?: string
}

export default function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M 13.54 25.18 A 9.5 9.5 0 1 1 18.46 25.18"
        stroke="white"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path d="M 16 12 L 20 16 L 16 20 L 12 16 Z" fill="white" />
    </svg>
  )
}
