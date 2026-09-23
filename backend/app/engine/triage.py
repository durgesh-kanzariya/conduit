"""
Triage Pipeline Coordinator.
Routes incoming support requests between:
- Tier 1: Laya Fast-Path Decision Router (~33ms)
- Tier 2: Groq Deep Reasoning LLM
Includes circuit-breaker fallback to Tier 1 when cloud LLM fails.
"""

import os
import asyncio

from app.schemas.triage import TriageDecision, validate_confidence
from app.engine.groq_engine import run_triage_groq

__all__ = ["TriageDecision", "validate_confidence", "run_triage", "run_triage_groq"]

async def run_triage(message: str, provider: str = None) -> TriageDecision:
    """
    Dispatcher function supporting:
    - 'hybrid': Dynamic confidence gating (threshold=0.82) escalating to Groq with circuit breaker.
    - 'laya': Pure Laya decision engine (forces local model output).
    - 'groq': Pure Groq LLM completion.
    """
    if provider is None:
        provider = os.getenv("LLM_PROVIDER", "hybrid").lower().strip()
    else:
        provider = provider.lower().strip()

    threshold = float(os.getenv("LAYA_CONFIDENCE_THRESHOLD", "0.82"))
    clean_text = message[:2000]

    cached_laya_decision = None

    # Tier 1: Laya Fast-Path
    if provider in ["hybrid", "laya"]:
        try:
            from app.engine.laya_engine import predict_with_laya, is_laya_available
            if is_laya_available():
                force = (provider == "laya")
                # Non-blocking inference in dedicated thread
                laya_dict, _ = await asyncio.to_thread(predict_with_laya, clean_text, force, threshold)
                if laya_dict:
                    decision = TriageDecision(**laya_dict)
                    decision = validate_confidence(decision, message=clean_text)
                    decision.tier_used = "⚡ Laya Fast-Path"

                    # If forced Laya or confidence passes the 0.82 gating threshold
                    if provider == "laya" or decision.confidence >= threshold:
                        return decision
                    
                    # Cache decision for circuit-breaker resilience
                    cached_laya_decision = decision
        except Exception as e:
            print(f"[STATUS] Laya execution bypassed: {e}")

    if provider == "laya" and cached_laya_decision:
        return cached_laya_decision

    # Tier 2: Groq Deep Reasoning Escalation
    try:
        groq_result = await run_triage_groq(clean_text)
        groq_result = validate_confidence(groq_result, message=clean_text)
        groq_result.tier_used = "🧠 Groq Deep (Escalated)"
        return groq_result
    except Exception as e:
        print(f"[WARNING] Groq escalation error: {e}. Triggering Circuit Breaker fallback.")
        if cached_laya_decision:
            cached_laya_decision.tier_used = "⚡ Laya Fast-Path (Fallback)"
            cached_laya_decision.fallback_triggered = True
            return cached_laya_decision
        
        # Safe emergency fallback if both failed
        return TriageDecision(
            category="unclassifiable",
            priority="P2",
            summary="Emergency fallback: All triage tiers encountered errors.",
            suggested_action="Escalate to human review immediately.",
            needs_human=True,
            confidence=0.0,
            tier_used="⚡ Laya Fast-Path (Fallback)",
            fallback_triggered=True
        )
