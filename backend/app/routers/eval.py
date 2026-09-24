import os
import json
import time
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.engine.evaluator import run_evaluation

router = APIRouter(tags=["Evaluation & Datasets"])

@router.get("/test-cases")
@router.get("/api/test-cases")
def get_test_cases():
    """
    Reads and serves the test cases stored in test_cases.json, mapping them to the schema expected by the frontend.
    """
    start_time = time.perf_counter()
    file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "test_cases.json")
    gt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "data", "ground_truth.json")
    
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
                    "category": gt_match.get("expected_category"),
                    "priority": gt_match.get("expected_priority"),
                    "needs_human": gt_match.get("expected_needs_human")
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

@router.get("/evaluate")
@router.get("/api/evaluate")
async def get_evaluate(provider: str = None):
    """
    Runs full evaluation against ground_truth.json dataset and returns the EvalReport.
    """
    start_time = time.perf_counter()
    from app.engine.laya_engine import is_laya_available
    if provider == "laya" and not is_laya_available():
        raise HTTPException(
            status_code=400,
            detail="Local Laya model is not available in cloud deployment. Please clone/download the repository and run locally on your PC to test the ModernBERT engine."
        )
    try:
        report = await run_evaluation(provider=provider)
        elapsed_time = (time.perf_counter() - start_time) * 1000.0
        report_dict = report.model_dump() if hasattr(report, "model_dump") else report
        report_dict["latency_ms"] = round(elapsed_time, 2)
        headers = {"X-Latency-MS": f"{round(elapsed_time, 2)}"}
        return JSONResponse(content=report_dict, headers=headers)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation run failed: {str(e)}")
