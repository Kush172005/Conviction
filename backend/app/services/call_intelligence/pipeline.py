"""
Call intelligence pipeline.
Orchestrates LLM extraction of structured deal intelligence from post-call notes/transcript.

Provider priority:
  1. Gemini (gemini-2.5-flash-lite) — reliable JSON synthesis
  2. Hugging Face (Qwen2.5-7B-Instruct) — open-source fallback
  3. Deterministic heuristics — never fails, always returns a usable result
"""
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from app.services.call_intelligence.prompts import (
    CALL_INTELLIGENCE_SYSTEM,
    build_call_intelligence_prompt,
)
from app.services.llm.gemini_client import call_gemini_json
from app.services.llm.provider import get_llm
from app.services.startup_intelligence.provider_log import ProviderLog

logger = logging.getLogger("call_intelligence.pipeline")


async def generate_call_intelligence(
    company_name: str,
    text: str,
    input_mode: str = "text",
    thesis: Optional[str] = None,
    fund_name: Optional[str] = None,
    investor_name: Optional[str] = None,
    gemini_api_key: str = "",
    gemini_synthesis_model: str = "gemini-2.5-flash-lite",
    log: Optional[ProviderLog] = None,
) -> Dict[str, Any]:
    """
    Generate structured VC deal intelligence from raw call text.
    Returns a normalized dict ready to be persisted to the decisions collection.
    """
    if log is None:
        log = ProviderLog()

    if not text or not text.strip():
        log.record("pipeline", "call_intelligence", "error", "Empty input text")
        return _normalize({}, company_name)

    prompt = build_call_intelligence_prompt(
        company_name=company_name,
        text=text,
        thesis=thesis,
        fund_name=fund_name,
        investor_name=investor_name,
    )

    result: Optional[Dict[str, Any]] = None

    # ── 1. Gemini ──────────────────────────────────────────────────────────────
    if gemini_api_key:
        result = await call_gemini_json(
            gemini_api_key,
            gemini_synthesis_model,
            system=CALL_INTELLIGENCE_SYSTEM,
            user=prompt,
            use_grounding=False,
            max_output_tokens=8192,
            temperature=0.2,
            log=log,
            log_provider="gemini",
            log_action="call_intelligence",
            max_retries=2,
        )
        if result:
            logger.info("Call intelligence extracted via Gemini (%s)", gemini_synthesis_model)

    # ── 2. Hugging Face fallback ────────────────────────────────────────────────
    if not result:
        llm = get_llm()
        if llm.is_configured:
            result = await llm.chat_json(
                CALL_INTELLIGENCE_SYSTEM,
                prompt,
                log=log,
                action="call_intelligence",
            )
            if result:
                logger.info("Call intelligence extracted via HuggingFace (%s)", llm.model)

    # ── 3. Deterministic fallback ───────────────────────────────────────────────
    if not result:
        log.record("deterministic", "call_intelligence", "ok", "Using heuristic fallback")
        result = _heuristic_result(company_name, text, thesis)
        logger.warning("Call intelligence using deterministic fallback for %s", company_name)

    return _normalize(result, company_name)


# ────────────────────────────────────────────────────────────────────────────────
# Normalization helpers
# ────────────────────────────────────────────────────────────────────────────────

def _str(raw: Dict[str, Any], key: str, default: str = "") -> str:
    val = raw.get(key)
    if val and str(val).strip():
        return str(val).strip()
    return default


def _list(raw: Dict[str, Any], key: str) -> List[str]:
    val = raw.get(key)
    if isinstance(val, list):
        return [str(v).strip() for v in val if v and str(v).strip()]
    return []


def _normalize(raw: Dict[str, Any], company_name: str) -> Dict[str, Any]:
    valid_recs = {"strong_invest", "invest", "monitor", "pass", "need_more_info"}
    recommendation = _str(raw, "recommendation", "need_more_info")
    if recommendation not in valid_recs:
        recommendation = "need_more_info"

    try:
        confidence = max(0, min(100, int(raw.get("confidence", 45))))
    except (TypeError, ValueError):
        confidence = 45

    # Follow-up actions — list of {action, priority, due_in_days}
    raw_actions = raw.get("follow_up_actions") or []
    follow_up_actions: List[Dict[str, Any]] = []
    if isinstance(raw_actions, list):
        for a in raw_actions:
            if not isinstance(a, dict):
                continue
            action_text = str(a.get("action") or "").strip()
            if not action_text:
                continue
            priority = a.get("priority", "medium")
            if priority not in ("high", "medium", "low"):
                priority = "medium"
            try:
                due_days = max(1, min(90, int(a.get("due_in_days", 7))))
            except (TypeError, ValueError):
                due_days = 7
            follow_up_actions.append(
                {"action": action_text, "priority": priority, "due_in_days": due_days}
            )

    # Key metrics
    key_metrics = raw.get("key_metrics") or {}
    if not isinstance(key_metrics, dict):
        key_metrics = {}
    # Keep only string-valued entries
    key_metrics = {
        k: str(v) for k, v in key_metrics.items() if v and str(v).strip()
    }

    # Suggested follow-up date
    try:
        days = max(1, min(90, int(raw.get("suggested_follow_up_date_days", 14))))
    except (TypeError, ValueError):
        days = 14
    suggested_follow_up_date = datetime.utcnow() + timedelta(days=days)

    return {
        "recommendation": recommendation,
        "confidence": confidence,
        "rationale": _str(
            raw, "rationale",
            f"Based on this call with {company_name}. Further diligence recommended to build conviction."
        ),
        "deal_summary": _str(
            raw, "deal_summary",
            f"Call notes captured for {company_name}. Process again for complete analysis."
        ),
        "founder_assessment": _str(
            raw, "founder_assessment",
            "Founder details not sufficiently captured in notes for a full assessment."
        ),
        "business_overview": _str(
            raw, "business_overview",
            "Business details require additional documentation."
        ),
        "market_assessment": _str(
            raw, "market_assessment",
            "Market analysis requires additional research beyond current notes."
        ),
        "thesis_fit": _str(
            raw, "thesis_fit",
            "Thesis alignment analysis pending — add your investment thesis in Settings for better output."
        ),
        "strengths": _list(raw, "strengths") or ["Early-stage signals observed — see full notes"],
        "concerns": _list(raw, "concerns") or ["Insufficient data for complete risk assessment"],
        "opportunities": _list(raw, "opportunities"),
        "risks": _list(raw, "risks"),
        "open_questions": _list(raw, "open_questions"),
        "key_metrics": key_metrics,
        "follow_up_actions": follow_up_actions,
        "suggested_follow_up_date": suggested_follow_up_date,
        "draft_email": _str(raw, "draft_email", _default_email(recommendation)),
    }


