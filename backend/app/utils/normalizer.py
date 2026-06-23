import json
import csv
import io
import re
import time
from typing import Any
from bs4 import BeautifulSoup
from app.utils.extractor import extract_all_strings, sanitize_html


# ── Injection detection (runs on CLEANED text, never on raw input) ──

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


def get_injection_response():
    """
    Returns a pre-built TriageDecision for confirmed injection attempts.
    Imported lazily to avoid circular imports.
    """
    from app.engine.triage import TriageDecision
    return TriageDecision(
        category="security_flag",
        priority="P1",
        summary="Message contains prompt injection attempt. Classified by pre-detection layer.",
        suggested_action="Flag for security review. Do not process automatically.",
        needs_human=True,
        confidence=0.95
    )


def normalize_input(raw: Any) -> str:
    """
    Accepts ANY input format and returns a clean plain text string.
    Never crashes. Wraps every case in try/except.
    
    Order of operations:
    1. Empty/null input -> "UNCLASSIFIABLE_INPUT"
    2. Valid JSON string -> parse it, call extract_all_strings() to join text values
    3. HTML input (contains < > tags) -> BS4 tag-stripped text content
    4. CSV-like string (has commas and newlines) -> longest text field
    5. PDF bytes -> pypdf page extraction
    6. Plain text -> strip whitespace, use as-is
    7. Length validation (meaningful characters < 3) -> "UNCLASSIFIABLE_INPUT"
    8. Final pass -> sanitize_html()
    """
    overall_start = time.perf_counter()
    
    # 1. Empty/null input -> return "UNCLASSIFIABLE_INPUT"
    check_start = time.perf_counter()
    try:
        if raw is None:
            print(f"[TIMING] Normalizer: Null input check completed in {(time.perf_counter() - check_start)*1000:.2f} ms")
            return "UNCLASSIFIABLE_INPUT"
        # If it's a string, check if empty or whitespace only
        if isinstance(raw, str) and not raw.strip():
            print(f"[TIMING] Normalizer: Empty string check completed in {(time.perf_counter() - check_start)*1000:.2f} ms")
            return "UNCLASSIFIABLE_INPUT"
        # If it's an empty dictionary or list
        if isinstance(raw, (dict, list)) and not raw:
            print(f"[TIMING] Normalizer: Empty container check completed in {(time.perf_counter() - check_start)*1000:.2f} ms")
            return "UNCLASSIFIABLE_INPUT"
    except Exception as e:
        print(f"[TIMING] Normalizer: Exception in empty/null check: {e}")

    result = ""
    matched = False

    # Handling bytes inputs (such as PDF files)
    if isinstance(raw, bytes):
        pdf_start = time.perf_counter()
        # 5. PDF bytes -> use pypdf to extract all page text
        try:
            if raw.startswith(b'%PDF'):
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(raw))
                text_parts = []
                for page in reader.pages:
                    t = page.extract_text()
                    if t:
                        text_parts.append(t)
                if text_parts:
                    result = " ".join(text_parts)
                    matched = True
                print(f"[TIMING] Normalizer: PDF extraction completed in {(time.perf_counter() - pdf_start)*1000:.2f} ms")
        except Exception as e:
            print(f"[TIMING] Normalizer: Exception in PDF extraction: {e}")

        # If bytes input wasn't handled as PDF, decode to string to fall through remaining parsers
        if not matched:
            decode_start = time.perf_counter()
            try:
                decoded = raw.decode("utf-8", errors="ignore")
                if decoded.strip():
                    raw = decoded
                else:
                    print(f"[TIMING] Normalizer: Decoded empty bytes in {(time.perf_counter() - decode_start)*1000:.2f} ms")
                    return "UNCLASSIFIABLE_INPUT"
                print(f"[TIMING] Normalizer: Bytes decoding completed in {(time.perf_counter() - decode_start)*1000:.2f} ms")
            except Exception as e:
                print(f"[TIMING] Normalizer: Exception in bytes decoding: {e}")

    # Direct collection inputs (pre-parsed dictionaries or arrays):
    if not matched:
        coll_start = time.perf_counter()
        try:
            if isinstance(raw, (dict, list)):
                extracted = extract_all_strings(raw)
                result = " ".join(extracted)
                matched = True
                print(f"[TIMING] Normalizer: Dict/List extraction completed in {(time.perf_counter() - coll_start)*1000:.2f} ms")
        except Exception as e:
            print(f"[TIMING] Normalizer: Exception in Dict/List extraction: {e}")

    # 2. Valid JSON string -> parse it, call extract_all_strings() from extractor.py to get all text values, join them
    if not matched:
        json_start = time.perf_counter()
        try:
            if isinstance(raw, str):
                trimmed = raw.strip()
                if (trimmed.startswith('{') and trimmed.endswith('}')) or (trimmed.startswith('[') and trimmed.endswith(']')):
                    parsed = json.loads(trimmed)
                    if isinstance(parsed, (dict, list)):
                        extracted = extract_all_strings(parsed)
                        result = " ".join(extracted)
                        matched = True
                        print(f"[TIMING] Normalizer: JSON string parsing/extraction completed in {(time.perf_counter() - json_start)*1000:.2f} ms")
        except Exception as e:
            print(f"[TIMING] Normalizer: Exception in JSON string parsing: {e}")

    # 3. HTML input (contains < > tags) -> run BeautifulSoup, extract text only, strip tags completely
    if not matched:
        html_start = time.perf_counter()
        try:
            if isinstance(raw, str) and "<" in raw and ">" in raw:
                soup = BeautifulSoup(raw, "html.parser")
                # Decompose script and style tags so their content is fully excluded
                for element in soup(["script", "style"]):
                    element.decompose()
                extracted_text = soup.get_text(separator=" ")
                result = extracted_text
                matched = True
                print(f"[TIMING] Normalizer: HTML parsing/tag-stripping completed in {(time.perf_counter() - html_start)*1000:.2f} ms")
        except Exception as e:
            print(f"[TIMING] Normalizer: Exception in HTML parsing: {e}")

    # 4. CSV-like string (has commas and newlines) -> extract the longest text field as the message
    if not matched:
        csv_start = time.perf_counter()
        try:
            if isinstance(raw, str) and "," in raw and "\n" in raw:
                f = io.StringIO(raw.strip())
                reader = csv.reader(f)
                longest_field = ""
                for row in reader:
                    for field in row:
                        cleaned_field = field.strip()
                        if len(cleaned_field) > len(longest_field):
                            longest_field = cleaned_field
                result = longest_field
                matched = True
                print(f"[TIMING] Normalizer: CSV parsing completed in {(time.perf_counter() - csv_start)*1000:.2f} ms")
        except Exception as e:
            print(f"[TIMING] Normalizer: Exception in CSV parsing: {e}")

    # 6. Plain text -> strip whitespace, use as-is
    if not matched:
        plain_start = time.perf_counter()
        try:
            if isinstance(raw, str):
                result = raw.strip()
                matched = True
                print(f"[TIMING] Normalizer: Plain text formatting completed in {(time.perf_counter() - plain_start)*1000:.2f} ms")
            elif isinstance(raw, (int, float, bool)):
                result = str(raw).strip()
                matched = True
                print(f"[TIMING] Normalizer: Primitive value string conversion completed in {(time.perf_counter() - plain_start)*1000:.2f} ms")
        except Exception as e:
            print(f"[TIMING] Normalizer: Exception in plain text formatting: {e}")

    # 7. After all above -> if result has less than 3 meaningful characters return "UNCLASSIFIABLE_INPUT"
    # A meaningful character is defined as an alphanumeric character.
    val_start = time.perf_counter()
    try:
        meaningful_count = sum(1 for c in result if c.isalnum())
        if meaningful_count < 3:
            print(f"[TIMING] Normalizer: Input rejected (insufficient meaningful characters: {meaningful_count}) in {(time.perf_counter() - val_start)*1000:.2f} ms")
            return "UNCLASSIFIABLE_INPUT"
        print(f"[TIMING] Normalizer: Character length check passed in {(time.perf_counter() - val_start)*1000:.2f} ms")
    except Exception as e:
        print(f"[TIMING] Normalizer: Exception in length validation: {e}")
        return "UNCLASSIFIABLE_INPUT"

    # 8. Final pass -> always run result through existing sanitize_html() from extractor.py
    san_start = time.perf_counter()
    try:
        final_clean = sanitize_html(result)
        print(f"[TIMING] Normalizer: HTML sanitization completed in {(time.perf_counter() - san_start)*1000:.2f} ms")
        print(f"[TIMING] Normalizer: Overall normalization completed in {(time.perf_counter() - overall_start)*1000:.2f} ms")
        return final_clean
    except Exception as e:
        print(f"[TIMING] Normalizer: Exception in final HTML sanitization: {e}")
        return "UNCLASSIFIABLE_INPUT"
