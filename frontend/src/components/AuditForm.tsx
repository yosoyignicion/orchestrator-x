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

export default function AuditForm({ onAudit, isLoading }: Props) {
  const [url, setUrl] = useState("");
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [ollamaStatus, setOllamaStatus] = useState<"loading" | "online" | "offline" | "no_models">("loading");

  useEffect(() => {
    (async () => {
      const list = await fetchModels();
      setModels(list);
      if (list.length > 0) {
        // Pre-select the first model
        setSelectedModel(list[0].name);
        setOllamaStatus("online");
      } else {
        // Try a direct health check to distinguish "offline" from "no models"
        try {
          const h = await fetch("http://localhost:11434/api/tags", { signal: AbortSignal.timeout(3000) });
          if (h.ok) setOllamaStatus("no_models");
          else setOllamaStatus("offline");
        } catch {
          setOllamaStatus("offline");
        }
      }
    })();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onAudit(url.trim(), selectedModel || undefined);
  };

  const statusIcon = () => {
    switch (ollamaStatus) {
      case "loading": return <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="Detectando..." />;
      case "online": return <span className="h-2 w-2 rounded-full bg-green-400" title={`${models.length} modelo(s) disponible(s)`} />;
      case "no_models": return <span className="h-2 w-2 rounded-full bg-amber-500" title="Ollama activo, 0 modelos" />;
      case "offline": return <span className="h-2 w-2 rounded-full bg-red-400" title="Ollama no responde" />;
    }
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
            disabled={isLoading}
            className="h-12 w-full bg-card pr-10 text-base shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-blue-500/50"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            </div>
          )}
        </div>
        <Button type="submit" size="lg" disabled={isLoading || ollamaStatus === "offline"} className="h-12 min-w-[120px] px-8 font-semibold">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Auditando
            </span>
          ) : (
            "Auditar →"
          )}
        </Button>
      </form>

      {/* Model selector row */}
      <div className="flex items-center justify-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          {statusIcon()}
          <span>
            {ollamaStatus === "loading" && "Detectando Ollama..."}
            {ollamaStatus === "offline" && "Ollama offline — audits requieren el modelo local"}
            {ollamaStatus === "no_models" && "Ollama activo — pulsa pull de un modelo (ej: gemma3:4b)"}
            {ollamaStatus === "online" && `${models.length} modelo(s) disponible(s)`}
          </span>
        </div>

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
      </div>
    </div>
  );
}
