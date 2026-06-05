"""
Speech-to-text service for voice call uploads.

Provider chain:
  1. Hugging Face Inference API — openai/whisper-large-v3-turbo (free, open-source)
  2. Gemini multimodal fallback — gemini-2.5-flash inline audio (uses existing key)
"""
import asyncio
import base64
import logging
from typing import TYPE_CHECKING, Optional

import httpx

if TYPE_CHECKING:
    from app.services.startup_intelligence.provider_log import ProviderLog

logger = logging.getLogger("call_intelligence.stt")

# HF deprecated api-inference.huggingface.co — use the router hf-inference path instead.
HF_WHISPER_URL = (
    "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo"
)
GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


async def transcribe_audio(
    audio_bytes: bytes,
    mime_type: str = "audio/webm",
    hf_api_key: str = "",
    gemini_api_key: str = "",
    gemini_model: str = "gemini-2.5-flash",
    log: Optional["ProviderLog"] = None,
) -> Optional[str]:
    """
    Transcribe audio → plain text.
    Tries HF Whisper first, falls back to Gemini multimodal.
    Returns None if all providers fail.
    """
    if hf_api_key:
        text = await _hf_whisper(audio_bytes, mime_type, hf_api_key, log)
        if text:
            return text

    if gemini_api_key:
        text = await _gemini_transcribe(
            audio_bytes, mime_type, gemini_api_key, gemini_model, log
        )
        if text:
            return text

    if log:
        log.record("stt", "transcribe", "error", "All STT providers failed or unconfigured")
    logger.error("All STT providers failed for audio of %d bytes", len(audio_bytes))
    return None


async def _hf_whisper(
    audio_bytes: bytes,
    mime_type: str,
    api_key: str,
    log: Optional["ProviderLog"] = None,
) -> Optional[str]:
    if log:
        log.record(
            "stt_hf_whisper",
            "transcribe",
            "calling",
            f"model=whisper-large-v3-turbo size={len(audio_bytes)}b",
        )
    try:
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                HF_WHISPER_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": mime_type,
                },
                content=audio_bytes,
            )
        if resp.status_code == 503:
            # Model loading — short wait and retry once
            if log:
                log.record("stt_hf_whisper", "transcribe", "retry", "Model loading, waiting…")
            await asyncio.sleep(20)
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(
                    HF_WHISPER_URL,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": mime_type,
                    },
                    content=audio_bytes,
                )

        if resp.status_code != 200:
            if log:
                log.record(
                    "stt_hf_whisper", "transcribe", "error",
                    f"HTTP {resp.status_code}", resp.text[:300],
                )
            return None

        data = resp.json()
        text = (data.get("text") or "").strip()
        if not text:
            if log:
                log.record("stt_hf_whisper", "transcribe", "error", "Empty transcript returned")
            return None

        if log:
            log.record(
                "stt_hf_whisper", "transcribe", "ok",
                f"chars={len(text)}", text[:120],
            )
        return text

    except Exception as exc:
        if log:
            log.record("stt_hf_whisper", "transcribe", "error", str(exc))
        logger.exception("HF Whisper transcription failed")
        return None


async def _gemini_transcribe(
    audio_bytes: bytes,
    mime_type: str,
    api_key: str,
    model: str,
    log: Optional["ProviderLog"] = None,
) -> Optional[str]:
    # Gemini inline_data has a ~20 MB limit — fine for typical call recordings
    if len(audio_bytes) > 19_000_000:
        if log:
            log.record("stt_gemini", "transcribe", "skipped", "Audio too large for inline Gemini")
        return None

    if log:
        log.record(
            "stt_gemini", "transcribe", "calling",
            f"model={model} size={len(audio_bytes)}b",
        )
    try:
        audio_b64 = base64.b64encode(audio_bytes).decode()
        payload = {
            "contents": [
                {
                    "parts": [
                        {"inline_data": {"mime_type": mime_type, "data": audio_b64}},
                        {
                            "text": (
                                "Transcribe this audio recording verbatim. "
                                "Return ONLY the spoken words exactly as spoken. "
                                "Do not add headers, timestamps, speaker labels, "
                                "or any formatting. Just the raw transcript."
                            )
                        },
                    ]
                }
            ],
            "generationConfig": {"temperature": 0, "maxOutputTokens": 8192},
        }

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                f"{GEMINI_BASE}/{model}:generateContent?key={api_key}",
                json=payload,
            )

        if resp.status_code != 200:
            if log:
                log.record(
                    "stt_gemini", "transcribe", "error",
                    f"HTTP {resp.status_code}", resp.text[:300],
                )
            return None

        data = resp.json()
        parts = (
            data.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [])
        )
        text = "".join(p.get("text", "") for p in parts if p.get("text")).strip()

        if not text:
            if log:
                log.record("stt_gemini", "transcribe", "error", "Empty transcript from Gemini")
            return None

        if log:
            log.record(
                "stt_gemini", "transcribe", "ok",
                f"chars={len(text)}", text[:120],
            )
        return text

    except Exception as exc:
        if log:
            log.record("stt_gemini", "transcribe", "error", str(exc))
        logger.exception("Gemini transcription failed")
        return None
