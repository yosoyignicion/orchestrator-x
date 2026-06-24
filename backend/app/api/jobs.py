"""Jobs API router — queue management, SSE streaming, and history."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.models.extraction import ExtractionRequest
from app.agents.pipeline import run_pipeline
from app.core import EXTRACT_TIMEOUT_MS
from app.services.extractor import extract_url
from app.services.job_manager import Job, event_store, job_manager
from app.services.provider import detect_providers

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["jobs"])


# ── Schemas ────────────────────────────────────────────────────────────────


class EnqueueRequest(BaseModel):
    url: str
    model: str | None = None
    type: str = "audit"
    business_name: str = ""
    sector: str = ""


class EnqueueResponse(BaseModel):
    job_id: str
    url: str
    status: str
    created_at: str


class JobListResponse(BaseModel):
    jobs: list[dict]
    total: int


class ProviderStatus(BaseModel):
    ollama: dict
    lm_studio: dict
    active: str | None


# ── Endpoints ──────────────────────────────────────────────────────────────


@router.post("/jobs", response_model=EnqueueResponse)
async def enqueue_job(req: EnqueueRequest):
    """Enqueue a new audit job."""
    job = await job_manager.enqueue(req.url, model=req.model, type=req.type)
    return EnqueueResponse(
        job_id=job.id,
        url=job.url,
        status=job.status,
        created_at=job.created_at,
    )


@router.get("/jobs", response_model=JobListResponse)
async def list_jobs(limit: int = 50, offset: int = 0):
    """List all jobs ordered by creation date (newest first)."""
    jobs = await job_manager.list_jobs(limit=limit, offset=offset)
    return JobListResponse(
        jobs=[j.to_dict() for j in jobs],
        total=len(jobs),
    )


@router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    """Get a single job by ID."""
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.to_dict()


@router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job from history."""
    await job_manager.delete_job(job_id)
    return {"deleted": True}


@router.get("/jobs/{job_id}/stream")
async def stream_job(job_id: str):
    """SSE stream of job progress updates."""
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    from fastapi.responses import StreamingResponse

    return StreamingResponse(
        event_store.subscribe(job_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/providers", response_model=ProviderStatus)
async def get_providers():
    """Detect available LLM providers (Ollama / LM Studio)."""
    status = await detect_providers()
    return ProviderStatus(**status)


# ── Worker process function — connected to existing pipeline ────────────────


async def _process_audit_job(job: Job, update):
    """Process a single audit job: extraction → pipeline → store result.

    Auto-detects Ollama or LM Studio as the LLM provider.
    Pushes progress updates via SSE through the update callback.
    """
    # Phase 1: extraction
    job.phase = "Lanzando navegador headless..."
    job.progress = 10
    await update(job)

    extraction = await extract_url(job.url, timeout_ms=EXTRACT_TIMEOUT_MS)
    if extraction.error:
        raise RuntimeError(extraction.error)

    job.phase = "Analizando tecnologías y frameworks..."
    job.progress = 35
    await update(job)

    # Phase 2: detect provider before agent pipeline
    job.phase = "Detectando proveedor de IA (Ollama / LM Studio)..."
    job.progress = 45
    await update(job)

    provider_info = await detect_providers()
    active_provider = provider_info.get("active", "ollama")
    job.phase = f"Consultando agentes de IA ({active_provider})..."
    job.progress = 60
    await update(job)

    report = await run_pipeline(
        extraction,
        model_override=job.model or None,
        provider_override=active_provider if active_provider else None,
    )

    if report.error:
        raise RuntimeError(report.error)

    job.phase = "Generando reporte personalizado..."
    job.progress = 90
    await update(job)

    # Store result as JSON
    job.result = report.model_dump_json(indent=2)
    job.phase = "Auditoría completada ✅"
    job.progress = 100
    await update(job)
