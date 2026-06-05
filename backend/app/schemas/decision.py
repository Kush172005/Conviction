from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from app.models.decision import Recommendation


class DecisionResponse(BaseModel):
    id: str
    call_id: str
    company_id: str
    user_id: str
    recommendation: Recommendation
    rationale: str
    thesis_fit: str
    strengths: List[str]
    concerns: List[str]
    confidence: int
    deal_summary: Optional[str] = None
    founder_assessment: Optional[str] = None
    business_overview: Optional[str] = None
    market_assessment: Optional[str] = None
    opportunities: List[str] = []
    risks: List[str] = []
    open_questions: List[str] = []
    key_metrics: Optional[Dict[str, Any]] = None
    suggested_follow_up_date: Optional[datetime] = None
    draft_email: Optional[str] = None
    created_at: datetime
