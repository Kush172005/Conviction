"""
Background indexing for the RAG chatbot.

Reads call/decision/memory text, chunks it, embeds it via Gemini, and upserts
it into rag_chunks. Runs as a FastAPI BackgroundTask right after a call is
processed — same shape as startup_intelligence's background pipeline.

Never raises: indexing failure must not break the request/task it's attached to.
"""
import logging
from datetime import datetime
from typing import Literal, Optional

from app.config import settings
from app.repositories.rag_chunk_repository import RagChunkRepository
from app.services.rag.chunking import chunk_text
from app.services.rag.embeddings import document_text, embed_texts

logger = logging.getLogger("rag.indexer")

SourceType = Literal["call_transcript", "decision", "memory_entry"]


async def index_source(
    db,
    *,
    user_id: str,
    company_id: str,
    source_type: SourceType,
    source_id: str,
    text: str,
    occurred_at: Optional[datetime],
    title: Optional[str] = None,
) -> None:
    """Idempotent: replaces any existing chunks for (source_type, source_id)."""
    repo = RagChunkRepository(db)
    try:
        await repo.delete_by_source(source_type, source_id)

        pieces = chunk_text(text)
        if not pieces:
            return

        embeddings = await embed_texts(
            [document_text(p, title=title) for p in pieces],
            api_key=settings.gemini_api_key,
        )

        now = datetime.utcnow()
        docs = [
            {
                "user_id": user_id,
                "company_id": company_id,
                "source_type": source_type,
                "source_id": source_id,
                "chunk_index": i,
                "text": piece,
                "embedding": embedding,
                "occurred_at": occurred_at or now,
                "created_at": now,
                "updated_at": now,
            }
            for i, (piece, embedding) in enumerate(zip(pieces, embeddings))
            if embedding
        ]
        await repo.insert_chunks(docs)
    except Exception:
        logger.exception(
            "RAG indexing failed for source_type=%s source_id=%s", source_type, source_id
        )


async def index_call(db, *, call: dict, decision: Optional[dict]) -> None:
    """Index everything derived from one processed call: transcript/notes, decision, memory."""
    try:
        user_id = call.get("user_id")
        company_id = call.get("company_id")
        call_id = call.get("id")
        occurred_at = call.get("occurred_at")

        transcript = call.get("transcript_text") or call.get("raw_notes") or ""
        if transcript.strip():
            await index_source(
                db,
                user_id=user_id,
                company_id=company_id,
                source_type="call_transcript",
                source_id=call_id,
                text=transcript,
                occurred_at=occurred_at,
                title=call.get("title"),
            )

        if decision:
            decision_text = "\n\n".join(
                part
                for part in [
                    decision.get("deal_summary"),
                    decision.get("rationale"),
                    decision.get("business_overview"),
                    decision.get("market_assessment"),
                    decision.get("founder_assessment"),
                ]
                if part
            )
            if decision_text.strip():
                await index_source(
                    db,
                    user_id=user_id,
                    company_id=company_id,
                    source_type="decision",
                    source_id=decision.get("id"),
                    text=decision_text,
                    occurred_at=occurred_at,
                )

        memory_doc = await db["memory_entries"].find_one({"call_id": call_id})
        if memory_doc and memory_doc.get("summary", "").strip():
            await index_source(
                db,
                user_id=user_id,
                company_id=company_id,
                source_type="memory_entry",
                source_id=str(memory_doc["_id"]),
                text=memory_doc["summary"],
                occurred_at=memory_doc.get("occurred_at"),
                title=memory_doc.get("title"),
            )
    except Exception:
        logger.exception("index_call failed for call_id=%s", call.get("id"))
