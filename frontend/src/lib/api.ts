/** API client for Orchestrator-X backend. */

import type { AuditReport, ExtractionResult, Job, OllamaModel } from "../types/audit";

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

// ── Job / Queue API ──────────────────────────────────────────────

export async function enqueueJob(url: string, model?: string): Promise<{ job_id: string }> {
  const res = await fetch(`${API_BASE}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function listJobs(limit = 50, offset = 0): Promise<{ jobs: Job[]; total: number }> {
  const res = await fetch(`${API_BASE}/api/jobs?limit=${limit}&offset=${offset}`);
  if (!res.ok) return { jobs: [], total: 0 };
  return res.json();
}

export async function getJob(jobId: string): Promise<Job> {
  const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
  if (!res.ok) throw new Error("Job not found");
  return res.json();
}

export async function deleteJob(jobId: string): Promise<void> {
  await fetch(`${API_BASE}/api/jobs/${jobId}`, { method: "DELETE" });
}

/**
 * Subscribe to SSE stream for a job. Calls `onProgress` with each update.
 * Returns an AbortController to stop listening.
 */
export function subscribeJob(
  jobId: string,
  onProgress: (job: Job) => void,
): AbortController {
  const controller = new AbortController();

  const es = new EventSource(`${API_BASE}/api/jobs/${jobId}/stream`);

  es.onmessage = (event) => {
    if (event.data === "__DONE__") {
      es.close();
      return;
    }
    try {
      const job: Job = JSON.parse(event.data);
      onProgress(job);
    } catch {
      // ignore parse errors
    }
  };

  es.onerror = () => {
    es.close();
  };

  // AbortController cleanup
  controller.signal.addEventListener("abort", () => es.close());

  return controller;
}

export async function fetchProviders(): Promise<{ active: string | null }> {
  try {
    const res = await fetch(`${API_BASE}/api/providers`);
    if (!res.ok) return { active: null };
    return res.json();
  } catch {
    return { active: null };
  }
}
