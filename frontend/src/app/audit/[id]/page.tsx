"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MaturityGauge from "@/components/MaturityGauge";
import MetricCard from "@/components/MetricCard";
import TechStackBadge from "@/components/TechStackBadge";
import ConversionPenalty from "@/components/ConversionPenalty";
import BottleneckList from "@/components/BottleneckList";
import AIRecommendations from "@/components/AIRecommendations";
import { getJob, subscribeJob } from "@/lib/api";
import type { Job, AuditReport } from "@/types/audit";

const STATUS_CFG: Record<string, { label: string; class: string }> = {
  queued: { label: "En cola", class: "text-muted-foreground border-border" },
  processing: { label: "Procesando", class: "text-primary border-primary/40" },
  done: { label: "✅ Completado", class: "text-emerald-400 border-emerald-500/30" },
  error: { label: "⚠️ Error", class: "text-red-400 border-red-500/30" },
};

function parseReport(job: Job): AuditReport | null {
  if (!job.result) return null;
  try {
    return JSON.parse(job.result);
  } catch {
    return null;
  }
}

export default function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"client" | "developer">("client");

  useEffect(() => {
    (async () => {
      try {
        const j = await getJob(id);
        setJob(j);

        // Subscribe to SSE if still processing
        if (j.status === "processing" || j.status === "queued") {
          subscribeJob(id, (updated) => {
            setJob(updated);
          });
        }
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-md py-32 text-center text-sm text-muted-foreground">
        Cargando auditoría...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <p className="text-sm text-muted-foreground">Auditoría no encontrada</p>
        <Link href="/queue" className="mt-4 inline-block text-xs text-primary hover:underline">
          ← Volver a la cola
        </Link>
      </div>
    );
  }

  const st = STATUS_CFG[job.status] || STATUS_CFG.queued;
  const report = parseReport(job);
  const isProcessing = job.status === "processing" || job.status === "queued";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/queue"
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            ← Cola
          </Link>
          <Badge
            variant="outline"
            className={`border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${st.class}`}
          >
            {st.label}
          </Badge>
        </div>
        <h1 className="mt-2 text-xl font-bold text-foreground">
          {job.url.replace(/^https?:\/\//, "")}
        </h1>
        <p className="text-xs text-muted-foreground break-all">{job.url}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {new Date(job.created_at).toLocaleString("es-ES")}
        </p>
      </div>

      {/* Processing state */}
      {isProcessing && (
        <div className="mb-8 rounded-xl border border-primary/20 bg-primary/5 p-6 text-center backdrop-blur-sm">
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-2.5 w-2.5 rounded-full bg-primary shadow-lg shadow-primary/50 animate-pulse" />
              </div>
            </div>
          </div>
          <p className="text-sm font-medium text-foreground">{job.phase}</p>
          <Progress value={job.progress} className="mx-auto mt-3 h-1.5 max-w-xs" />
          <p className="mt-2 text-xs text-muted-foreground">{job.progress}%</p>
        </div>
      )}

      {/* Error state */}
      {job.status === "error" && !isProcessing && (
        <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-sm">
          <span className="text-3xl">⚠️</span>
          <p className="mt-2 text-sm font-medium text-red-400">Error en la auditoría</p>
          <p className="mt-1 text-xs text-red-300/80">{job.error}</p>
        </div>
      )}

      {/* Report (done) */}
      {report && job.status === "done" && (
        <>
          {/* Tab selector */}
          <div className="mb-6 flex gap-2">
            <Button
              variant={tab === "client" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("client")}
              className={
                tab === "client"
                  ? "bg-primary text-white"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              }
            >
              👁️ Vista Cliente
            </Button>
            <Button
              variant={tab === "developer" ? "default" : "outline"}
              size="sm"
              onClick={() => setTab("developer")}
              className={
                tab === "developer"
                  ? "bg-primary text-white"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              }
            >
              ⚙️ Vista Developer
            </Button>
          </div>

          <ScrollArea className="w-full">
            {tab === "client" ? (
              /* ════════════ CLIENT VIEW ════════════ */
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="text-center sm:text-left">
                    <Badge variant="secondary" className="mb-2 border-0 bg-primary/10 text-primary">
                      {report.business_niche || "No clasificado"}
                    </Badge>
                    {report.summary && (
                      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                        {report.summary}
                      </p>
                    )}
                  </div>
                  <MaturityGauge score={report.maturity_score} label="Madurez Digital" />
                </div>

                <Separator className="bg-border/40" />

                {/* Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="SEO Técnico"
                    value={`${report.seo.score}/100`}
                    icon="🔍"
                    trend={report.seo.score >= 70 ? "up" : report.seo.score >= 40 ? "neutral" : "down"}
                  />
                  <MetricCard
                    title="UX / UI"
                    value={`${report.ux_ui.score}/100`}
                    icon="🎨"
                    trend={report.ux_ui.score >= 70 ? "up" : report.ux_ui.score >= 40 ? "neutral" : "down"}
                  />
                  <MetricCard
                    title="Rendimiento"
                    value={`${report.seo.performance}/100`}
                    subtitle={`${report.tech_stack.length} tecnologías`}
                    icon="⚡"
                    trend={report.seo.performance >= 70 ? "up" : "neutral"}
                  />
                  <MetricCard
                    title="Accesibilidad"
                    value={report.ux_ui.has_accessible_markup ? "Buena" : "Mejorable"}
                    subtitle={report.ux_ui.has_modern_framework ? "Framework moderno" : "Stack tradicional"}
                    icon="♿"
                    trend={report.ux_ui.has_accessible_markup ? "up" : "down"}
                  />
                </div>

                {/* Tech Stack */}
                {report.tech_stack.length > 0 && (
                  <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-foreground">
                        Stack Tecnológico Detectado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {report.tech_stack.map((t, i) => (
                          <TechStackBadge key={i} name={t.name} category={t.category} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Conversion Penalty */}
                <ConversionPenalty
                  penaltyPct={report.ux_ui.estimated_conversion_penalty_pct}
                  loadTimeMs={report.seo.performance > 0 ? (100 - report.seo.performance) * 50 : 2500}
                />

                {/* Key Issues */}
                {report.seo.key_issues.length > 0 && (
                  <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-foreground">Issues Detectados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1.5">
                        {report.seo.key_issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="mt-0.5 shrink-0 text-primary">•</span>
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Bottlenecks + Roadmap */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <BottleneckList bottlenecks={report.bottlenecks} />
                  <AIRecommendations recommendations={report.ai_roadmap} />
                </div>
              </div>
            ) : (
              /* ════════════ DEVELOPER VIEW ════════════ */
              <div className="space-y-6">
                {/* Stack recomendado */}
                <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-foreground">
                      ⚙️ Stack Recomendado
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Basado en el stack actual detectado y las mejores prácticas del sector
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-lg border border-border/40 bg-background/50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Frontend
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground font-mono">
                          {report.tech_stack.some((t) => t.name === "Next.js")
                            ? "Next.js"
                            : report.tech_stack.some((t) =>
                                ["React", "Vue.js", "Angular", "Svelte"].includes(t.name)
                              )
                              ? report.tech_stack.find((t) =>
                                  ["React", "Vue.js", "Angular", "Svelte"].includes(t.name)
                                )?.name
                              : "Next.js / SvelteKit"}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {report.ux_ui.has_modern_framework ? "Ya usa framework moderno" : "Migrar recomendado"}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-background/50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Backend
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground font-mono">
                          {report.tech_stack.some((t) =>
                            ["PHP", "WordPress", "Drupal"].includes(t.name)
                          )
                            ? "FastAPI / PocketBase"
                            : "FastAPI / Node.js"}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">Python 3.12+ · Async</p>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-background/50 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Hosting
                        </p>
                        <p className="mt-1 text-sm font-medium text-foreground font-mono">
                          {report.tech_stack.some((t) => ["Cloudflare", "Vercel", "Netlify"].includes(t.name))
                            ? "Mantener actual"
                            : "Vercel / Railway"}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">Escalado automático</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Data brutos del sitio original */}
                <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold text-foreground">
                      📐 Datos del Sitio Original
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">
                      Información extraída directamente del sitio — zero LLM
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Rendimiento
                        </p>
                        <ul className="mt-2 space-y-1">
                          <li className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Carga</span>
                            <span className="font-mono text-foreground">
                              {report.seo.performance > 0
                                ? `${((100 - report.seo.performance) * 50).toFixed(0)}ms`
                                : "—"}
                            </span>
                          </li>
                          <li className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Score SEO</span>
                            <span className="font-mono text-foreground">{report.seo.score}/100</span>
                          </li>
                          <li className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Meta Tags</span>
                            <span className="font-mono text-foreground">{report.seo.meta_tags}/100</span>
                          </li>
                          <li className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Headings</span>
                            <span className="font-mono text-foreground">{report.seo.headings}/100</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Stack Detectado ({report.tech_stack.length})
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {report.tech_stack.map((t, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="border-border/40 bg-background/30 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                            >
                              {t.name}
                              {t.version ? ` ${t.version}` : ""}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cuellos de botella técnicos */}
                {report.bottlenecks.length > 0 && (
                  <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-sm font-semibold text-foreground">
                        🔧 Cuellos de Botella Técnicos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {report.bottlenecks.map((b, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/30 p-3"
                          >
                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                b.severity === "critical"
                                  ? "bg-red-500"
                                  : b.severity === "high"
                                    ? "bg-orange-500"
                                    : "bg-amber-500"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground">{b.area}</p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">{b.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Export raw */}
                <div className="flex items-center justify-between border-t border-border/30 pt-4">
                  <span className="text-[10px] text-muted-foreground/50">
                    {report.tech_stack.length} tecnologías · {report.bottlenecks.length} bottlenecks ·{" "}
                    {report.ai_roadmap.length} recomendaciones IA
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
                      const a = document.createElement("a");
                      a.href = URL.createObjectURL(blob);
                      a.download = `audit-${job.url.replace(/[^a-z0-9]/gi, "-").slice(0, 40)}.json`;
                      a.click();
                    }}
                    className="border-border/50 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Exportar JSON
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </>
      )}
    </div>
  );
}
