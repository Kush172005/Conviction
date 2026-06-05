from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class CallInputMode(str, Enum):
    VOICE = "voice"
    TEXT = "text"
    TRANSCRIPT = "transcript"


class CallStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CallDocument(BaseModel):
    """Captures a single founder interaction."""

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    company_id: str

    title: str
    input_mode: CallInputMode
    raw_notes: Optional[str] = None
    transcript_text: Optional[str] = None
    audio_url: Optional[str] = None  # future: S3 URL
    duration_seconds: Optional[int] = None
    status: CallStatus = CallStatus.PENDING
    processing_error: Optional[str] = None

    # Embedding for future semantic search
    embedding: Optional[List[float]] = None
    embedding_model: Optional[str] = None

    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# Indexes:
# { user_id: 1, company_id: 1, occurred_at: -1 }
# { user_id: 1, occurred_at: -1 }
INDEXES = [
    {"keys": [("user_id", 1), ("company_id", 1), ("occurred_at", -1)]},
    {"keys": [("user_id", 1), ("occurred_at", -1)]},
]
