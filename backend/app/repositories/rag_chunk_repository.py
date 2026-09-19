from datetime import datetime
from typing import List, Optional

from .base import BaseRepository

VECTOR_INDEX_NAME = "rag_chunks_vector_index"


class RagChunkRepository(BaseRepository):
    def __init__(self, db):
        super().__init__(db, "rag_chunks")

    async def delete_by_source(self, source_type: str, source_id: str) -> None:
        await self.collection.delete_many({"source_type": source_type, "source_id": source_id})

    async def insert_chunks(self, chunks: List[dict]) -> None:
        if not chunks:
            return
        now = datetime.utcnow()
        for c in chunks:
            c.setdefault("created_at", now)
            c.setdefault("updated_at", now)
        await self.collection.insert_many(chunks)

    async def vector_search(
        self,
        *,
        user_id: str,
        company_id: str,
        query_vector: List[float],
        k: int = 8,
    ) -> List[dict]:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": VECTOR_INDEX_NAME,
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": max(100, k * 15),
                    "limit": k,
                    "filter": {"user_id": user_id, "company_id": company_id},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "source_type": 1,
                    "source_id": 1,
                    "chunk_index": 1,
                    "text": 1,
                    "occurred_at": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        return await self.aggregate(pipeline)
