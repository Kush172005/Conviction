from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, HttpUrl, field_validator


class StartReportRequest(BaseModel):
    company_name: str
    website_url: str
    linkedin_url: Optional[str] = None
    user_context: Optional[str] = None
    force_refresh: bool = False

    @field_validator("website_url")
    @classmethod
    def normalize_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            v = "https://" + v
        return v


class ProgressStageResponse(BaseModel):
    name: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


class AlignmentScoreResponse(BaseModel):
    score: float
    label: str
    reasons: List[str] = []


class ThesisMatchResponse(BaseModel):
    thesis_fit_score: int
    sector_alignment: Optional[AlignmentScoreResponse] = None
    stage_alignment: Optional[AlignmentScoreResponse] = None
    geography_alignment: Optional[AlignmentScoreResponse] = None
    business_model_alignment: Optional[AlignmentScoreResponse] = None
    key_fit_reasons: List[str] = []
    key_misfit_reasons: List[str] = []
    confidence: float = 0.0


class MoatSignalResponse(BaseModel):
    dimension: str
    strength: str
    evidence: str
    confidence: float


class MoatAnalysisResponse(BaseModel):
    network_effects: MoatSignalResponse
    data_moat: MoatSignalResponse
    distribution: MoatSignalResponse
    switching_costs: MoatSignalResponse
    brand: MoatSignalResponse
    technical_depth: MoatSignalResponse
    regulatory: MoatSignalResponse
    partnerships: MoatSignalResponse
    overall_moat_score: int
    moat_summary: str


class RedFlagResponse(BaseModel):
    severity: str
    category: str
    explanation: str
    supporting_evidence: str
    confidence: float


class DiligenceQuestionResponse(BaseModel):
    question: str
    category: str
    priority: str
    why_important: str


class ICMemoResponse(BaseModel):
    headline: str
    recommendation: str
    recommendation_rationale: str
    thesis_fit_summary: str
    key_strengths: List[str]
    key_risks: List[str]
    suggested_next_step: str
    diligence_plan: str
    full_memo_text: str


class ReportSectionResponse(BaseModel):
    executive_summary: str = ""
    company_overview: str = ""
    founder_assessment: str = ""
    market_analysis: str = ""
    competitor_landscape: str = ""
    business_model: str = ""
    funding_and_investors: str = ""
    growth_and_hiring: str = ""
    news_and_sentiment: str = ""
    opportunities: str = ""


class SourceResponse(BaseModel):
    url: str
    title: str
    domain: str
    snippet: str
    source_type: str
    source_quality_score: float
    fetched_at: Optional[datetime] = None


class EvidenceConfidenceResponse(BaseModel):
    company_overview: float = 0.0
    founders: float = 0.0
    market: float = 0.0
    business_model: float = 0.0
    competitors: float = 0.0
    funding: float = 0.0
    growth: float = 0.0
    moat: float = 0.0
    overall: float = 0.0


class ReportListItem(BaseModel):
    id: str
    company_name: str
    website_url: str
    status: str
    progress_percent: int
    current_stage: str
    thesis_fit_score: Optional[int] = None
    recommendation: Optional[str] = None
    overall_confidence: float = 0.0
    cache_used: bool = False
    created_at: datetime
    completed_at: Optional[datetime] = None


class ProviderLogEntry(BaseModel):
    provider: str
    action: str
    status: str
    detail: str = ""
    response_preview: str = ""
    at: Optional[datetime] = None


class ReportDetailResponse(BaseModel):
    id: str
    company_name: str
    website_url: str
    linkedin_url: Optional[str] = None
    user_context: Optional[str] = None
    status: str
    progress_percent: int
    current_stage: str
    stages: List[ProgressStageResponse] = []
    error_message: Optional[str] = None

    cache_used: bool = False
    cache_age_hours: Optional[float] = None

    thesis_match: Optional[ThesisMatchResponse] = None
    moat_analysis: Optional[MoatAnalysisResponse] = None
    red_flags: List[RedFlagResponse] = []
    ic_memo: Optional[ICMemoResponse] = None
    report: Optional[ReportSectionResponse] = None
    diligence_questions: List[DiligenceQuestionResponse] = []

    sources: List[SourceResponse] = []
    overall_confidence: float = 0.0
    evidence_confidence: Optional[EvidenceConfidenceResponse] = None
    provider_log: List[ProviderLogEntry] = []

    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None


class CacheMetaResponse(BaseModel):
    normalized_domain: str
    website_url: str
    company_name: str
    cache_status: str
    last_researched_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    source_count: int = 0
    evidence_confidence_overall: float = 0.0
