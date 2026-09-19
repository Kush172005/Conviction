"""
RAG answer generation: retrieve chunks for a company, then answer the question
with the same 3-tier fallback every other AI feature uses — Gemini -> HuggingFace
-> deterministic heuristic — so the chat never hard-fails.
"""
import logging
from typing import Any, Dict, List

from app.config import settings
from app.services.llm.gemini_client import call_gemini_json
from app.services.llm.provider import get_llm
from app.services.rag.retrieval import retrieve_chunks

logger = logging.getLogger("rag.chat")

CHAT_SYSTEM = """\
You are a venture capital analyst assistant. You answer questions about a specific \
portfolio/prospect company using only the excerpts provided below — call transcripts, \
notes, and prior investment analysis. Never invent facts that aren't in the excerpts.

If the excerpts don't contain enough information to answer, say so plainly instead \
of guessing.

Return ONLY valid JSON: {"answer": "<your answer>", "used_chunk_indices": [<ints>]} \
where used_chunk_indices lists which of the numbered excerpts you actually drew on.\
"""


def _build_prompt(company_name: str, question: str, chunks: List[dict]) -> str:
    excerpts = "\n\n".join(
        f"[{i}] ({c.get('source_type')}) {c.get('text')}" for i, c in enumerate(chunks)
    )
    return f"""\
Company: {company_name}

Excerpts:
---
{excerpts or "(no excerpts found for this company yet)"}
---

Question: {question}
"""


def _heuristic_answer(chunks: List[dict], question: str) -> str:
    if not chunks:
        return (
            "I don't have any indexed call notes or analysis for this company yet, "
            "so I can't answer that. Try processing a call first."
        )
    top = chunks[0]
    return (
        f"AI providers are unavailable right now, so here's the most relevant excerpt "
        f"I found (from {top.get('source_type', 'a record')}):\n\n{top.get('text', '')}"
    )


async def answer_question(
    db, *, user_id: str, company_id: str, company_name: str, question: str
) -> Dict[str, Any]:
    chunks = await retrieve_chunks(db, user_id=user_id, company_id=company_id, query=question)
    print(chunks);
    prompt = _build_prompt(company_name, question, chunks)

    result = None
    if settings.gemini_api_key:
        result = await call_gemini_json(
            settings.gemini_api_key,
            settings.gemini_synthesis_model,
            system=CHAT_SYSTEM,
            user=prompt,
            max_output_tokens=2048,
            temperature=0.2,
        )

    if not result:
        llm = get_llm()
        if llm.is_configured:
            result = await llm.chat_json(CHAT_SYSTEM, prompt)

    used_indices: List[int]
    if result and result.get("answer"):
        answer = str(result["answer"])
        used_indices = [i for i in result.get("used_chunk_indices", []) if isinstance(i, int)]
    else:
        answer = _heuristic_answer(chunks, question)
        used_indices = [0] if chunks else []

    citations = [
        {
            "source_type": chunks[i].get("source_type"),
            "source_id": chunks[i].get("source_id"),
            "snippet": (chunks[i].get("text") or "")[:280],
        }
        for i in used_indices
        if 0 <= i < len(chunks)
    ]

    return {"answer": answer, "citations": citations}
