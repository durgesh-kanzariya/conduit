import os
from fastapi import APIRouter

router = APIRouter(tags=["Health"])

@router.get("/health")
@router.get("/api/health")
def get_health():
    """Simple health check endpoint returning status ok."""
    return {"status": "ok"}

@router.get("/engine-info")
@router.get("/api/engine-info")
def get_engine_info():
    """Returns runtime engine configuration and availability."""
    provider = os.getenv("LLM_PROVIDER", "hybrid")
    groq_model = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    
    laya_available = False
    try:
        from app.engine.laya_engine import is_laya_available
        laya_available = is_laya_available()
    except Exception:
        pass

    return {
        "provider": provider,
        "groq_model": groq_model,
        "laya_available": laya_available,
        "laya_model": "convaiinnovations/laya (ModernBERT decision router)"
    }
