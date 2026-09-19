"""
Gemini embeddings client for RAG indexing/retrieval — mirrors the request/retry
shape of app.services.llm.gemini_client, but targets the embeddings endpoint.

Model: gemini-embedding-2 (text-embedding-004 was shut down Jan 2026;
gemini-embedding-001 still works but is superseded). Unlike the older models,
gemini-embedding-2 has no task_type field — task intent is baked into the text
itself via a prefix, applied consistently at index time and query time.
"""
import logging
from typing import Any, Dict, List, Optional

import httpx

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
EMBEDDING_MODEL = "gemini-embedding-2"
OUTPUT_DIMENSIONS = 768

logger = logging.getLogger("rag.embeddings")


def document_text(text: str, title: Optional[str] = None) -> str:
    """Prefix convention for indexed content (must match embed_query's convention)."""
    if title:
        return f"title: {title} | text: {text}"
    return f"task: search document | text: {text}"


def query_text(text: str) -> str:
    """Prefix convention for a user's chat question."""
    return f"task: search result | query: {text}"


async def embed_texts(texts: List[str], api_key: str) -> List[Optional[List[float]]]:
    """
    Batch-embed already-prefixed document texts. Returns one entry per input text,
    None for any that failed — callers must skip None entries, never raise.
    """
    if not api_key or not texts:
        return [None] * len(texts)

    payload = {
        "requests": [
            {
                "model": f"models/{EMBEDDING_MODEL}",
                "content": {"parts": [{"text": t}]},
                "outputDimensionality": OUTPUT_DIMENSIONS,
            }
            for t in texts
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{GEMINI_BASE}/{EMBEDDING_MODEL}:batchEmbedContents",
                headers={"x-goog-api-key": api_key},
                json=payload,
            )
        if resp.status_code != 200:
            logger.warning("Gemini batchEmbedContents failed: HTTP %s: %s", resp.status_code, resp.text[:300])
            return [None] * len(texts)

        body: Dict[str, Any] = resp.json()
        embeddings = body.get("embeddings") or []
        if len(embeddings) != len(texts):
            logger.warning("Gemini batchEmbedContents returned %d embeddings for %d texts", len(embeddings), len(texts))

        results: List[Optional[List[float]]] = []
        for i in range(len(texts)):
            values = embeddings[i].get("values") if i < len(embeddings) else None
            results.append(values if isinstance(values, list) else None)
        return results
    except Exception:
        logger.exception("Gemini batchEmbedContents call failed")
        return [None] * len(texts)


async def embed_query(text: str, api_key: str) -> Optional[List[float]]:
    """Single-text embed for a user question, using the query prefix convention."""
    if not api_key or not text.strip():
        return None

    payload = {
        "content": {"parts": [{"text": query_text(text)}]},
        "outputDimensionality": OUTPUT_DIMENSIONS,
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{GEMINI_BASE}/{EMBEDDING_MODEL}:embedContent",
                headers={"x-goog-api-key": api_key},
                json=payload,
            )
        if resp.status_code != 200:
            logger.warning("Gemini embedContent failed: HTTP %s: %s", resp.status_code, resp.text[:300])
            return None

        body = resp.json()
        values = (body.get("embedding") or {}).get("values")
        return values if isinstance(values, list) else None
    except Exception:
        logger.exception("Gemini embedContent call failed")
        return None
