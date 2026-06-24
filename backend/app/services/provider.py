"""Auto-detect available local LLM providers: Ollama and/or LM Studio."""

from __future__ import annotations

import logging

import httpx

from app.core import LM_STUDIO_URL, OLLAMA_BASE_URL

log = logging.getLogger(__name__)

TIMEOUT_S = 3


async def detect_providers() -> dict:
    """Check which local providers are reachable and list their models.

    Returns:
        {
            "ollama": {"online": bool, "models": [{"name", "size_bytes", "modified_at"}]},
            "lm_studio": {"online": bool, "models": [{"id", "object", "created"}]},
            "active": str | None  # "ollama" | "lm_studio" | None
        }
    """
    result = {"ollama": {"online": False, "models": []}, "lm_studio": {"online": False, "models": []}, "active": None}

    # ── Ollama ──────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_S) as c:
            r = await c.get(f"{OLLAMA_BASE_URL}/api/tags")
            if r.is_success:
                data = r.json()
                models = data.get("models", [])
                result["ollama"] = {
                    "online": True,
                    "models": [
                        {"name": m["name"], "size_bytes": m.get("size", 0), "modified_at": m.get("modified_at", "")}
                        for m in models
                    ],
                }
                log.info("Ollama detected: %d model(s)", len(models))
    except Exception:
        log.debug("Ollama not reachable at %s", OLLAMA_BASE_URL)

    # ── LM Studio ───────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT_S) as c:
            r = await c.get(f"{LM_STUDIO_URL}/models")
            if r.is_success:
                data = r.json()
                models = data if isinstance(data, list) else data.get("data", [])
                result["lm_studio"] = {
                    "online": True,
                    "models": [
                        {"id": m.get("id", ""), "object": m.get("object", "model"), "created": m.get("created", 0)}
                        for m in models
                    ],
                }
                log.info("LM Studio detected: %d model(s)", len(models))
    except Exception:
        log.debug("LM Studio not reachable at %s", LM_STUDIO_URL)

    # ── Pick active ─────────────────────────────────────────
    if result["ollama"]["online"] and len(result["ollama"]["models"]) > 0:
        result["active"] = "ollama"
    elif result["lm_studio"]["online"] and len(result["lm_studio"]["models"]) > 0:
        result["active"] = "lm_studio"

    return result


async def health_check() -> dict:
    """Quick provider health (used by /api/health)."""
    return await detect_providers()
