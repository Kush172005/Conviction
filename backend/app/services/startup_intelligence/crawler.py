"""
Website crawler with 3-tier provider hierarchy:
1. Jina Reader (r.jina.ai) — free, no key, handles JS-rendered sites
2. Firecrawl — optional paid, 1 credit max (homepage only if Jina fails)
3. httpx + BeautifulSoup — always-available raw fallback

High-signal pages: homepage, /about, /team
"""
import re
from datetime import datetime
from typing import TYPE_CHECKING, Dict, List, Optional
from urllib.parse import urlparse

import httpx

from app.models.startup_intelligence import ResearchSource

if TYPE_CHECKING:
    from app.services.startup_intelligence.provider_log import ProviderLog

try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# Pages that reliably contain founder + product info
CRAWL_PATHS = ["", "/about", "/team"]
JINA_BASE = "https://r.jina.ai/"


async def _jina_fetch(url: str) -> Optional[Dict]:
    """
    Jina Reader: converts any URL → clean markdown. Free, no key.
    Handles React/Next.js SPA sites that httpx can't parse.
    """
    try:
        async with httpx.AsyncClient(
            timeout=20,
            follow_redirects=True,
            headers={"Accept": "text/plain", "X-Return-Format": "markdown"},
        ) as client:
            resp = await client.get(f"{JINA_BASE}{url}")
            if resp.status_code != 200 or not resp.text:
                return None
            text = resp.text.strip()
            if len(text) < 50:
                return None
            # Extract title from markdown
            title_match = re.search(r"^Title:\s*(.+)$", text, re.MULTILINE)
            title = title_match.group(1).strip() if title_match else ""
            # Extract description (often in first few lines)
            desc_match = re.search(r"^(?:Description|Markdown Content):\s*(.+)$", text, re.MULTILINE)
            desc = desc_match.group(1).strip()[:300] if desc_match else ""
            return {"title": title, "description": desc, "full_text": text[:7000]}
    except Exception:
        return None


def _extract_text_from_html(html: str) -> Dict:
    if not BS4_AVAILABLE:
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text).strip()
        return {"full_text": text[:5000], "title": "", "description": ""}

    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
        tag.decompose()

    title = soup.title.get_text(strip=True) if soup.title else ""
    description = ""
    for attr in [("name", "description"), ("property", "og:description"), ("name", "twitter:description")]:
        meta = soup.find("meta", attrs={attr[0]: attr[1]})
        if meta and meta.get("content"):
            description = meta["content"]
            break

    sections = []
    for tag in soup.find_all(["h1", "h2", "h3", "p", "li"]):
        text = tag.get_text(strip=True)
        if len(text) > 20:
            sections.append(text)

    return {"title": title, "description": description, "full_text": " ".join(sections)[:6000]}


async def _httpx_fetch(url: str) -> Optional[Dict]:
    try:
        async with httpx.AsyncClient(
            headers=HEADERS, follow_redirects=True, timeout=15,
        ) as client:
            resp = await client.get(url)
            if resp.status_code >= 400:
                return None
            if "html" not in resp.headers.get("content-type", ""):
                return None
            return _extract_text_from_html(resp.text)
    except Exception:
        return None


async def _firecrawl_fetch(url: str, api_key: str) -> Optional[Dict]:
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://api.firecrawl.dev/v1/scrape",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={"url": url, "formats": ["markdown"], "onlyMainContent": True},
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            if not data.get("success"):
                return None
            fc = data.get("data", {})
            return {
                "title": fc.get("metadata", {}).get("title", ""),
                "description": fc.get("metadata", {}).get("description", ""),
                "full_text": fc.get("markdown", "")[:7000],
            }
    except Exception:
        return None


def _build_source(url: str, domain: str, parsed: Dict, via: str = "jina") -> ResearchSource:
    title = parsed.get("title") or domain
    desc = parsed.get("description") or ""
    text = parsed.get("full_text") or ""
    # Quality: Jina > Firecrawl > httpx
    quality = {"jina": 0.92, "firecrawl": 0.88, "httpx": 0.80}.get(via, 0.80)
    return ResearchSource(
        url=url,
        title=title,
        domain=domain,
        snippet=desc or text[:350],
        extracted_summary=text[:3000],
        source_type="website",
        source_quality_score=quality,
        fetched_at=datetime.utcnow(),
    )


async def crawl_company_website(
    website_url: str,
    firecrawl_api_key: str = "",
    firecrawl_fallback_only: bool = True,
    log: "ProviderLog | None" = None,
) -> List[ResearchSource]:
    """
    Crawl company website: Jina Reader → httpx+BS4 → Firecrawl (last resort).
    """
    parsed_url = urlparse(website_url)
    domain = parsed_url.netloc.replace("www.", "")
    base = f"{parsed_url.scheme}://{parsed_url.netloc}"
    sources: List[ResearchSource] = []

    for path in CRAWL_PATHS:
        url = base + path if path else website_url

        # Tier 1: Jina Reader (free, best for SPAs)
        parsed = await _jina_fetch(url)
        via = "jina"

        # Tier 2: httpx + BS4
        if not parsed or len(parsed.get("full_text", "")) < 200:
            parsed = await _httpx_fetch(url)
            via = "httpx"

        if parsed and (parsed.get("full_text") or parsed.get("description")):
            sources.append(_build_source(url, domain, parsed, via))
            if log:
                log.record(
                    via, f"crawl{path or '/'}",
                    "ok", f"chars={len(parsed.get('full_text',''))}",
                )

    # Tier 3: Firecrawl homepage — only if both Jina + httpx failed entirely
    if not sources and firecrawl_api_key:
        if log:
            log.record("firecrawl", "crawl/", "calling", "Jina+httpx both failed")
        parsed = await _firecrawl_fetch(website_url, firecrawl_api_key)
        if parsed and (parsed.get("full_text") or parsed.get("description")):
            sources.append(_build_source(website_url, domain, parsed, "firecrawl"))
            if log:
                log.record("firecrawl", "crawl/", "ok", f"chars={len(parsed.get('full_text',''))}")
        elif log:
            log.record("firecrawl", "crawl/", "error", "No content returned")

    if log:
        total_chars = sum(len(s.extracted_summary) for s in sources)
        log.record("crawler", "complete", "ok" if sources else "empty",
                   f"pages={len(sources)} total_chars={total_chars}")

    return sources
