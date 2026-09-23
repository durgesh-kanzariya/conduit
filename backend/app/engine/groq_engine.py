import os
import json
import time
import asyncio
import random
from typing import Optional
from groq import AsyncGroq
from dotenv import load_dotenv

from app.schemas.triage import TriageDecision
from app.prompts.triage_prompts import SYSTEM_PROMPT

load_dotenv()

# Global AsyncGroq client
_client: Optional[AsyncGroq] = None
_groq_semaphore: Optional[asyncio.Semaphore] = None

def get_groq_client() -> AsyncGroq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        _client = AsyncGroq(api_key=api_key, timeout=15.0)
    return _client

def get_semaphore() -> asyncio.Semaphore:
    global _groq_semaphore
    if _groq_semaphore is None:
        _groq_semaphore = asyncio.Semaphore(3)  # Maximum 3 concurrent connections
    return _groq_semaphore

def clean_json_markdown(raw: str) -> str:
    """Removes backticks and 'json' code fences from model outputs."""
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()

async def run_triage_groq(message: str) -> TriageDecision:
    """
    Asynchronously classifies the message using Groq's model with automatic retry & rate-limit handling.
    """
    fallback_decision = TriageDecision(
        category="unclassifiable",
        priority="P2",
        summary="Failed to parse model response",
        suggested_action="Escalate to human review",
        needs_human=True,
        confidence=0.0,
        tier_used="groq_deep"
    )

    client = get_groq_client()
    retries = 3
    base_delay = 1.0

    async with get_semaphore():
        for attempt in range(retries):
            try:
                print(f"[STATUS] Triage Engine: Starting LLM completion call (Attempt {attempt+1}/{retries})...")
                llm_start = time.perf_counter()
                groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
                
                response = await client.chat.completions.create(
                    model=groq_model,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": message}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.0
                )
                llm_duration = (time.perf_counter() - llm_start) * 1000.0
                print(f"[TIMING] Triage Engine: Groq API response received in {llm_duration:.2f} ms")
                
                clean_start = time.perf_counter()
                raw = clean_json_markdown(response.choices[0].message.content)
                
                try:
                    data = json.loads(raw)
                    json_parse_time = (time.perf_counter() - clean_start) * 1000.0
                    print(f"[TIMING] Triage Engine: Response text cleaned and JSON parsed in {json_parse_time:.2f} ms")
                    
                    validate_start = time.perf_counter()
                    validated = TriageDecision.model_validate(data)
                    validated.tier_used = "groq_deep"
                    validate_time = (time.perf_counter() - validate_start) * 1000.0
                    print(f"[TIMING] Triage Engine: Pydantic TriageDecision validation completed in {validate_time:.2f} ms")
                    return validated
                except Exception as e:
                    print(f"[ERROR] Triage Engine: JSON parse/validation error on response. Exception: {e}")
                    print(f"[ERROR] Raw model response content was: {raw}")
                    return fallback_decision

            except Exception as e:
                err_str = str(e).lower()
                print(f"[ERROR] Triage Engine: API request call failed. Exception details: {e}")
                
                if "429" in err_str or "rate" in err_str or "limit" in err_str:
                    print(f"[STATUS] API Warning: Groq Rate Limit (429) hit / Tokens exhausted.")
                elif "401" in err_str or "unauthorized" in err_str or "auth" in err_str or "invalid_api_key" in err_str:
                    print(f"[STATUS] API Warning: Groq Authorization (401) issue. Check API Key validity.")
                else:
                    print(f"[STATUS] API Warning: General Exception: {err_str}")
                
                if ("429" in err_str or "rate" in err_str or "limit" in err_str) and attempt < retries - 1:
                    sleep_time = base_delay * (2 ** attempt) + random.uniform(0.1, 0.5)
                    print(f"[STATUS] Triage Engine: Retrying in {sleep_time:.2f} seconds...")
                    await asyncio.sleep(sleep_time)
                    continue
                return fallback_decision
        
        return fallback_decision
