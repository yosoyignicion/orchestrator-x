"use client";

import type { AIRecommendation } from "@/types/audit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  recommendations: AIRecommendation[];
}

const IMPACT_CFG = {
  critical: { label: "Crítico", class: "border-red-500/30 text-red-400 bg-red-500/10" },
  high: { label: "Alto", class: "border-orange-500/30 text-orange-400 bg-orange-500/10" },
  medium: { label: "Medio", class: "border-amber-500/30 text-amber-400 bg-amber-500/10" },
  low: { label: "Bajo", class: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" },
};

const EFFORT_CFG = {
  high: "Alto esfuerzo",
  medium: "Medio esfuerzo",
  low: "Bajo esfuerzo",
};

const CATEGORY_ICONS: Record<string, string> = {
  chatbot: "💬",
  automation: "🤖",
  analytics: "📊",
  content: "✍️",
  personalization: "🎯",
  support: "🎧",
  search: "🔍",
  other: "⚡",
};

export default function AIRecommendations({ recommendations }: Props) {
  if (!recommendations.length) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wide text-foreground">
        Roadmap de Integración de IA ({recommendations.length} acciones)
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {recommendations.map((r, i) => {
          const impact = IMPACT_CFG[r.impact_level] || IMPACT_CFG.medium;
          return (
            <Card
              key={i}
              className="group border-border/50 bg-card/40 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{CATEGORY_ICONS[r.category] || "⚡"}</span>
                    <CardTitle className="text-sm font-semibold text-foreground">{r.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                  {r.description}
                </CardDescription>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className={cn("border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", impact.class)}>
                    {impact.label}
                  </Badge>
                  <Badge variant="secondary" className="border-0 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {EFFORT_CFG[r.effort] || r.effort}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
