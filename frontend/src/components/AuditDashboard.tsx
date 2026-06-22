"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import MaturityGauge from "@/components/MaturityGauge";
import MetricCard from "@/components/MetricCard";
import TechStackBadge from "@/components/TechStackBadge";
import AuditForm from "@/components/AuditForm";
import ConversionPenalty from "@/components/ConversionPenalty";
import BottleneckList from "@/components/BottleneckList";
import AIRecommendations from "@/components/AIRecommendations";
import { auditUrl } from "@/lib/api";
import type { AuditReport } from "@/types/audit";

const SCAN_PHRASES = [
  "Lanzando navegador headless...",
  "Extrayendo estructura del DOM...",
  "Analizando tecnologías y frameworks...",
  "Midiendo rendimiento y seguridad...",
  "Consultando agentes de IA...",
  "Generando reporte personalizado...",
];

export default function AuditDashboard() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to results
  useEffect(() => {
    if (report && !report.error && showReport) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [report, showReport]);

  const handleAudit = async (url: string, model?: string) => {
    setIsLoading(true);
    setError(null);
    setReport(null);
    setShowReport(false);
    setScanPhase(0);

    const phaseInterval = setInterval(() => {
      setScanPhase((p) => Math.min(p + 1, SCAN_PHRASES.length - 1));
    }, 5000);

    try {
      const result = await auditUrl(url, model);
      setReport(result);
      if (!result.error) {
        // Stagger reveal
        setTimeout(() => setShowReport(true), 200);
      } else {
        setError(result.error);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error inesperado";
      setError(msg);
    } finally {
      clearInterval(phaseInterval);
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setReport(null);
    setShowReport(false);
  };

  // ── Empty state ────────────────────────────────
  if (!isLoading && !report && !error) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Auditoría de Arquitectura{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Web</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Introduce una URL y obtén un diagnóstico completo con análisis de IA local
          </p>
          <div className="mt-6">
            <AuditForm onAudit={handleAudit} isLoading={isLoading} />
          </div>
        </div>

        {/* Features grid */}
        <div className="mx-auto mt-16 grid max-w-3xl gap-4 text-center sm:grid-cols-3">
          {[
            { icon: "🔍", title: "Escáner Técnico", desc: "Detección de tecnologías, frameworks y CMS" },
            { icon: "📊", title: "Score 0-100", desc: "Madurez digital, SEO, UX y rendimiento" },
            { icon: "🧠", title: "Roadmap IA", desc: "Recomendaciones con IA local (gemma3:4b)" },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border/40 bg-card/20 p-5 backdrop-blur-sm">
              <span className="text-2xl">{f.icon}</span>
              <p className="mt-2 text-sm font-semibold text-foreground">{f.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <div className="mb-10 text-center">
        <div className="mx-auto max-w-xl">
          <AuditForm onAudit={handleAudit} isLoading={isLoading} />
        </div>
      </div>

      {/* ── Loading ──────────────────────────────── */}
      {isLoading && (
        <div className="mx-auto max-w-md text-center py-16">
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse" />
              </div>
            </div>
          </div>
          <p className="text-sm font-medium text-foreground">{SCAN_PHRASES[scanPhase]}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {scanPhase < 3 ? "Extrayendo datos técnicos..." : "Procesando con IA local vía GPU Vulkan"}
          </p>
          <Progress value={((scanPhase + 1) / SCAN_PHRASES.length) * 100} className="mt-4 h-1.5" />
        </div>
      )}

      {/* ── Error ────────────────────────────────── */}
      {error && !isLoading && (
        <div className="mx-auto max-w-md text-center py-8">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-sm">
            <span className="text-3xl">⚠️</span>
            <p className="mt-2 text-sm font-medium text-red-400">Error en la auditoría</p>
            <p className="mt-1 text-xs text-red-300/80">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRetry} className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10">
              Intentar de nuevo
            </Button>
          </div>
        </div>
      )}

      {/* ── Report ───────────────────────────────── */}
      {report && !report.error && (
        <div
          ref={resultRef}
          className={`transition-all duration-700 ${
            showReport ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <ScrollArea className="w-full">
            <div className="space-y-8">
              {/* Header */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-center sm:text-left">
                  <Badge variant="secondary" className="mb-2 border-0 bg-blue-500/10 text-blue-400">
                    {report.business_niche || "No clasificado"}
                  </Badge>
                  <h2 className="text-lg font-semibold text-foreground">
                    {report.url.replace(/^https?:\/\//, "")}
                  </h2>
                  <p className="text-xs text-muted-foreground break-all">{report.url}</p>
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
                          <span className="mt-0.5 shrink-0 text-red-400">•</span>
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

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border/30 pt-4">
                <span className="text-[10px] text-muted-foreground/50">
                  Orchestrator-X · Ollama + gemma3:4b · GPU Vulkan
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Nueva auditoría →
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
