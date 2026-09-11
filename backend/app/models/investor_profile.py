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


