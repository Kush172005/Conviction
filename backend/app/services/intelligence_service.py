"""
Placeholder intelligence service.
Produces deterministic, structured deal intelligence from raw notes.
Phase 2 will replace this with Claude / Whisper integration.
"""
from datetime import datetime, timedelta
from typing import Optional


PLACEHOLDER_STRENGTHS = [
    "Strong founder-market fit — team has direct experience with the core problem",
    "Early revenue traction suggests genuine product-market pull",
    "Clear technical differentiation with defensible implementation",
    "Existing enterprise relationships reduce go-to-market risk",
    "Regulatory or structural tailwinds accelerating adoption",
]

PLACEHOLDER_CONCERNS = [
    "Competitive landscape includes well-funded incumbents and hyperscaler risk",
    "Pricing model not yet validated at scale",
    "Team may need to add enterprise sales capacity",
    "Product scope risk — current solution may need to expand to stay ahead",
    "Fundraising timeline creates execution pressure",
]


def generate_placeholder_intelligence(
    company_name: str,
    raw_notes: str,
    thesis: Optional[str] = None,
) -> dict:
    """
    Deterministic placeholder intelligence generation.
    Parses raw notes for key signals and returns structured output.
    All logic here will be replaced with LLM calls in Phase 2.
    """
    notes_lower = raw_notes.lower()

    # Heuristic recommendation
    positive_signals = sum([
        "impressive" in notes_lower,
        "strong" in notes_lower,
        "traction" in notes_lower,
        "revenue" in notes_lower,
        "pilot" in notes_lower,
        "love" in notes_lower,
        "exceptional" in notes_lower,
    ])
    negative_signals = sum([
        "concern" in notes_lower,
        "risk" in notes_lower,
        "competition" in notes_lower,
        "pass" in notes_lower,
        "unclear" in notes_lower,
        "weak" in notes_lower,
    ])

    if "pass" in notes_lower:
        recommendation = "pass"
        confidence = 70
    elif positive_signals >= 3 and negative_signals <= 1:
        recommendation = "invest"
        confidence = 72 + positive_signals * 2
    elif positive_signals >= 2:
        recommendation = "monitor"
        confidence = 55 + positive_signals * 3
    else:
        recommendation = "need_more_info"
        confidence = 45

    confidence = min(95, confidence)

    # Extract a basic deal summary
    first_100_words = " ".join(raw_notes.split()[:100])

    follow_up_date = datetime.utcnow() + timedelta(days=14)

    return {
        "recommendation": recommendation,
        "confidence": confidence,
        "rationale": f"Based on the notes from this call with {company_name}, the key signals suggest a {recommendation.replace('_', ' ')} stance. This assessment reflects the balance of positive traction signals and concerns identified in the raw notes.",
        "thesis_fit": thesis or "Assessment pending full thesis alignment analysis. Connect your investment thesis in Settings to improve this output.",
        "strengths": _extract_strengths(notes_lower),
        "concerns": _extract_concerns(notes_lower),
        "deal_summary": f"This call with {company_name} covered: {first_100_words}…",
        "founder_assessment": "Founder assessment pending — add structured notes about the team for AI to analyse.",
        "business_overview": f"{company_name} is building in a space the investor has identified through this call. Full business profile will be built as more calls are logged.",
        "market_assessment": "Market analysis will improve as more context is captured across calls.",
        "suggested_follow_up_date": follow_up_date,
        "draft_email": _generate_draft_email(company_name, recommendation),
    }


def _extract_strengths(notes: str) -> list[str]:
    found = []
    if any(w in notes for w in ["founder", "team", "background", "ex-"]):
        found.append("Strong team credentials based on notes")
    if any(w in notes for w in ["revenue", "arr", "mrr", "customers", "traction"]):
        found.append("Revenue or traction signals present")
    if any(w in notes for w in ["pilot", "enterprise", "f500", "contract"]):
        found.append("Enterprise validation evidence")
    if not found:
        found = PLACEHOLDER_STRENGTHS[:3]
    return found


def _extract_concerns(notes: str) -> list[str]:
    found = []
    if any(w in notes for w in ["competition", "competitor", "aws", "microsoft", "google"]):
        found.append("Competitive pressure from incumbents or hyperscalers")
    if any(w in notes for w in ["pricing", "price", "monetisation", "model"]):
        found.append("Pricing model requires further validation")
    if any(w in notes for w in ["gtm", "sales", "go-to-market", "acquisition"]):
        found.append("Go-to-market strategy needs clarity")
    if not found:
        found = PLACEHOLDER_CONCERNS[:2]
    return found


def _generate_draft_email(company_name: str, recommendation: str) -> str:
    if recommendation in ("invest", "strong_invest"):
        return f"""Hi [Founder Name],

Really energising call today. Your story around [key insight from call] landed well.

We'd like to continue the conversation. Can we set up time next week to go deeper on [specific area]?

I'd also love to make a few introductions from our network that might be useful for [specific need].

Looking forward to it,
[Your Name]"""
    elif recommendation == "pass":
        return f"""Hi [Founder Name],

Thank you for the time today — it was a thoughtful conversation.

After reflection, [company_name] isn't the right fit for us right now given [reason]. This isn't a reflection of the quality of what you're building.

I'd be happy to keep in touch as things progress. Please do reach back out if the context changes.

Best,
[Your Name]"""
    else:
        return f"""Hi [Founder Name],

Great to connect today. I'd love to learn more about [specific aspect].

Would you be able to share [specific data or material]? That would help me get a clearer picture before we go further.

Thanks,
[Your Name]"""
