import asyncio
import os
import json
from typing import List
from pydantic import BaseModel
from app.utils.normalizer import normalize_input
from app.engine.triage import run_triage

class SingleResult(BaseModel):
    id: int
    raw_message: str
    expected_category: str
    got_category: str
    expected_priority: str
    got_priority: str
    expected_needs_human: bool
    got_needs_human: bool
    category_match: bool
    priority_match: bool
    needs_human_match: bool
    overall_pass: bool  # all three match

class EvalReport(BaseModel):
    total: int
    passed: int
    agreement_rate: float
    results: List[SingleResult]
    failures: List[SingleResult]  # only failed ones

async def run_evaluation(provider: str = None) -> EvalReport:
    """
    Loads ground_truth.json, runs the triage pipeline for each entry concurrently,
    and returns a structured EvalReport containing success and failure details.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    file_path = os.path.join(base_dir, "data", "ground_truth.json")
    
    with open(file_path, "r", encoding="utf-8") as f:
        ground_truth = json.load(f)
        
    results = []
    failures = []
    passed_count = 0
    
    async def evaluate_entry(entry):
        raw_msg = entry["raw_message"]
        
        # Normalize input raw text
        try:
            clean_text = normalize_input(raw_msg)
        except Exception:
            clean_text = "UNCLASSIFIABLE_INPUT"
            
        # Run triage live using the pipeline
        decision = await run_triage(clean_text, provider=provider)
        
        # Compare decisions exactly
        exp_cat = entry["expected_category"]
        exp_prio = entry["expected_priority"]
        exp_human = entry["expected_needs_human"]
        
        got_cat = decision.category
        got_prio = decision.priority
        got_human = decision.needs_human
        
        category_match = got_cat == exp_cat
        priority_match = got_prio == exp_prio
        needs_human_match = got_human == exp_human
        
        overall_pass = category_match and priority_match and needs_human_match
        
        return SingleResult(
            id=entry["id"],
            raw_message=raw_msg,
            expected_category=exp_cat,
            got_category=got_cat,
            expected_priority=exp_prio,
            got_priority=got_prio,
            expected_needs_human=exp_human,
            got_needs_human=got_human,
            category_match=category_match,
            priority_match=priority_match,
            needs_human_match=needs_human_match,
            overall_pass=overall_pass
        )

    eval_results = []
    for entry in ground_truth:
        res = await evaluate_entry(entry)
        eval_results.append(res)
        await asyncio.sleep(1.0)  # rate limit buffer

    for res in eval_results:
        results.append(res)
        if res.overall_pass:
            passed_count += 1
        else:
            failures.append(res)
            
    total_count = len(ground_truth)
    agreement_rate = (passed_count / total_count) * 100.0 if total_count > 0 else 0.0
    
    return EvalReport(
        total=total_count,
        passed=passed_count,
        agreement_rate=round(agreement_rate, 2),
        results=results,
        failures=failures
    )
