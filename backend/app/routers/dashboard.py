from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db, get_current_user
from app.repositories import CompanyRepository, CallRepository, FollowUpRepository
from app.schemas.dashboard import DashboardStatsResponse

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_stats(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    user_id = current_user["id"]

    company_repo = CompanyRepository(db)
    call_repo = CallRepository(db)
    follow_up_repo = FollowUpRepository(db)

    companies_tracked = await company_repo.count({"user_id": user_id, "status": {"$ne": "archived"}})
    calls_logged = await call_repo.count({"user_id": user_id})
    open_follow_ups = await follow_up_repo.count_open(user_id)
    active_decisions = await company_repo.count({"user_id": user_id, "status": {"$in": ["active", "tracking"]}})

    return DashboardStatsResponse(
        companies_tracked=companies_tracked,
        calls_logged=calls_logged,
        open_follow_ups=open_follow_ups,
        active_decisions=active_decisions,
        recent_activity=[],
    )
