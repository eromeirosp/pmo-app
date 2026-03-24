"use client";

import { useState, useEffect } from "react";
import { Newspaper, RefreshCw, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface DigestData {
  id: string;
  message: string;
  createdAt: string;
}

export function WeeklyDigestCard() {
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchLatestDigest();
  }, []);

  const fetchLatestDigest = async () => {
    try {
      const res = await fetch("/api/notifications?type=WEEKLY_DIGEST&limit=1");
      if (!res.ok) return;
      const data = await res.json();
      const notifications = data.notifications || data;
      if (Array.isArray(notifications) && notifications.length > 0) {
        setDigest(notifications[0]);
      }
    } catch {
      // Silently fail — digest is optional
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/cron?digest=true");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.digestCreated) {
        await fetchLatestDigest();
      }
    } catch {
      // Silent fail
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return null;

  if (!digest) {
    return (
      <div className="mb-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Newspaper className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Resumo Semanal</h3>
            <p className="text-[11px] text-muted-foreground">Nenhum resumo gerado ainda</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={generating}
          className="text-xs font-bold gap-1.5"
        >
          {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Gerar Agora
        </Button>
      </div>
    );
  }

  const createdDate = new Date(digest.createdAt);
  const formattedDate = createdDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Show first 200 chars as preview
  const preview = digest.message.length > 200
    ? digest.message.slice(0, 200) + "..."
    : digest.message;

  return (
    <div className="mb-6 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Newspaper className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Resumo Semanal</h3>
              <span className="text-[10px] text-muted-foreground font-medium">{formattedDate}</span>
            </div>
            {!expanded && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xl">
                {preview.replace(/[#*_]/g, "")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleGenerate();
            }}
            disabled={generating}
            className="text-[10px] font-bold gap-1 h-7 px-2"
          >
            {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Atualizar
          </Button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-border/50 pt-4">
          <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown>{digest.message}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
