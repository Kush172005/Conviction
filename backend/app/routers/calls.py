"""
Calls router — production-ready voice/text/transcript ingestion + AI intelligence.

Endpoints
---------
GET  /calls                  List calls for current user
POST /calls                  Create call (text / transcript) — returns CallResponse
POST /calls/voice            Upload audio, transcribe, create + process — returns CallIntelligenceResponse
GET  /calls/{call_id}        Get single call
POST /calls/{call_id}/process  Run (or re-run) LLM pipeline — idempotent — returns CallIntelligenceResponse
GET  /calls/{call_id}/intelligence  Get assembled intelligence page data
"""
import logging
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.dependencies import get_db, get_current_user
from app.repositories import (
    CallRepository,
    CompanyRepository,
    DecisionRepository,
    FollowUpRepository,
    MemoryRepository,
    InvestorProfileRepository,
)
from app.schemas.call import CallCreate, CallIntelligenceResponse, CallResponse
from app.schemas.follow_up import FollowUpResponse
from app.services.call_intelligence import generate_call_intelligence
from app.services.stt import transcribe_audio
from app.services.startup_intelligence.provider_log import ProviderLog

logger = logging.getLogger("call_intelligence")
router = APIRouter(prefix="/calls", tags=["calls"])


# ────────────────────────────────────────────────────────────────────────────────
# Helpers
# ────────────────────────────────────────────────────────────────────────────────

async def _get_call_owned(call_id: str, user_id: str, call_repo: CallRepository) -> dict:
    call = await call_repo.find_by_id(call_id)
    if not call or call.get("user_id") != user_id:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


async def _get_investor_context(user_id: str, profile_repo: InvestorProfileRepository):
    profile = await profile_repo.find_by_user(user_id)
    if not profile:
        return None, None, None
    return (
        profile.get("investment_thesis"),
        profile.get("fund_name"),
        profile.get("investor_name"),
    )


async def _run_pipeline_and_persist(
    *,
    call: dict,
    company_name: str,
    user_id: str,
    thesis: Optional[str],
    fund_name: Optional[str],
    investor_name: Optional[str],
    log: ProviderLog,
    call_repo: CallRepository,
    decision_repo: DecisionRepository,
    follow_up_repo: FollowUpRepository,
    memory_repo: MemoryRepository,
    company_repo: CompanyRepository,
) -> dict:
    """
    Core pipeline runner: LLM → upsert decision → follow-ups → memory → mark completed.
    Returns the persisted decision dict (with id).
    """
    call_id = call["id"]
    company_id = call["company_id"]
    text = call.get("transcript_text") or call.get("raw_notes") or ""

    # Mark processing
    await call_repo.update_one(call_id, {"status": "processing"})

    try:
        intel = await generate_call_intelligence(
            company_name=company_name,
            text=text,
            input_mode=call.get("input_mode", "text"),
            thesis=thesis,
            fund_name=fund_name,
            investor_name=investor_name,
            gemini_api_key=settings.gemini_api_key,
            gemini_synthesis_model=settings.gemini_synthesis_model,
            log=log,
        )
    except Exception as exc:
        logger.exception("LLM pipeline failed for call %s", call_id)
        await call_repo.update_one(call_id, {
            "status": "failed",
            "processing_error": str(exc),
        })
        raise HTTPException(status_code=500, detail=f"Intelligence pipeline failed: {exc}")

    now = datetime.utcnow()

    # ── Upsert decision (idempotent) ───────────────────────────────────────────
    decision_doc = {
        "call_id": call_id,
        "company_id": company_id,
        "user_id": user_id,
        "recommendation": intel["recommendation"],
        "rationale": intel["rationale"],
        "thesis_fit": intel["thesis_fit"],
        "strengths": intel["strengths"],
        "concerns": intel["concerns"],
        "confidence": intel["confidence"],
        "deal_summary": intel.get("deal_summary"),
        "founder_assessment": intel.get("founder_assessment"),
        "business_overview": intel.get("business_overview"),
        "market_assessment": intel.get("market_assessment"),
        "opportunities": intel.get("opportunities", []),
        "risks": intel.get("risks", []),
        "open_questions": intel.get("open_questions", []),
        "key_metrics": intel.get("key_metrics") or {},
        "suggested_follow_up_date": intel.get("suggested_follow_up_date"),
        "draft_email": intel.get("draft_email"),
        "provider_log": log.to_list(),
        "created_at": now,
    }
    decision_id = await decision_repo.upsert_for_call(call_id, decision_doc)
    decision_doc["id"] = decision_id

    # ── Persist follow-up actions ─────────────────────────────────────────────
    for action_item in intel.get("follow_up_actions", []):
        action_text = action_item.get("action", "")
        if not action_text:
            continue
        priority = action_item.get("priority", "medium")
        days = int(action_item.get("due_in_days", 7))
        due = now + timedelta(days=days)
        await follow_up_repo.insert_one({
            "user_id": user_id,
            "company_id": company_id,
            "call_id": call_id,
            "action": action_text,
            "due_date": due,
            "status": "open",
            "priority": priority,
            "created_at": now,
            "updated_at": now,
        })

    # ── Persist memory entry ──────────────────────────────────────────────────
    sentiment = (
        "positive" if intel["recommendation"] in ("invest", "strong_invest")
        else "negative" if intel["recommendation"] == "pass"
        else "neutral"
    )
    await memory_repo.insert_one({
        "user_id": user_id,
        "company_id": company_id,
        "call_id": call_id,
        "type": "decision",
        "title": f"Decision: {intel['recommendation'].replace('_', ' ').title()} — {company_name}",
        "summary": intel["rationale"],
        "sentiment": sentiment,
        "importance": 5,
        "occurred_at": now,
        "created_at": now,
    })

    # Mark call completed
    await call_repo.update_one(call_id, {"status": "completed"})

    # Update company last_interaction
    await company_repo.increment_call_count(company_id)

    return decision_doc


