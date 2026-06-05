"""
Data models for Startup Intelligence feature.
Two MongoDB collections:
  - startup_company_research_cache: shared by normalized domain, TTL 14 days
  - startup_intelligence_reports: user-scoped, generated from cache + investor profile
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ─── Source models ────────────────────────────────────────────────────────────

class ResearchSource(BaseModel):
    url: str
    title: str
    domain: str
    snippet: str
    extracted_summary: str = ""
    source_type: str  # website, news, search_result, linkedin_public, crunchbase, etc.
    source_quality_score: float = 0.0  # 0-1
    fetched_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Evidence layer ───────────────────────────────────────────────────────────

class EvidenceItem(BaseModel):
    value: str
    confidence: float  # 0-1
    sources: List[str] = []  # source URLs that support this claim


class FounderProfile(BaseModel):
    name: str
    role: str
    background_summary: str = ""
    linkedin_url: Optional[str] = None
    previous_companies: List[str] = []
    education_signals: List[str] = []
    domain_expertise_signals: List[str] = []
    confidence: float = 0.0


class CompetitorInfo(BaseModel):
    name: str
    differentiator: str = ""
    funding_known: str = ""
    relative_positioning: str = ""


class MoatSignal(BaseModel):
    dimension: str  # network_effects, data_moat, switching_costs, brand, technical, distribution, regulatory, partnerships
    strength: str  # none, weak, moderate, strong
    evidence: str
    confidence: float


class RiskSignal(BaseModel):
    category: str
    description: str
    severity: str  # low, medium, high, critical
    evidence: str
    confidence: float


class EvidenceLayer(BaseModel):
    company_overview: str = ""
    one_liner: str = ""
    founding_year: Optional[str] = None
    headquarters: Optional[str] = None
    employee_count_estimate: Optional[str] = None
    founders: List[FounderProfile] = []
    business_model: str = ""
    monetization: str = ""
    target_customer: str = ""
    market: str = ""
    market_size_estimate: Optional[str] = None
    competitors: List[CompetitorInfo] = []
    funding_stage: Optional[str] = None
    total_funding_known: Optional[str] = None
    investors_known: List[str] = []
    hiring_signals: List[str] = []
    growth_signals: List[str] = []
    news_headlines: List[str] = []
    sentiment_summary: str = ""
    moat_signals: List[MoatSignal] = []
    risk_signals: List[RiskSignal] = []
    unknowns: List[str] = []  # categories where information was not found


class EvidenceConfidence(BaseModel):
    company_overview: float = 0.0
    founders: float = 0.0
    market: float = 0.0
    business_model: float = 0.0
    competitors: float = 0.0
    funding: float = 0.0
    growth: float = 0.0
    moat: float = 0.0
    overall: float = 0.0


# ─── Company cache ────────────────────────────────────────────────────────────

class CompanyResearchCache(BaseModel):
    id: Optional[str] = None
    normalized_domain: str
    website_url: str
    company_name: str
    cache_status: str = "fresh"  # fresh, stale, refreshing, failed
    last_researched_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = None
    source_hash: str = ""
    sources: List[ResearchSource] = []
    evidence_layer: EvidenceLayer = Field(default_factory=EvidenceLayer)
    evidence_confidence: EvidenceConfidence = Field(default_factory=EvidenceConfidence)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Report models ────────────────────────────────────────────────────────────

class AlignmentScore(BaseModel):
    score: float  # 0-1
    label: str  # strong, moderate, weak, mismatch
    reasons: List[str] = []


class ThesisMatch(BaseModel):
    thesis_fit_score: int  # 0-100
    sector_alignment: AlignmentScore = Field(default_factory=lambda: AlignmentScore(score=0, label="unknown"))
    stage_alignment: AlignmentScore = Field(default_factory=lambda: AlignmentScore(score=0, label="unknown"))
    geography_alignment: AlignmentScore = Field(default_factory=lambda: AlignmentScore(score=0, label="unknown"))
    business_model_alignment: AlignmentScore = Field(default_factory=lambda: AlignmentScore(score=0, label="unknown"))
    check_size_fit: Optional[AlignmentScore] = None
    key_fit_reasons: List[str] = []
    key_misfit_reasons: List[str] = []
    confidence: float = 0.0


class MoatAnalysis(BaseModel):
    network_effects: MoatSignal
    data_moat: MoatSignal
    distribution: MoatSignal
    switching_costs: MoatSignal
    brand: MoatSignal
    technical_depth: MoatSignal
    regulatory: MoatSignal
    partnerships: MoatSignal
    overall_moat_score: int  # 0-100
    moat_summary: str


class RedFlag(BaseModel):
    severity: str  # low, medium, high, critical
    category: str
    explanation: str
    supporting_evidence: str
    confidence: float


class DiligenceQuestion(BaseModel):
    question: str
    category: str  # founders, market, product, business_model, competition, financials, legal
    priority: str  # high, medium, low
    why_important: str


class ICMemo(BaseModel):
    headline: str
    recommendation: str  # strong_invest, investigate, monitor, pass
    recommendation_rationale: str
    thesis_fit_summary: str
    key_strengths: List[str]
    key_risks: List[str]
    suggested_next_step: str
    diligence_plan: str
    full_memo_text: str


class ReportSection(BaseModel):
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


class ProgressStage(BaseModel):
    name: str
    status: str  # pending, running, completed, failed, skipped
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


class InvestorProfileSnapshot(BaseModel):
    fund_name: str = ""
    investor_name: str = ""
    investment_thesis: str = ""
    preferred_sectors: List[str] = []
    preferred_stages: List[str] = []
    geographies: List[str] = []
    typical_check_size: str = ""
    investment_style: str = ""


class StartupIntelligenceReport(BaseModel):
    id: Optional[str] = None
    user_id: str
    company_name: str
    website_url: str
    linkedin_url: Optional[str] = None
    user_context: Optional[str] = None
    investor_profile_snapshot: InvestorProfileSnapshot = Field(default_factory=InvestorProfileSnapshot)

    status: str = "queued"  # queued, researching, analyzing, completed, failed
    progress_percent: int = 0
    current_stage: str = "Queued"
    stages: List[ProgressStage] = []
    error_message: Optional[str] = None

    cache_key: Optional[str] = None
    cache_used: bool = False
    cache_age_hours: Optional[float] = None
    refresh_reason: Optional[str] = None

    thesis_match: Optional[ThesisMatch] = None
    moat_analysis: Optional[MoatAnalysis] = None
    red_flags: List[RedFlag] = []
    ic_memo: Optional[ICMemo] = None
    report: Optional[ReportSection] = None
    diligence_questions: List[DiligenceQuestion] = []

    sources: List[ResearchSource] = []
    overall_confidence: float = 0.0
    evidence_confidence: Optional[EvidenceConfidence] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


CACHE_TTL_DAYS = 14
