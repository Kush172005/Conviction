"""
Fund Thesis Match Engine.
Deterministic — no LLM required.
Scores how well a startup fits the investor's fund thesis across:
  sector, stage, geography, business model, check size
Produces 0-100 thesis_fit_score with fit/misfit reasons.
"""
from typing import List, Optional

from app.models.startup_intelligence import (
    AlignmentScore,
    EvidenceLayer,
    InvestorProfileSnapshot,
    ThesisMatch,
)

# ─── Sector mapping: evidence keywords → canonical VC sector labels ──────────

SECTOR_KEYWORD_MAP = {
    "B2B SaaS": ["saas", "b2b software", "software as a service", "vertical saas", "horizontal saas"],
    "AI Infrastructure": ["ai infrastructure", "llm", "large language model", "foundation model",
                          "ml ops", "mlops", "vector database", "gpu", "inference", "training infrastructure"],
    "Developer Tools": ["developer", "devtools", "cli", "api", "sdk", "open source", "ide",
                        "ci/cd", "devops", "platform engineering"],
    "FinTech": ["fintech", "financial", "banking", "payments", "lending", "insurance",
                "wealth management", "neobank", "crypto", "defi", "trading"],
    "HealthTech": ["healthcare", "health tech", "healthtech", "medical", "clinical", "hospital",
                   "patient", "pharma", "biotech", "life sciences", "mental health", "wellness"],
    "Climate Tech": ["climate", "cleantech", "clean energy", "renewable", "carbon", "sustainability",
                     "net zero", "energy transition", "solar", "battery", "ev"],
    "Consumer": ["consumer", "direct to consumer", "dtc", "b2c", "social", "gaming",
                 "content", "creator economy", "entertainment"],
    "Deep Tech": ["deep tech", "deeptech", "robotics", "hardware", "bioengineering",
                  "quantum", "photonics", "advanced materials", "space tech"],
    "Future of Work": ["future of work", "remote work", "collaboration", "productivity",
                       "hr tech", "hrtech", "workforce", "talent", "hiring"],
    "Cybersecurity": ["cybersecurity", "security", "identity", "zero trust", "threat detection",
                      "soc", "compliance", "data privacy", "encryption"],
    "EdTech": ["edtech", "education technology", "learning", "e-learning", "tutoring",
               "skills", "upskilling", "university", "school"],
    "Web3": ["web3", "blockchain", "crypto", "nft", "defi", "dao", "token", "smart contract"],
    "MarTech": ["marketing technology", "martech", "ad tech", "growth", "crm",
                "customer data", "personalization", "analytics"],
    "Supply Chain": ["supply chain", "logistics", "freight", "warehouse", "inventory",
                     "procurement", "sourcing", "last mile"],
}

GEOGRAPHY_KEYWORD_MAP = {
    "US": ["united states", "us market", "silicon valley", "san francisco", "new york", "austin",
           "seattle", "boston", "los angeles", "inc.", "llc"],
    "India": ["india", "bengaluru", "bangalore", "mumbai", "delhi", "hyderabad", "indian market"],
    "Europe": ["europe", "uk", "london", "berlin", "paris", "amsterdam", "stockholm", "european"],
    "Southeast Asia": ["singapore", "southeast asia", "indonesia", "vietnam", "thailand",
                       "malaysia", "philippines", "sea market"],
    "Latin America": ["latin america", "brazil", "mexico", "colombia", "latam"],
    "Africa": ["africa", "nigeria", "kenya", "south africa", "ghana", "african market"],
    "Middle East": ["middle east", "dubai", "uae", "saudi", "mena"],
    "Global": ["global", "worldwide", "international", "multi-country"],
}

STAGE_ORDER = ["pre-seed", "seed", "series-a", "series-b", "series-c", "growth", "late-stage"]


# ─── Alignment scoring helpers ────────────────────────────────────────────────

