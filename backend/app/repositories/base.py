from datetime import datetime
from typing import Any, Dict, List, Optional, TypeVar, Generic
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId


T = TypeVar("T")


def serialize_doc(doc: dict) -> dict:
    """Convert ObjectId _id to string id for API responses."""
    if doc and "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


class BaseRepository:
    def __init__(self, db: AsyncIOMotorDatabase, collection_name: str):
        self.collection = db[collection_name]

    async def find_by_id(self, doc_id: str) -> Optional[dict]:
        try:
            doc = await self.collection.find_one({"_id": ObjectId(doc_id)})
            return serialize_doc(doc) if doc else None
        except Exception:
            return None

    async def find_one(self, query: dict) -> Optional[dict]:
        doc = await self.collection.find_one(query)
        return serialize_doc(doc) if doc else None

    async def find_many(
        self,
        query: dict,
        sort: Optional[List] = None,
        limit: int = 50,
        skip: int = 0,
    ) -> List[dict]:
        cursor = self.collection.find(query)
        if sort:
            cursor = cursor.sort(sort)
        cursor = cursor.skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [serialize_doc(d) for d in docs]

    async def count(self, query: dict) -> int:
        return await self.collection.count_documents(query)

    async def insert_one(self, data: dict) -> str:
        data.pop("id", None)
        data.pop("_id", None)
        result = await self.collection.insert_one(data)
        return str(result.inserted_id)

    async def update_one(self, doc_id: str, updates: dict) -> bool:
        updates["updated_at"] = datetime.utcnow()
        result = await self.collection.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": updates},
        )
        return result.modified_count > 0

    async def delete_one(self, doc_id: str) -> bool:
        result = await self.collection.delete_one({"_id": ObjectId(doc_id)})
        return result.deleted_count > 0

    async def aggregate(self, pipeline: List[dict]) -> List[dict]:
        cursor = self.collection.aggregate(pipeline)
        return await cursor.to_list(length=None)
