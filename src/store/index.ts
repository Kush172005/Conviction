import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, InvestorProfile } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isDemo: boolean
  isLoading: boolean
  login: (user: User, token: string, isDemo?: boolean) => void
  logout: () => void
  setLoading: (loading: boolean) => void
  updateUser: (updates: Partial<User>) => void
  setDemo: (isDemo: boolean) => void
}

interface OnboardingState {
  investorProfile: InvestorProfile | null
  currentStep: number
  isComplete: boolean
  setProfile: (profile: InvestorProfile) => void
  setStep: (step: number) => void
  complete: () => void
  reset: () => void
}

interface UIState {
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  commandPaletteOpen: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
  toggleMobileSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isDemo: false,
      isLoading: false,
      login: (user, token, isDemo = false) =>
        set({ user, token, isAuthenticated: true, isLoading: false, isDemo }),
      logout: () =>
        set({ user: null, token: null, isAuthenticated: false, isDemo: false }),
      setLoading: (isLoading) => set({ isLoading }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
      setDemo: (isDemo) => set({ isDemo }),
    }),
    {
      name: 'conviction-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isDemo: state.isDemo,
      }),
    }
  )
)

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      investorProfile: null,
      currentStep: 0,
      isComplete: false,
      setProfile: (profile) => set({ investorProfile: profile }),
      setStep: (step) => set({ currentStep: step }),
      complete: () => set({ isComplete: true }),
      reset: () => set({ currentStep: 0, isComplete: false, investorProfile: null }),
    }),
    { name: 'conviction-onboarding' }
  )
)

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  commandPaletteOpen: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  toggleMobileSidebar: () =>
    set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}))