def _heuristic_result(
    company_name: str,
    text: str,
    thesis: Optional[str],
) -> Dict[str, Any]:
    """Keyword-based heuristic when all LLM providers fail."""
    lower = text.lower()

    positive = sum([
        any(w in lower for w in ["impressive", "exceptional", "love", "strong"]),
        any(w in lower for w in ["traction", "revenue", "arr", "mrr"]),
        any(w in lower for w in ["pilot", "customer", "enterprise", "f500"]),
        "recommend" in lower,
    ])
    negative = sum([
        any(w in lower for w in ["concern", "risk", "worried"]),
        any(w in lower for w in ["competition", "competitor", "hyperscaler"]),
        "pass" in lower,
        "unclear" in lower,
    ])

    if "pass" in lower:
        recommendation, confidence = "pass", 70
    elif positive >= 3 and negative <= 1:
        recommendation, confidence = "invest", min(82, 65 + positive * 4)
    elif positive >= 2:
        recommendation, confidence = "monitor", min(72, 50 + positive * 5)
    else:
        recommendation, confidence = "need_more_info", 45

    return {
        "recommendation": recommendation,
        "confidence": confidence,
        "rationale": (
            f"Heuristic analysis of call notes with {company_name}. "
            f"Detected {positive} positive and {negative} cautionary signals. "
            "Connect an AI provider for richer analysis."
        ),
        "deal_summary": f"Call notes captured for {company_name}. AI providers unavailable — connect Gemini or HuggingFace for full extraction.",
        "founder_assessment": "AI analysis unavailable — add provider keys for founder assessment.",
        "business_overview": f"{company_name} opportunity identified from call. Full business profile pending AI analysis.",
        "market_assessment": "Market analysis unavailable without AI providers.",
        "thesis_fit": thesis or "No thesis configured. Add your investment thesis in Settings.",
        "strengths": ["Positive signals detected in notes — see raw content"],
        "concerns": ["Risk factors detected — AI analysis needed for specifics"],
        "opportunities": [],
        "risks": [],
        "open_questions": ["What is the team background?", "What is the current ARR/traction?", "Who are the key competitors?"],
        "key_metrics": {},
        "follow_up_actions": [{"action": "Schedule follow-up call to gather more information", "priority": "medium", "due_in_days": 7}],
        "suggested_follow_up_date_days": 14,
        "draft_email": _default_email(recommendation),
    }


def _default_email(recommendation: str) -> str:
    templates = {
        "strong_invest": (
            "Hi [Founder Name],\n\n"
            "Really energizing call — I left with strong conviction about what you're building.\n\n"
            "I'd love to move quickly. Can we get IC prep scheduled this week? "
            "It would help to have a quick look at your unit economics and a cap table summary before then.\n\n"
            "Looking forward to it,\n[Your Name]"
        ),
        "invest": (
            "Hi [Founder Name],\n\n"
            "Great call today — the opportunity resonates strongly with our thesis.\n\n"
            "Would love to continue the conversation. "
            "Can we find 45 minutes next week to go deeper on the go-to-market motion and competitive landscape?\n\n"
            "I'd also love to share some portfolio founder introductions that might be useful for you.\n\n"
            "Best,\n[Your Name]"
        ),
        "monitor": (
            "Hi [Founder Name],\n\n"
            "Really appreciate the time today — fascinating problem space.\n\n"
            "I'd love to stay close as things develop. "
            "Please keep me updated on key milestones — happy to be a sounding board in the interim.\n\n"
            "Best,\n[Your Name]"
        ),
        "pass": (
            "Hi [Founder Name],\n\n"
            "Thank you for the thoughtful conversation today.\n\n"
            "After careful reflection, the opportunity isn't the right fit for our current portfolio focus. "
            "This is not a reflection on the quality of what you're building.\n\n"
            "I'd encourage you to keep us posted as things progress — context changes quickly.\n\n"
            "Wishing you the best,\n[Your Name]"
        ),
        "need_more_info": (
            "Hi [Founder Name],\n\n"
            "Great to connect today. The opportunity is interesting and I'd love to understand it better.\n\n"
            "Could you share some materials before our next conversation — "
            "specifically around traction metrics, competitive positioning, and use of funds?\n\n"
            "Looking forward to continuing,\n[Your Name]"
        ),
    }
    return templates.get(recommendation, templates["need_more_info"])
