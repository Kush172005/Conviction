"""
Deterministic evidence extraction from raw sources.
Builds the structured EvidenceLayer from website text + search snippets.
No LLM calls here — all heuristic/regex/keyword extraction.
"""
import re
from typing import List, Optional, Tuple

from app.models.startup_intelligence import (
    CompetitorInfo,
    EvidenceConfidence,
    EvidenceLayer,
    FounderProfile,
    MoatSignal,
    ResearchSource,
    RiskSignal,
)

# ─── Keyword sets ─────────────────────────────────────────────────────────────

FOUNDER_TITLES = ["ceo", "cto", "coo", "co-founder", "cofounder", "founder", "president", "chief"]
STAGE_KEYWORDS = {
    "pre-seed": ["pre-seed", "pre seed", "ideation", "building from scratch", "just started"],
    "seed": ["seed round", "seed stage", "seed funding", "$500k", "$1m", "$2m", "pre-series a"],
    "series-a": ["series a", "series-a", "$5m", "$8m", "$10m", "$12m", "$15m"],
    "series-b": ["series b", "series-b", "$20m", "$25m", "$30m", "$40m", "$50m"],
    "series-c": ["series c", "series-c", "$75m", "$100m"],
    "growth": ["growth stage", "late stage", "pre-ipo", "series d", "series e"],
}
FUNDING_AMOUNTS = re.compile(
    r"\$(\d+(?:\.\d+)?)\s*(million|m|billion|b|k)",
    re.IGNORECASE,
)
YEAR_RE = re.compile(r"\b(20\d{2})\b")
EMPLOYEE_RE = re.compile(
    r"(\d+)[+\-]?\s*(?:employees?|people|team members|engineers|staff)",
    re.IGNORECASE,
)
COMPETITOR_KEYWORDS = ["competitor", "alternative", "versus", r"vs\.", "compete", "competing"]
INVESTOR_RE = re.compile(
    r"(a16z|andreessen|sequoia|y\s*combinator|yc|lightspeed|tiger|coatue|general\s*catalyst|accel|"
    r"greylock|benchmark|khosla|founders?\s*fund|bessemer|GV|google\s*ventures|"
    r"softbank|kleiner|index\s*ventures|redpoint|battery|felicis|"
    r"500\s*startups|techstars|first\s*round)",
    re.IGNORECASE,
)
MOAT_KEYWORDS = {
    "network_effects": ["network effect", "viral", "more users", "flywheel", "marketplace", "two-sided"],
    "data_moat": ["proprietary data", "data advantage", "unique dataset", "train on", "machine learning data"],
    "switching_costs": ["switching cost", "lock-in", "workflow integration", "embedded", "api dependency"],
    "distribution": ["partnership", "channel partner", "reseller", "OEM", "distribution agreement"],
    "brand": ["brand", "community", "trusted", "category leader", "industry standard"],
    "technical_depth": ["patent", "proprietary", "novel", "breakthrough", "research", "phd", "deep tech"],
    "regulatory": ["regulatory", "compliance", "certified", "approved", "license", "accredited"],
    "partnerships": ["partnership", "enterprise agreement", "strategic partner", "integration with"],
}
RED_FLAG_PATTERNS = {
    "no_monetization": ["free forever", "no pricing", "not yet monetizing", "pre-revenue"],
    "stale_footprint": ["founded in 201", "last updated", "no recent news"],
    "crowded_market": ["many competitors", "highly competitive", "crowded space"],
    "regulatory_exposure": ["regulatory risk", "pending regulation", "compliance issue"],
}


# ─── Helper functions ─────────────────────────────────────────────────────────

def _all_text(sources: List[ResearchSource]) -> str:
    return " ".join(
        (s.extracted_summary or s.snippet) for s in sources
    ).lower()


def _website_text(sources: List[ResearchSource]) -> str:
    return " ".join(
        (s.extracted_summary or s.snippet)
        for s in sources
        if s.source_type == "website"
    ).lower()


def _source_urls_containing(sources: List[ResearchSource], keywords: List[str]) -> List[str]:
    urls = []
    for s in sources:
        text = (s.extracted_summary + " " + s.snippet).lower()
        if any(k.lower() in text for k in keywords):
            urls.append(s.url)
    return urls[:3]


def _extract_founded_year(text: str) -> Optional[str]:
    matches = YEAR_RE.findall(text)
    for m in matches:
        year = int(m)
        if 2000 <= year <= 2025:
            return str(year)
    return None


def _extract_funding_stage(text: str) -> Optional[str]:
    for stage, keywords in STAGE_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return stage
    return None


