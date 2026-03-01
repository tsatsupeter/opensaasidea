import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/use-auth'
import { ThemeProvider } from '@/hooks/use-theme'
import { RecentProvider } from '@/hooks/use-recent'
import { RootLayout } from '@/components/layout/root-layout'
import { HomePage } from '@/pages/home'
import { ExplorePage } from '@/pages/explore'
import { LoginPage } from '@/pages/login'
import { RegisterPage } from '@/pages/register'
import { OnboardingPage } from '@/pages/onboarding'
import { DashboardPage } from '@/pages/dashboard'
import { IdeaDetailPage } from '@/pages/idea-detail'
import { AdminPage } from '@/pages/admin'

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
          <RecentProvider>
            <BrowserRouter>
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
                  <Route path="/idea/:id" element={<IdeaDetailPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </RecentProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
