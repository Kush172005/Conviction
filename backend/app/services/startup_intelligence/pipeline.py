"""
Main research pipeline orchestrator.
Wires together: cache check → crawl → search → evidence → thesis → synthesis → report
"""
import hashlib
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.config import settings
from app.models.startup_intelligence import (
    CACHE_TTL_DAYS,
    CompanyResearchCache,
    EvidenceConfidence,
    EvidenceLayer,
    InvestorProfileSnapshot,
    ProgressStage,
    ResearchSource,
    StartupIntelligenceReport,
)
from app.repositories.startup_intelligence_repository import (
    StartupCacheRepository,
    StartupReportRepository,
)

from .crawler import crawl_company_website
from .llm_extractor import build_evidence_with_llm
from .provider_log import ProviderLog
from .report_synthesizer import (
    dict_to_diligence_questions,
    dict_to_ic_memo,
    dict_to_moat_analysis,
    dict_to_red_flags,
    dict_to_report_section,
    synthesize_report,
)
from .searcher import search_company
from .thesis_engine import run_thesis_match_engine
from .url_utils import normalize_domain


def _make_stage(name: str, status: str = "pending") -> ProgressStage:
    return ProgressStage(name=name, status=status)


def _stage_dict(s: ProgressStage) -> dict:
    return {
        "name": s.name,
        "status": s.status,
        "started_at": s.started_at,
        "completed_at": s.completed_at,
        "error": s.error,
    }


async def _update_stage(
    repo: StartupReportRepository,
    report_id: str,
    stages: List[ProgressStage],
    idx: int,
    status: str,
    percent: int,
    current_stage: str,
    error: Optional[str] = None,
):
    stages[idx].status = status
    if status == "running":
        stages[idx].started_at = datetime.utcnow()
    elif status in ("completed", "failed", "skipped"):
        stages[idx].completed_at = datetime.utcnow()
    if error:
        stages[idx].error = error

    await repo.update_progress(
        report_id,
        percent,
        current_stage,
        stages=[_stage_dict(s) for s in stages],
    )


def _source_hash(sources: List[ResearchSource]) -> str:
    content = "".join(s.url for s in sources)
    return hashlib.md5(content.encode()).hexdigest()[:16]


