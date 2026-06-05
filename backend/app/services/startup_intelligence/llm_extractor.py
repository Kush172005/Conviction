"""
Company intelligence extraction via LLM providers.
Priority: Gemini + Google Search grounding (live web) → HuggingFace (on crawled text) → heuristic.
"""
from typing import Any, Dict, List, Optional, Tuple

from app.models.startup_intelligence import (
    CompetitorInfo,
    EvidenceConfidence,
    EvidenceLayer,
    FounderProfile,
    ResearchSource,
)
from app.services.llm.gemini_client import call_gemini_json
from app.services.llm.prompts import COMPANY_EXTRACTION_SYSTEM, build_company_extraction_prompt
from app.services.llm.provider import get_llm
from app.services.startup_intelligence.provider_log import ProviderLog

GEMINI_GROUNDING_SYSTEM = (
    "You are a VC research analyst. Use Google Search. "
    "Return ONLY valid JSON. Keep string values concise (max 120 chars each). "
    "Max 5 founders, 8 investors, 6 competitors. No markdown."
)

# Compact schema only — full schema + grounding returns empty; this works reliably
GEMINI_GROUNDING_PROMPT = """Research startup: {company_name} ({website_url})
Use Google Search. Return ONLY valid JSON (no markdown):
{{"founders":[{{"name":"","role":"","background_summary":""}}],"funding_stage":"","total_funding_known":"","investors_known":[],"competitors":[{{"name":"","differentiator":"","relative_positioning":""}}],"headquarters":"","founding_year":"","company_overview":"","market":"","business_model":"","growth_signals":[],"news_headlines":[]}}"""


async def _gemini_research(
    company_name: str,
    website_url: str,
    api_key: str,
    model: str = "gemini-2.5-flash",
    log: Optional[ProviderLog] = None,
) -> Optional[Dict[str, Any]]:
    """
    Single Gemini grounding call — compact schema on gemini-2.5-flash only.
    No model fallbacks (flash-lite/2.0 return empty or 429).
    """
    if not api_key:
        if log:
            log.record("gemini_research", "research", "skipped", "GEMINI_API_KEY not set")
        return None

    if log:
        log.record("gemini_research", "research", "calling",
                   f"model={model} grounding=google_search company={company_name}")

    prompt = GEMINI_GROUNDING_PROMPT.format(company_name=company_name, website_url=website_url)
    return await call_gemini_json(
        api_key, model,
        system=GEMINI_GROUNDING_SYSTEM,
        user=prompt,
        use_grounding=True,
        max_output_tokens=2048,
        temperature=0.1,
        log=log,
        log_provider="gemini_research",
        log_action="research",
    )


async def _gemini_corpus_extraction(
    company_name: str,
    website_url: str,
    sources: List[ResearchSource],
    api_key: str,
    model: str,
    log: Optional[ProviderLog] = None,
) -> Optional[Dict[str, Any]]:
    """Fallback: Gemini extracts from crawled+search corpus (no grounding)."""
    corpus = _build_source_corpus(sources)
    if len(corpus) < 80:
        return None
    if log:
        log.record("gemini", "corpus_extraction", "calling", f"corpus={len(corpus)} chars")
    prompt = build_company_extraction_prompt(company_name, website_url, corpus)
    from app.config import settings
    corpus_model = settings.gemini_synthesis_model  # flash-lite — reliable for JSON extraction
    return await call_gemini_json(
        api_key, corpus_model,
        system=COMPANY_EXTRACTION_SYSTEM,
        user=prompt,
        use_grounding=False,
        max_output_tokens=4096,
        temperature=0.1,
        log=log,
        log_provider="gemini",
        log_action="corpus_extraction",
        fallback_models=[],
        max_retries=1,
    )


def _build_source_corpus(sources: List[ResearchSource]) -> str:
    parts = []
    for s in sorted(sources, key=lambda x: x.source_quality_score, reverse=True):
        header = f"[{s.source_type.upper()}] {s.title} ({s.url})"
        body = (s.extracted_summary or s.snippet or "").strip()
        if body:
            parts.append(f"{header}\n{body[:3000]}")
    return "\n\n---\n\n".join(parts)


