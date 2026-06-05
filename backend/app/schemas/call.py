from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.call import CallInputMode, CallStatus


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
    duration_seconds: Optional[int] = None
    occurred_at: datetime
    created_at: datetime
    updated_at: datetime
