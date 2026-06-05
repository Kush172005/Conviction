from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db, get_current_user
from app.repositories import FollowUpRepository, CompanyRepository
from app.schemas.follow_up import FollowUpCreate, FollowUpUpdate, FollowUpResponse

router = APIRouter(prefix="/follow-ups", tags=["follow-ups"])


@router.get("", response_model=List[FollowUpResponse])
async def list_follow_ups(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = FollowUpRepository(db)
    follow_ups = await repo.find_by_user(current_user["id"])
    return [FollowUpResponse(**f) for f in follow_ups]


@router.post("", response_model=FollowUpResponse, status_code=201)
async def create_follow_up(
    body: FollowUpCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = FollowUpRepository(db)
    now = datetime.utcnow()
    doc = body.model_dump()
    doc.update({
        "user_id": current_user["id"],
        "status": "open",
        "created_at": now,
        "updated_at": now,
    })
    inserted_id = await repo.insert_one(doc)
    doc["id"] = inserted_id
    return FollowUpResponse(**doc)


@router.patch("/{follow_up_id}", response_model=FollowUpResponse)
async def update_follow_up(
    follow_up_id: str,
    body: FollowUpUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = FollowUpRepository(db)
    follow_up = await repo.find_by_id(follow_up_id)
    if not follow_up or follow_up.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    updates = body.model_dump(exclude_none=True)
    if updates.get("status") == "completed":
        updates["completed_at"] = datetime.utcnow()
    if updates:
        await repo.update_one(follow_up_id, updates)
        follow_up = await repo.find_by_id(follow_up_id)
    return FollowUpResponse(**follow_up)
