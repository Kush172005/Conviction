from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.models.call import CallInputMode, CallStatus
from app.schemas.follow_up import FollowUpResponse


class CallCreate(BaseModel):
    company_id: str
    title: str
    input_mode: CallInputMode
    raw_notes: Optional[str] = None
    transcript_text: Optional[str] = None
    occurred_at: Optional[datetime] = None


class CallResponse(BaseModel):
    id: str
    user_id: str
    company_id: str
    title: str
    input_mode: CallInputMode
    status: CallStatus
    raw_notes: Optional[str] = None
    transcript_text: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    processing_error: Optional[str] = None
    occurred_at: datetime
    created_at: datetime
    updated_at: datetime


class CallIntelligenceResponse(BaseModel):
    """Single unified response for the Call Intelligence page."""

    # ── Call metadata ──────────────────────────────────────────────────────────
    call_id: str
    company_id: str
    company_name: str
    call_title: str
    input_mode: str
    occurred_at: datetime
    transcript_text: Optional[str] = None

    # ── Decision / AI output ───────────────────────────────────────────────────
    decision_id: str
    recommendation: str
    confidence: int
    rationale: str
    deal_summary: Optional[str] = None
    founder_assessment: Optional[str] = None
    business_overview: Optional[str] = None
    market_assessment: Optional[str] = None
    thesis_fit: str = ""
    strengths: List[str] = []
    concerns: List[str] = []
    opportunities: List[str] = []
    risks: List[str] = []
    open_questions: List[str] = []
    key_metrics: Optional[Dict[str, str]] = None
    suggested_follow_up_date: Optional[datetime] = None
    draft_email: Optional[str] = None
    decision_created_at: datetime

    # ── Related records ────────────────────────────────────────────────────────
    follow_ups: List[FollowUpResponse] = []

    # ── Provider activity ──────────────────────────────────────────────────────
    provider_log: List[Dict[str, Any]] = []
