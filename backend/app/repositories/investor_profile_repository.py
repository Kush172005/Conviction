from typing import Optional
from .base import BaseRepository


class InvestorProfileRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "investor_profiles")

    async def find_by_user(self, user_id: str) -> Optional[dict]:
        return await self.find_one({"user_id": user_id})
