from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator

from app.models.startup_intelligence import (
    AlignmentScore,
    DiligenceQuestion,
    EvidenceConfidence,
    ICMemo,
    MoatAnalysis,
    MoatSignal,
    ProgressStage,
    RedFlag,
    ReportSection,
)


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


class ProgressStageResponse(ProgressStage):
    pass


class AlignmentScoreResponse(AlignmentScore):
    pass


class ThesisMatchResponse(BaseModel):
    thesis_fit_score: int
    sector_alignment: AlignmentScoreResponse
    stage_alignment: AlignmentScoreResponse
    geography_alignment: AlignmentScoreResponse
    business_model_alignment: AlignmentScoreResponse
    key_fit_reasons: List[str] = []
    key_misfit_reasons: List[str] = []
    confidence: float = 0.0


class MoatSignalResponse(MoatSignal):
    pass


class MoatAnalysisResponse(MoatAnalysis):
    # Explicit overrides (not a bare subclass): MoatAnalysis's nested fields are
    # typed MoatSignal internally. Redeclaring them here keeps the wire response
    # pointing at MoatSignalResponse (the exposed schema) instead of leaking the
    # internal-only MoatSignal type into the OpenAPI contract.
    network_effects: MoatSignalResponse
    data_moat: MoatSignalResponse
    distribution: MoatSignalResponse
    switching_costs: MoatSignalResponse
    brand: MoatSignalResponse
    technical_depth: MoatSignalResponse
    regulatory: MoatSignalResponse
    partnerships: MoatSignalResponse


class RedFlagResponse(RedFlag):
    pass


class DiligenceQuestionResponse(DiligenceQuestion):
    pass


class ICMemoResponse(ICMemo):
    pass


class ReportSectionResponse(ReportSection):
    pass


class SourceResponse(BaseModel):
    url: str
    title: str
    domain: str
    snippet: str
    source_type: str
    source_quality_score: float
    fetched_at: Optional[datetime] = None


class EvidenceConfidenceResponse(EvidenceConfidence):
    pass


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
