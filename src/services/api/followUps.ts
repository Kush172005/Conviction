import { api } from './client'
import type { FollowUp } from '@/types'

export function mapFollowUp(raw: Record<string, unknown>): FollowUp {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    companyId: raw.company_id as string,
    callId: raw.call_id as string | undefined,
    action: raw.action as string,
    dueDate: raw.due_date as string | undefined,
    status: raw.status as FollowUp['status'],
    priority: raw.priority as FollowUp['priority'],
    notes: raw.notes as string | undefined,
    completedAt: raw.completed_at as string | undefined,
    createdAt: raw.created_at as string,
  }
}

export const followUpsApi = {
  list: async (companyId?: string): Promise<FollowUp[]> => {
    const raw = await api.get<Record<string, unknown>[]>('/follow-ups')
    const all = raw.map(mapFollowUp)
    return companyId ? all.filter((f) => f.companyId === companyId) : all
  },
}
