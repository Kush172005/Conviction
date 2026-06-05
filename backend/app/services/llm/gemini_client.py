"""
Shared Gemini API client — retries, JSON parsing, model fallbacks.

Working models (verified via logs):
  - gemini-2.5-flash       → Google Search grounding (compact JSON, no JSON mode)
  - gemini-2.5-flash-lite  → report synthesis + corpus extraction
Removed (always fail):
  - gemini-2.0-flash / gemini-2.0-flash-lite → 429 quota exceeded
"""
import asyncio
from typing import Any, Dict, List, Optional, TYPE_CHECKING

import httpx

from app.services.llm.provider import parse_json_from_llm

if TYPE_CHECKING:
    from app.services.startup_intelligence.provider_log import ProviderLog

GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
RETRYABLE_STATUS = {429, 500, 502, 503, 504}

# Only models confirmed working on this API key
SYNTHESIS_FALLBACK = "gemini-2.5-flash-lite"


def extract_gemini_text(data: Dict[str, Any]) -> str:
    """Extract text from Gemini response, including multi-part grounded responses."""
    for candidate in data.get("candidates") or []:
        parts = candidate.get("content", {}).get("parts") or []
        chunks = [p["text"] for p in parts if p.get("text")]
        if chunks:
            return "".join(chunks).strip()
    return ""


def _finish_reason(data: Dict[str, Any]) -> str:
    candidates = data.get("candidates") or []
    if candidates:
        return candidates[0].get("finishReason", "unknown")
    return "no_candidates"


async def _post_gemini(
    api_key: str,
    model: str,
    payload: Dict[str, Any],
) -> tuple[int, Dict[str, Any], str]:
    async with httpx.AsyncClient(timeout=90) as client:
        resp = await client.post(
            f"{GEMINI_BASE}/{model}:generateContent?key={api_key}",
            json=payload,
        )
        preview = resp.text[:500]
        try:
            body = resp.json()
        except Exception:
            body = {}
        return resp.status_code, body, preview


async def call_gemini_json(
    api_key: str,
    model: str,
    *,
    system: str = "",
    user: str,
    use_grounding: bool = False,
    max_output_tokens: int = 4096,
    temperature: float = 0.2,
    log: Optional["ProviderLog"] = None,
    log_provider: str = "gemini",
    log_action: str = "call",
    fallback_models: Optional[List[str]] = None,
    max_retries: int = 2,
) -> Optional[Dict[str, Any]]:
    """
    Call Gemini and return parsed JSON dict.
    Grounding: never uses JSON mode (API rejects it); single model, 1 retry max.
    Synthesis: JSON mode; falls back to gemini-2.5-flash-lite on failure.
    """
    if not api_key:
        if log:
            log.record(log_provider, log_action, "skipped", "GEMINI_API_KEY not set")
        return None

    if use_grounding:
        # Grounding only works reliably on primary model with compact prompts
        models_to_try = [model]
        max_retries = 1
    else:
        fallbacks = fallback_models if fallback_models is not None else (
            [SYNTHESIS_FALLBACK] if model != SYNTHESIS_FALLBACK else []
        )
        models_to_try = [model] + [m for m in fallbacks if m != model]

    for attempt_model in models_to_try:
        for attempt in range(max_retries):
            if log and attempt_model != model and attempt == 0:
                log.record(log_provider, log_action, "fallback", f"model={attempt_model}")
            elif log and attempt > 0:
                log.record(log_provider, log_action, "retry",
                           f"attempt={attempt + 1} model={attempt_model}")

            gen_config: Dict[str, Any] = {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
            }
            # Grounding rejects responseMimeType — skip it entirely
            if not use_grounding:
                gen_config["responseMimeType"] = "application/json"

            payload: Dict[str, Any] = {
                "contents": [{"parts": [{"text": user}]}],
                "generationConfig": gen_config,
            }
            if system:
                payload["system_instruction"] = {"parts": [{"text": system}]}
            if use_grounding:
                payload["tools"] = [{"google_search": {}}]

            try:
                status, body, preview = await _post_gemini(api_key, attempt_model, payload)

                if status in RETRYABLE_STATUS:
                    if log:
                        log.record(log_provider, log_action, "error",
                                   f"HTTP {status} model={attempt_model}", preview)
                    if attempt < max_retries - 1:
                        await asyncio.sleep(2.0 * (attempt + 1))
                        continue
                    break

                if status != 200:
                    if log:
                        log.record(log_provider, log_action, "error",
                                   f"HTTP {status} model={attempt_model}", preview)
                    break

                raw = extract_gemini_text(body)
                if not raw:
                    reason = _finish_reason(body)
                    if log:
                        log.record(log_provider, log_action, "error",
                                   f"Empty response finishReason={reason}")
                    break

                parsed = parse_json_from_llm(raw)
                if parsed:
                    if log:
                        log.record(log_provider, log_action, "ok",
                                   f"model={attempt_model} keys={list(parsed.keys())[:8]}",
                                   raw[:250])
                    return parsed

                if log:
                    log.record(log_provider, log_action, "error", "JSON parse failed", raw[:300])
                if attempt < max_retries - 1:
                    await asyncio.sleep(1.0)
                    continue
                break

            except Exception as exc:
                if log:
                    log.record(log_provider, log_action, "error", str(exc))
                if attempt < max_retries - 1:
                    await asyncio.sleep(1.5 * (attempt + 1))
                    continue
                break

    return None
