"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  name: string;
  category: string;
  className?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  Framework: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  CMS: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  "E-commerce": "border-violet-500/40 text-violet-400 bg-violet-500/10",
  CDN: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
  Analytics: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  Hosting: "border-orange-500/40 text-orange-400 bg-orange-500/10",
  "Web Server": "border-rose-500/40 text-rose-400 bg-rose-500/10",
  "CSS Framework": "border-sky-500/40 text-sky-400 bg-sky-500/10",
  Library: "border-pink-500/40 text-pink-400 bg-pink-500/10",
  Security: "border-red-500/40 text-red-400 bg-red-500/10",
  Payment: "border-green-500/40 text-green-400 bg-green-500/10",
  "Tag Manager": "border-yellow-500/40 text-yellow-400 bg-yellow-500/10",
  "Hosting/Edge": "border-purple-500/40 text-purple-400 bg-purple-500/10",
};

export default function TechStackBadge({ name, category, className }: Props) {
  const colorClass = CATEGORY_COLORS[category] || "border-border/60 text-muted-foreground";

  return (
    <Badge variant="outline" className={cn("border px-2.5 py-1 text-xs font-medium", colorClass, className)}>
      {name}
    </Badge>
  );
}
