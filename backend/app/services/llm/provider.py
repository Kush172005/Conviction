"""
Reusable Hugging Face Inference API client (OpenAI-compatible router).
Use across Startup Intelligence and future features via get_llm().
"""
import json
import logging
import re
from typing import Any, Dict, List, Optional, TYPE_CHECKING

import httpx

from app.config import settings

if TYPE_CHECKING:
    from app.services.startup_intelligence.provider_log import ProviderLog

HF_CHAT_URL = "https://router.huggingface.co/v1/chat/completions"
logger = logging.getLogger("startup_intelligence.providers")


class HuggingFaceLLM:
    """Open-source LLM via Hugging Face Inference Router."""

    def __init__(
        self,
        api_key: str = "",
        model: str = "",
        max_tokens: int = 2048,
        timeout: int = 90,
    ):
        raw_key = api_key or settings.huggingface_api_key
        self.api_key = raw_key.strip().strip('"').strip("'") if raw_key else ""
        self.model = model or settings.huggingface_model
        self.max_tokens = max_tokens or settings.huggingface_max_tokens
        self.timeout = timeout

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.model)

    async def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.1,
        max_tokens: Optional[int] = None,
        log: Optional["ProviderLog"] = None,
        action: str = "chat",
    ) -> Optional[str]:
        if not self.is_configured:
            if log:
                log.record("huggingface", action, "skipped", "HUGGINGFACE_API_KEY not set")
            return None
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(
                    HF_CHAT_URL,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "max_tokens": max_tokens or self.max_tokens,
                        "temperature": temperature,
                    },
                )
                body_preview = resp.text[:400]
                if resp.status_code != 200:
                    if log:
                        log.record(
                            "huggingface", action, "error",
                            f"HTTP {resp.status_code} model={self.model}",
                            body_preview,
                        )
                    return None
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                if log:
                    log.record(
                        "huggingface", action, "ok",
                        f"model={data.get('model', self.model)} tokens≈{len(content)}",
                        content[:200],
                    )
                return content
        except Exception as exc:
            if log:
                log.record("huggingface", action, "error", str(exc))
            logger.exception("HuggingFace call failed")
            return None

    async def chat_json(
        self,
        system: str,
        user: str,
        temperature: float = 0.1,
        log: Optional["ProviderLog"] = None,
        action: str = "extract_json",
    ) -> Optional[Dict[str, Any]]:
        text = await self.chat(
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
            log=log,
            action=action,
        )
        if not text:
            return None
        parsed = parse_json_from_llm(text)
        if not parsed and log:
            log.record("huggingface", action, "error", "Failed to parse JSON from response", text[:300])
        elif parsed and log:
            log.record("huggingface", action, "parsed", f"keys={list(parsed.keys())[:8]}")
        return parsed


def parse_json_from_llm(text: str) -> Optional[Dict[str, Any]]:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        return None


def get_llm() -> HuggingFaceLLM:
    return HuggingFaceLLM()
