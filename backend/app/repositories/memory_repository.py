from typing import List
from .base import BaseRepository


class MemoryRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "memory_entries")

    async def find_by_company(self, company_id: str, user_id: str) -> List[dict]:
        return await self.find_many(
            {"company_id": company_id, "user_id": user_id},
            sort=[("occurred_at", -1)],
        )

    async def find_by_user(self, user_id: str, limit: int = 100) -> List[dict]:
        return await self.find_many({"user_id": user_id}, sort=[("occurred_at", -1)], limit=limit)
