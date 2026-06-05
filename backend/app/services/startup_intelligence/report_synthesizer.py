"""
Report and IC Memo synthesizer.
Priority: Gemini → HuggingFace → deterministic templates.
"""
from typing import Any, Dict, List, Optional, TYPE_CHECKING

from app.config import settings
from app.services.llm.gemini_client import call_gemini_json
from app.services.llm.provider import get_llm
from app.models.startup_intelligence import (
    DiligenceQuestion,
    EvidenceConfidence,
    EvidenceLayer,
    ICMemo,
    InvestorProfileSnapshot,
    MoatAnalysis,
    MoatSignal,
    RedFlag,
    ReportSection,
    ThesisMatch,
)

if TYPE_CHECKING:
    from app.services.startup_intelligence.provider_log import ProviderLog

SYNTHESIS_SYSTEM = "You are a VC analyst. Return ONLY valid JSON matching the requested schema. No markdown."


# ─── Gemini call ──────────────────────────────────────────────────────────────

def _build_synthesis_prompt(
    company_name: str,
    website_url: str,
    evidence: EvidenceLayer,
    confidence: EvidenceConfidence,
    thesis_match: ThesisMatch,
    profile: InvestorProfileSnapshot,
    user_context: Optional[str],
) -> str:
    moat_summary = ", ".join(
        f"{m.dimension}:{m.strength}" for m in evidence.moat_signals if m.strength != "none"
    )
    risk_summary = "; ".join(
        f"[{r.severity.upper()}] {r.description}" for r in evidence.risk_signals[:5]
    )

    return f"""You are a VC analyst writing an investment report for {profile.fund_name or "our fund"}.

COMPANY: {company_name} ({website_url})
FUND THESIS: {profile.investment_thesis or "Not specified"}
PREFERRED SECTORS: {', '.join(profile.preferred_sectors) or 'Not specified'}
PREFERRED STAGES: {', '.join(profile.preferred_stages) or 'Not specified'}
GEOGRAPHIES: {', '.join(profile.geographies) or 'Not specified'}
CHECK SIZE: {profile.typical_check_size or 'Not specified'}
THESIS FIT SCORE: {thesis_match.thesis_fit_score}/100
FIT REASONS: {'; '.join(thesis_match.key_fit_reasons)}
MISFIT REASONS: {'; '.join(thesis_match.key_misfit_reasons)}

EVIDENCE SUMMARY:
- Overview: {evidence.company_overview[:400]}
- One-liner: {evidence.one_liner}
- Business model: {evidence.business_model}
- Market: {evidence.market}
- Founders: {', '.join(f.name + ' (' + f.role + ')' for f in evidence.founders) or 'Not found'}
- Funding stage: {evidence.funding_stage or 'Unknown'}
- Total funding: {evidence.total_funding_known or 'Unknown'}
- Investors: {', '.join(evidence.investors_known) or 'None found'}
- Competitors: {', '.join(c.name for c in evidence.competitors) or 'None identified'}
- Growth signals: {', '.join(evidence.growth_signals) or 'None'}
- Moat signals: {moat_summary or 'None detected'}
- Risk signals: {risk_summary or 'None'}
- Unknowns: {', '.join(evidence.unknowns) or 'None'}
- Overall evidence confidence: {confidence.overall:.0%}
{('- User context: ' + user_context) if user_context else ''}

Generate a JSON object with EXACTLY these keys:
{{
  "executive_summary": "3-4 sentence summary: what the company does, thesis fit score, key signal, recommendation",
  "company_overview": "2-3 sentences on what the company does, its stage, and key facts",
  "founder_assessment": "Assessment of founders based on available public signals. If founders unknown, note this and explain what we'd want to verify.",
  "market_analysis": "2-3 sentences on market size, dynamics, and tailwinds relevant to thesis",
  "competitor_landscape": "2 sentences on competitive positioning and differentiation",
  "business_model": "1-2 sentences on monetization and unit economics signals",
  "funding_and_investors": "1-2 sentences on funding status and investor quality signals",
  "growth_and_hiring": "1-2 sentences on growth and team size signals",
  "news_and_sentiment": "1-2 sentences on recent news and public sentiment",
  "opportunities": "2-3 bullet points as a string: key investment opportunities",
  "moat_analysis": {{
    "network_effects": {{"strength": "none|weak|moderate|strong", "evidence": "one sentence", "confidence": 0.0-1.0}},
    "data_moat": {{"strength": "none|weak|moderate|strong", "evidence": "one sentence", "confidence": 0.0-1.0}},
    "distribution": {{"strength": "none|weak|moderate|strong", "evidence": "one sentence", "confidence": 0.0-1.0}},
    "switching_costs": {{"strength": "none|weak|moderate|strong", "evidence": "one sentence", "confidence": 0.0-1.0}},
    "brand": {{"strength": "none|weak|moderate|strong", "evidence": "one sentence", "confidence": 0.0-1.0}},
    "technical_depth": {{"strength": "none|weak|moderate|strong", "evidence": "one sentence", "confidence": 0.0-1.0}},
    "regulatory": {{"strength": "none|weak|moderate|strong", "evidence": "one sentence", "confidence": 0.0-1.0}},
    "partnerships": {{"strength": "none|weak|moderate|strong", "evidence": "one sentence", "confidence": 0.0-1.0}},
    "overall_moat_score": 0-100,
    "moat_summary": "2 sentences"
  }},
  "red_flags": [
    {{"severity": "low|medium|high|critical", "category": "category name", "explanation": "sentence", "supporting_evidence": "sentence", "confidence": 0.0-1.0}}
  ],
  "diligence_questions": [
    {{"question": "...", "category": "founders|market|product|business_model|competition|financials|legal", "priority": "high|medium|low", "why_important": "sentence"}}
  ],
  "recommendation": "strong_invest|investigate|monitor|pass",
  "recommendation_rationale": "2 sentences explaining the recommendation",
  "ic_memo_headline": "Short punchy one-line IC memo title",
  "ic_memo_thesis_fit_summary": "3-4 sentences on how the company matches or misses the fund thesis",
  "ic_memo_key_strengths": ["strength 1", "strength 2", "strength 3"],
  "ic_memo_key_risks": ["risk 1", "risk 2", "risk 3"],
  "ic_memo_suggested_next_step": "One concrete next action",
  "ic_memo_diligence_plan": "2-3 sentence diligence plan",
  "ic_memo_full_text": "Full IC memo, 250-350 words, in professional VC memo style. Include: headline, thesis fit score, executive summary, key investment thesis, risks, recommendation, and next steps. Do not use markdown headers — write as flowing paragraphs."
}}

Important:
- Be specific and evidence-grounded. If evidence is missing, say so explicitly.
- Confidence scores should reflect evidence quality, not optimism.
- Include at least 3-5 diligence questions and at least 2-4 red flags.
- All values must be strings or numbers — no null values.
- Return ONLY the JSON object, no other text."""


