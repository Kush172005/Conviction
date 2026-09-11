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


