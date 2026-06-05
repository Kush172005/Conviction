import { api } from './client'
import type { DashboardStats } from '@/types'

function mapStats(raw: Record<string, unknown>): DashboardStats {
  return {
    companiesTracked: (raw.companies_tracked as number) ?? 0,
    callsLogged: (raw.calls_logged as number) ?? 0,
    openFollowUps: (raw.open_follow_ups as number) ?? 0,
    activeDecisions: (raw.active_decisions as number) ?? 0,
    recentActivity: [],
  }
}

export const dashboardApi = {
  stats: async (): Promise<DashboardStats> => {
    const raw = await api.get<Record<string, unknown>>('/dashboard/stats')
    return mapStats(raw)
  },
}
