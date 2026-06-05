from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, Field
from enum import Enum


class MemoryEntryType(str, Enum):
    CALL_NOTE = "call_note"
    DECISION = "decision"
    CONCERN = "concern"
    MILESTONE = "milestone"
    FOLLOW_UP = "follow_up"
    THESIS_UPDATE = "thesis_update"


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"


class MemoryEntryDocument(BaseModel):
    """
    Investment memory entry — a structured snapshot of a moment in a company's
    deal history. Building blocks for the intelligence timeline.
    Future-ready for semantic search via embeddings.
    """

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    company_id: str
    call_id: Optional[str] = None

    type: MemoryEntryType
    title: str
    summary: str
    sentiment: Sentiment = Sentiment.NEUTRAL
    importance: int = Field(default=3, ge=1, le=5)

    # Future: embedding for semantic recall
    embedding: Optional[List[float]] = None
    embedding_model: Optional[str] = None

    occurred_at: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# Access pattern: "show all memory for company X sorted by time"
# Access pattern: "show all memory for user Y sorted by time"
# Future: "find entries semantically similar to this query"
INDEXES = [
    {"keys": [("user_id", 1), ("company_id", 1), ("occurred_at", -1)]},
    {"keys": [("user_id", 1), ("occurred_at", -1)]},
    {"keys": [("company_id", 1), ("type", 1)]},
]
