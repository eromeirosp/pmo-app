"use client";

import { useEffect, useState, useCallback } from "react";
import { Zap, Settings, RefreshCw, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { AlertItem } from "./AlertItem";
import { IntelligenceSettingsModal } from "./IntelligenceSettingsModal";
import { toast } from "sonner";

interface Alert {
  id: string;
  projectId: string;
  ruleKey: string;
  severity: string;
  title: string;
  message: string;
  evidence: Record<string, unknown>;
  createdAt: string;
}

interface PredictiveAlertsCardProps {
  projectNames?: Record<string, string>;
}

export function PredictiveAlertsCard({ projectNames = {} }: PredictiveAlertsCardProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch("/api/intelligence/alerts");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAlerts(data);
    } catch {
      console.error("[PredictiveAlerts] Failed to fetch alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await fetch("/api/intelligence/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast.success(`Avaliação concluída para ${data.evaluated} projeto(s)`);
      await fetchAlerts();
    } catch {
      toast.error("Erro ao avaliar inteligência");
    } finally {
      setEvaluating(false);
    }
  };

  const handleDismiss = async (alertId: string) => {
    try {
      const res = await fetch(`/api/intelligence/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dismissed: true }),
      });
      if (!res.ok) throw new Error();
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success("Alerta descartado");
    } catch {
      toast.error("Erro ao descartar alerta");
    }
  };

  // Sort by severity priority
  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sortedAlerts = [...alerts].sort(
    (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
  );

  const criticalCount = alerts.filter((a) => a.severity === "CRITICAL").length;
  const highCount = alerts.filter((a) => a.severity === "HIGH").length;

  return (
    <>
      <div className="bg-card/40 border border-border backdrop-blur-sm shadow-xl rounded-2xl transition-all hover:border-primary/20 mb-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Alertas de Inteligência
              </h3>
              {alerts.length > 0 && (
                <div className="flex items-center gap-2 mt-0.5">
                  {criticalCount > 0 && (
                    <span className="text-[10px] font-bold text-rose-500">
                      {criticalCount} crítico{criticalCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  {highCount > 0 && (
                    <span className="text-[10px] font-bold text-amber-500">
                      {highCount} alto{highCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {alerts.length} total
                  </span>
                </div>
              )}
            </div>
            {collapsed ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer disabled:opacity-50"
              title="Reavaliar todos os projetos"
            >
              {evaluating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Reavaliar
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
              title="Configurar regras de inteligência"
            >
              <Settings className="h-3.5 w-3.5" />
              Regras
            </button>
          </div>
        </div>

        {/* Content */}
        {!collapsed && (
          <div className="p-5 pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : sortedAlerts.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-bold text-muted-foreground">
                  Nenhum alerta ativo
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos os projetos estão dentro dos parâmetros configurados.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {sortedAlerts.map((alert) => (
                  <AlertItem
                    key={alert.id}
                    id={alert.id}
                    projectId={alert.projectId}
                    projectName={projectNames[alert.projectId]}
                    ruleKey={alert.ruleKey}
                    severity={alert.severity}
                    title={alert.title}
                    message={alert.message}
                    evidence={alert.evidence as Record<string, unknown>}
                    onDismiss={handleDismiss}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <IntelligenceSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