def _extract_funding_amount(text: str) -> Optional[str]:
    match = FUNDING_AMOUNTS.search(text)
    if match:
        amount = match.group(1)
        unit = match.group(2).lower()
        if unit in ("m", "million"):
            return f"${amount}M"
        elif unit in ("b", "billion"):
            return f"${amount}B"
        elif unit == "k":
            return f"${amount}K"
    return None


def _extract_employee_count(text: str) -> Optional[str]:
    match = EMPLOYEE_RE.search(text)
    if match:
        return match.group(1) + "+"
    return None


def _extract_investors(text: str, sources: List[ResearchSource]) -> List[str]:
    found = []
    for match in INVESTOR_RE.finditer(_all_text(sources)):
        name = match.group(0).strip()
        if name not in found:
            found.append(name)
    return found[:8]


def _extract_founders(sources: List[ResearchSource]) -> List[FounderProfile]:
    """Heuristic: look for role+name patterns in website text."""
    founders: List[FounderProfile] = []
    seen_names: set = set()

    for source in sources:
        text = source.extracted_summary or source.snippet
        # Look for "Name, CEO/CTO/Founder" or "CEO Name" patterns
        matches = re.findall(
            r"([A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*[,\-–]\s*(CEO|CTO|COO|Co-Founder|Founder|President|CPO)",
            text,
        )
        for name, role in matches:
            if name not in seen_names and len(name.split()) <= 4:
                seen_names.add(name)
                founders.append(FounderProfile(
                    name=name,
                    role=role,
                    background_summary="",
                    confidence=0.6,
                ))
        if len(founders) >= 5:
            break

    return founders


def _extract_competitors(sources: List[ResearchSource]) -> List[CompetitorInfo]:
    """Pull competitor names from search results."""
    competitors: List[CompetitorInfo] = []
    seen: set = set()
    for source in sources:
        if source.source_type not in ("search_result", "news"):
            continue
        text = source.extracted_summary or source.snippet
        # Look for "versus X" or "compete with X" patterns
        matches = re.findall(
            r"(?:vs\.?|versus|compete\s+with|alternative\s+to|competitor[s]?\s+like|similar\s+to)\s+([A-Z][a-zA-Z0-9\s]{2,30}?)(?:[,\.\(]|$)",
            text,
        )
        for m in matches:
            name = m.strip()
            if name and name not in seen and len(name) < 40:
                seen.add(name)
                competitors.append(CompetitorInfo(
                    name=name,
                    differentiator="",
                    funding_known="",
                    relative_positioning="",
                ))
        if len(competitors) >= 5:
            break
    return competitors


def _build_moat_signals(text: str, sources: List[ResearchSource]) -> List[MoatSignal]:
    signals = []
    for dimension, keywords in MOAT_KEYWORDS.items():
        found = [kw for kw in keywords if kw.lower() in text]
        if found:
            strength = "strong" if len(found) >= 2 else "moderate"
            conf = 0.7 if len(found) >= 2 else 0.45
            evidence_urls = _source_urls_containing(sources, found)
            signals.append(MoatSignal(
                dimension=dimension,
                strength=strength,
                evidence=f"Keywords detected: {', '.join(found[:3])}",
                confidence=conf,
            ))
        else:
            signals.append(MoatSignal(
                dimension=dimension,
                strength="none",
                evidence="No evidence found",
                confidence=0.0,
            ))
    return signals


def _build_risk_signals(text: str, sources: List[ResearchSource]) -> List[RiskSignal]:
    risks: List[RiskSignal] = []

    # Generic structural checks
    if not any(kw in text for kw in ["pricing", "price", "plan", "per seat", "per user", "subscription"]):
        risks.append(RiskSignal(
            category="monetization",
            description="No clear pricing model detected in public materials",
            severity="medium",
            evidence="No pricing/plan language found on website or in search results",
            confidence=0.6,
        ))

    if not any(kw in text for kw in ["customer", "client", "case study", "user", "enterprise"]):
        risks.append(RiskSignal(
            category="traction",
            description="No customer or traction signals detected publicly",
            severity="medium",
            evidence="No customer references, case studies, or user counts found",
            confidence=0.5,
        ))

    for pattern_name, keywords in RED_FLAG_PATTERNS.items():
        for kw in keywords:
            if kw.lower() in text:
                risks.append(RiskSignal(
                    category=pattern_name,
                    description=f"Potential risk: {pattern_name.replace('_', ' ')} — '{kw}' detected",
                    severity="medium",
                    evidence=f"Found in: {_source_urls_containing(sources, [kw])}",
                    confidence=0.5,
                ))
                break

    return risks