def _label(score: float) -> str:
    if score >= 0.75:
        return "strong"
    if score >= 0.5:
        return "moderate"
    if score >= 0.25:
        return "weak"
    return "mismatch"


def _score_sector(
    evidence: EvidenceLayer,
    preferred_sectors: List[str],
) -> AlignmentScore:
    if not preferred_sectors:
        return AlignmentScore(score=0.5, label="unknown", reasons=["No preferred sectors configured"])

    evidence_text = (
        evidence.company_overview + " " +
        evidence.business_model + " " +
        evidence.market + " " +
        evidence.one_liner
    ).lower()

    matched_sectors = []
    for sector in preferred_sectors:
        keywords = SECTOR_KEYWORD_MAP.get(sector, [sector.lower()])
        if any(kw in evidence_text for kw in keywords):
            matched_sectors.append(sector)

    if matched_sectors:
        score = min(1.0, len(matched_sectors) / max(1, len(preferred_sectors)) + 0.3)
        return AlignmentScore(
            score=round(score, 2),
            label=_label(score),
            reasons=[f"Matches preferred sector: {s}" for s in matched_sectors],
        )
    else:
        # Check what sectors are detected
        detected = [s for s, kws in SECTOR_KEYWORD_MAP.items()
                    if any(kw in evidence_text for kw in kws)]
        if detected:
            return AlignmentScore(
                score=0.2,
                label="mismatch",
                reasons=[f"Detected sector '{detected[0]}' does not match preferred sectors: {', '.join(preferred_sectors[:3])}"],
            )
        return AlignmentScore(
            score=0.3,
            label="weak",
            reasons=["Sector not clearly identifiable from public sources"],
        )


def _score_stage(
    evidence: EvidenceLayer,
    preferred_stages: List[str],
) -> AlignmentScore:
    if not preferred_stages:
        return AlignmentScore(score=0.5, label="unknown", reasons=["No preferred stages configured"])

    detected = evidence.funding_stage
    if not detected:
        return AlignmentScore(
            score=0.4,
            label="weak",
            reasons=["Funding stage not determinable from public sources"],
        )

    if detected in preferred_stages:
        # Check adjacency for partial credit
        return AlignmentScore(
            score=0.95,
            label="strong",
            reasons=[f"Detected stage '{detected}' matches preferred stages"],
        )

    # Adjacent stage: partial credit
    try:
        det_idx = STAGE_ORDER.index(detected)
        for pref in preferred_stages:
            if pref in STAGE_ORDER:
                pref_idx = STAGE_ORDER.index(pref)
                if abs(det_idx - pref_idx) == 1:
                    return AlignmentScore(
                        score=0.55,
                        label="moderate",
                        reasons=[f"Detected stage '{detected}' is adjacent to preferred '{pref}'"],
                    )
    except ValueError:
        pass

    return AlignmentScore(
        score=0.15,
        label="mismatch",
        reasons=[f"Detected stage '{detected}' does not match preferred stages: {', '.join(preferred_stages)}"],
    )


def _score_geography(
    evidence: EvidenceLayer,
    geographies: List[str],
) -> AlignmentScore:
    if not geographies:
        return AlignmentScore(score=0.5, label="unknown", reasons=["No geography preferences configured"])

    evidence_text = (
        evidence.company_overview + " " +
        evidence.one_liner + " " +
        " ".join(evidence.news_headlines)
    ).lower()

    matched_geos = []
    for geo in geographies:
        keywords = GEOGRAPHY_KEYWORD_MAP.get(geo, [geo.lower()])
        if any(kw in evidence_text for kw in keywords):
            matched_geos.append(geo)

    # If "Global" is preferred, always partial credit
    if "Global" in geographies:
        return AlignmentScore(
            score=0.7,
            label="strong",
            reasons=["Fund invests globally"],
        )

    if matched_geos:
        return AlignmentScore(
            score=0.9,
            label="strong",
            reasons=[f"Company signals in preferred geography: {', '.join(matched_geos)}"],
        )

    return AlignmentScore(
        score=0.3,
        label="weak",
        reasons=["Company geography not confirmed as matching preferences"],
    )


