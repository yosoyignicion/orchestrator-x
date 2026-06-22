/** API client for Orchestrator-X backend. */

import type { AuditReport, ExtractionResult, OllamaModel } from "../types/audit";

const API_BASE = ""; // relative — Next.js rewrites /api/* → backend
const AUDIT_TIMEOUT_MS = 120_000;

export async function fetchModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${API_BASE}/api/models`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.models ?? [];
  } catch {
    return [];
  }
}

export async function auditUrl(url: string, model?: string): Promise<AuditReport> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUDIT_TIMEOUT_MS);

  const body: Record<string, unknown> = { url };
  if (model) body.model = model;

  try {
    const res = await fetch(`${API_BASE}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${res.status}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractUrl(url: string): Promise<ExtractionResult> {
  const res = await fetch(`${API_BASE}/api/extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}
