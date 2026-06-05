from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies import get_current_user, get_db
from app.models.startup_intelligence import (
    InvestorProfileSnapshot,
    ProgressStage,
    StartupIntelligenceReport,
)
from app.repositories import InvestorProfileRepository
from app.repositories.startup_intelligence_repository import (
    StartupCacheRepository,
    StartupReportRepository,
)
from app.schemas.startup_intelligence import (
    CacheMetaResponse,
    ReportDetailResponse,
    ReportListItem,
    StartReportRequest,
)
from app.services.startup_intelligence import run_research_pipeline
from app.services.startup_intelligence.url_utils import normalize_domain

router = APIRouter(prefix="/startup-intelligence", tags=["startup-intelligence"])


def _make_default_stages() -> List[dict]:
    names = [
        "Checking cache",
        "Crawling website",
        "Searching public web",
        "Extracting company details",
        "Scoring thesis fit",
        "Writing IC memo",
        "Saving report",
    ]
    return [{"name": n, "status": "pending", "started_at": None, "completed_at": None, "error": None} for n in names]


def _doc_to_list_item(doc: dict) -> ReportListItem:
    thesis = doc.get("thesis_match") or {}
    ic = doc.get("ic_memo") or {}
    return ReportListItem(
        id=doc["id"],
        company_name=doc.get("company_name", ""),
        website_url=doc.get("website_url", ""),
        status=doc.get("status", "queued"),
        progress_percent=doc.get("progress_percent", 0),
        current_stage=doc.get("current_stage", "Queued"),
        thesis_fit_score=thesis.get("thesis_fit_score"),
        recommendation=ic.get("recommendation"),
        overall_confidence=doc.get("overall_confidence", 0.0),
        cache_used=doc.get("cache_used", False),
        created_at=doc.get("created_at", datetime.utcnow()),
        completed_at=doc.get("completed_at"),
    )


