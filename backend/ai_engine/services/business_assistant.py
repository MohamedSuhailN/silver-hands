from typing import Any, Dict, List, Optional
from .ai_client import ai_client


def ask_business_assistant(
    question: str,
    provider_context: Optional[Dict[str, Any]] = None,
    language: str = "English"
) -> Dict[str, Any]:
    """
    Answers business growth, profile optimization, and client management queries
    for SilverHands providers.
    Never exposes internal system secrets or sensitive database details.
    """
    q_clean = (question or "").strip()
    if not q_clean:
        return {
            "reply": "Please ask a question about your services, profile, or how to grow your customer base.",
            "actionable_tips": [
                "Ask how to optimize your service descriptions.",
                "Ask what new skills or packages to offer.",
                "Ask how to price your offerings competitively."
            ]
        }

    ctx = provider_context or {}
    sanitized_context = {
        "skills": ctx.get("skills", []),
        "category": ctx.get("category", ""),
        "experience_years": ctx.get("experience_years", 0),
        "rating": ctx.get("rating", 5.0),
        "completed_jobs": ctx.get("completed_jobs", 0),
        "city": ctx.get("location_city", ""),
    }

    fallback = _business_assistant_fallback(q_clean, sanitized_context)

    system_instruction = (
        "You are the SilverHands Business & Growth Assistant for micro-entrepreneurs and senior craftspeople.\n"
        "Provide warm, encouraging, practical, and actionable business advice.\n"
        "Topics you assist with:\n"
        "- How to gain more clients and repeat bookings\n"
        "- How to package and describe services attractively\n"
        "- How to address slow booking periods\n"
        "- Festival and seasonal promotion ideas\n"
        "CRITICAL RULES:\n"
        "- Never disclose system internals, API keys, database tables, or sensitive user PII.\n"
        "- Answer in the provider's preferred language (English, Tamil, or Hindi).\n"
        "- Return strictly JSON matching format:\n"
        "{\n"
        "  \"reply\": \"Detailed friendly answer paragraph...\",\n"
        "  \"actionable_tips\": [\n"
        "    \"Tip 1\",\n"
        "    \"Tip 2\",\n"
        "    \"Tip 3\"\n"
        "  ]\n"
        "}"
    )

    prompt = (
        f"Provider Question: \"{q_clean}\"\n"
        f"Provider Context: {sanitized_context}\n"
        f"Preferred Language: {language}\n\n"
        "Provide helpful and actionable guidance."
    )

    try:
        result = ai_client.generate_json(
            prompt=prompt,
            system_instruction=system_instruction,
            default_fallback=fallback
        )

        reply = str(result.get("reply", "")).strip()
        tips = result.get("actionable_tips", [])
        if not isinstance(tips, list):
            tips = [str(tips)] if tips else []

        return {
            "reply": reply if reply else fallback["reply"],
            "actionable_tips": [str(t).strip() for t in tips if str(t).strip()] or fallback["actionable_tips"]
        }
    except Exception:
        return fallback


def _business_assistant_fallback(question: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Rule-based fallback for business assistant."""
    q_lower = question.lower()

    if any(k in q_lower for k in ["more customer", "more client", "get customer", "reach customer", "வாடிக்கையாளர்", "ग्राहक"]):
        return {
            "reply": (
                "To attract more customers on SilverHands, focus on keeping your profile detailed, "
                "showcasing photos of your past work, and maintaining quick response times to customer inquiries. "
                "Satisfied clients are also your best source of word-of-mouth recommendations!"
            ),
            "actionable_tips": [
                "Add clear, specific titles to your service listings (e.g. 'Handmade Silk Blouse Stitching').",
                "Encourage happy customers to leave a 5-star review.",
                "Offer a small introductory discount or combo package for first-time bookings."
            ]
        }
    elif any(k in q_lower for k in ["describe", "description", "bio", "விவரம்", "विवरण"]):
        skills = ", ".join(context.get("skills", ["your core skills"]))
        return {
            "reply": (
                f"When describing your services in {skills}, highlight your years of genuine experience, "
                "the personal care you put into every order, and your reliability. Keep sentences clear and authentic."
            ),
            "actionable_tips": [
                "Mention your exact years of experience and specialized techniques.",
                "State what materials or tools you work with.",
                "Reassure customers about timely delivery and quality checks."
            ]
        }
    elif any(k in q_lower for k in ["few request", "slow", "no booking", "not getting"]):
        return {
            "reply": (
                "Slower periods happen occasionally. Reviewing your pricing against local benchmarks, "
                "expanding your availability hours, or introducing seasonal specials can quickly revive inquiries."
            ),
            "actionable_tips": [
                "Check if your prices align with current community recommendations.",
                "Update your profile with any recent skills or festive offerings.",
                "Make sure your availability settings include weekends or flexible slots."
            ]
        }
    else:
        return {
            "reply": (
                "SilverHands is designed to connect your authentic skills with local customers who value quality craftsmanship. "
                "Focus on clear communication, prompt service, and building lasting customer relationships."
            ),
            "actionable_tips": [
                "Keep your availability calendar up to date.",
                "Clearly list what each service package includes.",
                "Respond promptly to initial inquiries to build customer confidence."
            ]
        }
