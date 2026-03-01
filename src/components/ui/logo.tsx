import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt="OpenSaaSIdea"
      className={cn('object-contain', className)}
    />
  )
}
