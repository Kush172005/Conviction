import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import OnboardingPage from '@/pages/OnboardingPage'
import AppShell from '@/components/layout/AppShell'
import DashboardPage from '@/pages/DashboardPage'
import CompaniesPage from '@/pages/CompaniesPage'
import CompanyDetailPage from '@/pages/CompanyDetailPage'
import NewCallPage from '@/pages/NewCallPage'
import CallIntelligencePage from '@/pages/CallIntelligencePage'
import MemoryPage from '@/pages/MemoryPage'
import IntelligencePage from '@/pages/IntelligencePage'
import SettingsPage from '@/pages/SettingsPage'
import StartupIntelligencePage from '@/pages/StartupIntelligencePage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isDemo = useAuthStore((s) => s.isDemo)
  const user = useAuthStore((s) => s.user)

  if (!isAuthenticated) return <Navigate to="/login" replace />

  // Real users who haven't onboarded must complete onboarding first
  if (!isDemo && user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppShell>
              <DashboardPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/companies"
        element={
          <ProtectedRoute>
            <AppShell>
              <CompaniesPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/companies/:companyId"
        element={
          <ProtectedRoute>
            <AppShell>
              <CompanyDetailPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calls/new"
        element={
          <ProtectedRoute>
            <AppShell>
              <NewCallPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calls/:callId/intelligence"
        element={
          <ProtectedRoute>
            <AppShell>
              <CallIntelligencePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/memory"
        element={
          <ProtectedRoute>
            <AppShell>
              <MemoryPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/intelligence"
        element={
          <ProtectedRoute>
            <AppShell>
              <IntelligencePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppShell>
              <SettingsPage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/startup-intelligence"
        element={
          <ProtectedRoute>
            <AppShell>
              <StartupIntelligencePage />
            </AppShell>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
