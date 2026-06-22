from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

from app.api.extract import router as extract_router
from app.api.audit import router as audit_router
from app.api.models import router as models_router
from app.core import OLLAMA_BASE_URL

app = FastAPI(
    title="Orchestrator-X API",
    version="0.1.0",
    description="Backend de extracción técnica y pipeline de agentes IA",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(extract_router)
app.include_router(audit_router)
app.include_router(models_router)


@app.get("/api/health")
async def health():
    ollama_ok = False
    try:
        async with httpx.AsyncClient(timeout=3) as c:
            r = await c.get(f"{OLLAMA_BASE_URL}/api/tags")
            ollama_ok = r.is_success
    except Exception:
        pass
    return {
        "status": "ok",
        "version": "0.1.0",
        "ollama": ollama_ok,
    }
