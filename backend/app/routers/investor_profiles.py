from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db, get_current_user
from app.repositories import InvestorProfileRepository
from app.schemas.investor_profile import InvestorProfileCreate, InvestorProfileUpdate, InvestorProfileResponse

router = APIRouter(prefix="/investor-profile", tags=["investor-profile"])


@router.get("", response_model=InvestorProfileResponse)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = InvestorProfileRepository(db)
    profile = await repo.find_by_user(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return InvestorProfileResponse(**profile)


@router.post("", response_model=InvestorProfileResponse, status_code=201)
async def create_profile(
    body: InvestorProfileCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = InvestorProfileRepository(db)
    existing = await repo.find_by_user(current_user["id"])
    if existing:
        raise HTTPException(status_code=409, detail="Profile already exists. Use PATCH to update.")

    now = datetime.utcnow()
    doc = body.model_dump()
    doc.update({"user_id": current_user["id"], "created_at": now, "updated_at": now})
    inserted_id = await repo.insert_one(doc)
    doc["id"] = inserted_id
    return InvestorProfileResponse(**doc)


@router.patch("", response_model=InvestorProfileResponse)
async def update_profile(
    body: InvestorProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = InvestorProfileRepository(db)
    profile = await repo.find_by_user(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    updates = body.model_dump(exclude_none=True)
    if updates:
        await repo.update_one(profile["id"], updates)
        profile = await repo.find_by_user(current_user["id"])
    return InvestorProfileResponse(**profile)
