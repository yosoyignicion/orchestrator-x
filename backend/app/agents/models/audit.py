"""Pydantic models for the full audit report (output of the agent pipeline)."""

from __future__ import annotations

from pydantic import BaseModel, Field


class TechStackItem(BaseModel):
    """A detected technology in the audit."""

    name: str
    category: str = ""
    version: str | None = None
    is_obsolete: bool = False
    recommendation: str = ""


class InfrastructureBottleneck(BaseModel):
    """A detected infrastructure or performance bottleneck."""

    area: str = Field(..., description="e.g. 'Hosting', 'CDN', 'Database', 'JS Bundling'")
    severity: str = Field(default="medium", pattern=r"^(low|medium|high|critical)$")
    description: str
    estimated_impact: str = ""


class SEOBreakdown(BaseModel):
    """Detailed SEO scoring."""

    score: int = Field(default=0, ge=0, le=100)
    meta_tags: int = Field(default=0, ge=0, le=100)
    headings: int = Field(default=0, ge=0, le=100)
    performance: int = Field(default=0, ge=0, le=100)
    mobile_friendly: int = Field(default=50, ge=0, le=100, description="Heuristic estimate")
    key_issues: list[str] = Field(default_factory=list)


class UxUIBreakdown(BaseModel):
    """UX/UI quality estimation."""

    score: int = Field(default=0, ge=0, le=100)
    has_modern_framework: bool = False
    has_responsive_design: bool = False
    has_accessible_markup: bool = False
    estimated_conversion_penalty_pct: float = Field(default=0.0, ge=0.0, le=100.0)


class AIRecommendation(BaseModel):
    """One recommendation in the AI implementation roadmap."""

    title: str
    impact_level: str = Field(default="medium", pattern=r"^(low|medium|high|critical)$")
    description: str
    effort: str = Field(default="medium", pattern=r"^(low|medium|high)$")
    category: str = Field(default="", description="e.g. 'chatbot', 'automation', 'analytics', 'content'")


class AuditReport(BaseModel):
    """Complete audit report — output of the 3-agent pipeline."""

    url: str
    business_niche: str = Field(default="", description="Classified niche: B2B, e-commerce, SaaS, media, etc.")
    maturity_score: int = Field(default=0, ge=0, le=100, description="Overall digital maturity score")
    tech_stack: list[TechStackItem] = Field(default_factory=list)
    bottlenecks: list[InfrastructureBottleneck] = Field(default_factory=list)
    seo: SEOBreakdown = Field(default_factory=SEOBreakdown)
    ux_ui: UxUIBreakdown = Field(default_factory=UxUIBreakdown)
    ai_roadmap: list[AIRecommendation] = Field(default_factory=list)
    summary: str = Field(default="", description="Executive summary for the client")
    error: str | None = Field(default=None)
