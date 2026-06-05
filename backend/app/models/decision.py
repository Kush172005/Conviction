from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class Recommendation(str, Enum):
    STRONG_INVEST = "strong_invest"
    INVEST = "invest"
    PASS = "pass"
    MONITOR = "monitor"
    NEED_MORE_INFO = "need_more_info"


class DecisionDocument(BaseModel):
    """Structured deal intelligence output for a call."""

    id: Optional[str] = Field(default=None, alias="_id")
    call_id: str
    company_id: str
    user_id: str

    recommendation: Recommendation
    rationale: str
    thesis_fit: str
    strengths: List[str] = []
    concerns: List[str] = []
    confidence: int  # 0–100

    deal_summary: Optional[str] = None
    founder_assessment: Optional[str] = None
    business_overview: Optional[str] = None
    market_assessment: Optional[str] = None

    suggested_follow_up_date: Optional[datetime] = None
    draft_email: Optional[str] = None

    # Future: embeddings for semantic memory queries
    embedding: Optional[List[float]] = None
    embedding_model: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# Indexes:
# { call_id: 1 } unique
# { company_id: 1, created_at: -1 }
# { user_id: 1, created_at: -1 }
INDEXES = [
    {"keys": [("call_id", 1)], "unique": True},
    {"keys": [("company_id", 1), ("created_at", -1)]},
    {"keys": [("user_id", 1), ("created_at", -1)]},
]
