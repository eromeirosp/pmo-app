"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  FlaskConical, Play, Save, Trash2, Upload, Loader2,
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  Activity, GitCompare, X, Sparkles, Zap, Clock, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";

// ── Types ───────────────────────────────────────────────

interface Risk {
  id: string;
  title: string;
  level: string;
}

interface EapItem {
  id: string;
  name: string;
  status: string;
}

interface RadarDimensions {
  budget: number;
  timeline: number;
  risks: number;
  scope: number;
  health: number;
}

interface TriggeredAlert {
  ruleKey: string;
  ruleName: string;
  severity: string;
  title: string;
  message: string;
}

interface SimulationResult {
  currentScore: number;
  simulatedScore: number;
  currentAlerts: TriggeredAlert[];
  simulatedAlerts: TriggeredAlert[];
  diff: {
    appeared: TriggeredAlert[];
    disappeared: TriggeredAlert[];
    unchanged: TriggeredAlert[];
  };
  currentRadar: RadarDimensions;
  simulatedRadar: RadarDimensions;
}

interface SavedScenario {
  id: string;
  label: string;
  parameters: ScenarioParams;
  result: SimulationResult;
  narrative?: string;
  radarData?: { current: RadarDimensions; simulated: RadarDimensions };
  createdAt: string;
}

interface ScenarioParams {
  budgetAdjustmentPct: number;
  timelineDeltaDays: number;
  materializedRiskIds: string[];
  removedEapItemIds: string[];
}

interface ProjectSimulatorTabProps {
  projectId: string;
}

// ── Animated Number ─────────────────────────────────────

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v));
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => setCurrent(v));
    return unsubscribe;
  }, [display]);

  return <span className={className}>{current}</span>;
}

// ── Score Gauge (SVG semicircular) ──────────────────────

