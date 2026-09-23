"""
Evaluator — runs against ground_truth.json.
Returns: accuracy, macro_f1, per_class_f1, latency percentiles,
         misclassifications, field breakdown, estimated cost.
"""
import os
import json
import time
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.utils.normalizer import normalize_input
from app.engine.triage import run_triage


# ---------------------------------------------------------------------------
# Pydantic response models
# ---------------------------------------------------------------------------

class Misclassification(BaseModel):
    id: int
    payload: str          # short excerpt (frontend uses 'payload' not 'raw_message')
    expected: str         # expected category
    predicted: str        # predicted category
    confidence: float

class EvalReport(BaseModel):
    # Headline numbers
    total: int
    correct: int
    accuracy: float       # 0-100
    macro_f1: float       # 0-1
    per_class_f1: Dict[str, float]  # per-category F1 0-1

    # Latency
    avg_latency_ms: float
    latency_percentiles: Dict[str, float]  # p50, p90, p99

    # Cost
    estimated_cost_usd: float

    # Field-level accuracy
    category_accuracy: float
    priority_accuracy: float
    needs_human_accuracy: float

    # Misclassifications list (all failures)
    misclassifications: List[Misclassification]

    # Full per-item results for raw access
    results: List[Dict[str, Any]]


# ---------------------------------------------------------------------------
# Math helpers
# ---------------------------------------------------------------------------

def _percentile(values: List[float], p: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    k = (len(s) - 1) * (p / 100.0)
    f = int(k)
    c = min(f + 1, len(s) - 1)
    return round(s[f] + (k - f) * (s[c] - s[f]), 2)


def _macro_f1(true_labels: List[str], pred_labels: List[str]) -> float:
    classes = list(set(true_labels + pred_labels))
    if not classes:
        return 0.0
    f1s = []
    for cls in classes:
        tp = sum(1 for t, p in zip(true_labels, pred_labels) if t == cls and p == cls)
        fp = sum(1 for t, p in zip(true_labels, pred_labels) if t != cls and p == cls)
        fn = sum(1 for t, p in zip(true_labels, pred_labels) if t == cls and p != cls)
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec  = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1   = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        f1s.append(f1)
    return round(sum(f1s) / len(f1s), 3)


def _per_class_f1(true_labels: List[str], pred_labels: List[str]) -> Dict[str, float]:
    classes = sorted(set(true_labels + pred_labels))
    result = {}
    for cls in classes:
        tp = sum(1 for t, p in zip(true_labels, pred_labels) if t == cls and p == cls)
        fp = sum(1 for t, p in zip(true_labels, pred_labels) if t != cls and p == cls)
        fn = sum(1 for t, p in zip(true_labels, pred_labels) if t == cls and p != cls)
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec  = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1   = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        result[cls] = round(f1, 3)
    return result


# ---------------------------------------------------------------------------
# Main evaluation runner
# ---------------------------------------------------------------------------

async def run_evaluation(provider: str = None) -> EvalReport:
    """
    Runs full evaluation against ground_truth.json.
    Computes accuracy, macro/per-class F1, latency percentiles, estimated cost.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    file_path = os.path.join(base_dir, "data", "ground_truth.json")

    with open(file_path, "r", encoding="utf-8") as f:
        ground_truth = json.load(f)

    results = []
    misclassifications = []
    latencies: List[float] = []
    groq_calls = 0

    exp_categories: List[str] = []
    got_categories: List[str] = []

    cat_matches   = 0
    prio_matches  = 0
    human_matches = 0
    overall_passes = 0

    for entry in ground_truth:
        raw_msg = entry["raw_message"]
        try:
            clean_text = normalize_input(raw_msg)
        except Exception:
            clean_text = "UNCLASSIFIABLE_INPUT"

        item_start = time.perf_counter()
        decision   = await run_triage(clean_text, provider=provider)
        item_ms    = round((time.perf_counter() - item_start) * 1000.0, 2)
        latencies.append(item_ms)

        if "groq" in str(decision.tier_used).lower():
            groq_calls += 1

        exp_cat   = entry["expected_category"]
        exp_prio  = entry["expected_priority"]
        exp_human = entry["expected_needs_human"]

        got_cat   = decision.category
        got_prio  = decision.priority
        got_human = decision.needs_human

        exp_categories.append(exp_cat)
        got_categories.append(got_cat)

        cat_match   = (got_cat == exp_cat)
        prio_match  = (got_prio == exp_prio)
        human_match = (got_human == exp_human)

        if cat_match:   cat_matches   += 1
        if prio_match:  prio_matches  += 1
        if human_match: human_matches += 1

        overall_pass = cat_match and prio_match and human_match
        if overall_pass:
            overall_passes += 1

        item_dict = {
            "id":                    entry["id"],
            "raw_message":           raw_msg,
            "expected_category":     exp_cat,
            "got_category":          got_cat,
            "expected_priority":     exp_prio,
            "got_priority":          got_prio,
            "expected_needs_human":  exp_human,
            "got_needs_human":       got_human,
            "category_match":        cat_match,
            "priority_match":        prio_match,
            "needs_human_match":     human_match,
            "overall_pass":          overall_pass,
            "tier_used":             decision.tier_used,
            "confidence":            round(decision.confidence, 2),
            "latency_ms":            item_ms,
        }
        results.append(item_dict)

        if not overall_pass:
            misclassifications.append(Misclassification(
                id=entry["id"],
                payload=(raw_msg[:120] + ("..." if len(raw_msg) > 120 else "")),
                expected=exp_cat,
                predicted=got_cat,
                confidence=round(decision.confidence, 2),
            ))

        # Small sleep only for cloud providers (Laya doesn't need rate-limiting)
        if "groq" in str(provider or "").lower() or provider == "hybrid":
            await asyncio.sleep(0.3)

    total = len(ground_truth)
    accuracy  = round((overall_passes / total) * 100.0, 2) if total > 0 else 0.0
    macro_f1v = _macro_f1(exp_categories, got_categories)
    pcf1      = _per_class_f1(exp_categories, got_categories)

    avg_lat = round(sum(latencies) / len(latencies), 2) if latencies else 0.0

    # Cost model: $0.00 for Laya local, $0.08 per 1k for Groq
    est_cost = round((groq_calls / max(total, 1)) * 0.08 * total / 1000.0, 6)

    return EvalReport(
        total=total,
        correct=overall_passes,
        accuracy=accuracy,
        macro_f1=macro_f1v,
        per_class_f1=pcf1,
        avg_latency_ms=avg_lat,
        latency_percentiles={
            "p50": _percentile(latencies, 50),
            "p90": _percentile(latencies, 90),
            "p99": _percentile(latencies, 99),
        },
        estimated_cost_usd=est_cost,
        category_accuracy=round((cat_matches   / total) * 100.0, 1) if total > 0 else 0.0,
        priority_accuracy=round((prio_matches  / total) * 100.0, 1) if total > 0 else 0.0,
        needs_human_accuracy=round((human_matches / total) * 100.0, 1) if total > 0 else 0.0,
        misclassifications=misclassifications,
        results=results,
    )