def _parse_founders(raw: Any) -> List[FounderProfile]:
    if not isinstance(raw, list):
        return []
    founders = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        name = (item.get("name") or "").strip()
        if not name or len(name) < 3:
            continue
        founders.append(FounderProfile(
            name=name,
            role=item.get("role") or "Founder",
            background_summary=item.get("background_summary") or "",
            confidence=0.90,
        ))
    return founders[:8]


def _parse_competitors(raw: Any) -> List[CompetitorInfo]:
    if not isinstance(raw, list):
        return []
    result = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        name = (item.get("name") or "").strip()
        if not name:
            continue
        result.append(CompetitorInfo(
            name=name,
            differentiator=item.get("differentiator") or "",
            funding_known="",
            relative_positioning=item.get("relative_positioning") or "",
        ))
    return result[:8]


def _str_or_none(val: Any) -> Optional[str]:
    if val is None:
        return None
    s = str(val).strip()
    return s if s and s.lower() not in ("null", "none", "unknown", "n/a") else None


def _str_list(val: Any) -> List[str]:
    if not isinstance(val, list):
        return []
    return [str(x).strip() for x in val if x and str(x).strip()]


async def build_evidence_with_llm(
    company_name: str,
    website_url: str,
    sources: List[ResearchSource],
    user_context: Optional[str] = None,
    log: Optional[ProviderLog] = None,
    gemini_api_key: str = "",
    gemini_model: str = "gemini-2.0-flash",
    gemini_grounding_enabled: bool = True,
) -> Tuple[EvidenceLayer, EvidenceConfidence, bool]:
    """
    Full evidence build:
    1. Heuristic extraction from crawled sources (always, instant)
    2. HuggingFace LLM extraction from crawled text (if key set)
    3. Gemini + Google Search grounding for live web research (if key + grounding enabled)
       — finds founders, funding, investors, competitors from live web
    Merge order: heuristic → HF → Gemini grounding (Gemini wins on conflicts)
    """
    from .evidence_builder import build_evidence_layer

    heuristic, confidence = build_evidence_layer(company_name, sources)

    # HF extraction on crawled text
    hf_data = await extract_company_intelligence(
        company_name, website_url, sources, user_context, log=log,
    )
    merged, hf_used = merge_llm_into_evidence(heuristic, hf_data)

    # Gemini: live web research (grounding) → corpus extraction fallback
    gemini_research_used = False
    if gemini_api_key:
        gemini_research_data = None
        if gemini_grounding_enabled:
            gemini_research_data = await _gemini_research(
                company_name, website_url, gemini_api_key, gemini_model, log=log,
            )
        if not gemini_research_data:
            gemini_research_data = await _gemini_corpus_extraction(
                company_name, website_url, sources, gemini_api_key, gemini_model, log=log,
            )
        if gemini_research_data:
            merged, gemini_research_used = merge_llm_into_evidence(merged, gemini_research_data)

    llm_used = hf_used or gemini_research_used
    confidence = boost_confidence_after_llm(confidence, merged, llm_used)

    if log:
        log.record(
            "extraction", "summary", "ok" if llm_used else "heuristic",
            f"hf={hf_used} gemini_grounding={gemini_research_used} "
            f"founders={len(merged.founders)} funding={merged.funding_stage or 'unknown'} "
            f"competitors={len(merged.competitors)}",
        )

    return merged, confidence, llm_used


async def extract_company_intelligence(
    company_name: str,
    website_url: str,
    sources: List[ResearchSource],
    user_context: Optional[str] = None,
    log: Optional[ProviderLog] = None,
) -> Optional[Dict[str, Any]]:
    """
    HuggingFace LLM extraction from crawled source text.
    """
    llm = get_llm()
    if not llm.is_configured:
        if log:
            log.record("huggingface", "company_extraction", "skipped", "HUGGINGFACE_API_KEY not set")
        return None

    corpus = _build_source_corpus(sources)
    if len(corpus) < 80:
        if log:
            log.record("huggingface", "company_extraction", "skipped",
                       f"Insufficient source text ({len(corpus)} chars)")
        return None

    if log:
        log.record("huggingface", "company_extraction", "calling",
                   f"corpus={len(corpus)} chars model={llm.model}")

    prompt = build_company_extraction_prompt(
        company_name, website_url, corpus, user_context,
    )
    return await llm.chat_json(
        COMPANY_EXTRACTION_SYSTEM, prompt,
        log=log, action="company_extraction",
    )


