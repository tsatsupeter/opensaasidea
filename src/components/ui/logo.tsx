import { cn } from '@/lib/utils'
import { siteConfig } from '@/lib/site-config'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt={siteConfig.logoAlt}
      className={cn('object-contain', className)}
    />
  )
}
