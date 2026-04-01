"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, RotateCcw, Shield } from "lucide-react";
import { toast } from "sonner";
import { HistoricalInsightsCard } from "@/components/intelligence/HistoricalInsightsCard";

interface GlobalRule {
  id: string;
  key: string;
  name: string;
  description: string;
  category: string;
  defaultThreshold: number;
  enabled: boolean;
  severity: string;
}

interface Override {
  id: string;
  ruleKey: string;
  threshold: number | null;
  enabled: boolean | null;
}

interface MergedRule extends GlobalRule {
  overrideThreshold: number | null;
  overrideEnabled: boolean | null;
  effectiveThreshold: number;
  effectiveEnabled: boolean;
  hasOverride: boolean;
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
  if (key === "historical_benchmark") return `Score < ${value}`;
  return `${Math.round(value * 100)}%`;
}

function getSliderProps(key: string) {
  if (key === "project_stagnation") return { min: 1, max: 30, step: 1 };
  if (key === "risk_concentration" || key === "recurring_issues") return { min: 1, max: 10, step: 1 };
  if (key === "historical_benchmark") return { min: 20, max: 90, step: 5 };
  return { min: 0.05, max: 1, step: 0.05 };
}

export function ProjectRulesTab({ projectId }: { projectId: string }) {
  const [globalRules, setGlobalRules] = useState<GlobalRule[]>([]);
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, overridesRes] = await Promise.all([
        fetch("/api/intelligence/rules"),
        fetch(`/api/projects/${projectId}/rules`),
      ]);
      if (!rulesRes.ok || !overridesRes.ok) throw new Error();
      setGlobalRules(await rulesRes.json());
      setOverrides(await overridesRes.json());
    } catch {
      toast.error("Erro ao carregar regras");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const merged: MergedRule[] = globalRules.map((rule) => {
    const override = overrides.find((o) => o.ruleKey === rule.key);
    const overrideThreshold = override?.threshold ?? null;
    const overrideEnabled = override?.enabled ?? null;
    return {
      ...rule,
      overrideThreshold,
      overrideEnabled,
      effectiveThreshold: overrideThreshold !== null ? overrideThreshold : rule.defaultThreshold,
      effectiveEnabled: overrideEnabled !== null ? overrideEnabled : rule.enabled,
      hasOverride: overrideThreshold !== null || overrideEnabled !== null,
    };
  });

  const grouped = merged.reduce<Record<string, MergedRule[]>>((acc, rule) => {
    if (!acc[rule.category]) acc[rule.category] = [];
    acc[rule.category].push(rule);
    return acc;
  }, {});

  const handleToggle = async (rule: MergedRule) => {
    const newEnabled = !rule.effectiveEnabled;
    setSaving(rule.key);
    try {
      const res = await fetch(`/api/projects/${projectId}/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleKey: rule.key, enabled: newEnabled }),
      });
      if (!res.ok) throw new Error();
      setOverrides((prev) => {
        const existing = prev.find((o) => o.ruleKey === rule.key);
        if (existing) {
          return prev.map((o) => o.ruleKey === rule.key ? { ...o, enabled: newEnabled } : o);
        }
        return [...prev, { id: "", ruleKey: rule.key, threshold: null, enabled: newEnabled }];
      });
    } catch {
      toast.error("Erro ao atualizar regra");
    } finally {
      setSaving(null);
    }
  };

  const handleThresholdSave = async (rule: MergedRule, newThreshold: number) => {
    setSaving(rule.key);
    try {
      const res = await fetch(`/api/projects/${projectId}/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleKey: rule.key, threshold: newThreshold }),
      });
      if (!res.ok) throw new Error();
      setOverrides((prev) => {
        const existing = prev.find((o) => o.ruleKey === rule.key);
        if (existing) {
          return prev.map((o) => o.ruleKey === rule.key ? { ...o, threshold: newThreshold } : o);
        }
        return [...prev, { id: "", ruleKey: rule.key, threshold: newThreshold, enabled: null }];
      });
    } catch {
      toast.error("Erro ao atualizar threshold");
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async (ruleKey: string) => {
    setSaving(ruleKey);
    try {
      const res = await fetch(`/api/projects/${projectId}/rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleKey, threshold: null, enabled: null }),
      });
      if (!res.ok) throw new Error();
      setOverrides((prev) => prev.filter((o) => o.ruleKey !== ruleKey));
      toast.success("Regra restaurada ao padrão global");
    } catch {
      toast.error("Erro ao redefinir regra");
    } finally {
      setSaving(null);
    }
  };

  // Local threshold state for smooth slider interaction
  const [localThresholds, setLocalThresholds] = useState<Record<string, number>>({});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Regras de IA do Projeto
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Personalize thresholds e ativação das regras preditivas para este projeto. Valores não customizados usam o padrão global.
          </p>
        </div>
      </div>

      {/* Rules grouped by category */}
      {Object.entries(grouped).map(([category, rules]) => (
        <div key={category}>
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
            {categoryLabels[category] || category}
          </h3>
          <div className="space-y-3">
            {rules.map((rule) => {
              const sev = severityLabels[rule.severity] || severityLabels.MEDIUM;
              const isBinary = rule.key === "risk_cascade";
              const sliderProps = getSliderProps(rule.key);
              const displayThreshold = localThresholds[rule.key] ?? rule.effectiveThreshold;

              return (
                <div
                  key={rule.key}
                  className={`p-4 rounded-xl border transition-all ${
                    rule.effectiveEnabled
                      ? "border-border bg-background/50"
                      : "border-border/50 bg-muted/20 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[13px] font-bold text-foreground">
                          {rule.name}
                        </span>
                        <span className={`text-[10px] font-bold uppercase ${sev.color}`}>
                          {sev.label}
                        </span>
                        {rule.hasOverride && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            Customizado
                          </span>
                        )}
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
                        rule.effectiveEnabled ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          rule.effectiveEnabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Threshold slider */}
                  {rule.effectiveEnabled && !isBinary && (
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                        Threshold:
                      </span>
                      <input
                        type="range"
                        min={sliderProps.min}
                        max={sliderProps.max}
                        step={sliderProps.step}
                        value={displayThreshold}
                        onChange={(e) => {
                          setLocalThresholds((prev) => ({
                            ...prev,
                            [rule.key]: parseFloat(e.target.value),
                          }));
                        }}
                        onMouseUp={(e) => {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          setLocalThresholds((prev) => {
                            const next = { ...prev };
                            delete next[rule.key];
                            return next;
                          });
                          handleThresholdSave(rule, val);
                        }}
                        onTouchEnd={(e) => {
                          const val = parseFloat((e.target as HTMLInputElement).value);
                          setLocalThresholds((prev) => {
                            const next = { ...prev };
                            delete next[rule.key];
                            return next;
                          });
                          handleThresholdSave(rule, val);
                        }}
                        className="flex-1 h-1.5 accent-primary cursor-pointer"
                      />
                      <span className="text-[12px] font-black text-foreground w-16 text-right">
                        {formatThreshold(rule.key, displayThreshold)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        (padrão: {formatThreshold(rule.key, rule.defaultThreshold)})
                      </span>
                    </div>
                  )}

                  {/* Reset button */}
                  {rule.hasOverride && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => handleReset(rule.key)}
                        disabled={saving === rule.key}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Redefinir padrão
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Historical Insights */}
      <HistoricalInsightsCard projectId={projectId} />
    </div>
  );
}
