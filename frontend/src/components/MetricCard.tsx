"use client";

import { cn } from "@/lib/utils";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
  color?: string;
}

export default function MetricCard({ title, value, subtitle, icon, trend, className, color }: Props) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-border/60 bg-card/40 p-5 backdrop-blur-sm transition-all duration-300 hover:border-border hover:bg-card/70 hover:shadow-lg hover:shadow-black/10",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{title}</p>
          <p
            className="mt-1.5 text-2xl font-bold tracking-tight text-foreground"
            style={color ? { color } : undefined}
          >
            {value}
          </p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {icon && <span className="text-2xl opacity-60 transition-opacity group-hover:opacity-100">{icon}</span>}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className={cn(
              "inline-block text-xs font-medium",
              trend === "up" && "text-emerald-400",
              trend === "down" && "text-red-400",
              trend === "neutral" && "text-muted-foreground",
            )}
          >
            {trend === "up" && "↑"} {trend === "down" && "↓"} {trend === "neutral" && "→"}
          </span>
        </div>
      )}
    </div>
  );
}
