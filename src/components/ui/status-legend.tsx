"use client";

import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

const LEGEND_ITEMS = [
  { color: "bg-emerald-500", Icon: CheckCircle2, label: "No Prazo", textColor: "text-emerald-600 dark:text-emerald-400" },
  { color: "bg-amber-500", Icon: AlertTriangle, label: "Atenção", textColor: "text-amber-600 dark:text-amber-400" },
  { color: "bg-rose-500", Icon: XCircle, label: "Crítico", textColor: "text-rose-600 dark:text-rose-400" },
];

export function StatusLegend({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex ${compact ? "gap-4" : "gap-6"} items-center flex-wrap`}
      role="region"
      aria-label="Legenda de status"
    >
      {LEGEND_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <item.Icon className={`w-3.5 h-3.5 ${item.textColor}`} />
          <span className={`w-2 h-2 rounded-full ${item.color}`} aria-hidden="true" />
          <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
