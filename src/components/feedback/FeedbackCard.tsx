"use client";

import { Bug, Lightbulb, Puzzle, MessageSquare, ThumbsUp } from "lucide-react";

interface TicketComment {
  id: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface TicketData {
  id: string;
  userName: string;
  userEmail?: string | null;
  type: string;
  description: string;
  screenshotUrl?: string | null;
  currentPath: string;
  status: string;
  likes: string[];
  comments: TicketComment[];
  createdAt: string;
}

const typeConfig: Record<string, { icon: typeof Bug; label: string; color: string }> = {
  BUG: { icon: Bug, label: "Correção", color: "text-rose-500 bg-rose-500/10 border-rose-500/20" },
  IMPROVEMENT: { icon: Lightbulb, label: "Melhoria", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  FEATURE: { icon: Puzzle, label: "Novo Recurso", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
};

const statusConfig: Record<string, string> = {
  Backlog: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  "Em Análise": "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
  Priorizado: "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800",
  "Em Execução": "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  "Concluído": "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
};

interface FeedbackCardProps {
  ticket: TicketData;
  onClick: () => void;
}

export function FeedbackCard({ ticket, onClick }: FeedbackCardProps) {
  const tConfig = typeConfig[ticket.type] || typeConfig.BUG;
  const TypeIcon = tConfig.icon;
  const sConfig = statusConfig[ticket.status] || statusConfig.Backlog;

  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(ticket.createdAt));

  return (
    <button
      onClick={onClick}
      className="w-full text-left h-full flex flex-col p-5 bg-card border border-border rounded-2xl shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:-translate-y-0.5 group"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${tConfig.color}`}>
          <TypeIcon className="h-3 w-3" />
          {tConfig.label}
        </span>
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${sConfig}`}>
          {ticket.status}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-foreground font-medium line-clamp-3 leading-relaxed mb-4 flex-1">
        {ticket.description}
      </p>

      {/* Screenshot thumbnail */}
      {ticket.screenshotUrl && (
        <div className="mb-3">
          <img
            src={ticket.screenshotUrl}
            alt="Screenshot"
            className="h-16 rounded-lg border border-border object-cover"
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-muted-foreground pt-3 border-t border-border/50">
        <span className="text-[11px] font-medium truncate">
          {ticket.userName} &middot; {formattedDate}
        </span>
        <div className="flex items-center gap-3 text-[11px] font-bold">
          {ticket.likes.length > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {ticket.likes.length}
            </span>
          )}
          {ticket.comments.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              {ticket.comments.length}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
