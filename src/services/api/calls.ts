import { api } from './client'
import type { Call, CallIntelligenceData, FollowUp } from '@/types'

// ─── Mappers (snake_case → camelCase) ────────────────────────────────────────

function mapFollowUp(raw: Record<string, unknown>): FollowUp {
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

function mapCall(raw: Record<string, unknown>): Call {
  return {
    id: raw.id as string,
    userId: raw.user_id as string,
    companyId: raw.company_id as string,
    title: raw.title as string,
    inputMode: raw.input_mode as Call['inputMode'],
    rawNotes: raw.raw_notes as string | undefined,
    transcriptText: raw.transcript_text as string | undefined,
    durationSeconds: raw.duration_seconds as number | undefined,
    status: raw.status as Call['status'],
    processingError: raw.processing_error as string | undefined,
    occurredAt: raw.occurred_at as string,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  }
}

function mapIntelligence(raw: Record<string, unknown>): CallIntelligenceData {
  const followUps: FollowUp[] = ((raw.follow_ups as unknown[]) || []).map((fu) =>
    mapFollowUp(fu as Record<string, unknown>)
  )

  return {
    callId: raw.call_id as string,
    companyId: raw.company_id as string,
    companyName: raw.company_name as string,
    callTitle: raw.call_title as string,
    inputMode: raw.input_mode as CallIntelligenceData['inputMode'],
    occurredAt: raw.occurred_at as string,
    transcriptText: raw.transcript_text as string | undefined,

    decisionId: raw.decision_id as string,
    recommendation: raw.recommendation as CallIntelligenceData['recommendation'],
    confidence: raw.confidence as number,
    rationale: raw.rationale as string,
    dealSummary: raw.deal_summary as string | undefined,
    founderAssessment: raw.founder_assessment as string | undefined,
    businessOverview: raw.business_overview as string | undefined,
    marketAssessment: raw.market_assessment as string | undefined,
    thesisFit: (raw.thesis_fit as string) || '',
    strengths: (raw.strengths as string[]) || [],
    concerns: (raw.concerns as string[]) || [],
    opportunities: (raw.opportunities as string[]) || [],
    risks: (raw.risks as string[]) || [],
    openQuestions: (raw.open_questions as string[]) || [],
    keyMetrics: (raw.key_metrics as Record<string, string>) || undefined,
    suggestedFollowUpDate: raw.suggested_follow_up_date as string | undefined,
    draftEmail: raw.draft_email as string | undefined,
    decisionCreatedAt: raw.decision_created_at as string,

    followUps,
    followUpActions: followUps.map((fu) => fu.action),

    providerLog: ((raw.provider_log as unknown[]) || []).map((entry) => {
      const e = entry as Record<string, unknown>
      return {
        provider: e.provider as string,
        action: e.action as string,
        status: e.status as string,
        detail: e.detail as string,
        responsePreview: e.response_preview as string | undefined,
        at: e.at as string | undefined,
      }
    }),
  }
}

// ─── API Methods ──────────────────────────────────────────────────────────────

const LONG_TIMEOUT = 180_000

export const callsApi = {
  list: async (): Promise<Call[]> => {
    const raw = await api.get<Record<string, unknown>[]>('/calls')
    return raw.map(mapCall)
  },

  listByCompany: async (companyId: string): Promise<Call[]> => {
    const raw = await api.get<Record<string, unknown>[]>(`/calls?company_id=${companyId}`)
    return raw.map(mapCall)
  },

  get: async (id: string): Promise<Call> => {
    const raw = await api.get<Record<string, unknown>>(`/calls/${id}`)
    return mapCall(raw)
  },

  create: async (data: {
    company_id: string
    title: string
    input_mode: string
    raw_notes?: string
    transcript_text?: string
  }): Promise<Call> => {
    const raw = await api.post<Record<string, unknown>>('/calls', data)
    return mapCall(raw)
  },

  process: async (callId: string): Promise<CallIntelligenceData> => {
    const raw = await api.post<Record<string, unknown>>(
      `/calls/${callId}/process`,
      undefined,
      { timeoutMs: LONG_TIMEOUT }
    )
    return mapIntelligence(raw)
  },

  processVoice: async (formData: FormData): Promise<CallIntelligenceData> => {
    const raw = await api.upload<Record<string, unknown>>('/calls/voice', formData, LONG_TIMEOUT)
    return mapIntelligence(raw)
  },

  getIntelligence: async (callId: string): Promise<CallIntelligenceData> => {
    const raw = await api.get<Record<string, unknown>>(`/calls/${callId}/intelligence`)
    return mapIntelligence(raw)
  },
}
