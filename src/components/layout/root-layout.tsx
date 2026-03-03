import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Plus, Menu } from 'lucide-react'
import { siteConfig, getBrandParts } from '@/lib/site-config'
import { Sidebar } from './sidebar'
import { RightSidebar } from './right-sidebar'
import { SearchBar } from '@/components/ui/search-bar'
import { NotificationsDropdown } from '@/components/ui/notifications-dropdown'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'

const NO_SIDEBAR_ROUTES = ['/login', '/register', '/onboarding']
const NO_RIGHT_SIDEBAR_ROUTES = ['/login', '/register', '/onboarding', '/dashboard', '/admin']

export function RootLayout() {
  const location = useLocation()
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
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
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-3 border-b border-border bg-surface-0/95 backdrop-blur-lg px-4 h-14">
        {/* Left: hamburger + logo */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-surface-2 cursor-pointer"
          >
            <Menu className="h-4 w-4 text-text-secondary" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt={siteConfig.logoAlt} className="h-8 w-8 rounded-lg object-contain" />
            <span className="text-sm font-bold hidden sm:block">
              {getBrandParts().prefix}<span className="text-brand">{getBrandParts().brand}</span>{getBrandParts().suffix}
            </span>
          </Link>
        </div>

        {/* Center: search */}
        <div className="flex-1 flex justify-center max-w-xl mx-auto">
          <SearchBar />
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <NotificationsDropdown />
              <Link to="/dashboard">
                <Button size="sm" className="hidden sm:flex gap-1.5 text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Generate
                </Button>
              </Link>
              <Link to="/dashboard" className="sm:hidden">
                <Button size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </Link>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm" className="text-xs">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Sidebar below top bar */}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      {/* Main content area */}
      <div className={`pt-14 lg:pl-[240px] transition-all duration-300 ${!noRight ? 'xl:pr-[300px]' : ''}`}>
        <main className="px-4 lg:px-6 py-5">
          <Outlet />
        </main>
      </div>

      {/* Right sidebar */}
      {!noRight && <RightSidebar />}
    </div>
  )
}
