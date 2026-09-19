"""
One-off script: index every already-processed call for RAG retrieval.
Safe to re-run — index_source deletes-then-reinserts per (source_type, source_id).

Usage: python -m scripts.backfill_rag_index
"""
import asyncio
import sys

sys.path.insert(0, ".")

from app.db import close_client, get_database  # noqa: E402
from app.repositories.base import serialize_doc  # noqa: E402
from app.services.rag import index_call  # noqa: E402


async def main() -> None:
    db = get_database()
    count = 0
    async for call_raw in db["calls"].find({"status": "completed"}):
        call = serialize_doc(call_raw)
        decision_raw = await db["decisions"].find_one({"call_id": call["id"]})
        decision = serialize_doc(decision_raw) if decision_raw else None
        await index_call(db, call=call, decision=decision)
        count += 1
        print(f"Indexed call {call['id']} ({call.get('title', '')})")

    print(f"Done. Indexed {count} completed calls.")
    await close_client()


if __name__ == "__main__":
    asyncio.run(main())
