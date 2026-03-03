import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass, LayoutDashboard, Home, Moon, Sun,
  LogIn, LogOut, Shield, ChevronDown, Flame, TrendingUp,
  BarChart3, User, Camera, Settings, ChevronRight, Crown
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'
import { useCategories, type DynamicCategory } from '@/lib/categories'

const mainNav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/popular', label: 'Popular', icon: Flame },
  { href: '/trending', label: 'Trending', icon: TrendingUp },
]

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const { user, profile, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const { categories } = useCategories()
  const [catOpen, setCatOpen] = useState(true)
  const [yourOpen, setYourOpen] = useState(true)
  const [profileOpen, setProfileOpen] = useState(
    ['/profile', '/settings'].some(p => location.pathname.startsWith(p))
  )

  const isAdmin = (profile as any)?.is_admin === true

  const NavLink = ({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color?: string }) => {
    const isActive = location.pathname === href
    return (
      <Link to={href} onClick={onMobileClose}>
        <div className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
          isActive
            ? 'bg-surface-2 text-text-primary'
            : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
        )}>
          <Icon className={cn('h-[18px] w-[18px] shrink-0', color)} />
          <span className="truncate">{label}</span>
        </div>
      </Link>
    )
  }

  const SectionHeader = ({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-3 py-2 mt-2 cursor-pointer group"
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
      <ChevronDown className={cn(
        'h-3.5 w-3.5 text-text-muted transition-transform duration-200 group-hover:text-text-secondary',
        !open && '-rotate-90'
      )} />
    </button>
  )

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-14 bottom-0 z-40 flex flex-col border-r border-border transition-all duration-300 bg-[var(--sidebar-bg)] w-[240px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <nav className="flex-1 px-2 py-3 overflow-y-auto sidebar-scroll space-y-0.5">
          {/* Main nav */}
          {mainNav.map(item => (
            <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
          ))}

          <div className="mx-3 my-2 h-px bg-border" />

          {/* Categories */}
          <SectionHeader label="Categories" open={catOpen} onToggle={() => setCatOpen(!catOpen)} />
          <AnimatePresence initial={false}>
            {catOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {categories.slice(0, 5).map((cat: DynamicCategory) => {
                  const CatBadge = () => (
                    <div className={`h-[18px] w-[18px] rounded-full ${cat.bgColor} flex items-center justify-center shrink-0`}>
                      <span className={`text-[9px] font-bold ${cat.color}`}>{cat.label[0]}</span>
                    </div>
                  )
                  return (
                    <Link key={cat.slug} to={`/explore/${cat.slug}`} onClick={onMobileClose}>
                      <div className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                        location.pathname === `/explore/${cat.slug}`
                          ? 'bg-surface-2 text-text-primary'
                          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                      )}>
                        <CatBadge />
                        <span className="truncate">{cat.label}</span>
                        <span className="ml-auto text-[10px] text-text-muted">{cat.count}</span>
                      </div>
                    </Link>
                  )
                })}
                <Link to="/explore" onClick={onMobileClose}>
                  <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-text-muted hover:text-text-secondary transition-colors">
                    <Compass className="h-[18px] w-[18px] shrink-0" />
                    See all categories
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Your Stuff (auth) */}
          {user && (
            <>
              <SectionHeader label="Your Stuff" open={yourOpen} onToggle={() => setYourOpen(!yourOpen)} />
              <AnimatePresence initial={false}>
                {yourOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                    <NavLink href="/stats" icon={BarChart3} label="Stats" />

                    {/* Profile sub-nav */}
                    <button
                      onClick={() => setProfileOpen(!profileOpen)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 w-full',
                        ['/profile', '/settings'].some(p => location.pathname.startsWith(p))
                          ? 'bg-surface-2 text-text-primary'
                          : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'
                      )}
                    >
                      <User className="h-[18px] w-[18px] shrink-0" />
                      <span className="truncate flex-1 text-left">Profile</span>
                      <ChevronRight className={cn(
                        'h-3.5 w-3.5 text-text-muted transition-transform duration-200',
                        profileOpen && 'rotate-90'
                      )} />
                    </button>

                    <AnimatePresence initial={false}>
                      {profileOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden pl-4"
                        >
                          <NavLink href="/profile" icon={User} label="View Profile" />
                          <NavLink href="/settings" icon={Settings} label="Settings" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <NavLink href="/pricing" icon={Crown} label="Pricing" color="text-brand" />
                    {isAdmin && <NavLink href="/admin" icon={Shield} label="Admin" />}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border px-2 py-2 space-y-0.5">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all duration-150 w-full cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>

          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-text-secondary hover:text-rose hover:bg-rose/10 transition-all duration-150 w-full cursor-pointer"
            >
              <LogOut className="h-[18px] w-[18px]" />
              Sign Out
            </button>
          ) : (
            <Link to="/login" onClick={onMobileClose}>
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-text-secondary hover:text-brand hover:bg-brand/10 transition-all duration-150 w-full">
                <LogIn className="h-[18px] w-[18px]" />
                Sign In
              </div>
            </Link>
          )}
        </div>

        {/* User card */}
        {user && (
          <div className="px-2 pb-2">
            <Link to="/profile" onClick={onMobileClose}>
              <div className="flex items-center gap-2.5 rounded-lg bg-surface-2 px-3 py-2 hover:bg-surface-3 transition-colors">
                <div className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center text-white text-[11px] font-bold shrink-0 overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (profile?.full_name || user.email || '?')[0].toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{profile?.full_name || 'User'}</p>
                  <p className="text-[10px] text-text-muted truncate">{user.email}</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </aside>
    </>
  )
}
