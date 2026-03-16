import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Plus, Menu } from 'lucide-react'
import { siteConfig, getBrandParts } from '@/lib/site-config'
import { Sidebar } from './sidebar'
import { RightSidebar } from './right-sidebar'
import { SearchBar } from '@/components/ui/search-bar'
import { NotificationsBell } from '@/components/ui/notifications-bell'
import { useAuth } from '@/hooks/use-auth'
import { useAuthModal } from '@/components/ui/auth-modal'
import { useSiteSettings } from '@/hooks/use-site-settings'
import { Button } from '@/components/ui/button'

const NO_SIDEBAR_ROUTES = ['/login', '/register', '/onboarding']
const NO_RIGHT_SIDEBAR_ROUTES = ['/login', '/register', '/onboarding', '/dashboard', '/admin']

export function RootLayout() {
  const location = useLocation()
  const { user, profile } = useAuth()
  const { openAuthModal } = useAuthModal()
  const { getSetting } = useSiteSettings()
  const [mobileOpen, setMobileOpen] = useState(false)
  const logoUrl = getSetting('logo_url', '/logo.png')
  const siteName = getSetting('site_name', siteConfig.name)
  const brandWord = getSetting('brand_word', siteConfig.brandWord)
  const noSidebar = NO_SIDEBAR_ROUTES.includes(location.pathname)
  const noRight = NO_RIGHT_SIDEBAR_ROUTES.includes(location.pathname) || location.pathname.startsWith('/idea/')

  if (noSidebar) {
    return (
      <div className="min-h-screen bg-surface-0">
        <Outlet />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-0">
      {/* Reddit-style top bar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-surface-0/95 backdrop-blur-lg">
        {/* Row 1: hamburger + logo + actions */}
        <div className="flex items-center gap-3 px-3 sm:px-4 h-12 md:h-14">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-full hover:bg-surface-2 cursor-pointer"
            >
              <Menu className="h-5 w-5 text-text-secondary" />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <img src={logoUrl} alt={siteName} className="h-8 w-8 rounded-lg object-contain" />
              <span className="text-sm font-bold hidden sm:block">
                Open<span className="text-brand">{brandWord}</span>Idea
              </span>
            </Link>
          </div>

          {/* Center: search — desktop only */}
          <div className="hidden md:flex flex-1 justify-center max-w-xl mx-auto">
            <SearchBar />
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
            {user ? (
              <>
                <Link to="/dashboard" className="hidden sm:flex">
                  <Button size="sm" className="gap-1.5 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Generate
                  </Button>
                </Link>
                <Link to="/dashboard" className="sm:hidden">
                  <div className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-surface-2 cursor-pointer">
                    <Plus className="h-5 w-5 text-text-secondary" />
                  </div>
                </Link>
                <NotificationsBell />
                <Link to="/profile">
                  <div className="h-8 w-8 rounded-full bg-brand/20 flex items-center justify-center border-2 border-transparent hover:border-brand/40 transition-colors cursor-pointer overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[11px] font-bold text-brand">
                        {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </Link>
              </>
            ) : (
              <Button size="sm" className="text-xs" onClick={() => openAuthModal('login')}>Sign In</Button>
            )}
          </div>
        </div>

        {/* Row 2: search — mobile only, hidden when sidebar open */}
        {!mobileOpen && (
          <div className="md:hidden px-3 pb-2.5">
            <SearchBar />
          </div>
        )}
      </header>

      {/* Sidebar below top bar */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main content area */}
      <div className={`${mobileOpen ? 'pt-12' : 'pt-[6.5rem]'} md:pt-14 lg:pl-[240px] transition-all duration-300 ${!noRight ? 'xl:pr-[300px]' : ''}`}>
        <main className="px-3 sm:px-4 lg:px-6 py-4 sm:py-5 w-full min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Right sidebar */}
      {!noRight && <RightSidebar />}
    </div>
  )
}
