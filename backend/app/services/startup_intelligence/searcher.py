"""
Public web search via Tavily.
ALWAYS runs founder+funding query. Optional second news query.
Never skips based on website content — external data is always needed.
"""
from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

import httpx

from app.models.startup_intelligence import ResearchSource

if TYPE_CHECKING:
    from app.services.startup_intelligence.provider_log import ProviderLog


async def _tavily_search(query: str, api_key: str, max_results: int = 5) -> List[dict]:
    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.tavily.com/search",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "query": query,
                    "search_depth": "basic",
                    "max_results": max_results,
                    "include_answer": False,
                    "include_domains": [],
                },
            )
            if resp.status_code != 200:
                return []
            return resp.json().get("results", [])
    except Exception:
        return []


def _result_to_source(result: dict, source_type: str = "search_result") -> ResearchSource:
    url = result.get("url", "")
    domain = url.split("/")[2] if url.count("/") >= 2 else url
    domain = domain.replace("www.", "")
    quality = min(0.88, 0.45 + result.get("score", 0.5) * 0.5)
    return ResearchSource(
        url=url,
        title=result.get("title", domain),
        domain=domain,
        snippet=result.get("content", "")[:600],
        extracted_summary=result.get("content", "")[:3000],
        source_type=source_type,
        source_quality_score=quality,
        fetched_at=datetime.utcnow(),
    )


def _classify_source_type(domain: str) -> str:
    if "crunchbase" in domain:
        return "crunchbase"
    if "linkedin" in domain:
        return "linkedin_public"
    if "ycombinator" in domain or "ycdb" in domain:
        return "news"
    if any(x in domain for x in ["techcrunch", "venturebeat", "forbes", "bloomberg",
                                   "wired", "businessinsider", "sifted", "eu-startups"]):
        return "news"
    return "search_result"


async def search_company(
    company_name: str,
    website_url: str,
    tavily_api_key: str = "",
    max_queries: int = 3,
    website_sources: Optional[List[ResearchSource]] = None,
    log: "ProviderLog | None" = None,
) -> List[ResearchSource]:
    """
    Always runs: (1) founder+funding+crunchbase query
    Optionally: (2) recent news, (3) product+competitors
    NEVER skips based on website content size.
    External sources (Crunchbase, YC, news) are always valuable.
    """
    if not tavily_api_key:
        if log:
            log.record("tavily", "search", "skipped", "TAVILY_API_KEY not set")
        return []

    # Query 1: founder + funding (always runs — this is what website never has)
    # Query 2: recent news + YC/product launches
    # Query 3: competitors + market (optional)
    queries = [
        f'"{company_name}" startup founders CEO CTO crunchbase funding investors site:crunchbase.com OR site:ycombinator.com OR site:linkedin.com',
        f'"{company_name}" startup funding round raised news 2024 2025',
        f'"{company_name}" startup competitors alternative product launch',
    ][:max(2, min(max_queries, 3))]

    sources: List[ResearchSource] = []
    seen_urls: set = set()

    for i, query in enumerate(queries):
        if log:
            log.record("tavily", f"query_{i+1}", "calling", query[:100])
        results = await _tavily_search(query, tavily_api_key, max_results=5)
        if log:
            log.record(
                "tavily", f"query_{i+1}",
                "ok" if results else "empty",
                f"results={len(results)} | {query[:60]}",
            )
        for r in results:
            url = r.get("url", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)
            domain = url.split("/")[2] if url.count("/") >= 2 else url
            stype = _classify_source_type(domain.replace("www.", ""))
            sources.append(_result_to_source(r, stype))

    final = sources[:15]
    if log:
        log.record(
            "tavily", "search_complete",
            "ok" if final else "empty",
            f"total_sources={len(final)} queries={len(queries)}",
        )
    return final
