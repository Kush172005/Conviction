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


