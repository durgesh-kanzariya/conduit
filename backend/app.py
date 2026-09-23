import gradio as gr
from app.main import app as fastapi_app

# Create clean interactive landing page for the Hugging Face Space
with gr.Blocks(title="Conduit AI Engine") as demo:
    gr.Markdown("""
    # ⚡ Conduit AI — Intelligent Decision Routing Engine
    
    The high-throughput triage engine is live and serving requests.
    
    ### API Endpoints:
    - **POST** `/api/triage` — Real-time ticket normalization and triage
    - **POST** `/api/batch` — High-throughput batch triage
    - **GET** `/api/evaluate?provider=hybrid` — Ground truth benchmark evaluation
    - **GET** `/health` — Service health check
    """)

# Mount FastAPI app onto Gradio
app = gr.mount_gradio_app(fastapi_app, demo, path="/")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
