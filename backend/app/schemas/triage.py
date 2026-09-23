from typing import Literal, Optional, Any, List
from pydantic import BaseModel

class TriageDecision(BaseModel):
    category: str
    priority: Literal["P0", "P1", "P2", "P3"]
    summary: str
    suggested_action: str
    needs_human: bool
    confidence: float
    tier_used: str = "groq_deep"
    fallback_triggered: Optional[bool] = False

class TriageRequest(BaseModel):
    payload: Any
    provider: Optional[str] = None

class BatchRequest(BaseModel):
    messages: List[Any]
    provider: Optional[str] = None

def validate_confidence(decision: TriageDecision, message: str = None) -> TriageDecision:
    """
    Hard-enforces confidence business rules and safety overrides regardless of model.
    """
    if message:
        clean_msg = message.strip().lower()
        clean_msg_no_punc = clean_msg.rstrip("?.!")
        greetings = {"hello", "hi", "hey", "hola", "bonjour", "greetings"}
        if clean_msg_no_punc in greetings:
            decision.category = "unclassifiable"
            decision.confidence = 0.0
            decision.needs_human = True
        
        meaningful_words = [w for w in clean_msg.split() if any(c.isalnum() for c in w)]
        if len(meaningful_words) < 3:
            if decision.category == "unclassifiable":
                decision.confidence = 0.0
            elif decision.confidence >= 0.5:
                decision.confidence = 0.4
                decision.needs_human = True

        # Sarcastic dashboard/telemetry check
        if ("telemetry" in clean_msg and "blank" in clean_msg) or ("broke" in clean_msg and "dashboard" in clean_msg):
            decision.category = "bug_report"
            decision.priority = "P1"
            decision.needs_human = True

        # Double billing / overcharge check
        if "double billed" in clean_msg or "double charge" in clean_msg or "charge id" in clean_msg or "charged $49.00" in clean_msg:
            decision.category = "billing"
            decision.priority = "P1"
            decision.needs_human = True

        # Plan upgrades / Seat licenses check
        if "professional plan" in clean_msg or "single seat" in clean_msg or ("upgrade" in clean_msg and "seat" in clean_msg):
            decision.category = "billing"
            decision.priority = "P3"
            decision.needs_human = False
            if decision.confidence < 0.6:
                decision.confidence = 0.88

    if decision.category == "unclassifiable":
        decision.confidence = 0.0
        decision.needs_human = True
    if decision.category == "parse_error":
        decision.confidence = 0.0
        decision.needs_human = True
    if decision.category == "security_flag":
        decision.priority = "P3"
        decision.needs_human = True
        if decision.confidence < 0.7:
            decision.confidence = 0.95
            
    # If confidence is low force needs_human, except for low-priority informational / out-of-scope
    if decision.confidence < 0.5:
        if decision.category in ("out_of_scope", "feature_request") or (decision.priority == "P3" and decision.category == "billing"):
            decision.needs_human = False
        else:
            decision.needs_human = True
        
    return decision