async def _call_gemini(
    prompt: str,
    api_key: str,
    model: str = "",
    log: Optional["ProviderLog"] = None,
) -> Optional[Dict]:
    # flash-lite first — flash gets 503/429 under load (confirmed in logs)
    model = model or settings.gemini_synthesis_model
    if log:
        log.record("gemini", "report_synthesis", "calling", f"model={model}")
    return await call_gemini_json(
        api_key, model,
        system=SYNTHESIS_SYSTEM,
        user=prompt,
        use_grounding=False,
        max_output_tokens=8192,
        temperature=0.3,
        log=log,
        log_provider="gemini",
        log_action="report_synthesis",
        fallback_models=[],  # no fallback to 2.0-flash (429) or flash (503)
        max_retries=2,
    )


async def _call_hf_synthesis(
    prompt: str,
    log: Optional["ProviderLog"] = None,
) -> Optional[Dict]:
    llm = get_llm()
    if not llm.is_configured:
        if log:
            log.record("huggingface", "report_synthesis", "skipped", "HUGGINGFACE_API_KEY not set")
        return None
    if log:
        log.record("huggingface", "report_synthesis", "calling", f"model={llm.model} (primary LLMs unavailable)")
    return await llm.chat_json(SYNTHESIS_SYSTEM, prompt, log=log, action="report_synthesis")


# ─── Fallback deterministic generator ────────────────────────────────────────

def _recommendation_from_score(score: int, confidence: float) -> str:
    if confidence < 0.3:
        return "investigate"
    if score >= 70:
        return "strong_invest"
    if score >= 50:
        return "investigate"
    if score >= 30:
        return "monitor"
    return "pass"


