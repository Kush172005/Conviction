import { api } from './client'
import type { User } from '@/types'

export interface TokenResponse {
  access_token: string
  token_type: string
  user_id: string
  onboarding_completed: boolean
}

export interface BackendUser {
  id: string
  email: string
  name: string
  avatar_url?: string
  onboarding_completed: boolean
  created_at: string
}

export interface BackendInvestorProfile {
  id: string
  user_id: string
  fund_name: string
  investor_name: string
  investment_thesis: string
  preferred_sectors: string[]
  preferred_stages: string[]
  typical_check_size: string
  geographies: string[]
  investment_style: string
  created_at: string
  updated_at: string
}

export type InvestorProfilePayload = Omit<
  BackendInvestorProfile,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>

export function mapBackendUser(user: BackendUser): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar_url,
    onboardingCompleted: user.onboarding_completed,
    createdAt: user.created_at,
    updatedAt: user.created_at,
  }
}

export const authApi = {
  googleLogin: (idToken: string) =>
    api.post<TokenResponse>('/auth/google', { id_token: idToken }),

  mockLogin: (email?: string, name?: string) =>
    api.post<TokenResponse>('/auth/mock', {
      email: email ?? 'arjun@rtpglobal.com',
      name: name ?? 'Arjun Mehta',
    }),

  getMe: () => api.get<BackendUser>('/users/me'),

  updateMe: (data: { onboarding_completed?: boolean; name?: string }) =>
    api.patch<BackendUser>('/users/me', data),

  getInvestorProfile: () => api.get<BackendInvestorProfile>('/investor-profile'),

  createInvestorProfile: (data: InvestorProfilePayload) =>
    api.post<BackendInvestorProfile>('/investor-profile', data),

  updateInvestorProfile: (data: Partial<InvestorProfilePayload>) =>
    api.patch<BackendInvestorProfile>('/investor-profile', data),
}
