import logging
from typing import List

from app.config import settings
from app.repositories.rag_chunk_repository import RagChunkRepository
from app.services.rag.embeddings import embed_query

logger = logging.getLogger("rag.retrieval")


async def retrieve_chunks(
    db, *, user_id: str, company_id: str, query: str, k: int = 8
) -> List[dict]:
    """
    Embed the question and run a $vectorSearch pre-filtered by user_id+company_id.
    Returns [] if embeddings are unavailable or nothing is indexed yet — callers
    must handle an empty result gracefully, never raise.
    """
    vector = await embed_query(query, api_key=settings.gemini_api_key)
    if not vector:
        return []

    try:
        repo = RagChunkRepository(db)
        return await repo.vector_search(
            user_id=user_id, company_id=company_id, query_vector=vector, k=k
        )
    except Exception:
        logger.exception("Vector search failed for company_id=%s", company_id)
        return []
