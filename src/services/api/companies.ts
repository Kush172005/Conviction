import { api } from './client'
import type { Company, Founder, Stage, CompanyStatus } from '@/types'

// ─── Mapper ───────────────────────────────────────────────────────────────────

export function mapCompany(raw: Record<string, unknown>): Company {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    name: raw.name as string,
    website: raw.website as string | undefined,
    industry: raw.industry as string | undefined,
    description: raw.description as string | undefined,
    founders: (raw.founders as Founder[]) || [],
    status: raw.status as CompanyStatus,
    stage: raw.stage as Stage | undefined,
    location: raw.location as string | undefined,
    employeeCount: raw.employee_count as string | undefined,
    totalFunding: raw.total_funding as string | undefined,
    enrichmentStatus: (raw.enrichment_status as Company['enrichmentStatus']) || 'not_started',
    callCount: (raw.call_count as number) ?? 0,
    lastInteractionAt: raw.last_interaction_at as string | undefined,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  }
}

export interface LatestDecision {
  decisionId: string
  callId: string
  recommendation: string
  confidence: number
  thesisFit: string
  rationale: string
  createdAt: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const companiesApi = {
  list: async (status?: string): Promise<Company[]> => {
    const url = `/companies${status ? `?status=${status}` : ''}`
    const raw = await api.get<Record<string, unknown>[]>(url)
    return raw.map(mapCompany)
  },

  get: async (id: string): Promise<Company> => {
    const raw = await api.get<Record<string, unknown>>(`/companies/${id}`)
    return mapCompany(raw)
  },

  create: async (data: {
    name: string
    website?: string
    industry?: string
    description?: string
  }): Promise<Company> => {
    const raw = await api.post<Record<string, unknown>>('/companies', data)
    return mapCompany(raw)
  },

  update: async (id: string, data: Partial<Company>): Promise<Company> => {
    const raw = await api.patch<Record<string, unknown>>(`/companies/${id}`, data)
    return mapCompany(raw)
  },

  latestDecision: async (id: string): Promise<LatestDecision | null> => {
    const raw = await api.get<Record<string, unknown> | null>(
      `/companies/${id}/latest-decision`
    )
    if (!raw) return null
    return {
      decisionId: raw.decision_id as string,
      callId: raw.call_id as string,
      recommendation: raw.recommendation as string,
      confidence: raw.confidence as number,
      thesisFit: raw.thesis_fit as string,
      rationale: raw.rationale as string,
      createdAt: raw.created_at as string,
    }
  },

  intelligence: (id: string) => api.post(`/companies/${id}/intelligence`),
}
