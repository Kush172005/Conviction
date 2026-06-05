import { api } from './client'
import type {
  SIReportDetail,
  SIReportListItem,
} from '@/types'

// ─── Snake_case API response types (backend) ─────────────────────────────────

interface ApiAlignmentScore {
  score: number
  label: string
  reasons: string[]
}

interface ApiThesisMatch {
  thesis_fit_score: number
  sector_alignment?: ApiAlignmentScore
  stage_alignment?: ApiAlignmentScore
  geography_alignment?: ApiAlignmentScore
  business_model_alignment?: ApiAlignmentScore
  key_fit_reasons: string[]
  key_misfit_reasons: string[]
  confidence: number
}

interface ApiMoatSignal {
  dimension: string
  strength: string
  evidence: string
  confidence: number
}

interface ApiMoatAnalysis {
  network_effects: ApiMoatSignal
  data_moat: ApiMoatSignal
  distribution: ApiMoatSignal
  switching_costs: ApiMoatSignal
  brand: ApiMoatSignal
  technical_depth: ApiMoatSignal
  regulatory: ApiMoatSignal
  partnerships: ApiMoatSignal
  overall_moat_score: number
  moat_summary: string
}

interface ApiRedFlag {
  severity: string
  category: string
  explanation: string
  supporting_evidence: string
  confidence: number
}

interface ApiDiligenceQuestion {
  question: string
  category: string
  priority: string
  why_important: string
}

interface ApiICMemo {
  headline: string
  recommendation: string
  recommendation_rationale: string
  thesis_fit_summary: string
  key_strengths: string[]
  key_risks: string[]
  suggested_next_step: string
  diligence_plan: string
  full_memo_text: string
}

interface ApiReportSection {
  executive_summary: string
  company_overview: string
  founder_assessment: string
  market_analysis: string
  competitor_landscape: string
  business_model: string
  funding_and_investors: string
  growth_and_hiring: string
  news_and_sentiment: string
  opportunities: string
}

interface ApiProgressStage {
  name: string
  status: string
  started_at?: string
  completed_at?: string
  error?: string
}

interface ApiSource {
  url: string
  title: string
  domain: string
  snippet: string
  source_type: string
  source_quality_score: number
  fetched_at?: string
}

interface ApiEvidenceConfidence {
  company_overview: number
  founders: number
  market: number
  business_model: number
  competitors: number
  funding: number
  growth: number
  moat: number
  overall: number
}

interface ApiReportListItem {
  id: string
  company_name: string
  website_url: string
  status: string
  progress_percent: number
  current_stage: string
  thesis_fit_score?: number
  recommendation?: string
  overall_confidence: number
  cache_used: boolean
  created_at: string
  completed_at?: string
}

interface ApiReportDetail {
  id: string
  company_name: string
  website_url: string
  linkedin_url?: string
  user_context?: string
  status: string
  progress_percent: number
  current_stage: string
  stages: ApiProgressStage[]
  error_message?: string
  cache_used: boolean
  cache_age_hours?: number
  thesis_match?: ApiThesisMatch
  moat_analysis?: ApiMoatAnalysis
  red_flags: ApiRedFlag[]
  ic_memo?: ApiICMemo
  report?: ApiReportSection
  diligence_questions: ApiDiligenceQuestion[]
  sources: ApiSource[]
  overall_confidence: number
  evidence_confidence?: ApiEvidenceConfidence
  provider_log?: ApiProviderLogEntry[]
  created_at: string
  updated_at: string
  completed_at?: string
}

