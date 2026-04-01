"use client";

import { X, ExternalLink, AlertTriangle, AlertOctagon, Info, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface AlertItemProps {
  id: string;
  projectId: string;
  projectName?: string;
  ruleKey: string;
  severity: string;
  title: string;
  message: string;
  evidence: Record<string, unknown>;
  onDismiss: (id: string) => void;
}

const severityConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string; label: string }> = {
  CRITICAL: {
    icon: <AlertOctagon className="h-4 w-4" />,
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    label: "Crítico",
  },
  HIGH: {
    icon: <ShieldAlert className="h-4 w-4" />,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    label: "Alto",
  },
  MEDIUM: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    label: "Médio",
  },
  LOW: {
    icon: <Info className="h-4 w-4" />,
    color: "text-muted-foreground",
    bg: "bg-muted/10",
    border: "border-border",
    label: "Baixo",
  },
};

export function AlertItem({
  id,
  projectId,
  projectName,
  severity,
  title,
  message,
  onDismiss,
}: AlertItemProps) {
  const config = severityConfig[severity] || severityConfig.MEDIUM;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-xl border ${config.border} ${config.bg} transition-all hover:shadow-sm`}
    >
      <div className={`shrink-0 mt-0.5 ${config.color}`}>{config.icon}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${config.bg} ${config.color} border ${config.border}`}
          >
            {config.label}
          </span>
          {projectName && (
            <span className="text-[11px] font-bold text-muted-foreground truncate">
              {projectName}
            </span>
          )}
        </div>
        <p className="text-[13px] font-bold text-foreground leading-tight">{title}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{message}</p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Link
          href={`/projects/${projectId}`}
          className="p-1.5 rounded-lg hover:bg-background/50 text-muted-foreground hover:text-primary transition-colors"
          title="Ver projeto"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <button
          onClick={() => onDismiss(id)}
          className="p-1.5 rounded-lg hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          title="Descartar alerta"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
