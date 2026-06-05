from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.models.investor_profile import Stage, CheckSize, InvestmentStyle


class InvestorProfileCreate(BaseModel):
    fund_name: str
    investor_name: str
    investment_thesis: str
    preferred_sectors: List[str] = []
    preferred_stages: List[Stage] = []
    typical_check_size: CheckSize = CheckSize.M1_5M
    geographies: List[str] = []
    investment_style: InvestmentStyle = InvestmentStyle.BOTH


class InvestorProfileUpdate(BaseModel):
    fund_name: Optional[str] = None
    investor_name: Optional[str] = None
    investment_thesis: Optional[str] = None
    preferred_sectors: Optional[List[str]] = None
    preferred_stages: Optional[List[Stage]] = None
    typical_check_size: Optional[CheckSize] = None
    geographies: Optional[List[str]] = None
    investment_style: Optional[InvestmentStyle] = None


class InvestorProfileResponse(InvestorProfileCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
