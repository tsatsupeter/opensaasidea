import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'

interface SiteSettings {
  [key: string]: string
}

interface SiteSettingsContextType {
  settings: SiteSettings
  loading: boolean
  getSetting: (key: string, fallback?: string) => string
  refreshSettings: () => Promise<void>
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined)

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>({})
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('key, value')
      if (data) {
        const map: SiteSettings = {}
        for (const row of data as { key: string; value: string }[]) {
          map[row.key] = row.value
        }
        setSettings(map)
      }
    } catch (err) {
      console.error('Failed to load site settings:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Apply non-Helmet-managed tags (favicon, GA) when settings change
  // Meta tags (title, description, OG, canonical, etc.) are managed by the SEO component via react-helmet
  useEffect(() => {
    if (loading) return

    // Favicon
    const favicon = settings.favicon_url
    if (favicon) {
      const el = document.querySelector('link[rel="icon"]') as HTMLLinkElement
      if (el) el.href = favicon
    }

    // Google Analytics
    const gaId = settings.google_analytics_id
    if (gaId && !document.querySelector(`script[src*="googletagmanager"]`)) {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
      document.head.appendChild(script)
      const inlineScript = document.createElement('script')
      inlineScript.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`
      document.head.appendChild(inlineScript)
    }
  }, [settings, loading])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const getSetting = useCallback((key: string, fallback = '') => {
    return settings[key] || fallback
  }, [settings])

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, getSetting, refreshSettings: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  )
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext)
  if (!context) throw new Error('useSiteSettings must be used within SiteSettingsProvider')
  return context
}