function ScoreGauge({ current, simulated }: { current: number; simulated: number }) {
  const diff = simulated - current;
  const scoreColor = (s: number) => s >= 80 ? "text-emerald-500" : s >= 50 ? "text-amber-500" : "text-rose-500";
  const arcColor = (s: number) => s >= 80 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444";
  const diffColor = diff > 0 ? "text-emerald-500" : diff < 0 ? "text-rose-500" : "text-muted-foreground";

  // SVG arc path for semicircle
  const radius = 70;
  const cx = 85;
  const cy = 85;
  const startAngle = Math.PI;
  const createArc = (pct: number) => {
    const endAngle = Math.PI - (pct / 100) * Math.PI;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const largeArc = pct > 50 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 170 100" className="w-full max-w-[220px]">
        {/* Background arc */}
        <path
          d={createArc(100)}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="10"
          strokeLinecap="round"
          opacity={0.3}
        />
        {/* Current score arc (ghost) */}
        <motion.path
          d={createArc(Math.min(100, current))}
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="10"
          strokeLinecap="round"
          opacity={0.2}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {/* Simulated score arc */}
        <motion.path
          d={createArc(Math.min(100, simulated))}
          fill="none"
          stroke={arcColor(simulated)}
          strokeWidth="10"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div className="flex items-center gap-4 -mt-4">
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Atual</p>
          <AnimatedNumber value={current} className={`text-xl font-black ${scoreColor(current)}`} />
        </div>
        <div className="text-muted-foreground/30 text-lg font-light">/</div>
        <div className="text-center">
          <p className="text-[9px] uppercase tracking-wider font-bold text-primary">Simulado</p>
          <AnimatedNumber value={simulated} className={`text-xl font-black ${scoreColor(simulated)}`} />
        </div>
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold mt-1 ${diffColor}`}>
        {diff > 0 ? <TrendingUp className="h-3 w-3" /> : diff < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
        {diff > 0 ? `+${diff}` : diff} pontos
      </div>
    </div>
  );
}

// ── Radar Chart ─────────────────────────────────────────

const RADAR_LABELS: Record<string, string> = {
  budget: "Orçamento",
  timeline: "Prazo",
  risks: "Riscos",
  scope: "Escopo",
  health: "Saúde",
};

function ScenarioRadar({
  current,
  simulated,
  comparisonLabel,
}: {
  current: RadarDimensions;
  simulated: RadarDimensions;
  comparisonLabel?: string;
}) {
  const data = Object.keys(RADAR_LABELS).map((key) => ({
    dimension: RADAR_LABELS[key],
    current: current[key as keyof RadarDimensions],
    simulated: simulated[key as keyof RadarDimensions],
  }));

  const improved = Object.keys(current).reduce((sum, k) => {
    const key = k as keyof RadarDimensions;
    return sum + (simulated[key] - current[key]);
  }, 0);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={180}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
          <PolarAngleAxis
            dataKey="dimension"
            tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontWeight: 600 }}
          />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar
            name={comparisonLabel || "Atual"}
            dataKey="current"
            stroke="var(--muted-foreground)"
            fill="var(--muted-foreground)"
            fillOpacity={0.1}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
          <Radar
            name="Simulado"
            dataKey="simulated"
            stroke={improved >= 0 ? "var(--chart-2)" : "var(--chart-5)"}
            fill={improved >= 0 ? "var(--chart-2)" : "var(--chart-5)"}
            fillOpacity={0.15}
            strokeWidth={2}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)",
              fontSize: "12px",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Alert Diff ──────────────────────────────────────────

function AlertDiff({ diff }: { diff: SimulationResult["diff"] }) {
  return (
    <div className="space-y-2">
      {diff.appeared.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider font-bold text-rose-500">Novos Alertas</p>
          {diff.appeared.map((a) => (
            <div key={a.ruleKey} className="flex items-start gap-2 text-xs bg-rose-500/5 border border-rose-500/10 rounded-lg px-2.5 py-1.5">
              <AlertTriangle className="h-3 w-3 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-foreground font-semibold">{a.title}</span>
                <p className="text-muted-foreground text-[10px] mt-0.5">{a.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {diff.disappeared.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-500">Alertas Resolvidos</p>
          {diff.disappeared.map((a) => (
            <div key={a.ruleKey} className="flex items-center gap-2 text-xs bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-2.5 py-1.5">
              <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
              <span className="text-foreground font-medium line-through opacity-60">{a.title}</span>
            </div>
          ))}
        </div>
      )}
      {diff.unchanged.length > 0 && (
        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">Sem Mudança</p>
          {diff.unchanged.map((a) => (
            <div key={a.ruleKey} className="flex items-center gap-2 text-xs bg-secondary/50 rounded-lg px-2.5 py-1.5">
              <Minus className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{a.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Narrative Panel ─────────────────────────────────────

function NarrativePanel({ text, streaming }: { text: string; streaming: boolean }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streaming && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [text, streaming]);

  if (!text && !streaming) return null;

  // Parse markdown sections
  const sections = text.split(/^## /gm).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-primary/5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-bold text-foreground">Briefing do Consultor GP</span>
        {streaming && (
          <span className="text-[9px] font-medium text-primary animate-pulse ml-auto">
            Analisando...
          </span>
        )}
      </div>
      <div className="px-4 py-3 space-y-3 max-h-[400px] overflow-y-auto text-sm text-foreground/90 leading-relaxed">
        {sections.map((section, i) => {
          const lines = section.split("\n");
          const title = lines[0]?.trim();
          const body = lines.slice(1).join("\n").trim();
          return (
            <div key={i}>
              {title && (
                <h4 className="text-xs font-black uppercase tracking-wider text-primary mb-1">
                  {title}
                </h4>
              )}
              <p className="text-xs text-foreground/80 whitespace-pre-wrap">
                {body.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                  part.startsWith("**") && part.endsWith("**")
                    ? <strong key={j} className="font-bold text-foreground">{part.slice(2, -2)}</strong>
                    : part
                )}
              </p>
            </div>
          );
        })}
        {streaming && <span className="streaming-cursor" />}
        <div ref={endRef} />
      </div>
    </motion.div>
  );
}

// ── Comparison Modal ────────────────────────────────────

function ComparisonModal({
  scenarioA,
  scenarioB,
  onClose,
}: {
  scenarioA: SavedScenario;
  scenarioB: SavedScenario;
  onClose: () => void;
}) {
  const radarA = scenarioA.radarData || scenarioA.result;
  const radarB = scenarioB.radarData || scenarioB.result;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-black text-foreground">Comparação de Cenários</h3>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Headers */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-xs font-bold text-primary">{scenarioA.label}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(scenarioA.createdAt).toLocaleDateString("pt-BR")}</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-primary">{scenarioB.label}</p>
              <p className="text-[10px] text-muted-foreground">{new Date(scenarioB.createdAt).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>

          {/* Gauges side by side */}
          <div className="grid grid-cols-2 gap-6">
            <ScoreGauge
              current={scenarioA.result.currentScore}
              simulated={scenarioA.result.simulatedScore}
            />
            <ScoreGauge
              current={scenarioB.result.currentScore}
              simulated={scenarioB.result.simulatedScore}
            />
          </div>

          {/* Radar overlay */}
          {"currentRadar" in radarA && "currentRadar" in radarB && (
            <div className="bg-secondary/30 rounded-xl p-4">
              <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground text-center mb-2">
                Radar Comparativo (simulados)
              </p>
              <ScenarioRadar
                current={(radarA as SimulationResult).simulatedRadar || (radarA as unknown as { current: RadarDimensions }).current}
                simulated={(radarB as SimulationResult).simulatedRadar || (radarB as unknown as { simulated: RadarDimensions }).simulated}
                comparisonLabel={scenarioA.label}
              />
            </div>
          )}

          {/* Narratives side by side */}
          {(scenarioA.narrative || scenarioB.narrative) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-xs text-foreground/80 whitespace-pre-wrap bg-secondary/30 rounded-xl p-3 max-h-[300px] overflow-y-auto">
                {scenarioA.narrative || "Narrativa não disponível"}
              </div>
              <div className="text-xs text-foreground/80 whitespace-pre-wrap bg-secondary/30 rounded-xl p-3 max-h-[300px] overflow-y-auto">
                {scenarioB.narrative || "Narrativa não disponível"}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────

export function ProjectSimulatorTab({ projectId }: ProjectSimulatorTabProps) {
  // Parameters
  const [budgetPct, setBudgetPct] = useState(0);
  const [timelineDays, setTimelineDays] = useState(0);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [eapItems, setEapItems] = useState<EapItem[]>([]);
  const [materializedRiskIds, setMaterializedRiskIds] = useState<string[]>([]);
  const [removedEapItemIds, setRemovedEapItemIds] = useState<string[]>([]);

  // State
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [narrative, setNarrative] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [saveLabel, setSaveLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  // Comparison
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch project data
  const fetchProjectData = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setRisks(
          (data.risks || []).filter(
            (r: Risk) => ["Alto", "Muito Alto", "Crítico"].includes(r.level) && r.level !== "Materializado"
          )
        );
        setEapItems(
          (data.eapItems || []).filter((i: EapItem) => i.status === "IN_PROGRESS")
        );
      }
    } catch {
      // silent
    }
  }, [projectId]);

  const fetchSavedScenarios = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/scenarios`);
      if (res.ok) setSavedScenarios(await res.json());
    } catch {
      // silent
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
    fetchSavedScenarios();
  }, [fetchProjectData, fetchSavedScenarios]);

  // ── Simulate with AI streaming ─────────────────────────

  const handleSimulate = async () => {
    setSimulating(true);
    setResult(null);
    setNarrative("");
    setStreaming(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/scenarios/simulate-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetAdjustmentPct: budgetPct,
          timelineDeltaDays: timelineDays,
          materializedRiskIds,
          removedEapItemIds,
        }),
      });

      if (!res.ok) {
        toast.error("Erro ao executar simulação");
        setSimulating(false);
        setStreaming(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === "result") {
              setResult(payload.data);
              setSimulating(false);
            } else if (payload.type === "narrative") {
              setNarrative((prev) => prev + payload.data);
            } else if (payload.type === "done") {
              setStreaming(false);
            } else if (payload.type === "error") {
              toast.error(payload.data);
              setStreaming(false);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }
    } catch {
      toast.error("Erro ao executar simulação");
    } finally {
      setSimulating(false);
      setStreaming(false);
    }
  };

  // ── Save scenario ──────────────────────────────────────

  const handleSave = async () => {
    if (!saveLabel.trim() || !result) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/scenarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: saveLabel.trim(),
          parameters: { budgetAdjustmentPct: budgetPct, timelineDeltaDays: timelineDays, materializedRiskIds, removedEapItemIds },
          result,
          narrative: narrative || null,
          radarData: result.currentRadar ? { current: result.currentRadar, simulated: result.simulatedRadar } : null,
        }),
      });
      if (res.ok) {
        toast.success("Cenário salvo com snapshot completo");
        setSaveLabel("");
        fetchSavedScenarios();
      } else {
        toast.error("Erro ao salvar cenário");
      }
    } catch {
      toast.error("Erro ao salvar cenário");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScenario = async (scenarioId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/scenarios/${scenarioId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Cenário removido");
        setSavedScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
        setCompareSelection((prev) => prev.filter((id) => id !== scenarioId));
      }
    } catch {
      toast.error("Erro ao remover cenário");
    }
  };

  const loadScenario = (scenario: SavedScenario) => {
    setBudgetPct(scenario.parameters.budgetAdjustmentPct);
    setTimelineDays(scenario.parameters.timelineDeltaDays);
    setMaterializedRiskIds(scenario.parameters.materializedRiskIds || []);
    setRemovedEapItemIds(scenario.parameters.removedEapItemIds || []);
    setResult(scenario.result);
    setNarrative(scenario.narrative || "");
    toast.success(`Cenário "${scenario.label}" carregado`);
  };

  const toggleRisk = (riskId: string) => {
    setMaterializedRiskIds((prev) =>
      prev.includes(riskId) ? prev.filter((id) => id !== riskId) : [...prev, riskId]
    );
  };

  const toggleEapItem = (itemId: string) => {
    setRemovedEapItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleCompareSelection = (id: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  // Quick-start presets
  const applyPreset = (preset: "budget" | "timeline" | "risks") => {
    if (preset === "budget") {
      setBudgetPct(-30);
      setTimelineDays(0);
      setMaterializedRiskIds([]);
      setRemovedEapItemIds([]);
    } else if (preset === "timeline") {
      setBudgetPct(0);
      setTimelineDays(30);
      setMaterializedRiskIds([]);
      setRemovedEapItemIds([]);
    } else if (preset === "risks") {
      setBudgetPct(0);
      setTimelineDays(0);
      setMaterializedRiskIds(risks.map((r) => r.id));
      setRemovedEapItemIds([]);
    }
    // Auto-simulate after preset
    setTimeout(() => {
      const btn = document.getElementById("simulate-btn");
      btn?.click();
    }, 100);
  };

  // Comparison scenarios
  const compA = savedScenarios.find((s) => s.id === compareSelection[0]);
  const compB = savedScenarios.find((s) => s.id === compareSelection[1]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <FlaskConical className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground">Simulador de Cenários</h2>
          <p className="text-xs text-muted-foreground">Ajuste parâmetros e veja o impacto no health score — análise completa por IA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Left: Parameters ─── */}
        <div className="space-y-4">
          {/* Budget slider */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-primary" />
                Ajuste de Orçamento
              </label>
              <motion.span
                key={budgetPct}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-sm font-black tabular-nums ${budgetPct > 0 ? "text-emerald-500" : budgetPct < 0 ? "text-rose-500" : "text-muted-foreground"}`}
              >
                {budgetPct > 0 ? "+" : ""}{budgetPct}%
              </motion.span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={budgetPct}
              onChange={(e) => setBudgetPct(Number(e.target.value))}
              className="slider-premium slider-budget"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>-50%</span>
              <span>0</span>
              <span>+50%</span>
            </div>
          </div>

          {/* Timeline slider */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-primary" />
                Ajuste de Prazo
              </label>
              <motion.span
                key={timelineDays}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-sm font-black tabular-nums ${timelineDays > 0 ? "text-emerald-500" : timelineDays < 0 ? "text-rose-500" : "text-muted-foreground"}`}
              >
                {timelineDays > 0 ? "+" : ""}{timelineDays} dias
              </motion.span>
            </div>
            <input
              type="range"
              min={-60}
              max={60}
              value={timelineDays}
              onChange={(e) => setTimelineDays(Number(e.target.value))}
              className="slider-premium slider-timeline"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>-60 dias</span>
              <span>0</span>
              <span>+60 dias</span>
            </div>
          </div>

          {/* Risk toggles */}
          {risks.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-primary" />
                Simular Materialização de Riscos
              </label>
              <div className="space-y-1.5">
                {risks.map((risk) => (
                  <label
                    key={risk.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      materializedRiskIds.includes(risk.id)
                        ? "bg-rose-500/10 border-rose-500/20"
                        : "bg-secondary/50 border-transparent hover:border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={materializedRiskIds.includes(risk.id)}
                      onChange={() => toggleRisk(risk.id)}
                      className="accent-rose-500"
                    />
                    <span className="text-xs text-foreground truncate">{risk.title || "Risco sem título"}</span>
                    <span className="text-[9px] font-bold text-rose-500 ml-auto shrink-0">{risk.level}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* EAP toggles */}
          {eapItems.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <label className="text-xs font-bold text-foreground">Simular Remoção de Itens EAP</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {eapItems.map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                      removedEapItemIds.includes(item.id)
                        ? "bg-amber-500/10 border-amber-500/20"
                        : "bg-secondary/50 border-transparent hover:border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={removedEapItemIds.includes(item.id)}
                      onChange={() => toggleEapItem(item.id)}
                      className="accent-amber-500"
                    />
                    <span className="text-xs text-foreground truncate">{item.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Simulate button */}
          <Button
            id="simulate-btn"
            onClick={handleSimulate}
            disabled={simulating || streaming}
            className="w-full gap-2 font-bold text-sm h-11"
          >
            {simulating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {simulating ? "Calculando..." : streaming ? "Gerando análise..." : "Simular"}
          </Button>

          {/* Save scenario */}
          {result && !streaming && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <input
                placeholder="Nome do cenário..."
                value={saveLabel}
                onChange={(e) => setSaveLabel(e.target.value)}
                className="flex-1 text-xs bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleSave}
                disabled={!saveLabel.trim() || saving}
                className="gap-1 font-bold text-xs"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                Salvar
              </Button>
            </motion.div>
          )}
        </div>

        {/* ─── Right: Results ─── */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Gauge + Radar side by side */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground text-center mb-2">Health Score</p>
                    <ScoreGauge current={result.currentScore} simulated={result.simulatedScore} />
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground text-center mb-2">Dimensões</p>
                    <ScenarioRadar current={result.currentRadar} simulated={result.simulatedRadar} />
                  </div>
                </div>

                {/* Alerts */}
                {(result.diff.appeared.length > 0 || result.diff.disappeared.length > 0 || result.diff.unchanged.length > 0) && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-2">Impacto nos Alertas</h3>
                    <AlertDiff diff={result.diff} />
                  </div>
                )}

                {/* AI Narrative */}
                <NarrativePanel text={narrative} streaming={streaming} />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full min-h-[400px]"
              >
                <div className="text-center space-y-4 max-w-xs">
                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                      rotate: [0, 3, -3, 0],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block"
                  >
                    <div className="p-4 rounded-2xl bg-primary/10 inline-block">
                      <FlaskConical className="h-10 w-10 text-primary/40" />
                    </div>
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Monte um cenário hipotético</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ajuste os parâmetros e descubra como eles impactariam seu projeto — com análise completa por IA.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => applyPreset("budget")}
                      className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                    >
                      E se o orçamento caísse 30%?
                    </button>
                    <button
                      onClick={() => applyPreset("timeline")}
                      className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                    >
                      E se o prazo aumentasse 30 dias?
                    </button>
                    {risks.length > 0 && (
                      <button
                        onClick={() => applyPreset("risks")}
                        className="text-[10px] font-semibold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
                      >
                        E se todos os riscos se materializassem?
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Saved Scenarios (full-width) ─── */}
      {savedScenarios.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <button
            onClick={() => setShowSaved(!showSaved)}
            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-foreground hover:bg-secondary/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-primary" />
              Cenários Salvos ({savedScenarios.length})
            </span>
            <div className="flex items-center gap-2">
              {compareMode && compareSelection.length === 2 && (
                <span
                  onClick={(e) => { e.stopPropagation(); setShowComparison(true); }}
                  className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Comparar selecionados
                </span>
              )}
              <span
                onClick={(e) => { e.stopPropagation(); setCompareMode(!compareMode); setCompareSelection([]); }}
                className="text-[10px] font-medium text-primary hover:underline cursor-pointer"
              >
                {compareMode ? "Cancelar" : "Comparar"}
              </span>
              <span className="text-muted-foreground">{showSaved ? "▲" : "▼"}</span>
            </div>
          </button>
          <AnimatePresence>
            {showSaved && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="border-t border-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
                  {savedScenarios.map((scenario) => {
                    const res = scenario.result as SimulationResult;
                    const diff = res.simulatedScore - res.currentScore;
                    const isSelected = compareSelection.includes(scenario.id);

                    return (
                      <div
                        key={scenario.id}
                        className={`bg-secondary/30 rounded-xl p-3 space-y-2 border transition-all ${
                          isSelected ? "border-primary bg-primary/5" : "border-transparent hover:border-border"
                        } ${compareMode ? "cursor-pointer" : ""}`}
                        onClick={() => compareMode && toggleCompareSelection(scenario.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-bold text-foreground">{scenario.label}</p>
                            <p className="text-[9px] text-muted-foreground">
                              {new Date(scenario.createdAt).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-black text-muted-foreground">{res.currentScore}</span>
                            <span className="text-[10px] text-muted-foreground">→</span>
                            <span className={`text-xs font-black ${diff >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                              {res.simulatedScore}
                            </span>
                          </div>
                        </div>
                        {scenario.narrative && (
                          <p className="text-[10px] text-muted-foreground line-clamp-2">
                            {scenario.narrative.split("## Veredito")[1]?.trim().slice(0, 120) ||
                              scenario.narrative.slice(0, 120)}
                          </p>
                        )}
                        {!compareMode && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => loadScenario(scenario)} className="h-6 px-2 text-[10px] gap-1">
                              <Upload className="h-2.5 w-2.5" /> Carregar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteScenario(scenario.id)} className="h-6 px-2 text-[10px] gap-1 text-rose-500 hover:text-rose-600">
                              <Trash2 className="h-2.5 w-2.5" /> Remover
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Comparison Modal */}
      <AnimatePresence>
        {showComparison && compA && compB && (
          <ComparisonModal
            scenarioA={compA}
            scenarioB={compB}
            onClose={() => { setShowComparison(false); setCompareMode(false); setCompareSelection([]); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
