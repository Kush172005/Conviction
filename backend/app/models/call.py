from enum import Enum


class CallInputMode(str, Enum):
    VOICE = "voice"
    TEXT = "text"
    TRANSCRIPT = "transcript"  # legacy — kept for existing records
    RECORDING = "recording"


class CallStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


