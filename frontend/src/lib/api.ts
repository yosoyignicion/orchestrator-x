/** API client for Orchestrator-X backend. */

import type { AuditReport, ExtractionResult } from "../types/audit";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AUDIT_TIMEOUT_MS = 120_000;

export async function auditUrl(url: string): Promise<AuditReport> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUDIT_TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE}/api/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
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