def merge_llm_into_evidence(
    base: EvidenceLayer,
    llm_data: Optional[Dict[str, Any]],
) -> Tuple[EvidenceLayer, bool]:
    """
    Merge LLM extraction over base layer. New data wins on non-empty fields.
    """
    if not llm_data:
        return base, False

    llm_founders = _parse_founders(llm_data.get("founders"))
    llm_competitors = _parse_competitors(llm_data.get("competitors"))

    funding_stage = _str_or_none(llm_data.get("funding_stage")) or base.funding_stage
    total_funding = _str_or_none(llm_data.get("total_funding_known")) or base.total_funding_known
    last_round = llm_data.get("last_funding_round")
    if isinstance(last_round, dict):
        if not total_funding and last_round.get("amount"):
            total_funding = _str_or_none(str(last_round["amount"]))
        if not funding_stage and last_round.get("stage"):
            funding_stage = _str_or_none(str(last_round["stage"]))

    investors = _str_list(llm_data.get("investors_known")) or base.investors_known

    layer = EvidenceLayer(
        company_overview=_str_or_none(llm_data.get("company_overview")) or base.company_overview,
        one_liner=_str_or_none(llm_data.get("one_liner")) or base.one_liner,
        founding_year=_str_or_none(llm_data.get("founding_year")) or base.founding_year,
        headquarters=_str_or_none(llm_data.get("headquarters")) or base.headquarters,
        employee_count_estimate=_str_or_none(llm_data.get("employee_count_estimate")) or base.employee_count_estimate,
        founders=llm_founders if llm_founders else base.founders,
        business_model=_str_or_none(llm_data.get("business_model")) or base.business_model,
        monetization=_str_or_none(llm_data.get("monetization")) or base.monetization,
        target_customer=_str_or_none(llm_data.get("target_customer")) or base.target_customer,
        market=_str_or_none(llm_data.get("market")) or base.market,
        market_size_estimate=_str_or_none(llm_data.get("market_size_estimate")) or base.market_size_estimate,
        competitors=llm_competitors if llm_competitors else base.competitors,
        funding_stage=funding_stage,
        total_funding_known=total_funding,
        investors_known=investors,
        hiring_signals=_str_list(llm_data.get("hiring_signals")) or base.hiring_signals,
        growth_signals=_str_list(llm_data.get("growth_signals")) or base.growth_signals,
        news_headlines=_str_list(llm_data.get("news_headlines")) or base.news_headlines,
        sentiment_summary=base.sentiment_summary,
        moat_signals=base.moat_signals,
        risk_signals=base.risk_signals,
        unknowns=[],
    )

    recent = _str_or_none(llm_data.get("recent_developments"))
    if recent and recent not in layer.company_overview:
        layer.company_overview = f"{layer.company_overview} {recent}".strip()[:800]

    if not layer.founders:
        layer.unknowns.append("founders")
    if not layer.funding_stage and not layer.total_funding_known:
        layer.unknowns.append("funding")
    if not layer.competitors:
        layer.unknowns.append("competitors")

    return layer, True


def boost_confidence_after_llm(
    confidence: EvidenceConfidence,
    layer: EvidenceLayer,
    llm_used: bool,
) -> EvidenceConfidence:
    if not llm_used:
        return confidence

    def _sig(lst) -> float:
        return min(1.0, len(lst) / 2.0) if lst else 0.0

    co = 0.88 if len(layer.company_overview) > 100 else confidence.company_overview
    founders = 0.90 if layer.founders else confidence.founders
    market = 0.82 if layer.market and layer.market != "Market not determined" else confidence.market
    bm = 0.80 if "not determined" not in layer.business_model.lower() else confidence.business_model
    comp = _sig(layer.competitors) if layer.competitors else confidence.competitors
    funding = 0.85 if (layer.funding_stage or layer.total_funding_known) else confidence.funding
    growth = _sig(layer.growth_signals) if layer.growth_signals else confidence.growth
    moat = confidence.moat
    overall = (co + founders + market + bm + comp + funding + growth + moat) / 8

    return EvidenceConfidence(
        company_overview=co,
        founders=founders,
        market=market,
        business_model=bm,
        competitors=comp,
        funding=funding,
        growth=growth,
        moat=moat,
        overall=round(overall, 2),
    )
