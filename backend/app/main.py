from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.extract import router as extract_router
from app.api.audit import router as audit_router
from app.api.models import router as models_router
from app.api.jobs import router as jobs_router, _process_audit_job
from app.services.job_manager import job_manager
from app.services.provider import health_check


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Start background job worker on boot."""
    await job_manager.start_worker(_process_audit_job)
    yield
    await job_manager.stop_worker()


app = FastAPI(
    title="Orchestrator-X API",
    version="0.2.0",
    description="Backend de extracción técnica y pipeline de agentes IA con cola de trabajos",
    lifespan=lifespan,
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
app.include_router(jobs_router)


@app.get("/api/health")
async def health():
    providers = await health_check()
    return {
        "status": "ok",
        "version": "0.2.0",
        "providers": providers,
    }
