import os
import json
import time
import asyncio
import gradio as gr
from dotenv import load_dotenv

# Load local environment variables (.env) if present
load_dotenv()

# Import spaces for Hugging Face ZeroGPU dynamic allocation
try:
    import spaces
    SPACES_AVAILABLE = True
except ImportError:
    SPACES_AVAILABLE = False

    # Effect-free fallback decorator for local environments without ZeroGPU
    class _MockSpaces:
        @staticmethod
        def GPU(task=None, duration=None, **kwargs):
            if task is not None and callable(task):
                return task
            def decorator(fn):
                return fn
            return decorator

    spaces = _MockSpaces()

# Import pure engine components (untouched core logic)
from app.utils.normalizer import normalize_input, detect_injection, get_injection_response
from app.engine.triage import run_triage
from app.engine.evaluator import run_evaluation

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_test_cases():
    """Reads data/test_cases.json and cross-references data/ground_truth.json."""
    file_path = os.path.join(BASE_DIR, "data", "test_cases.json")
    gt_path = os.path.join(BASE_DIR, "data", "ground_truth.json")

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

    return mapped_cases


def get_engine_info():
    """Returns runtime engine configuration without exposing secrets."""
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
        "laya_model": "convaiinnovations/laya (ModernBERT decision router)",
        "spaces_gpu_available": SPACES_AVAILABLE
    }


# ---------------------------------------------------------------------------
# Gradio Endpoint Functions (ZeroGPU Decorated)
# ---------------------------------------------------------------------------

@spaces.GPU(duration=60)
def triage_fn(message: str, provider: str = "hybrid") -> dict:
    """
    ZeroGPU triage entry point:
    1. Normalizes input via existing normalize_input
    2. Runs pre-LLM injection detection via existing detect_injection
    3. Calls existing run_triage (Laya ModernBERT / Groq Deep)
    4. Returns exact dictionary schema expected by the frontend
    """
    start_time = time.perf_counter()

    if not message or not str(message).strip():
        return {
            "error": "Message payload cannot be empty.",
            "latency_ms": 0.0
        }

    # Normalize input
    try:
        clean_text = normalize_input(str(message))
    except Exception as e:
        return {
            "error": f"Failed to normalize payload: {str(e)}",
            "latency_ms": round((time.perf_counter() - start_time) * 1000.0, 2)
        }

    # Pre-LLM injection detection on cleaned text
    if detect_injection(clean_text):
        injection_decision = get_injection_response()
        elapsed_time = (time.perf_counter() - start_time) * 1000.0
        return {
            "decision": injection_decision.model_dump(),
            "clean_text": clean_text,
            "latency_ms": round(elapsed_time, 2)
        }

    # Run triage coordinator
    try:
        decision = asyncio.run(run_triage(clean_text, provider=provider))
    except Exception as e:
        elapsed_time = (time.perf_counter() - start_time) * 1000.0
        return {
            "error": f"Triage execution error: {str(e)}",
            "latency_ms": round(elapsed_time, 2)
        }

    elapsed_time = (time.perf_counter() - start_time) * 1000.0
    return {
        "decision": decision.model_dump() if hasattr(decision, "model_dump") else decision,
        "clean_text": clean_text,
        "latency_ms": round(elapsed_time, 2)
    }


@spaces.GPU(duration=120)
def evaluate_fn(provider: str = "hybrid") -> dict:
    """
    Runs full evaluation against ground_truth.json dataset under ZeroGPU.
    """
    start_time = time.perf_counter()
    try:
        report = asyncio.run(run_evaluation(provider=provider))
        elapsed_time = (time.perf_counter() - start_time) * 1000.0
        report_dict = report.model_dump() if hasattr(report, "model_dump") else report
        report_dict["latency_ms"] = round(elapsed_time, 2)
        return report_dict
    except Exception as e:
        elapsed_time = (time.perf_counter() - start_time) * 1000.0
        return {
            "error": f"Evaluation run failed: {str(e)}",
            "latency_ms": round(elapsed_time, 2)
        }


def test_cases_fn() -> list:
    """Returns mapped test cases from data/test_cases.json."""
    return load_test_cases()


def engine_info_fn() -> dict:
    """Returns runtime engine configuration."""
    return get_engine_info()


# ---------------------------------------------------------------------------
# Gradio UI & Named API Endpoint Registration
# ---------------------------------------------------------------------------

with gr.Blocks(title="Conduit AI Engine") as demo:
    gr.Markdown("# ⚡ Conduit AI — Intelligent Decision Routing Engine")
    gr.Markdown("High-throughput hybrid triage architecture on Hugging Face ZeroGPU.")

    with gr.Tab("Triage"):
        with gr.Row():
            triage_input = gr.Textbox(
                label="Support Ticket Message",
                placeholder="Paste ticket message or JSON/HTML payload...",
                lines=5,
                value="Hi, I was charged $49.00 today but our subscription is only $29.00. Please refund the difference."
            )
            provider_dropdown = gr.Dropdown(
                choices=["hybrid", "laya", "groq"],
                value="hybrid",
                label="Inference Provider"
            )
        triage_output = gr.JSON(label="Decision Output")
        triage_button = gr.Button("Run Triage", variant="primary")
        triage_button.click(
            fn=triage_fn,
            inputs=[triage_input, provider_dropdown],
            outputs=triage_output,
            api_name="triage"
        )

    with gr.Tab("Evaluation Suite"):
        eval_provider_dropdown = gr.Dropdown(
            choices=["hybrid", "laya", "groq"],
            value="hybrid",
            label="Evaluation Provider"
        )
        eval_output = gr.JSON(label="Evaluation Report")
        eval_button = gr.Button("Run Evaluation Suite", variant="secondary")
        eval_button.click(
            fn=evaluate_fn,
            inputs=[eval_provider_dropdown],
            outputs=eval_output,
            api_name="evaluate"
        )

    with gr.Tab("Test Cases"):
        tc_output = gr.JSON(label="Dataset Test Cases")
        tc_button = gr.Button("Fetch Test Cases")
        tc_button.click(
            fn=test_cases_fn,
            inputs=[],
            outputs=tc_output,
            api_name="test_cases"
        )

    with gr.Tab("Engine Status"):
        info_output = gr.JSON(label="Engine Configuration")
        info_button = gr.Button("Check Engine Status")
        info_button.click(
            fn=engine_info_fn,
            inputs=[],
            outputs=info_output,
            api_name="engine_info"
        )

# Launch native Gradio server with request queueing enabled for ZeroGPU
if __name__ == "__main__":
    demo.queue().launch(server_name="0.0.0.0", server_port=7860)
