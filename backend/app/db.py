import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings

_client: AsyncIOMotorClient | None = None

# When running on AWS Lambda, set LAMBDA_POOL_SIZE=1 (via Lambda environment
# variable configuration) to avoid opening a full connection pool per
# cold-start instance against MongoDB Atlas.
# On EC2 / local development, leave LAMBDA_POOL_SIZE unset — the long-running
# server pool settings below are used unchanged.
_lambda_pool_size = os.environ.get("LAMBDA_POOL_SIZE")


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        if _lambda_pool_size is not None:
            # Lambda: minimal pool — one connection per warm instance is enough
            pool = int(_lambda_pool_size)
            _client = AsyncIOMotorClient(
                settings.mongodb_uri,
                maxPoolSize=pool,
                minPoolSize=0,  # don't hold idle connections between invocations
                connectTimeoutMS=5_000,
                serverSelectionTimeoutMS=5_000,
            )
        else:
            # EC2 / local: long-running server config (unchanged from original)
            _client = AsyncIOMotorClient(
                settings.mongodb_uri,
                maxPoolSize=50,
                minPoolSize=5,
                maxIdleTimeMS=300_000,
                connectTimeoutMS=5_000,
                serverSelectionTimeoutMS=5_000,
            )
    return _client


def get_database() -> AsyncIOMotorDatabase:
    return get_client()[settings.mongodb_db_name]


async def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
