"use client";

import AuditDashboard from "@/components/AuditDashboard";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-foreground">
            Orchestrator<span className="text-blue-400">-X</span>
          </span>
          <span className="text-xs font-mono text-muted-foreground">v0.1 · Alpha</span>
        </div>
      </header>

      <main className="flex-1">
        <AuditDashboard />
      </main>

      <footer className="border-t border-border/40 px-6 py-4 text-center text-[10px] text-muted-foreground/50">
        Orchestrator-X · Powered by FastAPI + Next.js + Ollama · GPU Vulkan
      </footer>
    </>
  );
}
