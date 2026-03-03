import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/use-auth'
import { ThemeProvider } from '@/hooks/use-theme'
import { RecentProvider } from '@/hooks/use-recent'
import { ToastProvider } from '@/components/ui/toast'
import { NotificationsProvider } from '@/hooks/use-notifications'
import { AuthModalProvider } from '@/components/ui/auth-modal'
import { RootLayout } from '@/components/layout/root-layout'
import { HomePage } from '@/pages/home'
import { ExplorePage } from '@/pages/explore'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'
import { OnboardingPage } from '@/pages/onboarding'
import { DashboardPage } from '@/pages/dashboard'
import { IdeaDetailPage } from '@/pages/idea-detail'
import { AdminPage } from '@/pages/admin'
import { ProfilePage } from '@/pages/profile'
import { StatsPage } from '@/pages/stats'
import { SettingsPage } from '@/pages/settings'
import { PrivacyPage, TermsPage, AccessibilityPage } from '@/pages/legal'
import { PricingPage } from '@/pages/pricing'
import { CheckoutSuccessPage } from '@/pages/checkout-success'
import { TeamPage } from '@/pages/team'
import { TeamInvitePage } from '@/pages/team-invite'
import { DeveloperApiPage } from '@/pages/developer-api'
import { AboutPage } from '@/pages/about'
import { HelpPage } from '@/pages/help'
import { BlogPage } from '@/pages/blog'
import { NotificationsPage } from '@/pages/notifications'

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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <NotificationsProvider>
          <RecentProvider>
            <ToastProvider>
            <BrowserRouter>
              <AuthModalProvider>
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
                </Route>
              </Routes>
              </AuthModalProvider>
            </BrowserRouter>
            </ToastProvider>
          </RecentProvider>
          </NotificationsProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
