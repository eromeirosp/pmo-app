"use client";

import { useEffect, useState } from "react";
import { X, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Rule {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  formula: string;
  defaultThreshold: number;
  enabled: boolean;
  severity: string;
  isSystem: boolean;
}

interface IntelligenceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryLabels: Record<string, string> = {
  BUDGET: "Orçamento",
  SCHEDULE: "Cronograma",
  RISK: "Riscos",
  SCOPE: "Escopo",
  QUALITY: "Qualidade",
};

const severityLabels: Record<string, { label: string; color: string }> = {
  CRITICAL: { label: "Crítico", color: "text-rose-500" },
  HIGH: { label: "Alto", color: "text-amber-500" },
  MEDIUM: { label: "Médio", color: "text-blue-500" },
  LOW: { label: "Baixo", color: "text-muted-foreground" },
};

function formatThreshold(key: string, value: number): string {
  if (key === "project_stagnation") return `${value} dias`;
  if (key === "risk_concentration" || key === "recurring_issues") return `${value}`;
  if (key === "risk_cascade") return "Automático";
  return `${Math.round(value * 100)}%`;
}

export function IntelligenceSettingsModal({ isOpen, onClose }: IntelligenceSettingsModalProps) {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) fetchRules();
  }, [isOpen]);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/intelligence/rules");
      if (!res.ok) throw new Error();
      setRules(await res.json());
    } catch {
      toast.error("Erro ao carregar regras");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (rule: Rule) => {
    setSaving(rule.key);
    try {
      const res = await fetch("/api/intelligence/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: rule.key, enabled: !rule.enabled }),
      });
      if (!res.ok) throw new Error();
      setRules((prev) =>
        prev.map((r) => (r.key === rule.key ? { ...r, enabled: !r.enabled } : r))
      );
    } catch {
      toast.error("Erro ao atualizar regra");
    } finally {
      setSaving(null);
    }
  };

  const handleThresholdChange = async (rule: Rule, newThreshold: number) => {
    setSaving(rule.key);
    try {
      const res = await fetch("/api/intelligence/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: rule.key, defaultThreshold: newThreshold }),
      });
      if (!res.ok) throw new Error();
      setRules((prev) =>
        prev.map((r) => (r.key === rule.key ? { ...r, defaultThreshold: newThreshold } : r))
      );
    } catch {
      toast.error("Erro ao atualizar threshold");
    } finally {
      setSaving(null);
    }
  };

  if (!isOpen) return null;

  // Group rules by category
  const grouped = rules.reduce<Record<string, Rule[]>>((acc, rule) => {
    const cat = rule.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(rule);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-black text-foreground">Configuração de Inteligência</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ajuste os thresholds e ativação das regras preditivas
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            Object.entries(grouped).map(([category, categoryRules]) => (
              <div key={category}>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  {categoryLabels[category] || category}
                </h3>
                <div className="space-y-3">
                  {categoryRules.map((rule) => {
                    const sev = severityLabels[rule.severity] || severityLabels.MEDIUM;
                    const isBinary = rule.key === "risk_cascade";

                    return (
                      <div
                        key={rule.key}
                        className={`p-4 rounded-xl border transition-all ${
                          rule.enabled
                            ? "border-border bg-background/50"
                            : "border-border/50 bg-muted/20 opacity-60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[13px] font-bold text-foreground">
                                {rule.name}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase ${sev.color}`}
                              >
                                {sev.label}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {rule.description}
                            </p>
                          </div>

                          {/* Toggle */}
                          <button
                            onClick={() => handleToggle(rule)}
                            disabled={saving === rule.key}
                            className={`relative shrink-0 w-10 h-5 rounded-full transition-colors cursor-pointer ${
                              rule.enabled ? "bg-primary" : "bg-muted"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                rule.enabled ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                        </div>

                        {/* Threshold slider */}
                        {rule.enabled && !isBinary && (
                          <div className="mt-3 flex items-center gap-3">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                              Threshold:
                            </span>
                            <input
                              type="range"
                              min={rule.key === "project_stagnation" ? 1 : rule.key === "risk_concentration" || rule.key === "recurring_issues" ? 1 : 0.05}
                              max={rule.key === "project_stagnation" ? 30 : rule.key === "risk_concentration" || rule.key === "recurring_issues" ? 10 : 1}
                              step={rule.key === "project_stagnation" || rule.key === "risk_concentration" || rule.key === "recurring_issues" ? 1 : 0.05}
                              value={rule.defaultThreshold}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setRules((prev) =>
                                  prev.map((r) =>
                                    r.key === rule.key ? { ...r, defaultThreshold: val } : r
                                  )
                                );
                              }}
                              onMouseUp={(e) => {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                handleThresholdChange(rule, val);
                              }}
                              onTouchEnd={(e) => {
                                const val = parseFloat((e.target as HTMLInputElement).value);
                                handleThresholdChange(rule, val);
                              }}
                              className="flex-1 h-1.5 accent-primary cursor-pointer"
                            />
                            <span className="text-[12px] font-black text-foreground w-16 text-right">
                              {formatThreshold(rule.key, rule.defaultThreshold)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <button
            onClick={fetchRules}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-secondary transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrões
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
