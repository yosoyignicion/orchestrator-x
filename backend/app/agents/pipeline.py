"""Agent pipeline: single unified call to Ollama or LM Studio for the audit report.

Auto-detects which provider is available. Falls back gracefully.
"""

from __future__ import annotations

import json
import logging

import httpx

from app.agents.models.audit import (
    AIRecommendation,
    AuditReport,
    InfrastructureBottleneck,
    SEOBreakdown,
    TechStackItem,
    UxUIBreakdown,
)
from app.agents.models.extraction import ExtractionResult
from app.agents.prompts import UNIFIED_AGENT_SYSTEM
from app.core import LLM_MODEL, LM_STUDIO_URL, OLLAMA_BASE_URL
from app.services.provider import detect_providers

log = logging.getLogger(__name__)

OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL}/api/generate"
LM_STUDIO_CHAT_URL = f"{LM_STUDIO_URL}/chat/completions"
REQUEST_TIMEOUT = 120  # reasoning models need more time


async def _detect_active_provider() -> tuple[str, str | None]:
    """Return (provider_name, model_name_or_None).

    provider_name is "ollama" or "lm_studio".
    model_name is the default model string for that provider.
    """
    status = await detect_providers()
    if status["active"] == "lm_studio":
        models = status["lm_studio"]["models"]
        model = models[0]["id"] if models else None
        return "lm_studio", model
    # Default to Ollama
    models = status["ollama"]["models"]
    model = models[0]["name"] if models else None
    return "ollama", model or LLM_MODEL


async def _call_ollama(system: str, user_prompt: str, model: str | None = None) -> str | None:
    """Call Ollama /api/generate."""
    active_model = model or LLM_MODEL
    payload = {
        "model": active_model,
        "system": system,
        "prompt": user_prompt,
        "stream": False,
        "options": {"temperature": 0.1, "num_predict": 2048},
    }
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.post(OLLAMA_GENERATE_URL, json=payload)
            resp.raise_for_status()
            return resp.json().get("response", "").strip()
    except Exception as e:
        log.warning("Ollama error (%s): %s", active_model, e)
        return None


async def _call_lm_studio(system: str, user_prompt: str, model: str | None = None) -> str | None:
    """Call LM Studio /v1/chat/completions (OpenAI-compatible).

    Handles reasoning models (gemma-4-e2b) where content may be in
    reasoning_content field.
    """
    active_model = model or "google/gemma-4-e2b"
    payload = {
        "model": active_model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.1,
        "max_tokens": 4096,
        "stream": False,
    }
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            resp = await client.post(LM_STUDIO_CHAT_URL, json=payload)
            resp.raise_for_status()
            data = resp.json()
            msg = data["choices"][0]["message"]
            content = msg.get("content", "") or ""
            reasoning = msg.get("reasoning_content", "") or ""
            return content if content.strip() else reasoning
    except Exception as e:
        log.warning("LM Studio error (%s): %s", active_model, e)
        return None


async def call_llm(
    system: str, user_prompt: str,
    provider: str | None = None,
    model: str | None = None,
) -> str | None:
    """Unified LLM call — routes to Ollama or LM Studio based on active provider."""
    if provider is None:
        provider, detected_model = await _detect_active_provider()
        model = model or detected_model

    if provider == "lm_studio":
        return await _call_lm_studio(system, user_prompt, model)
    return await _call_ollama(system, user_prompt, model)


def _extract_json(text: str) -> dict | None:
    """Extract JSON from model output, tolerating markdown fences."""
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    if "```json" in text:
        start = text.index("```json") + 7
        end = text.index("```", start) if "```" in text[start:] else len(text)
        try:
            return json.loads(text[start:end].strip())
        except (json.JSONDecodeError, ValueError):
            pass
    try:
        start = text.index("{")
        end = text.rindex("}") + 1
        return json.loads(text[start:end])
    except (ValueError, json.JSONDecodeError):
        pass
    return None