def _score_business_model(
    evidence: EvidenceLayer,
    thesis_text: str,
) -> AlignmentScore:
    bm = evidence.business_model.lower()
    thesis_lower = thesis_text.lower()

    reasons = []
    score = 0.5

    # SaaS preference signals
    if "saas" in thesis_lower or "software" in thesis_lower:
        if "saas" in bm or "subscription" in bm:
            score = 0.9
            reasons.append("SaaS/subscription model aligns with thesis")
        elif "marketplace" in bm:
            score = 0.5
            reasons.append("Marketplace model — partial thesis fit")
        elif bm == "not determined from public sources":
            score = 0.4
            reasons.append("Business model not clearly identified")
        else:
            score = 0.3
            reasons.append(f"Detected business model '{bm}' may not align with thesis")

    # Enterprise preference
    if "enterprise" in thesis_lower:
        if evidence.target_customer and "enterprise" in evidence.target_customer.lower():
            score = min(1.0, score + 0.1)
            reasons.append("Enterprise target customer aligns")

    if not reasons:
        reasons.append("Business model alignment is uncertain from available data")

    return AlignmentScore(score=round(score, 2), label=_label(score), reasons=reasons)


# ─── Main scoring function ────────────────────────────────────────────────────

def run_thesis_match_engine(
    evidence: EvidenceLayer,
    confidence: float,
    profile: InvestorProfileSnapshot,
) -> ThesisMatch:
    """
    Compute thesis fit score and alignment breakdown deterministically.
    Returns ThesisMatch with 0-100 score.
    """
    sector = _score_sector(evidence, profile.preferred_sectors)
    stage = _score_stage(evidence, profile.preferred_stages)
    geography = _score_geography(evidence, profile.geographies)
    bm = _score_business_model(evidence, profile.investment_thesis)

    # Weighted composite
    weights = {"sector": 0.35, "stage": 0.25, "geography": 0.20, "bm": 0.20}
    raw_score = (
        sector.score * weights["sector"] +
        stage.score * weights["stage"] +
        geography.score * weights["geography"] +
        bm.score * weights["bm"]
    )

    # Confidence penalty: low evidence = dampen extreme scores toward 50
    confidence_factor = 0.5 + confidence * 0.5
    adjusted = 50 + (raw_score - 0.5) * 100 * confidence_factor
    thesis_fit_score = max(5, min(95, int(adjusted)))

    # Collect fit/misfit reasons
    fit_reasons: List[str] = []
    misfit_reasons: List[str] = []
    for alignment in [sector, stage, geography, bm]:
        for reason in alignment.reasons:
            if alignment.label in ("strong", "moderate"):
                fit_reasons.append(reason)
            elif alignment.label in ("mismatch",):
                misfit_reasons.append(reason)

    # Thesis text matching: look for keyword overlaps
    thesis_words = set(profile.investment_thesis.lower().split())
    overview_words = set(evidence.company_overview.lower().split())
    overlap = thesis_words & overview_words - {"the", "a", "an", "and", "in", "of", "to", "for", "is", "are", "with"}
    if len(overlap) >= 3:
        fit_reasons.append(f"Company description overlaps with thesis keywords: {', '.join(list(overlap)[:5])}")

    # Unknown penalties
    if "founders" in evidence.unknowns:
        misfit_reasons.append("Founder information not publicly available — key uncertainty")
    if "funding" in evidence.unknowns:
        misfit_reasons.append("Funding stage unknown — stage fit cannot be confirmed")

    return ThesisMatch(
        thesis_fit_score=thesis_fit_score,
        sector_alignment=sector,
        stage_alignment=stage,
        geography_alignment=geography,
        business_model_alignment=bm,
        key_fit_reasons=fit_reasons[:5],
        key_misfit_reasons=misfit_reasons[:4],
        confidence=round(confidence, 2),
    )
