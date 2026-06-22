"""Ollama model discovery — lists available models via Ollama API."""

from __future__ import annotations

import logging

from fastapi import APIRouter
from pydantic import BaseModel

from app.core import OLLAMA_BASE_URL

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["models"])


class OllamaModel(BaseModel):
    name: str
    size_bytes: int
    modified_at: str


class OllamaModelList(BaseModel):
    models: list[OllamaModel]
    status: str  # "ok" | "offline"


@router.get("/models", response_model=OllamaModelList)
async def list_models():
    """List available Ollama models by calling the Ollama API /api/tags."""
    import httpx

    url = f"{OLLAMA_BASE_URL}/api/tags"
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
        raw = data.get("models", [])
        models = [
            OllamaModel(
                name=m["name"],
                size_bytes=m.get("size", 0),
                modified_at=m.get("modified_at", ""),
            )
            for m in raw
        ]
        if not models:
            return OllamaModelList(models=[], status="no_models")
        return OllamaModelList(models=models, status="ok")
    except Exception as e:
        log.warning("Ollama offline: %s", e)
        return OllamaModelList(models=[], status="offline")
