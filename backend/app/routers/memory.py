from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db, get_current_user
from app.repositories import MemoryRepository
from app.schemas.memory_entry import MemoryEntryResponse

router = APIRouter(prefix="/memory", tags=["memory"])


@router.get("", response_model=List[MemoryEntryResponse])
async def list_memory(
    company_id: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = MemoryRepository(db)
    if company_id:
        entries = await repo.find_by_company(company_id, current_user["id"])
    else:
        entries = await repo.find_by_user(current_user["id"])
    return [MemoryEntryResponse(**e) for e in entries]
