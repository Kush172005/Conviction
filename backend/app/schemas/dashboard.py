from datetime import datetime
from typing import List
from pydantic import BaseModel


class RecentActivityItem(BaseModel):
    id: str
    type: str
    title: str
    description: str
    company_name: str | None = None
    timestamp: datetime


class DashboardStatsResponse(BaseModel):
    companies_tracked: int
    calls_logged: int
    open_follow_ups: int
    active_decisions: int
    recent_activity: List[RecentActivityItem] = []
