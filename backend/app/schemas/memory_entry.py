from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from app.models.memory_entry import MemoryEntryType, Sentiment


class MemoryEntryResponse(BaseModel):
    id: str
    user_id: str
    company_id: str
    call_id: Optional[str] = None
    type: MemoryEntryType
    title: str
    summary: str
    sentiment: Sentiment
    importance: int
    occurred_at: datetime
    created_at: datetime
