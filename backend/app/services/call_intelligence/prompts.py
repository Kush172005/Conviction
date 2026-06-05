"""
VC-grade prompts for call intelligence extraction.
Designed to produce IC-ready structured output from raw post-call notes.
"""
from typing import Optional

CALL_INTELLIGENCE_SYSTEM = """\
You are an elite venture capital associate at a top-tier fund with deep expertise in early-stage investing.
A VC partner has shared their raw, unstructured post-call notes from a founder meeting.

Your task: Transform these messy notes into world-class, IC-ready structured deal intelligence.

Critical rules:
1. ONLY extract facts explicitly stated or clearly implied. NEVER invent data.
2. When information is missing, use professional language: "Not discussed", "Unclear from notes", etc.
3. Be specific — cite exact numbers, quotes, and details from the notes.
4. Write as if presenting at a demanding Investment Committee meeting.
5. The draft email must be personalized using specific details from the call.
6. Return ONLY valid JSON. No markdown fences, no commentary, no preamble.\
"""


def build_call_intelligence_prompt(
    company_name: str,
    text: str,
    thesis: Optional[str] = None,
    fund_name: Optional[str] = None,
    investor_name: Optional[str] = None,
) -> str:
    meta_lines = [f"Company: {company_name}"]
    if fund_name:
        meta_lines.append(f"Fund: {fund_name}")
    if investor_name:
        meta_lines.append(f"Investor/Partner: {investor_name}")
    if thesis:
        meta_lines.append(f"Fund Investment Thesis: {thesis}")

    meta = "\n".join(meta_lines)
    truncated_text = text[:10000] if len(text) > 10000 else text

    return f"""\
{meta}

Raw Post-Call Notes / Transcript:
---
{truncated_text}
---

Extract structured deal intelligence from these notes. Return ONLY this JSON object:
{{
  "recommendation": "strong_invest" | "invest" | "monitor" | "pass" | "need_more_info",
  "confidence": <integer 0-100, your confidence given available evidence>,
  "rationale": "<2-3 sentences. Specific, evidence-backed rationale. Cite exactly what in the notes drives this.>",
  "deal_summary": "<3-4 sentence executive overview: what they build, who they serve, stage, single best traction signal, single biggest risk.>",
  "founder_assessment": "<Founder credentials, domain expertise, execution signals, interpersonal dynamic if observed. If limited info in notes, state that explicitly.>",
  "business_overview": "<Product description, business model, pricing model, customer profile, traction metrics. Use exact numbers from notes where available.>",
  "market_assessment": "<Market size, growth dynamics, timing, regulatory tailwinds/headwinds. Evidence-backed. Cite sources in notes.>",
  "thesis_fit": "<Map this opportunity against the fund thesis. Concrete alignment or misalignment for each thesis dimension: sector, stage, geography, business model, check size.>",
  "strengths": [
    "<specific strength backed by evidence from notes>",
    "<specific strength backed by evidence from notes>"
  ],
  "concerns": [
    "<specific concern with supporting evidence>",
    "<specific concern with supporting evidence>"
  ],
  "opportunities": [
    "<value-add or upside angle worth exploring>",
    "<market or strategic opportunity>"
  ],
  "risks": [
    "<key risk factor>",
    "<key risk factor>"
  ],
  "open_questions": [
    "<critical question that must be answered before making an investment decision>",
    "<critical question>"
  ],
  "key_metrics": {{
    "arr_or_revenue": "<dollar figure or 'Not mentioned'>",
    "growth_rate": "<MoM/YoY rate or 'Not mentioned'>",
    "customers": "<count or named customers or 'Not mentioned'>",
    "team_size": "<headcount or 'Not mentioned'>",
    "runway": "<months of runway or 'Not mentioned'>",
    "valuation": "<current round valuation/terms or 'Not mentioned'>"
  }},
  "follow_up_actions": [
    {{"action": "<specific, actionable next step with clear owner>", "priority": "high" | "medium" | "low", "due_in_days": <integer>}},
    {{"action": "<next step>", "priority": "high" | "medium" | "low", "due_in_days": <integer>}}
  ],
  "suggested_follow_up_date_days": <integer, recommended days from today for next touchpoint>,
  "draft_email": "<Complete, personalized follow-up email to the founder. Reference specific things discussed. Professional but warm VC voice. 150-250 words. Include clear next step or ask.>"
}}\
"""
