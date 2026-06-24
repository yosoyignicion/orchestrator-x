"use client";

import AuditDashboard from "@/components/AuditDashboard";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg font-bold tracking-tight text-foreground">
              Orchestrator<span className="text-primary">-X</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/queue"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Cola
            </Link>
            <Link
              href="/history"
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              Historial
            </Link>
            <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground/50">
              v0.2 · 🔥 100% local
            </span>
          </nav>
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