def _generate_deterministic(
    company_name: str,
    evidence: EvidenceLayer,
    confidence: EvidenceConfidence,
    thesis_match: ThesisMatch,
    profile: InvestorProfileSnapshot,
    user_context: Optional[str],
    synthesis_note: str = "",
) -> Dict:
    rec = _recommendation_from_score(thesis_match.thesis_fit_score, confidence.overall)
    score = thesis_match.thesis_fit_score

    founders_text = (
        f"Founders identified: {', '.join(f.name + ' (' + f.role + ')' for f in evidence.founders)}."
        if evidence.founders
        else f"Founder information for {company_name} was not found in public sources. Direct outreach or LinkedIn research is recommended."
    )

    moat_signals_text = ", ".join(
        f"{m.dimension} ({m.strength})" for m in evidence.moat_signals if m.strength != "none"
    ) or "No clear moat signals detected from public data"

    red_flags = []
    for r in evidence.risk_signals:
        red_flags.append({
            "severity": r.severity,
            "category": r.category,
            "explanation": r.description,
            "supporting_evidence": r.evidence,
            "confidence": r.confidence,
        })
    if not red_flags:
        red_flags = [{
            "severity": "low",
            "category": "data_gap",
            "explanation": "Limited public data makes full due diligence impossible at this stage.",
            "supporting_evidence": "Fallback report — no AI synthesis available.",
            "confidence": 0.8,
        }]

    diligence_qs = [
        {"question": "What is the current ARR or revenue run rate?", "category": "financials", "priority": "high", "why_important": "Essential for stage and valuation assessment."},
        {"question": "Who are the founders and what is their prior track record?", "category": "founders", "priority": "high", "why_important": "Founder quality is the primary signal at early stage."},
        {"question": "Who are your top 3 direct competitors and how do you differentiate?", "category": "competition", "priority": "high", "why_important": "Validates market positioning and defensibility."},
        {"question": "What is your go-to-market motion and primary customer acquisition channel?", "category": "business_model", "priority": "medium", "why_important": "GTM efficiency determines capital efficiency."},
        {"question": "What is the current headcount and planned use of funds?", "category": "financials", "priority": "medium", "why_important": "Validates burn rate and growth plan."},
    ]

    moat_dict = {}
    for m in evidence.moat_signals:
        moat_dict[m.dimension] = {"strength": m.strength, "evidence": m.evidence, "confidence": m.confidence}

    def _moat_entry(dim: str) -> Dict:
        entry = moat_dict.get(dim, {})
        return {
            "strength": entry.get("strength", "none"),
            "evidence": entry.get("evidence", "No evidence found"),
            "confidence": entry.get("confidence", 0.0),
        }

    moat_score = sum(
        {"none": 0, "weak": 15, "moderate": 40, "strong": 70}.get(m.strength, 0)
        for m in evidence.moat_signals
    ) // max(1, len(evidence.moat_signals))

    full_memo = (
        f"{company_name} — IC Memo\n\n"
        f"Thesis Fit Score: {score}/100\n\n"
        f"{company_name} is building in {evidence.market or 'an emerging market'}. "
        f"{evidence.company_overview[:300]}\n\n"
        f"Fund thesis alignment: {thesis_match.thesis_fit_score}/100. "
        f"Key fit signals: {'; '.join(thesis_match.key_fit_reasons[:2]) or 'Not determined'}. "
        f"Key gaps: {'; '.join(thesis_match.key_misfit_reasons[:2]) or 'None identified'}.\n\n"
        f"Founders: {founders_text}\n\n"
        f"Moat signals: {moat_signals_text}.\n\n"
        f"Recommendation: {rec.replace('_', ' ').title()}. "
        f"{'This company warrants deeper diligence given thesis alignment.' if rec in ('strong_invest', 'investigate') else 'Monitor for future rounds or thesis evolution.'}"
    )

    return {
        "executive_summary": (
            f"{company_name} is building in {evidence.market or 'an identified market vertical'}. "
            f"Thesis fit score: {score}/100 with {confidence.overall:.0%} evidence confidence. "
            f"Key signal: {thesis_match.key_fit_reasons[0] if thesis_match.key_fit_reasons else 'Insufficient data for strong signal'}. "
            f"Recommendation: {rec.replace('_', ' ').title()}."
        ),
        "company_overview": (
            f"{evidence.one_liner + '. ' if evidence.one_liner else ''}"
            f"{evidence.company_overview[:500]}"
            + (f" Founded {evidence.founding_year}." if evidence.founding_year else "")
            + (f" HQ: {evidence.headquarters}." if evidence.headquarters else "")
            + (f" ~{evidence.employee_count_estimate} employees." if evidence.employee_count_estimate else "")
        ).strip() or f"Public information for {company_name} is limited.",
        "founder_assessment": founders_text,
        "market_analysis": f"Operating in: {evidence.market or 'market TBD'}. {evidence.market_size_estimate or 'Market size not determined from public sources.'}",
        "competitor_landscape": f"Competitors identified: {', '.join(c.name for c in evidence.competitors) or 'None detected from public sources'}.",
        "business_model": f"Model: {evidence.business_model}. Monetization: {evidence.monetization}. Target: {evidence.target_customer}.",
        "funding_and_investors": (
            f"Stage: {evidence.funding_stage or 'Unknown'}. "
            f"Total raised: {evidence.total_funding_known or 'Unknown'}. "
            f"Investors: {', '.join(evidence.investors_known) or 'None found'}."
        ),
        "growth_and_hiring": f"Growth signals: {', '.join(evidence.growth_signals) or 'None detected'}. Hiring: {', '.join(evidence.hiring_signals) or 'No active hiring signals'}.",
        "news_and_sentiment": f"News: {evidence.news_headlines[0] if evidence.news_headlines else 'No recent news found'}. Sentiment: {evidence.sentiment_summary}.",
        "opportunities": "• Potential thesis fit if stage and sector are confirmed.\n• Early-mover signals in identified market.\n• Warrants direct founder conversation.",
        "moat_analysis": {
            "network_effects": _moat_entry("network_effects"),
            "data_moat": _moat_entry("data_moat"),
            "distribution": _moat_entry("distribution"),
            "switching_costs": _moat_entry("switching_costs"),
            "brand": _moat_entry("brand"),
            "technical_depth": _moat_entry("technical_depth"),
            "regulatory": _moat_entry("regulatory"),
            "partnerships": _moat_entry("partnerships"),
            "overall_moat_score": moat_score,
            "moat_summary": f"Moat analysis based on public signals. {moat_signals_text}. Stronger assessment requires direct management conversation.",
        },
        "red_flags": red_flags,
        "diligence_questions": diligence_qs,
        "recommendation": rec,
        "recommendation_rationale": (
            f"Based on available public data with {confidence.overall:.0%} confidence. "
            f"Thesis fit score of {score}/100 suggests a '{rec.replace('_', ' ')}' stance. "
            f"{synthesis_note}"
        ).strip(),
        "ic_memo_headline": f"{company_name} — {rec.replace('_', ' ').title()} ({score}/100 thesis fit)",
        "ic_memo_thesis_fit_summary": (
            f"Thesis fit score: {score}/100. "
            f"Sector: {thesis_match.sector_alignment.label}. "
            f"Stage: {thesis_match.stage_alignment.label}. "
            f"Geography: {thesis_match.geography_alignment.label}. "
            f"Business model: {thesis_match.business_model_alignment.label}."
        ),
        "ic_memo_key_strengths": thesis_match.key_fit_reasons[:3] or ["Early-stage thesis potential", "Public footprint detected", "Website accessible"],
        "ic_memo_key_risks": [r["explanation"] for r in red_flags[:3]] or ["Data gap — founder unknown", "Stage unconfirmed", "Business model unclear"],
        "ic_memo_suggested_next_step": "Schedule introductory call with founders to validate thesis fit.",
        "ic_memo_diligence_plan": "Conduct founder interviews, request financials and cap table, validate customer references.",
        "ic_memo_full_text": full_memo,
    }


