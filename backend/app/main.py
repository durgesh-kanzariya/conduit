"""
Frontline AI Triage Backend Application.
High-throughput FastAPI application with lifespan model preloading and ORJSON serialization.
"""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.routers import health_router, triage_router, eval_router
from app.engine.laya_engine import preload_laya

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Global Model Lifespan: Preloads Laya model weights and executes
    a synthetic warm-up pass before serving public traffic.
    """
    print("[STATUS] Lifespan: Initializing ML models & warm-up...")
    await asyncio.to_thread(preload_laya)
    yield
    print("[STATUS] Lifespan: Teardown complete.")

app = FastAPI(
    title="Frontline AI Triage API",
    description="Dual-tier AI-powered customer support ticket triage system.",
    lifespan=lifespan,
    default_response_class=ORJSONResponse
)

# Configure CORS to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount modular routers
app.include_router(health_router)
app.include_router(triage_router)
app.include_router(eval_router)
