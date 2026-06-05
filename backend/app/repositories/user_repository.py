from typing import Optional
from .base import BaseRepository


class UserRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "users")

    async def find_by_google_id(self, google_id: str) -> Optional[dict]:
        return await self.find_one({"google_id": google_id})

    async def find_by_email(self, email: str) -> Optional[dict]:
        return await self.find_one({"email": email})

    async def upsert_google_user(self, google_id: str, email: str, name: str, avatar_url: Optional[str] = None) -> dict:
        from datetime import datetime
        existing = await self.find_by_google_id(google_id)
        if existing:
            updates = {"updated_at": datetime.utcnow()}
            if name and name != existing.get("name"):
                updates["name"] = name
            if avatar_url and avatar_url != existing.get("avatar_url"):
                updates["avatar_url"] = avatar_url
            if len(updates) > 1:
                await self.update_one(existing["id"], updates)
                existing = await self.find_by_id(existing["id"])
            return existing
        doc = {
            "google_id": google_id,
            "email": email,
            "name": name,
            "avatar_url": avatar_url,
            "onboarding_completed": False,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        inserted_id = await self.insert_one(doc)
        doc["id"] = inserted_id
        return doc
