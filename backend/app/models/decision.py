from enum import Enum


class Recommendation(str, Enum):
    STRONG_INVEST = "strong_invest"
    INVEST = "invest"
    PASS = "pass"
    MONITOR = "monitor"
    NEED_MORE_INFO = "need_more_info"


