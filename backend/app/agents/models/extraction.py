"""Pydantic models for the extraction pipeline."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ExtractedTechnology(BaseModel):
    """A single technology detected on the page."""

    name: str = Field(..., description="Technology name (e.g. 'Next.js', 'Shopify')")
    category: str = Field(default="", description="Category (CMS, framework, analytics, CDN, etc.)")
    confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    version: str | None = Field(default=None)


class HeadingStructure(BaseModel):
    """Heading hierarchy extracted from the page."""

    h1: list[str] = Field(default_factory=list)
    h2: list[str] = Field(default_factory=list)
    h3: list[str] = Field(default_factory=list)


class PerformanceMetrics(BaseModel):
    """Simulated performance metrics (headless approximation)."""

    load_time_ms: int = Field(default=0, description="Approximate page load time in ms")
    dom_content_loaded_ms: int = Field(default=0)
    resource_count: int = Field(default=0)
    page_size_bytes: int = Field(default=0)


class SecurityHeaders(BaseModel):
    """Key security headers detected in the response."""

    has_csp: bool = False
    has_hsts: bool = False
    has_xframe: bool = False
    has_xcontent: bool = False


class ExtractionResult(BaseModel):
    """Structured result of a URL extraction."""

    url: str
    title: str = ""
    meta_description: str = ""
    meta_keywords: str = ""
    favicon: str | None = None
    headings: HeadingStructure = Field(default_factory=HeadingStructure)
    technologies: list[ExtractedTechnology] = Field(default_factory=list)
    performance: PerformanceMetrics = Field(default_factory=PerformanceMetrics)
    security: SecurityHeaders = Field(default_factory=SecurityHeaders)
    error: str | None = Field(default=None)


class ExtractionRequest(BaseModel):
    url: str = Field(..., description="URL to audit", min_length=4)
