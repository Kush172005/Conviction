import { api } from './client'
import type { MemoryEntry } from '@/types'

function mapMemory(raw: Record<string, unknown>): MemoryEntry {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    companyId: raw.company_id as string,
    callId: raw.call_id as string | undefined,
    type: raw.type as MemoryEntry['type'],
    title: raw.title as string,
    summary: raw.summary as string,
    sentiment: raw.sentiment as MemoryEntry['sentiment'],
    importance: (raw.importance as MemoryEntry['importance']) ?? 3,
    occurredAt: raw.occurred_at as string,
    createdAt: raw.created_at as string,
  }
}

export const memoryApi = {
  list: async (companyId?: string): Promise<MemoryEntry[]> => {
    const url = companyId ? `/memory?company_id=${companyId}` : '/memory'
    const raw = await api.get<Record<string, unknown>[]>(url)
    return raw.map(mapMemory)
  },
}
