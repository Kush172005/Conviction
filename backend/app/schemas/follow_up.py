from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.follow_up import FollowUpStatus, FollowUpPriority


class FollowUpCreate(BaseModel):
    company_id: str
    call_id: Optional[str] = None
    action: str
    due_date: Optional[datetime] = None
    priority: FollowUpPriority = FollowUpPriority.MEDIUM
    notes: Optional[str] = None


class FollowUpUpdate(BaseModel):
    action: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[FollowUpStatus] = None
    priority: Optional[FollowUpPriority] = None
    notes: Optional[str] = None


class FollowUpResponse(BaseModel):
    id: str
    user_id: str
    company_id: str
    call_id: Optional[str] = None
    action: str
    due_date: Optional[datetime] = None
    status: FollowUpStatus
    priority: FollowUpPriority
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