async def _build_intelligence_response(
    *,
    call: dict,
    decision: dict,
    company_name: str,
    follow_ups: list,
) -> CallIntelligenceResponse:
    """Assemble the unified intelligence response from DB records."""
    fu_responses = []
    for fu in follow_ups:
        try:
            fu_responses.append(FollowUpResponse(**fu))
        except Exception:
            pass

    return CallIntelligenceResponse(
        call_id=call["id"],
        company_id=call["company_id"],
        company_name=company_name,
        call_title=call.get("title", ""),
        input_mode=call.get("input_mode", "text"),
        occurred_at=call.get("occurred_at") or call.get("created_at"),
        transcript_text=call.get("transcript_text"),
        decision_id=decision["id"],
        recommendation=decision.get("recommendation", "need_more_info"),
        confidence=int(decision.get("confidence", 45)),
        rationale=decision.get("rationale", ""),
        deal_summary=decision.get("deal_summary"),
        founder_assessment=decision.get("founder_assessment"),
        business_overview=decision.get("business_overview"),
        market_assessment=decision.get("market_assessment"),
        thesis_fit=decision.get("thesis_fit", ""),
        strengths=decision.get("strengths", []),
        concerns=decision.get("concerns", []),
        opportunities=decision.get("opportunities", []),
        risks=decision.get("risks", []),
        open_questions=decision.get("open_questions", []),
        key_metrics=decision.get("key_metrics") or None,
        suggested_follow_up_date=decision.get("suggested_follow_up_date"),
        draft_email=decision.get("draft_email"),
        decision_created_at=decision.get("created_at") or decision.get("updated_at"),
        follow_ups=fu_responses,
        provider_log=decision.get("provider_log", []),
    )


# ────────────────────────────────────────────────────────────────────────────────
# Routes
# ────────────────────────────────────────────────────────────────────────────────

