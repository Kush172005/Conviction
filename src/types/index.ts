export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  googleId?: string
  onboardingCompleted: boolean
  createdAt: string
  updatedAt: string
}

export interface InvestorProfile {
  id: string
  userId: string
  fundName: string
  investorName: string
  investmentThesis: string
  preferredSectors: string[]
  preferredStages: Stage[]
  typicalCheckSize: CheckSize
  geographies: string[]
  investmentStyle: InvestmentStyle
  createdAt: string
  updatedAt: string
}

export type Stage = 'pre-seed' | 'seed' | 'series-a' | 'series-b' | 'series-c' | 'growth' | 'late-stage'
export type CheckSize = '<$250k' | '$250k-$1M' | '$1M-$5M' | '$5M-$25M' | '$25M+'
export type InvestmentStyle = 'lead' | 'follow' | 'both'
export type CompanyStatus = 'tracking' | 'active' | 'passed' | 'portfolio' | 'archived'
export type CallInputMode = 'voice' | 'text' | 'transcript'
export type CallStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type MemoryEntryType = 'call_note' | 'decision' | 'concern' | 'milestone' | 'follow_up' | 'thesis_update'
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed'
export type Recommendation = 'strong_invest' | 'invest' | 'pass' | 'monitor' | 'need_more_info'
export type FollowUpStatus = 'open' | 'completed' | 'overdue' | 'cancelled'
export type FollowUpPriority = 'high' | 'medium' | 'low'

export interface Founder {
  name: string
  role: string
  linkedin?: string
  background?: string
}

export interface Company {
  id: string
  userId: string
  name: string
  website?: string
  industry?: string
  description?: string
  founders: Founder[]
  status: CompanyStatus
  totalFunding?: string
  lastValuation?: string
  stage?: Stage
  location?: string
  employeeCount?: string
  enrichmentStatus: 'pending' | 'completed' | 'failed' | 'not_started'
  lastInteractionAt?: string
  callCount: number
  createdAt: string
  updatedAt: string
}

export interface Call {
  id: string
  userId: string
  companyId: string
  companyName?: string
  title: string
  inputMode: CallInputMode
  rawNotes?: string
  transcriptText?: string
  durationSeconds?: number
  status: CallStatus
  processingError?: string
  decision?: Decision
  followUps?: FollowUp[]
  occurredAt: string
  createdAt: string
  updatedAt: string
}

export interface Decision {
  id: string
  callId: string
  companyId: string
  userId: string
  recommendation: Recommendation
  rationale: string
  thesisFit: string
  strengths: string[]
  concerns: string[]
  confidence: number
  dealSummary?: string
  founderAssessment?: string
  marketAssessment?: string
  businessOverview?: string
  suggestedFollowUpDate?: string
  draftEmail?: string
  createdAt: string
}

export interface FollowUp {
  id: string
  userId: string
  companyId: string
  callId?: string
  action: string
  dueDate?: string
  status: FollowUpStatus
  priority: FollowUpPriority
  notes?: string
  completedAt?: string
  createdAt: string
}

export interface MemoryEntry {
  id: string
  userId: string
  companyId: string
  callId?: string
  type: MemoryEntryType
  title: string
  summary: string
  sentiment: Sentiment
  importance: 1 | 2 | 3 | 4 | 5
  occurredAt: string
  createdAt: string
}

export interface DashboardStats {
  companiesTracked: number
  callsLogged: number
  openFollowUps: number
  activeDecisions: number
  recentActivity: RecentActivity[]
}

export interface RecentActivity {
  id: string
  type: 'call' | 'decision' | 'follow_up' | 'company'
  title: string
  description: string
  companyName?: string
  timestamp: string
}

// ─── Startup Intelligence ─────────────────────────────────────────────────────

