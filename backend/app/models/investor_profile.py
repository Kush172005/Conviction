from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class Stage(str, Enum):
    PRE_SEED = "pre-seed"
    SEED = "seed"
    SERIES_A = "series-a"
    SERIES_B = "series-b"
    SERIES_C = "series-c"
    GROWTH = "growth"
    LATE_STAGE = "late-stage"


class CheckSize(str, Enum):
    UNDER_250K = "<$250k"
    K250_1M = "$250k-$1M"
    M1_5M = "$1M-$5M"
    M5_25M = "$5M-$25M"
    OVER_25M = "$25M+"


class InvestmentStyle(str, Enum):
    LEAD = "lead"
    FOLLOW = "follow"
    BOTH = "both"


class InvestorProfileDocument(BaseModel):
    """One-to-one with User. Personalises AI outputs."""

    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str  # ObjectId as str

    fund_name: str
    investor_name: str
    investment_thesis: str
    preferred_sectors: List[str] = []
    preferred_stages: List[Stage] = []
    typical_check_size: CheckSize = CheckSize.M1_5M
    geographies: List[str] = []
    investment_style: InvestmentStyle = InvestmentStyle.BOTH

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        use_enum_values = True


# Indexes:
# { user_id: 1 } unique
INDEXES = [
    {"keys": [("user_id", 1)], "unique": True},
]
