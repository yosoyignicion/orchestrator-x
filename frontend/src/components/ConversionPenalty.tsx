"use client";

import { cn } from "@/lib/utils";

interface Props {
  penaltyPct: number;
  loadTimeMs: number;
}

export default function ConversionPenalty({ penaltyPct, loadTimeMs }: Props) {
  const severity = penaltyPct >= 30 ? "critical" : penaltyPct >= 15 ? "high" : penaltyPct >= 5 ? "medium" : "low";

  const config = {
    critical: { label: "Pérdida Crítica", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", icon: "🔴" },
    high: { label: "Pérdida Alta", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "🟠" },
    medium: { label: "Pérdida Moderada", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "🟡" },
    low: { label: "Pérdida Mínima", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "🟢" },
  }[severity];

  return (
    <div className={cn("rounded-xl border p-5 backdrop-blur-sm", config.bg, config.border)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Impacto en Conversión
          </p>
          <p className={cn("mt-1 text-3xl font-bold tracking-tight", config.color)}>
            -{penaltyPct.toFixed(0)}%
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {loadTimeMs > 3000
              ? `Tu web tarda ${(loadTimeMs / 1000).toFixed(1)}s en cargar. Cada segundo por encima de 3s reduce la conversión ~20%.`
              : loadTimeMs > 2000
                ? `Tu web tarda ${loadTimeMs}ms en cargar. Una optimización a <2s podría recuperar conversión.`
                : `Rendimiento aceptable (${loadTimeMs}ms). La optimización adicional sigue siendo valiosa.`}
          </p>
        </div>
        <span className="text-3xl">{config.icon}</span>
      </div>
    </div>
  );
}
