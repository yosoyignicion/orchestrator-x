/** TypeScript types matching the backend Pydantic models. */

export interface ExtractedTechnology {
  name: string;
  category: string;
  confidence: number;
  version: string | null;
}

export interface HeadingStructure {
  h1: string[];
  h2: string[];
  h3: string[];
}

export interface PerformanceMetrics {
  load_time_ms: number;
  dom_content_loaded_ms: number;
  resource_count: number;
  page_size_bytes: number;
}

export interface SecurityHeaders {
  has_csp: boolean;
  has_hsts: boolean;
  has_xframe: boolean;
  has_xcontent: boolean;
}

export interface ExtractionResult {
  url: string;
  title: string;
  meta_description: string;
  meta_keywords: string;
  favicon: string | null;
  headings: HeadingStructure;
  technologies: ExtractedTechnology[];
  performance: PerformanceMetrics;
  security: SecurityHeaders;
  error: string | null;
}

export interface TechStackItem {
  name: string;
  category: string;
  version: string | null;
  is_obsolete: boolean;
  recommendation: string;
}

export interface Bottleneck {
  area: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  estimated_impact: string;
}

export interface SEOBreakdown {
  score: number;
  meta_tags: number;
  headings: number;
  performance: number;
  mobile_friendly: number;
  key_issues: string[];
}

export interface UxUIBreakdown {
  score: number;
  has_modern_framework: boolean;
  has_responsive_design: boolean;
  has_accessible_markup: boolean;
  estimated_conversion_penalty_pct: number;
}

export interface AIRecommendation {
  title: string;
  impact_level: "low" | "medium" | "high" | "critical";
  description: string;
  effort: "low" | "medium" | "high";
  category: string;
}

export interface AuditReport {
  url: string;
  business_niche: string;
  maturity_score: number;
  tech_stack: TechStackItem[];
  bottlenecks: Bottleneck[];
  seo: SEOBreakdown;
  ux_ui: UxUIBreakdown;
  ai_roadmap: AIRecommendation[];
  summary: string;
  error: string | null;
}

export interface OllamaModel {
  name: string;
  size_bytes: number;
  modified_at: string;
}

// ── Job / Queue types ──────────────────────────────────────────

export interface Job {
  id: string;
  type: string;
  url: string;
  model: string;
  business_name: string;
  sector: string;
  status: "queued" | "processing" | "done" | "error";
  progress: number;
  phase: string;
  result: string;
  error: string;
  created_at: string;
  completed_at: string | null;
}

export interface ProviderStatus {
  ollama: { online: boolean; models: { name: string }[] };
  lm_studio: { online: boolean; models: { id: string }[] };
  active: string | null;
}
