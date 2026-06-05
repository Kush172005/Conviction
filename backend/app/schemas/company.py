from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.company import CompanyStatus, Founder, EnrichmentStatus
from app.models.investor_profile import Stage


class CompanyCreate(BaseModel):
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


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    founders: Optional[List[Founder]] = None
    status: Optional[CompanyStatus] = None
    stage: Optional[Stage] = None
    location: Optional[str] = None
    employee_count: Optional[str] = None
    total_funding: Optional[str] = None


class CompanyResponse(BaseModel):
    id: str
    user_id: str
    name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    description: Optional[str] = None
    founders: List[Founder] = []
    status: CompanyStatus
    stage: Optional[Stage] = None
    location: Optional[str] = None
    employee_count: Optional[str] = None
    total_funding: Optional[str] = None
    enrichment_status: EnrichmentStatus
    call_count: int
    last_interaction_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
