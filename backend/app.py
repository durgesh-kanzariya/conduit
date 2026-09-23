import asyncio
import gradio as gr

# Try importing spaces (available on Hugging Face ZeroGPU)
try:
    import spaces
    SPACES_AVAILABLE = True
except ImportError:
    SPACES_AVAILABLE = False

from app.routers import health_router, triage_router, eval_router
from app.engine.triage import run_triage

def _run_triage_sync(text: str):
    return asyncio.run(run_triage(text, provider="hybrid"))

# ZeroGPU requires a function decorated with @spaces.GPU bound to a Gradio component
if SPACES_AVAILABLE:
    @spaces.GPU
    def triage_interactive(text: str):
        if not text.strip():
            return "Please enter a message to triage."
        decision = _run_triage_sync(text)
        return (
            f"Category: {decision.category}\n"
            f"Priority: {decision.priority}\n"
            f"Needs Human: {decision.needs_human}\n"
            f"Confidence: {decision.confidence}\n"
            f"Tier Used: {decision.tier_used}\n"
            f"Summary: {decision.summary}"
        )
else:
    def triage_interactive(text: str):
        if not text.strip():
            return "Please enter a message to triage."
        decision = _run_triage_sync(text)
        return (
            f"Category: {decision.category}\n"
            f"Priority: {decision.priority}\n"
            f"Needs Human: {decision.needs_human}\n"
            f"Confidence: {decision.confidence}\n"
            f"Tier Used: {decision.tier_used}\n"
            f"Summary: {decision.summary}"
        )

# Gradio Dashboard mounted at /gradio
with gr.Blocks(title="Conduit AI Engine") as demo:
    gr.Markdown("# ⚡ Conduit AI — Intelligent Decision Routing Engine")
    gr.Markdown("The backend REST API is online and serving requests for Vercel.")
    with gr.Row():
        input_text = gr.Textbox(
            label="Test Message",
            placeholder="Type a support ticket payload here...",
            value="Hi, I just noticed my card was charged $49.00 today but my subscription tier is $29.00. Please refund.",
            lines=3
        )
        output_text = gr.Textbox(label="Live Triage Decision", interactive=False, lines=6)
    btn = gr.Button("Run Triage", variant="primary")
    btn.click(fn=triage_interactive, inputs=input_text, outputs=output_text)

# Mount Gradio at /gradio so all FastAPI endpoints (/api/triage, /health, etc.) are top-level
app = gr.mount_gradio_app(fastapi_app, demo, path="/gradio")

