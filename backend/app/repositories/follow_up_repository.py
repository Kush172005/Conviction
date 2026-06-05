from typing import List
from .base import BaseRepository


class FollowUpRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "follow_ups")

    async def find_by_user(self, user_id: str, status: str | None = None) -> List[dict]:
        query: dict = {"user_id": user_id}
        if status:
            query["status"] = status
        return await self.find_many(query, sort=[("due_date", 1)])

    async def find_by_company(self, company_id: str, user_id: str) -> List[dict]:
        return await self.find_many(
            {"company_id": company_id, "user_id": user_id},
            sort=[("due_date", 1)],
        )

    async def count_open(self, user_id: str) -> int:
        return await self.count({"user_id": user_id, "status": {"$in": ["open", "overdue"]}})
