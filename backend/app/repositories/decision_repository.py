from typing import Optional
from .base import BaseRepository


class DecisionRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "decisions")

    async def find_by_call(self, call_id: str) -> Optional[dict]:
        return await self.find_one({"call_id": call_id})

    async def find_latest_by_company(self, company_id: str) -> Optional[dict]:
        docs = await self.find_many({"company_id": company_id}, sort=[("created_at", -1)], limit=1)
        return docs[0] if docs else None
