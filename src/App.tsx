import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider } from '@/hooks/use-auth'
import { ThemeProvider } from '@/hooks/use-theme'
import { RecentProvider } from '@/hooks/use-recent'
import { ToastProvider } from '@/components/ui/toast'
import { NotificationsProvider } from '@/hooks/use-notifications'
import { AuthModalProvider } from '@/components/ui/auth-modal'
import { SiteSettingsProvider } from '@/hooks/use-site-settings'
import { RootLayout } from '@/components/layout/root-layout'

// Critical path — eagerly loaded (home + explore are the main entry points)
import { HomePage } from '@/pages/home'
import { ExplorePage } from '@/pages/explore'

// Lazy-loaded pages — each gets its own chunk, loaded on demand
const LoginPage = lazy(() => import('@/pages/login').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('@/pages/register').then(m => ({ default: m.RegisterPage })))
const OnboardingPage = lazy(() => import('@/pages/onboarding').then(m => ({ default: m.OnboardingPage })))
const DashboardPage = lazy(() => import('@/pages/dashboard').then(m => ({ default: m.DashboardPage })))
const IdeaDetailPage = lazy(() => import('@/pages/idea-detail').then(m => ({ default: m.IdeaDetailPage })))
const AdminPage = lazy(() => import('@/pages/admin').then(m => ({ default: m.AdminPage })))
const ProfilePage = lazy(() => import('@/pages/profile').then(m => ({ default: m.ProfilePage })))
const StatsPage = lazy(() => import('@/pages/stats').then(m => ({ default: m.StatsPage })))
const SettingsPage = lazy(() => import('@/pages/settings').then(m => ({ default: m.SettingsPage })))
const PricingPage = lazy(() => import('@/pages/pricing').then(m => ({ default: m.PricingPage })))
const CheckoutSuccessPage = lazy(() => import('@/pages/checkout-success').then(m => ({ default: m.CheckoutSuccessPage })))
const TeamPage = lazy(() => import('@/pages/team').then(m => ({ default: m.TeamPage })))
const TeamInvitePage = lazy(() => import('@/pages/team-invite').then(m => ({ default: m.TeamInvitePage })))
const DeveloperApiPage = lazy(() => import('@/pages/developer-api').then(m => ({ default: m.DeveloperApiPage })))
const AboutPage = lazy(() => import('@/pages/about').then(m => ({ default: m.AboutPage })))
const HelpPage = lazy(() => import('@/pages/help').then(m => ({ default: m.HelpPage })))
const BlogPage = lazy(() => import('@/pages/blog').then(m => ({ default: m.BlogPage })))
const NotificationsPage = lazy(() => import('@/pages/notifications').then(m => ({ default: m.NotificationsPage })))
const NotFoundPage = lazy(() => import('@/pages/not-found').then(m => ({ default: m.NotFoundPage })))
const MyPlansPage = lazy(() => import('@/pages/plans').then(m => ({ default: m.MyPlansPage })))
const SharedPlanPage = lazy(() => import('@/pages/plans').then(m => ({ default: m.SharedPlanPage })))
const PrivacyPage = lazy(() => import('@/pages/legal').then(m => ({ default: m.PrivacyPage })))
const TermsPage = lazy(() => import('@/pages/legal').then(m => ({ default: m.TermsPage })))
const AccessibilityPage = lazy(() => import('@/pages/legal').then(m => ({ default: m.AccessibilityPage })))

// Minimal loading fallback — keeps layout stable during chunk load
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="h-6 w-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})

function App() {
  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SiteSettingsProvider>
        <AuthProvider>
          <NotificationsProvider>
          <RecentProvider>
            <ToastProvider>
            <BrowserRouter>
              <AuthModalProvider>
              <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route element={<RootLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/explore/:category" element={<ExplorePage />} />
                  <Route path="/popular" element={<HomePage />} />
                  <Route path="/trending" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/onboarding" element={<OnboardingPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/idea/:slug" element={<IdeaDetailPage />} />
                  <Route path="/plans" element={<MyPlansPage />} />
                  <Route path="/plan/:token" element={<SharedPlanPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  <Route path="/team" element={<TeamPage />} />
                  <Route path="/team/invite/:token" element={<TeamInvitePage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/developer/api" element={<DeveloperApiPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/help" element={<HelpPage />} />
                  <Route path="/blog" element={<BlogPage />} />
                  <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/accessibility" element={<AccessibilityPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
              </Suspense>
              </AuthModalProvider>
            </BrowserRouter>
            </ToastProvider>
          </RecentProvider>
          </NotificationsProvider>
        </AuthProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
    </HelmetProvider>
  )
}

export default App