async def run_research_pipeline(
    report_id: str,
    company_name: str,
    website_url: str,
    linkedin_url: Optional[str],
    user_context: Optional[str],
    force_refresh: bool,
    profile: InvestorProfileSnapshot,
    report_repo: StartupReportRepository,
    cache_repo: StartupCacheRepository,
):
    """
    Full research pipeline. Called as a FastAPI background task.
    Writes progress to MongoDB throughout so the frontend can poll.
    """
    STAGE_NAMES = [
        "Checking cache",
        "Crawling website",
        "Searching public web",
        "Extracting company details",
        "Scoring thesis fit",
        "Writing IC memo",
        "Saving report",
    ]
    stages = [_make_stage(n) for n in STAGE_NAMES]
    provider_log = ProviderLog()

    # Log configured providers at start
    provider_log.record(
        "config", "startup", "ok",
        f"gemini={'yes' if settings.gemini_api_key else 'no'} "
        f"research={settings.gemini_model} synthesis={settings.gemini_synthesis_model} "
        f"grounding={settings.gemini_grounding_enabled} "
        f"hf={'yes' if settings.huggingface_api_key else 'no'} "
        f"tavily={'yes' if settings.tavily_api_key else 'no'} "
        f"firecrawl={'yes' if settings.firecrawl_api_key else 'no'}",
    )

    try:
        await report_repo.update_progress(
            report_id, 5, "Starting research",
            stages=[_stage_dict(s) for s in stages],
            extra={"status": "researching"},
        )

        normalized_domain = normalize_domain(website_url)

        # ── Stage 0: Cache check ──────────────────────────────────────────────
        await _update_stage(report_repo, report_id, stages, 0, "running", 8, "Checking cache")
        cache_doc = await cache_repo.find_by_domain(normalized_domain)
        use_cache = False
        cache_age_hours: Optional[float] = None

        if cache_doc and not force_refresh and cache_repo.is_fresh(cache_doc):
            use_cache = True
            cache_age_hours = cache_repo.cache_age_hours(cache_doc)
            all_sources: List[ResearchSource] = [
                ResearchSource(**s) if isinstance(s, dict) else s
                for s in cache_doc.get("sources", [])
            ]
            ev_raw = cache_doc.get("evidence_layer", {})
            evidence = EvidenceLayer(**ev_raw) if isinstance(ev_raw, dict) else ev_raw
            conf_raw = cache_doc.get("evidence_confidence", {})
            ev_confidence = EvidenceConfidence(**conf_raw) if isinstance(conf_raw, dict) else conf_raw
            await _update_stage(report_repo, report_id, stages, 0, "completed", 15, "Cache hit — reusing evidence")
            for i in [1, 2, 3]:
                await _update_stage(report_repo, report_id, stages, i, "skipped", 15, "Cache hit — reusing evidence")
            provider_log.record("cache", "reuse", "ok", f"domain={normalized_domain} age_h={cache_age_hours}")
        else:
            await _update_stage(report_repo, report_id, stages, 0, "completed", 12, "No fresh cache — starting research")

            # ── Stage 1: Crawl website ────────────────────────────────────────
            await _update_stage(report_repo, report_id, stages, 1, "running", 20, "Crawling website")
            try:
                website_sources = await crawl_company_website(
                    website_url,
                    firecrawl_api_key=settings.firecrawl_api_key,
                    firecrawl_fallback_only=settings.firecrawl_fallback_only,
                    log=provider_log,
                )
            except Exception as e:
                website_sources = []
                await _update_stage(report_repo, report_id, stages, 1, "failed", 25, "Crawl failed — continuing", error=str(e))
            else:
                await _update_stage(report_repo, report_id, stages, 1, "completed", 35, f"Crawled {len(website_sources)} pages")

            # ── Stage 2: Web search ───────────────────────────────────────────
            await _update_stage(report_repo, report_id, stages, 2, "running", 40, "Searching public web")
            try:
                search_sources = await search_company(
                    company_name,
                    website_url,
                    tavily_api_key=settings.tavily_api_key,
                    max_queries=settings.tavily_max_queries,
                    website_sources=website_sources,
                    log=provider_log,
                )
            except Exception as e:
                search_sources = []
                await _update_stage(report_repo, report_id, stages, 2, "failed", 45, "Search failed — continuing", error=str(e))
            else:
                await _update_stage(report_repo, report_id, stages, 2, "completed", 50, f"Found {len(search_sources)} search results")

            all_sources = website_sources + search_sources

            # ── Stage 3: LLM extraction + evidence merge ────────────────────────
            await _update_stage(report_repo, report_id, stages, 3, "running", 55, "Extracting company details")
            evidence, ev_confidence, llm_used = await build_evidence_with_llm(
                company_name, website_url, all_sources, user_context, log=provider_log,
                gemini_api_key=settings.gemini_api_key,
                gemini_model=settings.gemini_model,
                gemini_grounding_enabled=settings.gemini_grounding_enabled,
            )
            stage_msg = "Company details extracted (open-source LLM)" if llm_used else "Company details extracted (heuristic)"
            await _update_stage(report_repo, report_id, stages, 3, "completed", 65, stage_msg)

            # Save/update company cache
            cache_data = {
                "website_url": website_url,
                "company_name": company_name,
                "cache_status": "fresh",
                "last_researched_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=CACHE_TTL_DAYS),
                "source_hash": _source_hash(all_sources),
                "sources": [s.model_dump() for s in all_sources],
                "evidence_layer": evidence.model_dump(),
                "evidence_confidence": ev_confidence.model_dump(),
            }
            await cache_repo.upsert_by_domain(normalized_domain, cache_data)

        # ── Stage 4: Thesis scoring ───────────────────────────────────────────
        await _update_stage(report_repo, report_id, stages, 4, "running", 70, "Scoring thesis fit")
        await report_repo.update_progress(report_id, 70, "Scoring thesis fit", extra={"status": "analyzing"})
        thesis_match = run_thesis_match_engine(evidence, ev_confidence.overall, profile)
        await _update_stage(report_repo, report_id, stages, 4, "completed", 78, f"Thesis fit: {thesis_match.thesis_fit_score}/100")

        # ── Stage 5: Report synthesis (IC memo + all sections) ────────────────
        await _update_stage(report_repo, report_id, stages, 5, "running", 82, "Writing IC memo")
        synthesis = await synthesize_report(
            company_name=company_name,
            website_url=website_url,
            evidence=evidence,
            confidence=ev_confidence,
            thesis_match=thesis_match,
            profile=profile,
            gemini_api_key=settings.gemini_api_key,
            gemini_model=settings.gemini_synthesis_model,
            user_context=user_context,
            log=provider_log,
        )

        moat_analysis = dict_to_moat_analysis(synthesis.get("moat_analysis", {}), evidence)
        red_flags = dict_to_red_flags(synthesis.get("red_flags", []))
        diligence_questions = dict_to_diligence_questions(synthesis.get("diligence_questions", []))
        ic_memo = dict_to_ic_memo(synthesis)
        report_section = dict_to_report_section(synthesis)

        await _update_stage(report_repo, report_id, stages, 5, "completed", 92, "IC memo written")

        # ── Stage 6: Save final report ────────────────────────────────────────
        await _update_stage(report_repo, report_id, stages, 6, "running", 95, "Saving report")

        final_updates = {
            "thesis_match": thesis_match.model_dump(),
            "moat_analysis": moat_analysis.model_dump(),
            "red_flags": [f.model_dump() for f in red_flags],
            "ic_memo": ic_memo.model_dump(),
            "report": report_section.model_dump(),
            "diligence_questions": [q.model_dump() for q in diligence_questions],
            "sources": [s.model_dump() for s in all_sources],
            "overall_confidence": ev_confidence.overall,
            "evidence_confidence": ev_confidence.model_dump(),
            "cache_key": normalized_domain,
            "cache_used": use_cache,
            "cache_age_hours": cache_age_hours,
            "stages": [_stage_dict(s) for s in stages],
            "provider_log": provider_log.to_list(),
        }
        await report_repo.mark_completed(report_id, final_updates)

    except Exception as exc:
        import traceback
        err = f"{type(exc).__name__}: {exc}\n{traceback.format_exc()[:800]}"
        await report_repo.mark_failed(report_id, err)
