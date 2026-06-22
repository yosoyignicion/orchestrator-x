"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  onAudit: (url: string) => void;
  isLoading: boolean;
}

export default function AuditForm({ onAudit, isLoading }: Props) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onAudit(url.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl gap-3">
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
      <Button type="submit" size="lg" disabled={isLoading} className="h-12 min-w-[120px] px-8 font-semibold">
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
  );
}