@router.get("", response_model=List[CallResponse])
async def list_calls(
    company_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = CallRepository(db)
    if company_id:
        calls = await repo.find_by_company(company_id, current_user["id"])
    else:
        calls = await repo.find_by_user(current_user["id"])
    return [CallResponse(**c) for c in calls]


@router.post("", response_model=CallResponse, status_code=201)
async def create_call(
    body: CallCreate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Create a call shell for text / transcript input. Call /process next."""
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
    return CallResponse(**doc)


@router.post("/voice", response_model=CallIntelligenceResponse)
async def upload_voice_call(
    company_id: str = Form(...),
    title: Optional[str] = Form(default=None),
    input_mode: str = Form(default="voice"),
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Upload a voice recording. The backend transcribes it, creates a call record,
    runs the LLM pipeline, and returns full intelligence — all in one request.
    """
    company_repo = CompanyRepository(db)
    company = await company_repo.find_by_id_for_user(company_id, current_user["id"])
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Audio file is empty")

    log = ProviderLog()
    mime_type = audio.content_type or "audio/webm"

    # ── 1. Transcribe ──────────────────────────────────────────────────────────
    log.record("stt", "start", "calling", f"mime={mime_type} size={len(audio_bytes)}b")
    transcript = await transcribe_audio(
        audio_bytes=audio_bytes,
        mime_type=mime_type,
        hf_api_key=settings.huggingface_api_key,
        gemini_api_key=settings.gemini_api_key,
        gemini_model=settings.gemini_model,
        log=log,
    )

    if not transcript:
        log.record("stt", "fallback", "warning", "Transcription failed — storing audio upload marker")
        transcript = "[Voice transcription unavailable — please paste notes manually]"

    # ── 2. Create call record ─────────────────────────────────────────────────
    call_repo = CallRepository(db)
    now = datetime.utcnow()
    mode = input_mode if input_mode in ("voice", "recording") else "voice"
    default_title = (
        f"Meeting recording — {company['name']}"
        if mode == "recording"
        else f"Voice call — {company['name']}"
    )
    call_doc = {
        "user_id": current_user["id"],
        "company_id": company_id,
        "title": title or default_title,
        "input_mode": mode,
        "transcript_text": transcript,
        "status": "pending",
        "occurred_at": now,
        "created_at": now,
        "updated_at": now,
    }
    call_id = await call_repo.insert_one(call_doc)
    call_doc["id"] = call_id

    # ── 3. Run LLM pipeline ────────────────────────────────────────────────────
    thesis, fund_name, investor_name = await _get_investor_context(
        current_user["id"], InvestorProfileRepository(db)
    )

    decision = await _run_pipeline_and_persist(
        call=call_doc,
        company_name=company["name"],
        user_id=current_user["id"],
        thesis=thesis,
        fund_name=fund_name,
        investor_name=investor_name,
        log=log,
        call_repo=call_repo,
        decision_repo=DecisionRepository(db),
        follow_up_repo=FollowUpRepository(db),
        memory_repo=MemoryRepository(db),
        company_repo=company_repo,
    )

    # ── 4. Return assembled response ───────────────────────────────────────────
    follow_ups = await FollowUpRepository(db).find_by_company(company_id, current_user["id"])
    call_doc_fresh = await call_repo.find_by_id(call_id) or call_doc

    return await _build_intelligence_response(
        call=call_doc_fresh,
        decision=decision,
        company_name=company["name"],
        follow_ups=[fu for fu in follow_ups if fu.get("call_id") == call_id],
    )


@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = CallRepository(db)
    call = await _get_call_owned(call_id, current_user["id"], repo)
    return CallResponse(**call)


@router.post("/{call_id}/process", response_model=CallIntelligenceResponse)
async def process_call(
    call_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Run (or re-run) the LLM intelligence pipeline for a call.
    Idempotent: re-processing replaces the existing decision.
    Returns full CallIntelligenceResponse for the intelligence page.
    """
    call_repo = CallRepository(db)
    call = await _get_call_owned(call_id, current_user["id"], call_repo)

    if not (call.get("raw_notes") or call.get("transcript_text")):
        raise HTTPException(
            status_code=422,
            detail="No notes or transcript found for this call. Add content before processing.",
        )

    company_repo = CompanyRepository(db)
    company = await company_repo.find_by_id_for_user(call["company_id"], current_user["id"])
    company_name = company.get("name", "Unknown Company") if company else "Unknown"

    thesis, fund_name, investor_name = await _get_investor_context(
        current_user["id"], InvestorProfileRepository(db)
    )

    log = ProviderLog()
    decision = await _run_pipeline_and_persist(
        call=call,
        company_name=company_name,
        user_id=current_user["id"],
        thesis=thesis,
        fund_name=fund_name,
        investor_name=investor_name,
        log=log,
        call_repo=call_repo,
        decision_repo=DecisionRepository(db),
        follow_up_repo=FollowUpRepository(db),
        memory_repo=MemoryRepository(db),
        company_repo=company_repo,
    )

    follow_ups = await FollowUpRepository(db).find_by_company(call["company_id"], current_user["id"])
    call_fresh = await call_repo.find_by_id(call_id) or call

    return await _build_intelligence_response(
        call=call_fresh,
        decision=decision,
        company_name=company_name,
        follow_ups=[fu for fu in follow_ups if fu.get("call_id") == call_id],
    )


@router.get("/{call_id}/intelligence", response_model=CallIntelligenceResponse)
async def get_call_intelligence(
    call_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Assemble and return the full intelligence page data for an existing processed call.
    Use this when revisiting a previously processed call.
    """
    call_repo = CallRepository(db)
    call = await _get_call_owned(call_id, current_user["id"], call_repo)

    decision_repo = DecisionRepository(db)
    decision = await decision_repo.find_by_call(call_id)
    if not decision:
        raise HTTPException(
            status_code=404,
            detail="No intelligence found for this call. Process it first.",
        )

    company_repo = CompanyRepository(db)
    company = await company_repo.find_by_id_for_user(call["company_id"], current_user["id"])
    company_name = company.get("name", "Unknown") if company else "Unknown"

    follow_up_repo = FollowUpRepository(db)
    all_follow_ups = await follow_up_repo.find_by_company(call["company_id"], current_user["id"])
    call_follow_ups = [fu for fu in all_follow_ups if fu.get("call_id") == call_id]

    return await _build_intelligence_response(
        call=call,
        decision=decision,
        company_name=company_name,
        follow_ups=call_follow_ups,
    )
