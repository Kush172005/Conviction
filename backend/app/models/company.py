from typing import Optional
from pydantic import BaseModel
from enum import Enum


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


