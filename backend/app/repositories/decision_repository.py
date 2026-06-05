from datetime import datetime
from typing import Optional
from bson import ObjectId
from .base import BaseRepository, serialize_doc


class DecisionRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "decisions")

    async def find_by_call(self, call_id: str) -> Optional[dict]:
        return await self.find_one({"call_id": call_id})

    async def find_latest_by_company(self, company_id: str) -> Optional[dict]:
        docs = await self.find_many({"company_id": company_id}, sort=[("created_at", -1)], limit=1)
        return docs[0] if docs else None

    async def upsert_for_call(self, call_id: str, data: dict) -> str:
        """
        Idempotent insert/update for a call's decision.
        If a decision already exists for call_id, replace all fields (re-process).
        Returns the decision document id.
        """
        data.pop("id", None)
        data.pop("_id", None)
        data["updated_at"] = datetime.utcnow()

        existing = await self.collection.find_one({"call_id": call_id})
        if existing:
            doc_id = existing["_id"]
            await self.collection.replace_one(
                {"_id": doc_id},
                {**data, "_id": doc_id},
            )
            return str(doc_id)

        data.setdefault("created_at", datetime.utcnow())
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)
