import re
from typing import Any, Dict, List
from .ai_client import ai_client, AIServiceException


def extract_skills_from_text(text: str) -> Dict[str, Any]:
    """
    Extracts professional skills, years of experience, and potential marketable services
    from freeform text in English, Tamil, or Hindi using the live AI model.
    """
    cleaned_text = (text or "").strip()
    if not cleaned_text:
        return {
            "skills": [],
            "experience_years": 0,
            "potential_services": []
        }

    system_instruction = (
        "You are the SilverHands Skill Extraction Engine. Analyze the user's professional background.\n"
        "Input may be in English, Tamil (தமிழ்), or Hindi (हिंदी).\n"
        "Extract:\n"
        "1. 'skills': list of concise practical skill titles (e.g. ['Tailoring', 'Embroidery', 'Blouse Designing'])\n"
        "2. 'experience_years': numeric years of experience mentioned in text (integer or float). If not mentioned, return 0.\n"
        "3. 'potential_services': list of realistic service offerings they can sell (e.g. ['Custom Blouse Stitching', 'Garment Alterations'])\n"
        "4. 'name': the person's explicitly stated name, or an empty string\n"
        "5. 'age': explicitly stated numeric age, or null; never infer it from other facts\n"
        "6. 'location': explicitly stated locality/address, or an empty string\n"
        "7. 'email': explicitly stated email address only, or an empty string\n"
        "8. 'username': explicitly stated username only, or an empty string\n"
        "CRITICAL RULES:\n"
        "- Do NOT invent unmentioned name, age, location, experience, or capabilities.\n"
        "- Never infer email or username from a name, phone number, or other field.\n"
        "- Respond in valid JSON matching keys: 'skills', 'experience_years', 'potential_services', 'name', 'age', 'location', 'email', 'username'."
    )

    prompt = f"Extract skills, experience, and potential services from this profile text:\n\n\"{cleaned_text}\""

    fallback = _extract_skills_rule_based(cleaned_text)

    # Call AI Client
    result = ai_client.generate_json(
        prompt=prompt,
        system_instruction=system_instruction,
        default_fallback=fallback
    )
    
    # Process structured AI result
    skills = result.get("skills", [])
    if not isinstance(skills, list):
        skills = [str(skills)] if skills else []

    experience = result.get("experience_years", 0)
    try:
        experience = float(experience) if experience is not None else 0
        if experience.is_integer():
            experience = int(experience)
    except (ValueError, TypeError):
        experience = 0

    potential_services = result.get("potential_services", [])
    if not isinstance(potential_services, list):
        potential_services = [str(potential_services)] if potential_services else []

    name = result.get("name", "")
    if not isinstance(name, str):
        name = ""
    location = result.get("location", "")
    if not isinstance(location, str):
        location = ""
    age = result.get("age")
    try:
        age = int(age) if age is not None and str(age).strip() else None
    except (ValueError, TypeError):
        age = None
    # Account identifiers must come from explicit transcript phrases, never AI inference.
    email = _extract_explicit_email(cleaned_text)
    username = _extract_explicit_username(cleaned_text)

    email = _extract_explicit_email(text)
    return {
        "skills": [str(s).strip() for s in skills if str(s).strip()],
        "experience_years": experience,
        "potential_services": [str(s).strip() for s in potential_services if str(s).strip()],
        "name": name.strip(),
        "age": age,
        "location": location.strip(),
        "email": email.strip(),
        "username": username.strip()
    }


def _extract_skills_rule_based(text: str) -> Dict[str, Any]:
    """Offline rule-based fallback when no API key is provided."""
    lower = text.lower()
    
    years = 0
    match = re.search(r'(\d+)\s*(?:years?|yrs?|வருட[^\s]*|வருஷ[^\s]*|ஆண்டுக[^\s]*|साल[^\s]*|वर्ष[^\s]*)(?!s?\s+old)', lower)
    if match:
        try:
            years = int(match.group(1))
        except ValueError:
            years = 0

    skills = []
    services = []

    keywords = [
        (["stitch", "tailor", "sewing", "தையல்", "துணி", "सिलाई", "दर्जी", "blouse", "saree"], "Tailoring & Blouse Stitching", "Custom Blouse & Dress Stitching"),
        (["cook", "baking", "catering", "snacks", "தின்பண்ட", "சமையல்", "உணவு", "खाना", "रसोई"], "Traditional Cooking & Catering", "Homemade Snacks & Catering"),
        (["teach", "tutor", "math", "english", "tamil", "science", "பாடம்", "ஆசிரியர்", "ट्यूशन", "गणित", "पढ़ाना"], "Academic Tutoring", "One-on-One Tutoring"),
        (["clean", "housekeeping", "maid", "வீட்டு வேலை", "சுத்தம்", "सफाई"], "Housekeeping", "Residential Cleaning"),
        (["plumb", "pipe", "குழாய்", "प्लम्बर"], "Plumbing", "Plumbing Repair"),
        (["electr", "wiring", "fan", "மின்சாரம்", "बिजली"], "Electrical Work", "Electrical Maintenance"),
        (["carpenter", "wood", "மரவேலை", "बढ़ई"], "Carpentry", "Furniture Repair"),
    ]

    for patterns, skill_name, service_name in keywords:
        if any(p in lower for p in patterns):
            skills.append(skill_name)
            services.append(service_name)

    name_match = re.search(r"(?:my name is|i am|i'm)\s+([A-Za-z][A-Za-z .'-]{1,60}?)(?:\.|,|\s+and\s+|\s+I\s+|$)", text, re.IGNORECASE)
    age_match = re.search(r"(?:i am|i'm)\s+(\d{1,3})\s+years?\s+old", text, re.IGNORECASE)
    location_match = re.search(r"(?:i live in|living in|from)\s+([^.,]+(?:,\s*[^.,]+)?)", text, re.IGNORECASE)
    email = _extract_explicit_email(text)

    return {
        "skills": list(dict.fromkeys(skills)),
        "experience_years": years,
        "potential_services": list(dict.fromkeys(services)),
        "name": name_match.group(1).strip() if name_match else "",
        "age": int(age_match.group(1)) if age_match else None,
        "location": location_match.group(1).strip() if location_match else "",
        "email": email,
        "username": _extract_explicit_username(text)
    }


def _extract_explicit_email(text: str) -> str:
    """Extract an explicitly supplied email, including common spoken forms."""
    direct_match = re.search(
        r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
        text,
        re.IGNORECASE,
    )
    if direct_match:
        return direct_match.group(0).lower()

    label_match = re.search(r"\bemail(?:\s+address)?\s*(?:is|:)\s*", text, re.IGNORECASE)
    if not label_match:
        return ""

    candidate = re.split(
        r"\s+(?:and\s+)?(?:my\s+)?username\b|[!?]",
        text[label_match.end():],
        maxsplit=1,
        flags=re.IGNORECASE,
    )[0].strip(" .,;")
    candidate = re.sub(r"\s+at\s+", "@", candidate, flags=re.IGNORECASE)
    candidate = re.sub(r"\s+dot\s+", ".", candidate, flags=re.IGNORECASE)
    candidate = re.sub(r"\s+", "", candidate)
    return candidate.lower() if re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", candidate) else ""


def _extract_explicit_username(text: str) -> str:
    match = re.search(
        r"\b(?:my\s+)?(?:preferred\s+)?username\s*(?:is|:)\s*([A-Za-z0-9][A-Za-z0-9_.-]*)",
        text,
        re.IGNORECASE,
    )
    return match.group(1).strip().rstrip('.,') if match else ""
