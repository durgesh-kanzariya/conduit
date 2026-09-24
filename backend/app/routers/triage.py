import time
import asyncio
from typing import Any
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from app.schemas.triage import BatchRequest, TriageDecision
from app.utils.normalizer import normalize_input, detect_injection, get_injection_response
from app.engine.triage import run_triage

router = APIRouter(tags=["Triage"])

@router.post("/triage")
@router.post("/api/triage")
async def post_triage(request: Request, provider: str = None):
    """
    Receives unverified raw input via any Content-Type, runs it through the normalization pipeline,
    and forwards it to the triage engine.
    """
    start_time = time.perf_counter()
    content_type = request.headers.get("content-type", "").lower()
    
    raw_input = None
    body_provider = None
    
    try:
        if "application/json" in content_type:
            try:
                body_json = await request.json()
                if isinstance(body_json, dict):
                    body_provider = body_json.get("provider")
                    if "payload" in body_json:
                        raw_input = body_json["payload"]
                    elif "message" in body_json:
                        raw_input = body_json["message"]
                    else:
                        raw_input = body_json
                else:
                    raw_input = body_json
            except Exception:
                body_bytes = await request.body()
                raw_input = body_bytes.decode("utf-8", errors="ignore")
        elif "multipart/form-data" in content_type:
            form = await request.form()
            body_provider = form.get("provider")
            if "message" in form:
                raw_input = form["message"]
            else:
                file_found = False
                for key, value in form.items():
                    if hasattr(value, "file"):
                        raw_input = await value.read()
                        file_found = True
                        break
                if not file_found:
                    raw_input = ""
        elif "text/plain" in content_type or "text/html" in content_type:
            body_bytes = await request.body()
            raw_input = body_bytes.decode("utf-8", errors="ignore")
        else:
            raw_input = await request.body()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading request body: {str(e)}")
        
    resolved_provider = provider or body_provider
    if resolved_provider == "laya":
        from app.engine.laya_engine import is_laya_available
        if not is_laya_available():
            raise HTTPException(
                status_code=400,
                detail="The local Laya (ModernBERT) model cannot be run on the live cloud deployment (Render.com). Please download/clone the project to run Laya locally on your PC, or switch to Groq / Hybrid engine."
            )
        
    try:
        clean_text = normalize_input(raw_input)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process and clean request payload: {str(e)}")
    
    # Pre-LLM injection detection on CLEANED text
    if detect_injection(clean_text):
        injection_decision = get_injection_response()
        elapsed_time = (time.perf_counter() - start_time) * 1000.0
        headers = {"X-Latency-MS": f"{round(elapsed_time, 2)}"}
        return JSONResponse(
            content={
                "decision": injection_decision.model_dump(),
                "clean_text": clean_text,
                "latency_ms": round(elapsed_time, 2)
            },
            headers=headers
        )

    try:
        decision = await run_triage(clean_text, provider=resolved_provider)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Triage execution error: {str(e)}")
        
    elapsed_time = (time.perf_counter() - start_time) * 1000.0
    headers = {"X-Latency-MS": f"{round(elapsed_time, 2)}"}
    
    return JSONResponse(
        content={
            "decision": decision.model_dump() if hasattr(decision, "model_dump") else decision,
            "clean_text": clean_text,
            "latency_ms": round(elapsed_time, 2)
        },
        headers=headers
    )

@router.post("/triage/groq")
@router.post("/api/triage/groq")
async def post_triage_groq_route(request: Request):
    """Explicitly triage message using Groq provider."""
    return await post_triage(request, provider="groq")

@router.post("/batch")
@router.post("/api/batch")
async def post_batch(request: BatchRequest):
    """
    Runs normalize + triage on a list of messages sequentially with rate limiting.
    """
    start_time = time.perf_counter()
    messages = request.messages
    provider = request.provider
    
    if len(messages) > 40:
        raise HTTPException(status_code=400, detail="Batch size exceeds maximum limit of 40 messages.")
        
    async def process_msg(msg):
        msg_start = time.perf_counter()
        try:
            clean_text = normalize_input(msg)
            if detect_injection(clean_text):
                verdict = get_injection_response()
            else:
                try:
                    verdict = await asyncio.wait_for(
                        run_triage(clean_text, provider=provider), 
                        timeout=15.0
                    )
                except asyncio.TimeoutError:
                    verdict = TriageDecision(
                        category="timeout_error",
                        priority="P2", 
                        summary="Request timed out after 15 seconds",
                        suggested_action="Retry or escalate to human",
                        needs_human=True,
                        confidence=0.0
                    )
            decision_data = verdict.model_dump() if hasattr(verdict, "model_dump") else verdict
            msg_latency = (time.perf_counter() - msg_start) * 1000.0
            return {
                "success": True,
                "decision": decision_data,
                "clean_text": clean_text,
                "latency_ms": round(msg_latency, 2)
            }
        except Exception as e:
            msg_latency = (time.perf_counter() - msg_start) * 1000.0
            return {
                "success": False,
                "error": str(e),
                "latency_ms": round(msg_latency, 2)
            }
            
    results = []
    total = len(messages)
    for i, msg in enumerate(messages):
        print(f"Processing message {i+1}/{total}...")
        res = await process_msg(msg)
        print(f"Processed {i+1}/{total}")
        results.append(res)
        if i < total - 1:
            await asyncio.sleep(1.5)  # rate limit buffer
            
    elapsed_time = (time.perf_counter() - start_time) * 1000.0
    headers = {"X-Latency-MS": f"{round(elapsed_time, 2)}"}
    
    return JSONResponse(
        content={
            "results": results,
            "latency_ms": round(elapsed_time, 2)
        },
        headers=headers
    )
