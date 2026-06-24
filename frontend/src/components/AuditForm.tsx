"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onAudit: (url: string) => void;
  isLoading: boolean;
}

type BackendStatus = "checking" | "online" | "offline";

export default function AuditForm({ onAudit, isLoading }: Props) {
  const [url, setUrl] = useState("");
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [providerLabel, setProviderLabel] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:8000/api/providers", {
          signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error("health not ok");
        const data = await res.json();
        setBackendStatus("online");
        if (data.active === "lm_studio") {
          const count = data.lm_studio?.models?.length ?? 0;
          setProviderLabel(`🎯 LM Studio · ${count} modelo(s)`);
        } else if (data.active === "ollama") {
          const count = data.ollama?.models?.length ?? 0;
          setProviderLabel(`🦙 Ollama · ${count} modelo(s)`);
        } else {
          setProviderLabel("🔌 Sin modelo disponible");
        }
      } catch {
        setBackendStatus("offline");
        setProviderLabel("");
      }
    })();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onAudit(url.trim());
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex w-full gap-3">
        <div className="relative flex-1">
          <Input
            type="url"
            placeholder="https://tudominio.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isLoading || backendStatus !== "online"}
            className="h-12 w-full bg-card pr-10 text-base shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-primary/50"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!url.trim() || isLoading || backendStatus !== "online"}
          className="h-12 min-w-[120px] bg-primary px-8 font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Encolando
            </span>
          ) : (
            "Auditar →"
          )}
        </Button>
      </form>

      {/* Status row */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {backendStatus === "checking" && (
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="Verificando..." />
          )}
          {backendStatus === "online" && (
            <span className="h-2 w-2 rounded-full bg-green-400" title="Backend conectado" />
          )}
          {backendStatus === "offline" && (
            <span className="h-2 w-2 rounded-full bg-red-500" title="Backend no responde" />
          )}
          Backend
        </span>

        {backendStatus === "online" && providerLabel && (
          <span className="text-muted-foreground/70">{providerLabel}</span>
        )}
      </div>
    </div>
  );
}
