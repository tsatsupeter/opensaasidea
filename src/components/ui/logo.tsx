import { cn } from '@/lib/utils'
import { siteConfig } from '@/lib/site-config'
import { useSiteSettings } from '@/hooks/use-site-settings'

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  const { getSetting } = useSiteSettings()
  const logoUrl = getSetting('logo_url', '/logo.png')
  const siteName = getSetting('site_name', siteConfig.name)

  return (
    <img
      src={logoUrl}
      alt={siteName}
      className={cn('object-contain', className)}
    />
  )
}
