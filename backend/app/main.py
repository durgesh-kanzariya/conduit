import asyncio
import json
import os
import time
from typing import Any, Dict, List
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.utils.normalizer import normalize_input, detect_injection, get_injection_response
from app.engine.triage import run_triage, TriageDecision
from app.engine.evaluator import run_evaluation

app = FastAPI(title="Frontline AI Triage API")

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open to all origins for hackathon simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TriageRequest(BaseModel):
    payload: Any

class BatchRequest(BaseModel):
    messages: List[Any]

@app.get("/health")
@app.get("/api/health")
def get_health():
    """
    Simple health check endpoint returning status ok.
    """
    return {"status": "ok"}

@app.get("/test-cases")
@app.get("/api/test-cases")
def get_test_cases():
    """
    Reads and serves the test cases stored in test_cases.json, mapping them to the schema expected by the frontend.
    """
    start_time = time.perf_counter()
    file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "test_cases.json")
    gt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "ground_truth.json")
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            raw_cases = json.load(f)
            
        gt_map = {}
        try:
            with open(gt_path, "r", encoding="utf-8") as gtf:
                gt_data = json.load(gtf)
                for gt in gt_data:
                    gt_map[gt["raw_message"].strip()] = gt
        except Exception:
            pass
            
        mapped_cases = []
        for tc in raw_cases:
            raw_msg = tc.get("raw_message", "")
            payload = raw_msg
            if tc.get("format") == "json":
                try:
                    payload = json.loads(raw_msg)
                except Exception:
                    pass
                    
            gt_match = gt_map.get(raw_msg.strip())
            if gt_match:
                expected = {
                    "category": gt_match["expected_category"],
                    "priority": gt_match["expected_priority"],
                    "needs_human": gt_match["expected_needs_human"]
                }
            else:
                expected = {
                    "category": "bug_report",
                    "priority": "P2",
                    "needs_human": False
                }
                
            mapped_cases.append({
                "id": tc.get("id"),
                "description": f"{tc.get('type_label', 'Test Case')} ({tc.get('format', 'text')})",
                "payload": payload,
                "expected": expected
            })
            
        elapsed_time = (time.perf_counter() - start_time) * 1000.0
        headers = {"X-Latency-MS": f"{round(elapsed_time, 2)}"}
        return JSONResponse(content=mapped_cases, headers=headers)
        
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="test_cases.json file not found.")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Error decoding test_cases.json.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/triage")
@app.post("/api/triage")
async def post_triage(request: Request):
    """
    Receives unverified raw input via any Content-Type, runs it through the normalization pipeline,
    and forwards it to the triage engine.
    """
    start_time = time.perf_counter()
    content_type = request.headers.get("content-type", "").lower()
    
    raw_input = None
    
    try:
        if "application/json" in content_type:
            try:
                body_json = await request.json()
                if isinstance(body_json, dict):
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
        decision = await run_triage(clean_text)
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

@app.post("/batch")
@app.post("/api/batch")
async def post_batch(request: BatchRequest):
    """
    Runs normalize + triage on a list of messages concurrently.
    """
    start_time = time.perf_counter()
    messages = request.messages
    
    if len(messages) > 40:
        raise HTTPException(status_code=400, detail="Batch size exceeds maximum limit of 40 messages.")
        
    async def process_msg(msg):
        msg_start = time.perf_counter()
        try:
            clean_text = normalize_input(msg)
            # Pre-LLM injection detection on CLEANED text
            if detect_injection(clean_text):
                verdict = get_injection_response()
            else:
                try:
                    verdict = await asyncio.wait_for(
                        run_triage(clean_text), 
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

@app.get("/evaluate")
@app.get("/api/evaluate")
async def get_evaluate():
    """
    Runs full evaluation against ground_truth.json dataset and returns the EvalReport.
    """
    start_time = time.perf_counter()
    try:
        report = await run_evaluation()
        elapsed_time = (time.perf_counter() - start_time) * 1000.0
        report_dict = report.model_dump() if hasattr(report, "model_dump") else report
        report_dict["latency_ms"] = round(elapsed_time, 2)
        headers = {"X-Latency-MS": f"{round(elapsed_time, 2)}"}
        return JSONResponse(content=report_dict, headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation run failed: {str(e)}")