def _doc_to_detail(doc: dict) -> ReportDetailResponse:
    def _nested(key: str):
        return doc.get(key) or None

    return ReportDetailResponse(
        id=doc["id"],
        company_name=doc.get("company_name", ""),
        website_url=doc.get("website_url", ""),
        linkedin_url=doc.get("linkedin_url"),
        user_context=doc.get("user_context"),
        status=doc.get("status", "queued"),
        progress_percent=doc.get("progress_percent", 0),
        current_stage=doc.get("current_stage", "Queued"),
        stages=doc.get("stages", []),
        error_message=doc.get("error_message"),
        cache_used=doc.get("cache_used", False),
        cache_age_hours=doc.get("cache_age_hours"),
        thesis_match=_nested("thesis_match"),
        moat_analysis=_nested("moat_analysis"),
        red_flags=doc.get("red_flags", []),
        ic_memo=_nested("ic_memo"),
        report=_nested("report"),
        diligence_questions=doc.get("diligence_questions", []),
        sources=doc.get("sources", []),
        overall_confidence=doc.get("overall_confidence", 0.0),
        evidence_confidence=_nested("evidence_confidence"),
        provider_log=doc.get("provider_log", []),
        created_at=doc.get("created_at", datetime.utcnow()),
        updated_at=doc.get("updated_at", datetime.utcnow()),
        completed_at=doc.get("completed_at"),
    )


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/reports", status_code=202)
async def start_report(
    body: StartReportRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    report_repo = StartupReportRepository(db)
    cache_repo = StartupCacheRepository(db)
    ip_repo = InvestorProfileRepository(db)

    # Load investor profile for thesis matching
    ip_doc = await ip_repo.find_by_user(current_user["id"])
    if ip_doc:
        profile = InvestorProfileSnapshot(
            fund_name=ip_doc.get("fund_name", ""),
            investor_name=current_user.get("name", ""),
            investment_thesis=ip_doc.get("investment_thesis", ""),
            preferred_sectors=ip_doc.get("preferred_sectors", []),
            preferred_stages=ip_doc.get("preferred_stages", []),
            geographies=ip_doc.get("geographies", []),
            typical_check_size=ip_doc.get("typical_check_size", ""),
            investment_style=ip_doc.get("investment_style", ""),
        )
    else:
        profile = InvestorProfileSnapshot()

    now = datetime.utcnow()
    report_doc = {
        "user_id": current_user["id"],
        "company_name": body.company_name,
        "website_url": body.website_url,
        "linkedin_url": body.linkedin_url,
        "user_context": body.user_context,
        "investor_profile_snapshot": profile.model_dump(),
        "status": "queued",
        "progress_percent": 0,
        "current_stage": "Queued",
        "stages": _make_default_stages(),
        "cache_key": normalize_domain(body.website_url),
        "cache_used": False,
        "cache_age_hours": None,
        "refresh_reason": "forced" if body.force_refresh else None,
        "red_flags": [],
        "diligence_questions": [],
        "sources": [],
        "overall_confidence": 0.0,
        "created_at": now,
        "updated_at": now,
    }
    report_id = await report_repo.insert_one(report_doc)

    background_tasks.add_task(
        run_research_pipeline,
        report_id=report_id,
        company_name=body.company_name,
        website_url=body.website_url,
        linkedin_url=body.linkedin_url,
        user_context=body.user_context,
        force_refresh=body.force_refresh,
        profile=profile,
        report_repo=report_repo,
        cache_repo=cache_repo,
    )

    return {"report_id": report_id, "status": "queued"}


@router.get("/reports", response_model=List[ReportListItem])
async def list_reports(
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = StartupReportRepository(db)
    docs = await repo.find_by_user(current_user["id"])
    return [_doc_to_list_item(d) for d in docs]


@router.get("/reports/{report_id}", response_model=ReportDetailResponse)
async def get_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = StartupReportRepository(db)
    doc = await repo.find_by_id_for_user(report_id, current_user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    return _doc_to_detail(doc)


@router.delete("/reports/{report_id}", status_code=204)
async def delete_report(
    report_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = StartupReportRepository(db)
    doc = await repo.find_by_id_for_user(report_id, current_user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")
    await repo.delete_one(report_id)


@router.post("/reports/{report_id}/retry", status_code=202)
async def retry_report(
    report_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    report_repo = StartupReportRepository(db)
    cache_repo = StartupCacheRepository(db)
    doc = await report_repo.find_by_id_for_user(report_id, current_user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")

    if doc.get("status") not in ("failed", "completed"):
        raise HTTPException(status_code=400, detail="Only failed or completed reports can be retried")

    profile_raw = doc.get("investor_profile_snapshot", {})
    profile = InvestorProfileSnapshot(**profile_raw) if profile_raw else InvestorProfileSnapshot()

    await report_repo.update_one(report_id, {
        "status": "queued",
        "progress_percent": 0,
        "current_stage": "Queued",
        "stages": _make_default_stages(),
        "error_message": None,
    })

    background_tasks.add_task(
        run_research_pipeline,
        report_id=report_id,
        company_name=doc["company_name"],
        website_url=doc["website_url"],
        linkedin_url=doc.get("linkedin_url"),
        user_context=doc.get("user_context"),
        force_refresh=False,
        profile=profile,
        report_repo=report_repo,
        cache_repo=cache_repo,
    )
    return {"report_id": report_id, "status": "queued"}


@router.post("/reports/{report_id}/refresh", status_code=202)
async def refresh_report(
    report_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    report_repo = StartupReportRepository(db)
    cache_repo = StartupCacheRepository(db)
    doc = await report_repo.find_by_id_for_user(report_id, current_user["id"])
    if not doc:
        raise HTTPException(status_code=404, detail="Report not found")

    profile_raw = doc.get("investor_profile_snapshot", {})
    profile = InvestorProfileSnapshot(**profile_raw) if profile_raw else InvestorProfileSnapshot()

    await report_repo.update_one(report_id, {
        "status": "queued",
        "progress_percent": 0,
        "current_stage": "Queued",
        "stages": _make_default_stages(),
        "refresh_reason": "user_requested",
        "error_message": None,
    })

    # Invalidate cache for this domain
    domain = normalize_domain(doc["website_url"])
    cache_doc = await cache_repo.find_by_domain(domain)
    if cache_doc:
        await cache_repo.update_one(cache_doc["id"], {"cache_status": "stale"})

    background_tasks.add_task(
        run_research_pipeline,
        report_id=report_id,
        company_name=doc["company_name"],
        website_url=doc["website_url"],
        linkedin_url=doc.get("linkedin_url"),
        user_context=doc.get("user_context"),
        force_refresh=True,
        profile=profile,
        report_repo=report_repo,
        cache_repo=cache_repo,
    )
    return {"report_id": report_id, "status": "queued"}


@router.get("/cache/{normalized_domain}", response_model=CacheMetaResponse)
async def get_cache_meta(
    normalized_domain: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    repo = StartupCacheRepository(db)
    doc = await repo.find_by_domain(normalized_domain)
    if not doc:
        raise HTTPException(status_code=404, detail="No cache entry for this domain")
    ec = doc.get("evidence_confidence", {})
    return CacheMetaResponse(
        normalized_domain=doc["normalized_domain"],
        website_url=doc.get("website_url", ""),
        company_name=doc.get("company_name", ""),
        cache_status=doc.get("cache_status", "fresh"),
        last_researched_at=doc.get("last_researched_at"),
        expires_at=doc.get("expires_at"),
        source_count=len(doc.get("sources", [])),
        evidence_confidence_overall=ec.get("overall", 0.0) if isinstance(ec, dict) else 0.0,
    )
