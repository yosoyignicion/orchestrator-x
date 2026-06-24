"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { enqueueJob, subscribeJob } from "@/lib/api";
import type { Job } from "@/types/audit";

const STATUS_CFG: Record<string, { label: string; class: string }> = {
  queued: { label: "En cola", class: "text-muted-foreground border-border" },
  processing: { label: "Procesando", class: "text-primary border-primary/40" },
  done: { label: "Completado", class: "text-emerald-400 border-emerald-500/30" },
  error: { label: "Error", class: "text-red-400 border-red-500/30" },
};

export default function QueuePage() {
  const [url, setUrl] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isEnqueuing, setIsEnqueuing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subsRef = useRef<Map<string, AbortController>>(new Map());

  // Subscribe SSE for processing jobs
  const watchJob = useCallback((job: Job) => {
    if (job.status !== "processing" && job.status !== "queued") return;
    if (subsRef.current.has(job.id)) return;

    const ctrl = subscribeJob(job.id, (updated) => {
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
      if (updated.status === "done" || updated.status === "error") {
        subsRef.current.delete(updated.id);
      }
    });
    subsRef.current.set(job.id, ctrl);
  }, []);

  // Load existing jobs on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/jobs?limit=20&offset=0");
        const data = await res.json();
        setJobs(data.jobs ?? []);
        for (const j of data.jobs ?? []) watchJob(j);
      } catch {
        // backend offline
      }
    })();
    return () => {
      subsRef.current.forEach((c) => c.abort());
    };
  }, [watchJob]);

  const handleEnqueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isEnqueuing) return;

    setIsEnqueuing(true);
    setError(null);
    try {
      const { job_id } = await enqueueJob(url.trim());
      // Add to local state optimistically
      const newJob: Job = {
        id: job_id,
        type: "audit",
        url: url.trim(),
        model: "",
        business_name: "",
        sector: "",
        status: "queued",
        progress: 0,
        phase: "En cola...",
        result: "",
        error: "",
        created_at: new Date().toISOString(),
        completed_at: null,
      };
      setJobs((prev) => [newJob, ...prev]);
      watchJob(newJob);
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al encolar");
    } finally {
      setIsEnqueuing(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Cola de Auditorías
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Añade URLs para auditar. El sistema las procesa una a una con progreso en tiempo real.
        </p>
      </div>

      {/* Enqueue form */}
      <form onSubmit={handleEnqueue} className="flex w-full gap-3 mb-8">
        <div className="relative flex-1">
          <Input
            type="url"
            placeholder="https://tudominio.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isEnqueuing}
            className="h-12 w-full bg-card pr-10 text-base shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!url.trim() || isEnqueuing}
          className="h-12 min-w-[120px] bg-primary px-8 font-semibold text-white hover:bg-primary/90"
        >
          {isEnqueuing ? "Encolando..." : "Auditar →"}
        </Button>
      </form>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Queue list */}
      <div className="space-y-2">
        {jobs.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No hay trabajos en la cola. Añade una URL para empezar.
          </div>
        )}

        {jobs.map((job) => {
          const st = STATUS_CFG[job.status] || STATUS_CFG.queued;
          const isActive = job.status === "processing" || job.status === "queued";
          return (
            <Link key={job.id} href={`/audit/${job.id}`} className="block">
              <Card
                className={`border-border/50 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-sm ${
                  isActive ? "border-primary/20" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {job.url.replace(/^https?:\/\//, "")}
                        </span>
                        <Badge
                          variant="outline"
                          className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${st.class}`}
                        >
                          {st.label}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {job.phase}
                      </p>
                    </div>

                    {/* Progress or result */}
                    {job.status === "processing" && (
                      <div className="w-24">
                        <Progress value={job.progress} className="h-1.5" />
                        <span className="mt-1 block text-right text-[10px] text-muted-foreground">
                          {job.progress}%
                        </span>
                      </div>
                    )}
                    {job.status === "done" && (
                      <span className="shrink-0 text-sm text-emerald-400">✅</span>
                    )}
                    {job.status === "error" && (
                      <span className="shrink-0 text-sm text-red-400">⚠️</span>
                    )}
                    {job.status === "queued" && (
                      <div className="h-2 w-2 animate-pulse rounded-full bg-primary/60" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Footer nav */}
      <div className="mt-10 border-t border-border/30 pt-4">
        <Link
          href="/"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          ← Dashboard
        </Link>
        <Link
          href="/history"
          className="ml-4 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          Historial completo →
        </Link>
      </div>
    </div>
  );
}