def _build_context(extraction: ExtractionResult) -> str:
    """Build a compact context string from extraction data."""
    techs = ", ".join(f"{t.name}" for t in extraction.technologies)
    h1 = "; ".join(extraction.headings.h1[:3])
    h2 = "; ".join(extraction.headings.h2[:5])
    return (
        f"URL: {extraction.url}\n"
        f"Title: {extraction.title}\n"
        f"Meta: {extraction.meta_description[:200]}\n"
        f"Technologies: {techs}\n"
        f"H1: {h1}\n"
        f"H2: {h2}\n"
        f"Load: {extraction.performance.load_time_ms}ms | "
        f"Size: {extraction.performance.page_size_bytes//1024}KB | "
        f"Resources: {extraction.performance.resource_count}\n"
        f"CSP={'Yes' if extraction.security.has_csp else 'No'} | "
        f"HSTS={'Yes' if extraction.security.has_hsts else 'No'} | "
        f"XFrame={'Yes' if extraction.security.has_xframe else 'No'}"
    )


VALID_NICHES = {"saas", "e-commerce", "ecommerce", "b2b", "b2c", "media",
                "education", "inmobiliaria", "salud", "industria", "startup", "other"}


def _sanitize_niche(raw: str) -> str:
    if not raw:
        return "other"
    val = raw.split("|")[0].split(",")[0].strip().lower()
    normalizations = {"ecommerce": "e-commerce", "real estate": "inmobiliaria",
                      "health": "salud", "industry": "industria"}
    val = normalizations.get(val, val)
    return val if val in VALID_NICHES else "other"


async def run_pipeline(
    extraction: ExtractionResult,
    model_override: str | None = None,
    provider_override: str | None = None,
) -> AuditReport:
    """Run the unified audit pipeline — calls Ollama or LM Studio.

    Args:
        extraction: ExtractionResult from extract_url()
        model_override: Specific model name to use
        provider_override: "ollama" or "lm_studio" — auto-detected if None
    """
    context = _build_context(extraction)
    provider = provider_override

    if provider is None:
        provider, _ = await _detect_active_provider()

    log.info("Calling unified agent pipeline (%s)…", provider)
    raw = await call_llm(UNIFIED_AGENT_SYSTEM, context, provider=provider, model=model_override)
    data = _extract_json(raw) or {}

    if not data:
        return AuditReport(
            url=extraction.url,
            error=f"Pipeline ({provider}) returned no valid JSON",
        )

    bottlenecks_raw = data.get("bottlenecks", [])
    bottlenecks = [
        InfrastructureBottleneck(
            area=b.get("area", "Unknown"),
            severity=b.get("severity", "medium"),
            description=b.get("desc", b.get("description", "")),
            estimated_impact=b.get("estimated_impact", ""),
        )
        for b in bottlenecks_raw
    ]

    roadmap_raw = data.get("roadmap", data.get("ai_roadmap", []))
    roadmap = [
        AIRecommendation(
            title=r.get("title", ""),
            impact_level=r.get("impact", r.get("impact_level", "medium")),
            description=r.get("desc", r.get("description", "")),
            effort=r.get("effort", "medium"),
            category=r.get("category", ""),
        )
        for r in roadmap_raw
    ]

    tech_stack = [
        TechStackItem(name=t.name, category=t.category, version=t.version)
        for t in extraction.technologies
    ]

    niche = _sanitize_niche(data.get("niche", data.get("business_niche", "")))
    maturity = data.get("maturity", data.get("maturity_score", 50))
    seo_score = data.get("seo", data.get("seo_score", 0))
    ux_score = data.get("ux", data.get("ux_score", 0))
    issues = data.get("issues", data.get("seo_key_issues", []))
    summary = data.get("summary", "")

    return AuditReport(
        url=extraction.url,
        business_niche=niche,
        maturity_score=maturity,
        tech_stack=tech_stack,
        bottlenecks=bottlenecks,
        seo=SEOBreakdown(
            score=seo_score,
            meta_tags=data.get("seo_meta_tags", 0),
            headings=data.get("seo_headings", 0),
            performance=data.get("seo_performance", 0),
            mobile_friendly=data.get("seo_mobile", data.get("seo_mobile_friendly", 50)),
            key_issues=issues,
        ),
        ux_ui=UxUIBreakdown(
            score=ux_score,
            has_modern_framework=data.get("ux_modern_framework", False),
            has_responsive_design=data.get("ux_responsive", False),
            has_accessible_markup=data.get("ux_accessible", False),
            estimated_conversion_penalty_pct=data.get("ux_conversion_penalty_pct", 0.0),
        ),
        ai_roadmap=roadmap,
        summary=summary,
    )
