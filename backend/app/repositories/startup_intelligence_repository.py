from datetime import datetime, timedelta
from typing import List, Optional
from .base import BaseRepository
from app.models.startup_intelligence import CACHE_TTL_DAYS


class StartupReportRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "startup_intelligence_reports")

    async def find_by_user(self, user_id: str, limit: int = 50) -> List[dict]:
        return await self.find_many(
            {"user_id": user_id},
            sort=[("created_at", -1)],
            limit=limit,
        )

    async def find_by_id_for_user(self, report_id: str, user_id: str) -> Optional[dict]:
        doc = await self.find_by_id(report_id)
        if doc and doc.get("user_id") == user_id:
            return doc
        return None

    async def update_progress(
        self,
        report_id: str,
        percent: int,
        stage: str,
        stages: Optional[list] = None,
        extra: Optional[dict] = None,
    ) -> bool:
        updates: dict = {
            "progress_percent": percent,
            "current_stage": stage,
        }
        if stages is not None:
            updates["stages"] = stages
        if extra:
            updates.update(extra)
        return await self.update_one(report_id, updates)

    async def mark_completed(self, report_id: str, result_updates: dict) -> bool:
        result_updates["status"] = "completed"
        result_updates["progress_percent"] = 100
        result_updates["current_stage"] = "Completed"
        result_updates["completed_at"] = datetime.utcnow()
        return await self.update_one(report_id, result_updates)

    async def mark_failed(self, report_id: str, error: str) -> bool:
        return await self.update_one(report_id, {
            "status": "failed",
            "error_message": error,
            "current_stage": "Failed",
        })


class StartupCacheRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "startup_company_research_cache")

    async def find_by_domain(self, normalized_domain: str) -> Optional[dict]:
        return await self.find_one({"normalized_domain": normalized_domain})

    async def upsert_by_domain(self, normalized_domain: str, data: dict) -> str:
        existing = await self.find_by_domain(normalized_domain)
        if existing:
            data["updated_at"] = datetime.utcnow()
            await self.update_one(existing["id"], data)
            return existing["id"]
        data["normalized_domain"] = normalized_domain
        data.setdefault("created_at", datetime.utcnow())
        data["updated_at"] = datetime.utcnow()
        return await self.insert_one(data)

    def is_fresh(self, cache_doc: dict) -> bool:
        expires_at = cache_doc.get("expires_at")
        if not expires_at:
            return False
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        return expires_at > datetime.utcnow() and cache_doc.get("cache_status") == "fresh"

    def cache_age_hours(self, cache_doc: dict) -> float:
        last = cache_doc.get("last_researched_at")
        if not last:
            return 9999.0
        if isinstance(last, str):
            last = datetime.fromisoformat(last)
        delta = datetime.utcnow() - last
        return delta.total_seconds() / 3600
