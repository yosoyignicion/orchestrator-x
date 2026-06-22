"use client";

import type { Bottleneck } from "@/types/audit";
import { cn } from "@/lib/utils";

interface Props {
  bottlenecks: Bottleneck[];
}

const SEVERITY_CFG = {
  critical: { label: "Crítico", color: "text-red-400", dot: "bg-red-500" },
  high: { label: "Alto", color: "text-orange-400", dot: "bg-orange-500" },
  medium: { label: "Medio", color: "text-amber-400", dot: "bg-amber-500" },
  low: { label: "Bajo", color: "text-emerald-400", dot: "bg-emerald-500" },
};

export default function BottleneckList({ bottlenecks }: Props) {
  if (!bottlenecks.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold tracking-wide text-foreground">Cuellos de Botella</h3>
      <div className="space-y-2">
        {bottlenecks.map((b, i) => {
          const sev = SEVERITY_CFG[b.severity] || SEVERITY_CFG.medium;
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border/50 bg-card/30 p-3.5 transition-colors hover:border-border"
            >
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", sev.dot)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{b.area}</span>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wider", sev.color)}>
                    {sev.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{b.description}</p>
                {b.estimated_impact && (
                  <p className="mt-1 text-[11px] italic text-muted-foreground/70">{b.estimated_impact}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
