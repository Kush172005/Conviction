"""Reusable LLM prompts — import into any feature."""
from typing import Optional

COMPANY_EXTRACTION_SYSTEM = """You are a venture capital research analyst. Extract factual company intelligence from the provided source text.

Rules:
- Only state facts supported by the source text. If unknown, use null or empty arrays.
- Do not invent founders, funding rounds, or investors.
- Prefer recent funding information when multiple rounds are mentioned.
- Return ONLY valid JSON matching the schema exactly. No markdown, no commentary."""

COMPANY_EXTRACTION_USER_TEMPLATE = """Company: {company_name}
Website: {website_url}
{user_context_block}

SOURCE TEXT (from website crawl and public search):
---
{source_corpus}
---

Extract a JSON object with this exact schema:
{{
  "company_overview": "2-3 sentences: what the company does, who they serve, core product",
  "one_liner": "single sentence elevator pitch",
  "founding_year": "YYYY or null",
  "headquarters": "city, country or null",
  "employee_count_estimate": "e.g. 50+ or null",
  "founders": [
    {{"name": "Full Name", "role": "CEO/CTO/Co-founder", "background_summary": "1 sentence prior experience if known"}}
  ],
  "business_model": "e.g. B2B SaaS subscription",
  "monetization": "how they make money",
  "target_customer": "e.g. Enterprise, SMB, Consumer",
  "market": "primary sector/industry vertical",
  "market_size_estimate": "TAM/SAM if mentioned or null",
  "competitors": [
    {{"name": "Competitor", "differentiator": "how this company differs", "relative_positioning": "leader/challenger/niche"}}
  ],
  "funding_stage": "pre-seed|seed|series-a|series-b|series-c|growth or null",
  "total_funding_known": "e.g. $12M or null",
  "last_funding_round": {{"amount": "$XM", "date": "YYYY or YYYY-MM", "lead_investor": "name or null", "stage": "seed/series-a/etc"}},
  "investors_known": ["investor names"],
  "hiring_signals": ["signal phrases if hiring actively"],
  "growth_signals": ["traction/growth signals"],
  "news_headlines": ["recent news headline summaries"],
  "recent_developments": "1-2 sentences on latest news, launches, or partnerships"
}}"""


def build_company_extraction_prompt(
    company_name: str,
    website_url: str,
    source_corpus: str,
    user_context: Optional[str] = None,
) -> str:
    ctx_block = f"Investor context: {user_context}" if user_context else ""
    return COMPANY_EXTRACTION_USER_TEMPLATE.format(
        company_name=company_name,
        website_url=website_url,
        user_context_block=ctx_block,
        source_corpus=source_corpus[:12000],
    )