# ─── Main entry point ─────────────────────────────────────────────────────────

async def synthesize_report(
    company_name: str,
    website_url: str,
    evidence: EvidenceLayer,
    confidence: EvidenceConfidence,
    thesis_match: ThesisMatch,
    profile: InvestorProfileSnapshot,
    gemini_api_key: str = "",
    gemini_model: str = "",
    user_context: Optional[str] = None,
    log: Optional["ProviderLog"] = None,
) -> Dict:
    """
    Generate all report sections.
    Priority: Gemini → HuggingFace → deterministic templates.
    """
    prompt = _build_synthesis_prompt(
        company_name, website_url, evidence, confidence,
        thesis_match, profile, user_context,
    )
    result = None
    synthesis_via = "deterministic"

    if gemini_api_key:
        result = await _call_gemini(prompt, gemini_api_key, gemini_model, log=log)
        if result:
            synthesis_via = "gemini"

    if not result:
        result = await _call_hf_synthesis(prompt, log=log)
        if result:
            synthesis_via = "huggingface"

    if not result:
        note = "Template-based report (LLM synthesis unavailable — check provider log)."
        result = _generate_deterministic(
            company_name, evidence, confidence, thesis_match, profile, user_context,
            synthesis_note=note,
        )
        if log:
            log.record("deterministic", "report_synthesis", "ok", "Using template fallback")

    if log:
        log.record("pipeline", "report_synthesis_final", "ok", f"via={synthesis_via}")

    return result


