import io
import csv
import json
import time
from typing import Any, Tuple
from bs4 import BeautifulSoup

from app.utils.extractor import extract_all_strings

def extract_from_bytes(raw: bytes) -> Tuple[str, bool]:
    """Extract text from bytes, trying PDF then UTF-8 decode."""
    pdf_start = time.perf_counter()
    try:
        if raw.startswith(b'%PDF'):
            import pypdf
            reader = pypdf.PdfReader(io.BytesIO(raw))
            text_parts = [page.extract_text() for page in reader.pages if page.extract_text()]
            if text_parts:
                print(f"[TIMING] FormatParser: PDF extracted in {(time.perf_counter() - pdf_start)*1000:.2f} ms")
                return " ".join(text_parts), True
    except Exception as e:
        print(f"[TIMING] FormatParser: PDF extraction exception: {e}")

    # Fallback to UTF-8 decoding
    try:
        decoded = raw.decode("utf-8", errors="ignore")
        return decoded.strip(), bool(decoded.strip())
    except Exception:
        return "", False

def extract_from_json(raw: str) -> Tuple[str, bool]:
    """Parse JSON string and extract nested strings."""
    trimmed = raw.strip()
    if (trimmed.startswith('{') and trimmed.endswith('}')) or (trimmed.startswith('[') and trimmed.endswith(']')):
        try:
            parsed = json.loads(trimmed)
            if isinstance(parsed, (dict, list)):
                extracted = extract_all_strings(parsed)
                return " ".join(extracted), True
        except Exception:
            pass
    return "", False

def extract_from_html(raw: str) -> Tuple[str, bool]:
    """Strip HTML tags and scripts via BeautifulSoup."""
    if "<" in raw and ">" in raw:
        try:
            soup = BeautifulSoup(raw, "html.parser")
            for element in soup(["script", "style"]):
                element.decompose()
            return soup.get_text(separator=" ").strip(), True
        except Exception:
            pass
    return "", False

def extract_from_csv(raw: str) -> Tuple[str, bool]:
    """Extract longest text field from CSV string."""
    if "," in raw and "\n" in raw:
        try:
            f = io.StringIO(raw.strip())
            reader = csv.reader(f)
            longest_field = ""
            for row in reader:
                for field in row:
                    cleaned_field = field.strip()
                    if len(cleaned_field) > len(longest_field):
                        longest_field = cleaned_field
            if longest_field:
                return longest_field, True
        except Exception:
            pass
    return "", False
