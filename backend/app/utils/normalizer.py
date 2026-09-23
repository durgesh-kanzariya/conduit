import time
from typing import Any

from app.utils.extractor import extract_all_strings, sanitize_html
from app.utils.injection_detector import detect_injection, get_injection_response
from app.utils.format_parser import (
    extract_from_bytes,
    extract_from_json,
    extract_from_html,
    extract_from_csv
)

__all__ = ["normalize_input", "detect_injection", "get_injection_response"]

def normalize_input(raw: Any) -> str:
    """
    Accepts ANY input format and returns a clean plain text string.
    Never crashes. Wraps every case safely.
    
    Order of operations:
    1. Empty/null input -> "UNCLASSIFIABLE_INPUT"
    2. Bytes / PDF -> text extraction
    3. Dict / List collection -> string extraction
    4. Valid JSON string -> parse & extract
    5. HTML string -> tag stripping
    6. CSV string -> longest field
    7. Plain text / primitive -> trimmed string
    8. Length validation (< 3 meaningful chars) -> "UNCLASSIFIABLE_INPUT"
    9. Final sanitization pass -> sanitize_html()
    """
    overall_start = time.perf_counter()
    
    # 1. Empty / null check
    if raw is None:
        return "UNCLASSIFIABLE_INPUT"
    if isinstance(raw, str) and not raw.strip():
        return "UNCLASSIFIABLE_INPUT"
    if isinstance(raw, (dict, list)) and not raw:
        return "UNCLASSIFIABLE_INPUT"

    result = ""
    matched = False

    # 2. Bytes / PDF
    if isinstance(raw, bytes):
        result, matched = extract_from_bytes(raw)
        if not matched and not result:
            return "UNCLASSIFIABLE_INPUT"

    # 3. Direct Dict / List collection
    if not matched and isinstance(raw, (dict, list)):
        extracted = extract_all_strings(raw)
        result = " ".join(extracted)
        matched = True

    # 4. JSON string
    if not matched and isinstance(raw, str):
        result, matched = extract_from_json(raw)

    # 5. HTML markup
    if not matched and isinstance(raw, str):
        result, matched = extract_from_html(raw)

    # 6. CSV formatted text
    if not matched and isinstance(raw, str):
        result, matched = extract_from_csv(raw)

    # 7. Plain text or primitive scalar
    if not matched:
        if isinstance(raw, str):
            result = raw.strip()
        elif isinstance(raw, (int, float, bool)):
            result = str(raw).strip()

    # 8. Character length validation (meaningful alphanumeric count >= 3)
    meaningful_count = sum(1 for c in result if c.isalnum())
    if meaningful_count < 3:
        return "UNCLASSIFIABLE_INPUT"

    # 9. HTML sanitization
    try:
        final_clean = sanitize_html(result)
        elapsed = (time.perf_counter() - overall_start) * 1000.0
        print(f"[TIMING] Normalizer: Input normalized in {elapsed:.2f} ms")
        return final_clean
    except Exception:
        return "UNCLASSIFIABLE_INPUT"
