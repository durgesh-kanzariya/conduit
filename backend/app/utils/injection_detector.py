import re
from typing import Optional
from app.schemas.triage import TriageDecision

# Patterns for prompt injection / instruction override detection
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?previous\s+instructions",
    r"you\s+are\s+now\s+in\s+admin\s+mode",
    r"set\s+priority\s*=",
    r"system\s+command\s+override",
    r"\[\[\s*SYSTEM\s*\]\]",
    r"<<<\s*.*?\s*>>>",
    r"override\s+(all\s+)?rules",
    r"disregard\s+(all\s+)?(previous|above)",
    r"new\s+instructions?\s*:",
    r"act\s+as\s+(a\s+)?",
    r"pretend\s+you\s+are",
    r"do\s+not\s+classify",
    r"forget\s+(all\s+)?(previous|your)",
]

_compiled_patterns = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

def detect_injection(cleaned_text: str) -> bool:
    """
    Checks CLEANED text for actual prompt injection / override commands.
    Random punctuation, garbage, or noise characters are NOT injection.
    Only returns True for real override attempts.
    """
    if not cleaned_text or cleaned_text == "UNCLASSIFIABLE_INPUT":
        return False
    for pattern in _compiled_patterns:
        if pattern.search(cleaned_text):
            print(f"[STATUS] Injection Detector: Pattern matched — {pattern.pattern}")
            return True
    return False

def get_injection_response() -> TriageDecision:
    """
    Returns a pre-built TriageDecision for confirmed injection attempts.
    """
    return TriageDecision(
        category="security_flag",
        priority="P3",
        summary="Message contains prompt injection attempt. Classified by pre-detection layer.",
        suggested_action="Flag for security review. Do not process automatically.",
        needs_human=True,
        confidence=0.95,
        tier_used="groq_deep"
    )
