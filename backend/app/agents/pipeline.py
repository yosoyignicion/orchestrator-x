"""Agent pipeline: single unified call to Ollama for the complete audit report.

Consolidates Business/Technical/Solutions roles into one prompt,
cutting latency from ~108s to ~36s (3× faster).
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
from app.core import LLM_MODEL, OLLAMA_BASE_URL

log = logging.getLogger(__name__)

OLLAMA_GENERATE_URL = f"{OLLAMA_BASE_URL}/api/generate"
REQUEST_TIMEOUT = 60  # GPU inference ~17s, generous buffer


async def _call_ollama(system: str, user_prompt: str) -> str | None:
    """Single Ollama API call."""
    payload = {
        "model": LLM_MODEL,
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
        log.warning("Ollama error: %s", e)
        return None


def _extract_json(text: str) -> dict | None:
    """Extract JSON from model output, tolerating markdown fences."""
    if not text:
        return None
    # Raw parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # ```json ... ``` block
    if "```json" in text:
        start = text.index("```json") + 7
        end = text.index("```", start) if "```" in text[start:] else len(text)
        try:
            return json.loads(text[start:end].strip())
        except (json.JSONDecodeError, ValueError):
            pass
    # First { to last }
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
    """Clean niche from model output — handles pipe/multi-value."""
    if not raw:
        return "other"
    val = raw.split("|")[0].split(",")[0].strip().lower()
    normalizations = {"ecommerce": "e-commerce", "real estate": "inmobiliaria",
                      "health": "salud", "industry": "industria"}
    val = normalizations.get(val, val)
    return val if val in VALID_NICHES else "other"


async def run_pipeline(extraction: ExtractionResult) -> AuditReport:
    """Run the unified audit pipeline — single Ollama call."""
    context = _build_context(extraction)

    log.info("Calling unified agent pipeline (Ollama + %s)...", LLM_MODEL)
    raw = await _call_ollama(UNIFIED_AGENT_SYSTEM, context)
    data = _extract_json(raw) or {}

    if not data:
        return AuditReport(url=extraction.url, error="Agent pipeline returned no valid JSON")

    # ── Parse bottlenecks ─────────────────────────────────
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

    # ── Parse AI roadmap ──────────────────────────────────
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

    # ── Tech stack ────────────────────────────────────────
    tech_stack = [
        TechStackItem(name=t.name, category=t.category, version=t.version)
        for t in extraction.technologies
    ]

    # Map simplified keys
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
        summary=data.get("summary", ""),
    )