def _compute_confidence(layer: EvidenceLayer) -> EvidenceConfidence:
    def _sig(lst) -> float:
        return min(1.0, len(lst) / 3.0) if lst else 0.0

    co = 0.7 if layer.company_overview else 0.0
    founders = _sig(layer.founders)
    market = 0.6 if layer.market else 0.0
    bm = 0.6 if layer.business_model else 0.0
    comp = _sig(layer.competitors)
    funding = 0.5 if (layer.funding_stage or layer.total_funding_known) else 0.0
    growth = _sig(layer.growth_signals)
    moat = _sig([m for m in layer.moat_signals if m.strength != "none"])
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
        overall=overall,
    )


# ─── Main builder ─────────────────────────────────────────────────────────────

def build_evidence_layer(
    company_name: str,
    sources: List[ResearchSource],
) -> Tuple[EvidenceLayer, EvidenceConfidence]:
    """
    Build a structured evidence layer from all collected sources.
    Deterministic — no LLM required.
    """
    all_text = _all_text(sources)
    web_text = _website_text(sources)

    # Company overview — prefer website title/description
    overview_parts = []
    for s in sources:
        if s.source_type == "website" and s.snippet:
            overview_parts.append(s.snippet)
    company_overview = " ".join(overview_parts[:2])[:500] or f"Company overview for {company_name} extracted from public sources."

    # One-liner from website meta description
    one_liner = ""
    for s in sources:
        if s.source_type == "website" and len(s.snippet) < 200 and s.snippet:
            one_liner = s.snippet
            break

    founders = _extract_founders(sources)
    competitors = _extract_competitors(sources)
    funding_stage = _extract_funding_stage(all_text)
    total_funding = _extract_funding_amount(all_text)
    investors = _extract_investors(all_text, sources)
    founded_year = _extract_founded_year(all_text)
    employee_count = _extract_employee_count(all_text)

    # Business model signals
    bm_keywords = []
    for kw in ["saas", "subscription", "marketplace", "platform", "api", "b2b", "b2c",
                "enterprise", "freemium", "usage-based", "per seat", "transaction fee"]:
        if kw in all_text:
            bm_keywords.append(kw)
    business_model = ", ".join(bm_keywords).title() if bm_keywords else "Not determined from public sources"
    monetization = business_model

    # Market
    market_keywords = []
    for kw in ["artificial intelligence", "machine learning", "healthcare", "fintech", "edtech",
                "devtools", "developer", "b2b software", "saas", "climate", "logistics", "legal",
                "real estate", "hr", "sales", "marketing", "security", "cybersecurity", "data"]:
        if kw in all_text:
            market_keywords.append(kw)
    market = ", ".join(market_keywords[:5]).title() if market_keywords else "Market not determined"

    # Growth/hiring
    hiring_keywords = ["hiring", "we're hiring", "join our team", "open positions", "careers"]
    hiring_signals = [kw for kw in hiring_keywords if kw in all_text]
    growth_signals = []
    for kw in ["growing", "launched", "raised", "announced", "expanded", "partnership"]:
        if kw in all_text:
            growth_signals.append(kw.title())

    # News
    news_snippets = [s.snippet[:200] for s in sources if s.source_type == "news"]

    moat_signals = _build_moat_signals(all_text, sources)
    risk_signals = _build_risk_signals(all_text, sources)

    unknowns = []
    if not founders:
        unknowns.append("founders")
    if not funding_stage and not total_funding:
        unknowns.append("funding")
    if not competitors:
        unknowns.append("competitors")

    layer = EvidenceLayer(
        company_overview=company_overview,
        one_liner=one_liner,
        founding_year=founded_year,
        headquarters=None,
        employee_count_estimate=employee_count,
        founders=founders,
        business_model=business_model,
        monetization=monetization,
        target_customer="Not determined" if "enterprise" not in all_text and "consumer" not in all_text else ("Enterprise" if "enterprise" in all_text else "Consumer"),
        market=market,
        market_size_estimate=None,
        competitors=competitors,
        funding_stage=funding_stage,
        total_funding_known=total_funding,
        investors_known=investors,
        hiring_signals=hiring_signals,
        growth_signals=growth_signals,
        news_headlines=news_snippets[:5],
        sentiment_summary="Neutral — insufficient signals for sentiment scoring" if not news_snippets else "Mixed signals across news sources",
        moat_signals=moat_signals,
        risk_signals=risk_signals,
        unknowns=unknowns,
    )

    confidence = _compute_confidence(layer)
    return layer, confidence
