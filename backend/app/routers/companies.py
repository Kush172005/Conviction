from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db, get_current_user
from app.repositories import CompanyRepository, InvestorProfileRepository
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse
from app.services.intelligence_service import generate_placeholder_intelligence

router = APIRouter(prefix="/companies", tags=["companies"])


@router.get("", response_model=List[CompanyResponse])
async def list_companies(
    status: Optional[str] = Query(default=None),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = CompanyRepository(db)
    companies = await repo.find_by_user(current_user["id"], status=status)
    return [CompanyResponse(**c) for c in companies]


@router.post("", response_model=CompanyResponse, status_code=201)
async def create_company(
    body: CompanyCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = CompanyRepository(db)
    now = datetime.utcnow()
    doc = body.model_dump()
    doc.update({
        "user_id": current_user["id"],
        "call_count": 0,
        "enrichment_status": "not_started",
        "created_at": now,
        "updated_at": now,
    })
    inserted_id = await repo.insert_one(doc)
    doc["id"] = inserted_id
    return CompanyResponse(**doc)


@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    company_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = CompanyRepository(db)
    company = await repo.find_by_id_for_user(company_id, current_user["id"])
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse(**company)


@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    company_id: str,
    body: CompanyUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = CompanyRepository(db)
    company = await repo.find_by_id_for_user(company_id, current_user["id"])
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    updates = body.model_dump(exclude_none=True)
    if updates:
        await repo.update_one(company_id, updates)
        company = await repo.find_by_id_for_user(company_id, current_user["id"])
    return CompanyResponse(**company)


@router.post("/{company_id}/intelligence")
async def get_company_intelligence(
    company_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Placeholder company intelligence endpoint.
    Phase 2: scrape website, enrich with LLM, store enrichment_data.
    """
    repo = CompanyRepository(db)
    company = await repo.find_by_id_for_user(company_id, current_user["id"])
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    profile_repo = InvestorProfileRepository(db)
    profile = await profile_repo.find_by_user(current_user["id"])
    thesis = profile.get("investment_thesis") if profile else None

    return {
        "company_id": company_id,
        "status": "placeholder",
        "message": "Website analysis and company enrichment will be available in Phase 2.",
        "placeholder_data": {
            "name": company["name"],
            "website": company.get("website"),
            "enrichment_available": False,
            "note": "Connect company website URL and we'll enrich the profile automatically.",
        },
    }