export type SIReportStatus = 'queued' | 'researching' | 'analyzing' | 'completed' | 'failed'
export type SIRecommendation = 'strong_invest' | 'investigate' | 'monitor' | 'pass'
export type MoatStrength = 'none' | 'weak' | 'moderate' | 'strong'
export type AlignmentLabel = 'strong' | 'moderate' | 'weak' | 'mismatch' | 'unknown'
export type RedFlagSeverity = 'low' | 'medium' | 'high' | 'critical'
export type DiligenceCategory = 'founders' | 'market' | 'product' | 'business_model' | 'competition' | 'financials' | 'legal'
export type DiligencePriority = 'high' | 'medium' | 'low'

export interface SISource {
  url: string
  title: string
  domain: string
  snippet: string
  sourceType: string
  sourceQualityScore: number
  fetchedAt?: string
}

export interface SIAlignmentScore {
  score: number
  label: AlignmentLabel
  reasons: string[]
}

export interface SIThesisMatch {
  thesisFitScore: number
  sectorAlignment?: SIAlignmentScore
  stageAlignment?: SIAlignmentScore
  geographyAlignment?: SIAlignmentScore
  businessModelAlignment?: SIAlignmentScore
  keyFitReasons: string[]
  keyMisfitReasons: string[]
  confidence: number
}

export interface SIMoatSignal {
  dimension: string
  strength: MoatStrength
  evidence: string
  confidence: number
}

export interface SIMoatAnalysis {
  networkEffects: SIMoatSignal
  dataMoat: SIMoatSignal
  distribution: SIMoatSignal
  switchingCosts: SIMoatSignal
  brand: SIMoatSignal
  technicalDepth: SIMoatSignal
  regulatory: SIMoatSignal
  partnerships: SIMoatSignal
  overallMoatScore: number
  moatSummary: string
}

export interface SIRedFlag {
  severity: RedFlagSeverity
  category: string
  explanation: string
  supportingEvidence: string
  confidence: number
}

export interface SIDiligenceQuestion {
  question: string
  category: DiligenceCategory
  priority: DiligencePriority
  whyImportant: string
}

export interface SIICMemo {
  headline: string
  recommendation: SIRecommendation
  recommendationRationale: string
  thesisFitSummary: string
  keyStrengths: string[]
  keyRisks: string[]
  suggestedNextStep: string
  diligencePlan: string
  fullMemoText: string
}

export interface SIReportSection {
  executiveSummary: string
  companyOverview: string
  founderAssessment: string
  marketAnalysis: string
  competitorLandscape: string
  businessModel: string
  fundingAndInvestors: string
  growthAndHiring: string
  newsAndSentiment: string
  opportunities: string
}

export interface SIProgressStage {
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startedAt?: string
  completedAt?: string
  error?: string
}

export interface SIEvidenceConfidence {
  companyOverview: number
  founders: number
  market: number
  businessModel: number
  competitors: number
  funding: number
  growth: number
  moat: number
  overall: number
}

export interface SIReportListItem {
  id: string
  companyName: string
  websiteUrl: string
  status: SIReportStatus
  progressPercent: number
  currentStage: string
  thesisFitScore?: number
  recommendation?: SIRecommendation
  overallConfidence: number
  cacheUsed: boolean
  createdAt: string
  completedAt?: string
}

export interface SIProviderLogEntry {
  provider: string
  action: string
  status: string
  detail: string
  responsePreview: string
  at?: string
}

export interface SIReportDetail {
  id: string
  companyName: string
  websiteUrl: string
  linkedinUrl?: string
  userContext?: string
  status: SIReportStatus
  progressPercent: number
  currentStage: string
  stages: SIProgressStage[]
  errorMessage?: string
  cacheUsed: boolean
  cacheAgeHours?: number
  thesisMatch?: SIThesisMatch
  moatAnalysis?: SIMoatAnalysis
  redFlags: SIRedFlag[]
  icMemo?: SIICMemo
  report?: SIReportSection
  diligenceQuestions: SIDiligenceQuestion[]
  sources: SISource[]
  overallConfidence: number
  evidenceConfidence?: SIEvidenceConfidence
  providerLog: SIProviderLogEntry[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}
