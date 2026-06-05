from typing import List, Optional
from .base import BaseRepository


class CallRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "calls")

    async def find_by_company(self, company_id: str, user_id: str) -> List[dict]:
        return await self.find_many(
            {"company_id": company_id, "user_id": user_id},
            sort=[("occurred_at", -1)],
        )

    async def find_by_user(self, user_id: str, limit: int = 20) -> List[dict]:
        return await self.find_many({"user_id": user_id}, sort=[("occurred_at", -1)], limit=limit)
