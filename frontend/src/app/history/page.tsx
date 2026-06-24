"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listJobs } from "@/lib/api";
import type { Job } from "@/types/audit";

const STATUS_CFG: Record<string, { label: string; class: string }> = {
  queued: { label: "En cola", class: "text-muted-foreground border-border" },
  processing: { label: "Procesando", class: "text-primary border-primary/40" },
  done: { label: "✅ Completado", class: "text-emerald-400 border-emerald-500/30" },
  error: { label: "⚠️ Error", class: "text-red-400 border-red-500/30" },
};

export default function HistoryPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await listJobs(100, 0);
        setJobs(data.jobs);
      } catch {
        // offline
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = search
    ? jobs.filter((j) => j.url.toLowerCase().includes(search.toLowerCase()))
    : jobs;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Historial de Auditorías
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Todas las auditorías realizadas. Haz clic en una para ver el detalle.
        </p>
      </div>

      {/* Search */}
      <Input
        type="text"
        placeholder="Buscar por URL..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 h-10 w-full max-w-sm bg-card text-sm"
      />

      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Cargando historial...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          {search ? "Sin resultados para esa búsqueda." : "No hay auditorías en el historial."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((job) => {
            const st = STATUS_CFG[job.status] || STATUS_CFG.queued;
            const date = new Date(job.created_at);
            const dateStr = date.toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Link key={job.id} href={`/audit/${job.id}`} className="block">
                <Card className="border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-200 hover:border-primary/30 hover:bg-card/50">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Badge
                      variant="outline"
                      className={`shrink-0 border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${st.class}`}
                    >
                      {st.label}
                    </Badge>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {job.url.replace(/^https?:\/\//, "")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {job.phase || "Sin fase"} · {dateStr}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs text-muted-foreground">
                      {job.progress}%
                    </span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Footer nav */}
      <div className="mt-10 border-t border-border/30 pt-4">
        <Link
          href="/queue"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          ← Volver a la cola
        </Link>
      </div>
    </div>
  );
}
