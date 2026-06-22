"""Audit API router — chains extraction + agent pipeline."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.agents.models.audit import AuditReport
from app.agents.models.extraction import ExtractionRequest, ExtractionResult
from app.agents.pipeline import run_pipeline
from app.core import EXTRACT_TIMEOUT_MS
from app.services.extractor import extract_url

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["audit"])


@router.post("/audit", response_model=AuditReport)
async def audit_webpage(req: ExtractionRequest) -> AuditReport:
    """Full audit pipeline: extract → business analysis → technical audit → solutions."""
    log.info("Audit requested for %s", req.url)

    # Step 1: Extraction (zero LLM tokens)
    extraction: ExtractionResult = await extract_url(req.url, timeout_ms=EXTRACT_TIMEOUT_MS)
    if extraction.error:
        log.warning("Extraction failed for %s: %s", req.url, extraction.error)
        raise HTTPException(status_code=422, detail=f"Extraction failed: {extraction.error}")

    log.info(
        "Extraction OK: %d techs, %dms load, %dKB",
        len(extraction.technologies),
        extraction.performance.load_time_ms,
        extraction.performance.page_size_bytes // 1024,
    )

    # Step 2: Agent pipeline (Ollama + gemma3:4b via Vulkan GPU)
    report = await run_pipeline(extraction)

    if report.error:
        log.warning("Pipeline error for %s: %s", req.url, report.error)
    else:
        log.info(
            "Audit complete: niche=%s, maturity=%d, seo=%d, roadmap=%d items",
            report.business_niche,
            report.maturity_score,
            report.seo.score,
            len(report.ai_roadmap),
        )

    return report
