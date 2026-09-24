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
    groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    
    is_render = bool(os.getenv("RENDER") or os.getenv("RENDER_SERVICE_ID"))
    laya_available = False
    try:
        from app.engine.laya_engine import is_laya_available
        laya_available = is_laya_available()
    except Exception:
        pass

    return {
        "provider": "groq" if not laya_available and provider == "laya" else provider,
        "groq_model": groq_model,
        "laya_available": laya_available,
        "is_cloud": is_render or not laya_available,
        "laya_model": "convaiinnovations/laya (ModernBERT decision router)",
        "message": (
            "Laya (ModernBERT) model is only available when running locally on PC. "
            "On live cloud hosting (Render.com), Laya is disabled due to memory constraints. "
            "Download or clone the project from GitHub to test local on-device Laya inference."
        ) if not laya_available else "Laya on-device ModernBERT engine is active."
    }