# ─── Converters from synthesis dict → model objects ───────────────────────────

def dict_to_moat_analysis(d: Dict, evidence: EvidenceLayer) -> MoatAnalysis:
    def _signal(dim: str) -> MoatSignal:
        entry = d.get(dim, {})
        return MoatSignal(
            dimension=dim,
            strength=entry.get("strength", "none"),
            evidence=entry.get("evidence", "No evidence"),
            confidence=entry.get("confidence", 0.0),
        )

    return MoatAnalysis(
        network_effects=_signal("network_effects"),
        data_moat=_signal("data_moat"),
        distribution=_signal("distribution"),
        switching_costs=_signal("switching_costs"),
        brand=_signal("brand"),
        technical_depth=_signal("technical_depth"),
        regulatory=_signal("regulatory"),
        partnerships=_signal("partnerships"),
        overall_moat_score=d.get("overall_moat_score", 0),
        moat_summary=d.get("moat_summary", ""),
    )


def dict_to_red_flags(flags: List[Dict]) -> List[RedFlag]:
    result = []
    for f in flags:
        try:
            result.append(RedFlag(
                severity=f.get("severity", "medium"),
                category=f.get("category", "unknown"),
                explanation=f.get("explanation", ""),
                supporting_evidence=f.get("supporting_evidence", ""),
                confidence=float(f.get("confidence", 0.5)),
            ))
        except Exception:
            continue
    return result


def dict_to_diligence_questions(qs: List[Dict]) -> List[DiligenceQuestion]:
    result = []
    for q in qs:
        try:
            result.append(DiligenceQuestion(
                question=q.get("question", ""),
                category=q.get("category", "general"),
                priority=q.get("priority", "medium"),
                why_important=q.get("why_important", ""),
            ))
        except Exception:
            continue
    return result


def dict_to_ic_memo(d: Dict) -> ICMemo:
    return ICMemo(
        headline=d.get("ic_memo_headline", ""),
        recommendation=d.get("recommendation", "investigate"),
        recommendation_rationale=d.get("recommendation_rationale", ""),
        thesis_fit_summary=d.get("ic_memo_thesis_fit_summary", ""),
        key_strengths=d.get("ic_memo_key_strengths", []),
        key_risks=d.get("ic_memo_key_risks", []),
        suggested_next_step=d.get("ic_memo_suggested_next_step", ""),
        diligence_plan=d.get("ic_memo_diligence_plan", ""),
        full_memo_text=d.get("ic_memo_full_text", ""),
    )


def dict_to_report_section(d: Dict) -> ReportSection:
    return ReportSection(
        executive_summary=d.get("executive_summary", ""),
        company_overview=d.get("company_overview", ""),
        founder_assessment=d.get("founder_assessment", ""),
        market_analysis=d.get("market_analysis", ""),
        competitor_landscape=d.get("competitor_landscape", ""),
        business_model=d.get("business_model", ""),
        funding_and_investors=d.get("funding_and_investors", ""),
        growth_and_hiring=d.get("growth_and_hiring", ""),
        news_and_sentiment=d.get("news_and_sentiment", ""),
        opportunities=d.get("opportunities", ""),
    )
