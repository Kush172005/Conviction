from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum
from .investor_profile import Stage


class CompanyStatus(str, Enum):
    TRACKING = "tracking"
    ACTIVE = "active"
    PASSED = "passed"
    PORTFOLIO = "portfolio"
    ARCHIVED = "archived"


class EnrichmentStatus(str, Enum):
    NOT_STARTED = "not_started"
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"


class Founder(BaseModel):
    name: str
    role: str
    linkedin: Optional[str] = None
    background: Optional[str] = None


class CompanyDocument(BaseModel):
    """A company being tracked in the deal pipeline."""

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str  # tenant scoping

    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    founders: List[Founder] = []
    status: CompanyStatus = CompanyStatus.TRACKING
    stage: Optional[Stage] = None
    location: Optional[str] = None
    employee_count: Optional[str] = None
    total_funding: Optional[str] = None
    last_valuation: Optional[str] = None

    # AI enrichment (future)
    enrichment_status: EnrichmentStatus = EnrichmentStatus.NOT_STARTED
    enrichment_data: Optional[dict] = None  # Raw AI-extracted JSON

    # Embedding for future vector search
    embedding: Optional[List[float]] = None
    embedding_model: Optional[str] = None

    call_count: int = 0
    last_interaction_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# Indexes:
# { user_id: 1, created_at: -1 }
# { user_id: 1, status: 1 }
# { user_id: 1, name: 1 }
INDEXES = [
    {"keys": [("user_id", 1), ("created_at", -1)]},
    {"keys": [("user_id", 1), ("status", 1)]},
]
