"""
One-off script: create the Atlas Vector Search index for rag_chunks.
Run once per environment (dev, then prod) — Atlas indexes are per-cluster,
not something migrations recreate on every deploy.

Usage: python -m scripts.create_vector_index
"""
import asyncio
import sys

sys.path.insert(0, ".")

from pymongo.operations import SearchIndexModel  # noqa: E402

from app.db import close_client, get_database  # noqa: E402
from app.repositories.rag_chunk_repository import VECTOR_INDEX_NAME  # noqa: E402

POLL_INTERVAL_SECONDS = 5
POLL_TIMEOUT_SECONDS = 120


async def main() -> None:
    db = get_database()
    collection = db["rag_chunks"]

    if "rag_chunks" not in await db.list_collection_names():
        await db.create_collection("rag_chunks")
        print("Created empty 'rag_chunks' collection.")

    existing = [idx async for idx in collection.list_search_indexes(VECTOR_INDEX_NAME)]
    if existing:
        print(f"Index '{VECTOR_INDEX_NAME}' already exists (queryable={existing[0].get('queryable')}).")
        await close_client()
        return

    model = SearchIndexModel(
        name=VECTOR_INDEX_NAME,
        type="vectorSearch",
        definition={
            "fields": [
                {"type": "vector", "path": "embedding", "numDimensions": 768, "similarity": "cosine"},
                {"type": "filter", "path": "user_id"},
                {"type": "filter", "path": "company_id"},
            ]
        },
    )
    await collection.create_search_index(model=model)
    print(f"Creating '{VECTOR_INDEX_NAME}'... polling until queryable.")

    waited = 0
    while waited < POLL_TIMEOUT_SECONDS:
        indexes = [idx async for idx in collection.list_search_indexes(VECTOR_INDEX_NAME)]
        if indexes and indexes[0].get("queryable"):
            print(f"Index '{VECTOR_INDEX_NAME}' is queryable.")
            await close_client()
            return
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
        waited += POLL_INTERVAL_SECONDS

    print(f"Timed out waiting for '{VECTOR_INDEX_NAME}' to become queryable — check the Atlas UI.")
    await close_client()


if __name__ == "__main__":
    asyncio.run(main())
