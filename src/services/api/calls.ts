import { api } from './client'
import type { Call } from '@/types'

export const callsApi = {
  list: () => api.get<Call[]>('/calls'),
  get: (id: string) => api.get<Call>(`/calls/${id}`),
  create: (data: {
    company_id: string
    title: string
    input_mode: string
    raw_notes?: string
    transcript_text?: string
  }) => api.post<Call>('/calls', data),
  process: (callId: string) => api.post(`/calls/${callId}/process`),
}
