from bs4 import BeautifulSoup
from typing import Any, List

def extract_all_strings(data: Any) -> List[str]:
    """
    Recursively traverses python dictionaries, lists, and primitive types
    to gather and extract all string properties.
    """
    strings = []
    if isinstance(data, dict):
        for key, value in data.items():
            # Include the key name if it's a string to preserve structure context
            if isinstance(key, str):
                strings.append(key)
            strings.extend(extract_all_strings(value))
    elif isinstance(data, list):
        for item in data:
            strings.extend(extract_all_strings(item))
    elif isinstance(data, (str, int, float, bool)) and data is not None:
        strings.append(str(data))
    return strings

def sanitize_html(text: str) -> str:
    """
    Uses BeautifulSoup4 to strip away all HTML structures, script elements,
    and style attributes from a string, extracting only the raw text content.
    """
    # Parse text as HTML
    soup = BeautifulSoup(text, "html.parser")
    
    # Decompose script and style tags completely so their inner contents are discarded
    for element in soup(["script", "style"]):
        element.decompose()
        
    # Get the plain text
    raw_text = soup.get_text(separator=" ")
    
    # Normalize multiple whitespace characters into single spaces
    clean_text = " ".join(raw_text.split())
    return clean_text

def extract_and_sanitize(payload: Any) -> str:
    """
    Combines the recursive extraction and HTML sanitization to produce
    a single, clean plain-text block from a chaotic nested payload.
    """
    extracted_parts = extract_all_strings(payload)
    combined_text = " ".join(extracted_parts)
    return sanitize_html(combined_text)