interface ApiProviderLogEntry {
  provider: string
  action: string
  status: string
  detail: string
  response_preview: string
  at?: string
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapAlignment(a?: ApiAlignmentScore): SIReportDetail['thesisMatch'] extends undefined ? undefined : any {
  if (!a) return undefined
  return { score: a.score, label: a.label as any, reasons: a.reasons }
}

function mapThesisMatch(t?: ApiThesisMatch): SIReportDetail['thesisMatch'] {
  if (!t) return undefined
  return {
    thesisFitScore: t.thesis_fit_score,
    sectorAlignment: mapAlignment(t.sector_alignment) as any,
    stageAlignment: mapAlignment(t.stage_alignment) as any,
    geographyAlignment: mapAlignment(t.geography_alignment) as any,
    businessModelAlignment: mapAlignment(t.business_model_alignment) as any,
    keyFitReasons: t.key_fit_reasons,
    keyMisfitReasons: t.key_misfit_reasons,
    confidence: t.confidence,
  }
}

function mapMoatSignal(s: ApiMoatSignal): any {
  return { dimension: s.dimension, strength: s.strength as any, evidence: s.evidence, confidence: s.confidence }
}

function mapMoatAnalysis(m?: ApiMoatAnalysis): SIReportDetail['moatAnalysis'] {
  if (!m) return undefined
  return {
    networkEffects: mapMoatSignal(m.network_effects),
    dataMoat: mapMoatSignal(m.data_moat),
    distribution: mapMoatSignal(m.distribution),
    switchingCosts: mapMoatSignal(m.switching_costs),
    brand: mapMoatSignal(m.brand),
    technicalDepth: mapMoatSignal(m.technical_depth),
    regulatory: mapMoatSignal(m.regulatory),
    partnerships: mapMoatSignal(m.partnerships),
    overallMoatScore: m.overall_moat_score,
    moatSummary: m.moat_summary,
  }
}

function mapICMemo(ic?: ApiICMemo): SIReportDetail['icMemo'] {
  if (!ic) return undefined
  return {
    headline: ic.headline,
    recommendation: ic.recommendation as any,
    recommendationRationale: ic.recommendation_rationale,
    thesisFitSummary: ic.thesis_fit_summary,
    keyStrengths: ic.key_strengths,
    keyRisks: ic.key_risks,
    suggestedNextStep: ic.suggested_next_step,
    diligencePlan: ic.diligence_plan,
    fullMemoText: ic.full_memo_text,
  }
}

function mapReport(r?: ApiReportSection): SIReportDetail['report'] {
  if (!r) return undefined
  return {
    executiveSummary: r.executive_summary,
    companyOverview: r.company_overview,
    founderAssessment: r.founder_assessment,
    marketAnalysis: r.market_analysis,
    competitorLandscape: r.competitor_landscape,
    businessModel: r.business_model,
    fundingAndInvestors: r.funding_and_investors,
    growthAndHiring: r.growth_and_hiring,
    newsAndSentiment: r.news_and_sentiment,
    opportunities: r.opportunities,
  }
}

function mapDetail(d: ApiReportDetail): SIReportDetail {
  return {
    id: d.id,
    companyName: d.company_name,
    websiteUrl: d.website_url,
    linkedinUrl: d.linkedin_url,
    userContext: d.user_context,
    status: d.status as any,
    progressPercent: d.progress_percent,
    currentStage: d.current_stage,
    stages: (d.stages || []).map(s => ({
      name: s.name,
      status: s.status as any,
      startedAt: s.started_at,
      completedAt: s.completed_at,
      error: s.error,
    })),
    errorMessage: d.error_message,
    cacheUsed: d.cache_used,
    cacheAgeHours: d.cache_age_hours,
    thesisMatch: mapThesisMatch(d.thesis_match),
    moatAnalysis: mapMoatAnalysis(d.moat_analysis),
    redFlags: (d.red_flags || []).map(f => ({
      severity: f.severity as any,
      category: f.category,
      explanation: f.explanation,
      supportingEvidence: f.supporting_evidence,
      confidence: f.confidence,
    })),
    icMemo: mapICMemo(d.ic_memo),
    report: mapReport(d.report),
    diligenceQuestions: (d.diligence_questions || []).map(q => ({
      question: q.question,
      category: q.category as any,
      priority: q.priority as any,
      whyImportant: q.why_important,
    })),
    sources: (d.sources || []).map(s => ({
      url: s.url,
      title: s.title,
      domain: s.domain,
      snippet: s.snippet,
      sourceType: s.source_type,
      sourceQualityScore: s.source_quality_score,
      fetchedAt: s.fetched_at,
    })),
    overallConfidence: d.overall_confidence,
    evidenceConfidence: d.evidence_confidence
      ? {
          companyOverview: d.evidence_confidence.company_overview,
          founders: d.evidence_confidence.founders,
          market: d.evidence_confidence.market,
          businessModel: d.evidence_confidence.business_model,
          competitors: d.evidence_confidence.competitors,
          funding: d.evidence_confidence.funding,
          growth: d.evidence_confidence.growth,
          moat: d.evidence_confidence.moat,
          overall: d.evidence_confidence.overall,
        }
      : undefined,
    providerLog: (d.provider_log || []).map(e => ({
      provider: e.provider,
      action: e.action,
      status: e.status,
      detail: e.detail,
      responsePreview: e.response_preview,
      at: e.at,
    })),
    createdAt: d.created_at,
    updatedAt: d.updated_at,
    completedAt: d.completed_at,
  }
}

function mapListItem(d: ApiReportListItem): SIReportListItem {
  return {
    id: d.id,
    companyName: d.company_name,
    websiteUrl: d.website_url,
    status: d.status as any,
    progressPercent: d.progress_percent,
    currentStage: d.current_stage,
    thesisFitScore: d.thesis_fit_score,
    recommendation: d.recommendation as any,
    overallConfidence: d.overall_confidence,
    cacheUsed: d.cache_used,
    createdAt: d.created_at,
    completedAt: d.completed_at,
  }
}

// ─── API calls ────────────────────────────────────────────────────────────────

export interface StartReportPayload {
  company_name: string
  website_url: string
  linkedin_url?: string
  user_context?: string
  force_refresh?: boolean
}

export const startupIntelligenceApi = {
  startReport: (payload: StartReportPayload) =>
    api.post<{ report_id: string; status: string }>('/startup-intelligence/reports', payload),

  listReports: async (): Promise<SIReportListItem[]> => {
    const raw = await api.get<ApiReportListItem[]>('/startup-intelligence/reports')
    return raw.map(mapListItem)
  },

  getReport: async (reportId: string): Promise<SIReportDetail> => {
    const raw = await api.get<ApiReportDetail>(`/startup-intelligence/reports/${reportId}`)
    return mapDetail(raw)
  },

  deleteReport: (reportId: string) =>
    api.delete<void>(`/startup-intelligence/reports/${reportId}`),

  retryReport: (reportId: string) =>
    api.post<{ report_id: string; status: string }>(`/startup-intelligence/reports/${reportId}/retry`, {}),

  refreshReport: (reportId: string) =>
    api.post<{ report_id: string; status: string }>(`/startup-intelligence/reports/${reportId}/refresh`, {}),
}
