from typing import List, Optional
from .base import BaseRepository


class CompanyRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "companies")

    async def find_by_user(self, user_id: str, status: Optional[str] = None, limit: int = 50) -> List[dict]:
        query: dict = {"user_id": user_id}
        if status:
            query["status"] = status
        return await self.find_many(query, sort=[("updated_at", -1)], limit=limit)

    async def find_by_id_for_user(self, company_id: str, user_id: str) -> Optional[dict]:
        from bson import ObjectId
        try:
            doc = await self.collection.find_one({"_id": ObjectId(company_id), "user_id": user_id})
            from .base import serialize_doc
            return serialize_doc(doc) if doc else None
        except Exception:
            return None

    async def increment_call_count(self, company_id: str) -> None:
        from datetime import datetime
        from bson import ObjectId
        await self.collection.update_one(
            {"_id": ObjectId(company_id)},
            {
                "$inc": {"call_count": 1},
                "$set": {"last_interaction_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            },
        )
