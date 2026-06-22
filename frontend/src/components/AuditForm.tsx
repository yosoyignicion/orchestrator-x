"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchModels } from "@/lib/api";
import type { OllamaModel } from "@/types/audit";

interface Props {
  onAudit: (url: string, model?: string) => void;
  isLoading: boolean;
}

type BackendStatus = "checking" | "online" | "offline";
type OllamaStatus = "checking" | "online" | "offline" | "no_models";

export default function AuditForm({ onAudit, isLoading }: Props) {
  const [url, setUrl] = useState("");
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus>("checking");

  useEffect(() => {
    (async () => {
      // Step 1: check backend reachability
      try {
        const res = await fetch("http://localhost:8000/api/health", { signal: AbortSignal.timeout(3000) });
        if (!res.ok) throw new Error("health not ok");
        setBackendStatus("online");
      } catch {
        setBackendStatus("offline");
        return; // stop — can't query Ollama without backend proxy
      }

      // Step 2: get models via backend proxy (avoids browser CORS to Ollama)
      const list = await fetchModels();
      setModels(list);
      if (list.length > 0) {
        setSelectedModel(list[0].name);
        setOllamaStatus("online");
      } else {
        setOllamaStatus("no_models");
      }
    })();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onAudit(url.trim(), selectedModel || undefined);
  };

  const backendDot = () => {
    switch (backendStatus) {
      case "checking": return <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="Verificando backend..." />;
      case "online": return <span className="h-2 w-2 rounded-full bg-green-400" title="Backend conectado" />;
      case "offline": return <span className="h-2 w-2 rounded-full bg-red-500" title="Backend no responde" />;
    }
  };

  const ollamaDot = () => {
    switch (ollamaStatus) {
      case "checking": return <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="Detectando modelos..." />;
      case "online": return <span className="h-2 w-2 rounded-full bg-green-400" title={`${models.length} modelo(s)`} />;
      case "no_models": return <span className="h-2 w-2 rounded-full bg-amber-500" title="Ollama activo, sin modelos" />;
      case "offline": return <span className="h-2 w-2 rounded-full bg-red-500" title="Ollama no accesible desde backend" />;
    }
  };

  const canAudit = backendStatus === "online" && ollamaStatus === "online" && !isLoading;

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
            className="h-12 w-full bg-card pr-10 text-base shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-[#ED2100]/50"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#ED2100] border-t-transparent" />
            </div>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!canAudit}
          className="h-12 min-w-[120px] bg-[#ED2100] px-8 font-semibold text-white hover:bg-[#ED2100]/90 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Auditando
            </span>
          ) : (
            "Auditar →"
          )}
        </Button>
      </form>

      {/* Status row */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          {backendDot()} Backend
        </span>
        <span className="flex items-center gap-1.5">
          {ollamaDot()} Modelos
        </span>

        {models.length > 0 && (
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
            disabled={isLoading}
          >
            {models.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name.replace(":latest", "")} ({(m.size_bytes / 1e9).toFixed(1)} GB)
              </option>
            ))}
          </select>
        )}

        {ollamaStatus === "no_models" && (
          <span className="text-amber-400">→ Ejecuta: <code className="bg-card px-1 rounded">ollama pull gemma3:4b</code></span>
        )}

        {backendStatus === "offline" && (
          <span className="text-red-400">→ Arranca: <code className="bg-card px-1 rounded">make dev</code></span>
        )}
      </div>
    </div>
  );
}
