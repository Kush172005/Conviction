from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum


class FollowUpStatus(str, Enum):
    OPEN = "open"
    COMPLETED = "completed"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class FollowUpPriority(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FollowUpDocument(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    company_id: str
    call_id: Optional[str] = None

    action: str
    due_date: Optional[datetime] = None
    status: FollowUpStatus = FollowUpStatus.OPEN
    priority: FollowUpPriority = FollowUpPriority.MEDIUM
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


INDEXES = [
    {"keys": [("user_id", 1), ("status", 1), ("due_date", 1)]},
    {"keys": [("company_id", 1), ("created_at", -1)]},
]
