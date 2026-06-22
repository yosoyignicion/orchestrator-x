"""Extraction API router."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.agents.models.extraction import ExtractionRequest, ExtractionResult
from app.core import EXTRACT_TIMEOUT_MS
from app.services.extractor import extract_url

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["extraction"])


@router.post("/extract", response_model=ExtractionResult)
async def extract_webpage(req: ExtractionRequest) -> ExtractionResult:
    """Extract structured data from a given URL."""
    log.info("Extracting %s", req.url)
    result = await extract_url(req.url, timeout_ms=EXTRACT_TIMEOUT_MS)
    if result.error:
        raise HTTPException(status_code=422, detail=result.error)
    log.info("Extraction OK: %s — %d techs", req.url, len(result.technologies))
    return result
