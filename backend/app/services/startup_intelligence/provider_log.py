"""
Tracks which external providers were called during a report run.
Stored on the report document and printed to server logs.
"""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger("startup_intelligence.providers")


class ProviderLog:
    def __init__(self):
        self.entries: List[Dict[str, Any]] = []

    def record(
        self,
        provider: str,
        action: str,
        status: str,
        detail: str = "",
        response_preview: str = "",
    ):
        entry = {
            "provider": provider,
            "action": action,
            "status": status,
            "detail": detail,
            "response_preview": (response_preview or "")[:500],
            "at": datetime.utcnow().isoformat(),
        }
        self.entries.append(entry)
        level = logging.INFO if status in ("ok", "skipped") else logging.WARNING
        logger.log(
            level,
            "[%s] %s — %s | %s%s",
            provider,
            action,
            status,
            detail,
            f" | preview: {response_preview[:120]}" if response_preview else "",
        )

    def to_list(self) -> List[Dict[str, Any]]:
        return self.entries
