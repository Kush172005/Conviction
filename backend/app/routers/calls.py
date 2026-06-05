from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.dependencies import get_db, get_current_user
from app.repositories import CallRepository, CompanyRepository, DecisionRepository, FollowUpRepository, MemoryRepository, InvestorProfileRepository
from app.schemas.call import CallCreate, CallResponse
from app.schemas.decision import DecisionResponse
from app.services.intelligence_service import generate_placeholder_intelligence

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("", response_model=List[CallResponse])
async def list_calls(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = CallRepository(db)
    calls = await repo.find_by_user(current_user["id"])
    return [CallResponse(**c) for c in calls]


@router.post("", response_model=CallResponse, status_code=201)
async def create_call(
    body: CallCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    company_repo = CompanyRepository(db)
    company = await company_repo.find_by_id_for_user(body.company_id, current_user["id"])
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    call_repo = CallRepository(db)
    now = datetime.utcnow()
    doc = body.model_dump()
    doc.update({
        "user_id": current_user["id"],
        "status": "pending",
        "occurred_at": body.occurred_at or now,
        "created_at": now,
        "updated_at": now,
    })
    inserted_id = await call_repo.insert_one(doc)
    doc["id"] = inserted_id

    # Update company call count
    await company_repo.increment_call_count(body.company_id)

    return CallResponse(**doc)


@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = CallRepository(db)
    call = await repo.find_by_id(call_id)
    if not call or call.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Call not found")
    return CallResponse(**call)


@router.post("/{call_id}/process", response_model=DecisionResponse)
async def process_call(
    call_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Process a call and generate structured deal intelligence.
    Phase 1: deterministic placeholder intelligence.
    Phase 2: Claude LLM integration.
    """
    call_repo = CallRepository(db)
    call = await call_repo.find_by_id(call_id)
    if not call or call.get("user_id") != current_user["id"]:
        raise HTTPException(status_code=404, detail="Call not found")

    company_repo = CompanyRepository(db)
    company = await company_repo.find_by_id_for_user(call["company_id"], current_user["id"])

    profile_repo = InvestorProfileRepository(db)
    profile = await profile_repo.find_by_user(current_user["id"])
    thesis = profile.get("investment_thesis") if profile else None

    raw_notes = call.get("raw_notes") or call.get("transcript_text") or ""
    intel = generate_placeholder_intelligence(
        company_name=company.get("name", "Unknown Company") if company else "Unknown",
        raw_notes=raw_notes,
        thesis=thesis,
    )

    # Persist decision
    decision_repo = DecisionRepository(db)
    now = datetime.utcnow()
    decision_doc = {
        "call_id": call_id,
        "company_id": call["company_id"],
        "user_id": current_user["id"],
        "created_at": now,
        **intel,
    }
    decision_id = await decision_repo.insert_one(decision_doc)
    decision_doc["id"] = decision_id

    # Update call status
    await call_repo.update_one(call_id, {"status": "completed"})

    # Create memory entry
    memory_repo = MemoryRepository(db)
    await memory_repo.insert_one({
        "user_id": current_user["id"],
        "company_id": call["company_id"],
        "call_id": call_id,
        "type": "decision",
        "title": f"Decision: {intel['recommendation'].replace('_', ' ').title()}",
        "summary": intel["rationale"],
        "sentiment": "positive" if intel["recommendation"] in ("invest", "strong_invest") else "neutral",
        "importance": 5,
        "occurred_at": now,
        "created_at": now,
    })

    return DecisionResponse(**decision_doc)
