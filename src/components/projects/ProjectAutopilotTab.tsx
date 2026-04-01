"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, RefreshCw, Check, X, ChevronDown, ChevronUp, FileText, AlertTriangle, DollarSign, Clock, Zap, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface AutopilotAction {
  id: string;
  projectId: string;
  type: string;
  status: string;
  triggeredByRule: string;
  draftData: Record<string, unknown>;
  reviewedAt: string | null;
  createdAt: string;
}

interface ProjectAutopilotTabProps {
  projectId: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string; bgColor: string; actionLabel: string }> = {
  STATUS_REPORT_DRAFT: { label: "Draft de Status Report", icon: FileText, color: "text-blue-500", bgColor: "bg-blue-500/10 border-blue-500/20", actionLabel: "Cria um Status Report na aba de Relatórios" },
  RISK_ESCALATION: { label: "Risco Identificado", icon: AlertTriangle, color: "text-rose-500", bgColor: "bg-rose-500/10 border-rose-500/20", actionLabel: "Adiciona um risco à Matriz de Riscos do projeto" },
  BUDGET_ALERT: { label: "Alerta Orçamentário", icon: DollarSign, color: "text-amber-500", bgColor: "bg-amber-500/10 border-amber-500/20", actionLabel: "" },
  SCHEDULE_ALERT: { label: "Alerta de Cronograma", icon: Clock, color: "text-purple-500", bgColor: "bg-purple-500/10 border-purple-500/20", actionLabel: "" },
  STAGNATION_NUDGE: { label: "Nudge de Estagnação", icon: Zap, color: "text-orange-500", bgColor: "bg-orange-500/10 border-orange-500/20", actionLabel: "" },
};

const RULE_LABELS: Record<string, string> = {
  budget_burn_rate: "Queima de Orçamento",
  budget_deviation: "Desvio Orçamentário",
  schedule_performance: "Performance de Cronograma",
  project_stagnation: "Estagnação de Projeto",
  risk_cascade: "Cascata de Riscos",
  risk_concentration: "Concentração de Riscos",
  scope_creep: "Crescimento de Escopo",
  recurring_issues: "Problemas Recorrentes",
};

function ActionCard({
  action,
  onApprove,
  onReject,
}: {
  action: AutopilotAction;
  onApprove: (id: string, editedDraft?: Record<string, unknown>) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editedDraft, setEditedDraft] = useState<Record<string, unknown>>(action.draftData);
  const config = TYPE_CONFIG[action.type] || TYPE_CONFIG.STAGNATION_NUDGE;
  const Icon = config.icon;

  const handleApprove = async () => {
    setProcessing(true);
    await onApprove(action.id, editedDraft);
    setProcessing(false);
  };

  const handleReject = async () => {
    setProcessing(true);
    await onReject(action.id);
    setProcessing(false);
  };

  const isStatusDraft = action.type === "STATUS_REPORT_DRAFT";
  const isRiskDraft = action.type === "RISK_ESCALATION";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-card border border-border rounded-xl overflow-hidden"
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg border ${config.bgColor}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </div>
            <div>
              <span className={`text-[10px] uppercase tracking-wider font-bold ${config.color}`}>
                {config.label}
              </span>
              <p className="text-xs text-muted-foreground">
                Regra: <span className="font-medium text-foreground">{RULE_LABELS[action.triggeredByRule] || action.triggeredByRule}</span>
              </p>
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
            {new Date(action.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        {/* Action label */}
        {config.actionLabel ? (
          <p className="text-[10px] text-muted-foreground bg-secondary/50 rounded-md px-2 py-1">
            Ao aprovar: <span className="font-medium text-foreground">{config.actionLabel}</span>
          </p>
        ) : null}

        {/* Summary */}
        {action.draftData.summary ? (
          <p className="text-sm text-foreground leading-relaxed">
            {String(action.draftData.summary)}
          </p>
        ) : null}
        {isRiskDraft && action.draftData.title ? (
          <p className="text-sm font-semibold text-foreground">{String(action.draftData.title)}</p>
        ) : null}
        {isRiskDraft && action.draftData.description ? (
          <p className="text-xs text-muted-foreground">{String(action.draftData.description)}</p>
        ) : null}
        {action.draftData.recommendedAction ? (
          <p className="text-xs text-muted-foreground">
            <span className="font-bold">Recomendação:</span> {String(action.draftData.recommendedAction)}
          </p>
        ) : null}

        {/* Expandable draft preview */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Ocultar draft" : "Ver draft completo"}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                {isRiskDraft ? (
                  // Editable form for risk drafts
                  <>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Título</label>
                      <input
                        className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5"
                        value={(editedDraft.title as string) || ""}
                        onChange={(e) => setEditedDraft({ ...editedDraft, title: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Descrição</label>
                      <textarea
                        className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5 min-h-[60px] resize-none"
                        value={(editedDraft.description as string) || ""}
                        onChange={(e) => setEditedDraft({ ...editedDraft, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Probabilidade (1-5)</label>
                        <select
                          className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5"
                          value={Number(editedDraft.probability) || 3}
                          onChange={(e) => setEditedDraft({ ...editedDraft, probability: Number(e.target.value) })}
                        >
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Impacto (1-5)</label>
                        <select
                          className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5"
                          value={Number(editedDraft.impact) || 3}
                          onChange={(e) => setEditedDraft({ ...editedDraft, impact: Number(e.target.value) })}
                        >
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Categoria</label>
                      <select
                        className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5"
                        value={(editedDraft.category as string) || "Geral"}
                        onChange={(e) => setEditedDraft({ ...editedDraft, category: e.target.value })}
                      >
                        {["Cronograma","Orçamento","Escopo","Qualidade","Recursos","Técnico","Externo","Geral"].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Mitigação</label>
                      <textarea
                        className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5 min-h-[50px] resize-none"
                        value={(editedDraft.mitigation as string) || ""}
                        onChange={(e) => setEditedDraft({ ...editedDraft, mitigation: e.target.value })}
                      />
                    </div>
                  </>
                ) : isStatusDraft ? (
                  // Editable form for status report drafts
                  <>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Período</label>
                      <input
                        className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5"
                        value={(editedDraft.period as string) || ""}
                        onChange={(e) => setEditedDraft({ ...editedDraft, period: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Status Geral</label>
                      <select
                        className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5"
                        value={(editedDraft.overallStatus as string) || "Amarelo"}
                        onChange={(e) => setEditedDraft({ ...editedDraft, overallStatus: e.target.value })}
                      >
                        <option value="Verde">Verde</option>
                        <option value="Amarelo">Amarelo</option>
                        <option value="Vermelho">Vermelho</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Realizações</label>
                      <textarea
                        className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5 min-h-[50px] resize-none"
                        value={(editedDraft.accomplishments as string) || ""}
                        onChange={(e) => setEditedDraft({ ...editedDraft, accomplishments: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Próximos Passos</label>
                      <textarea
                        className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5 min-h-[50px] resize-none"
                        value={(editedDraft.nextSteps as string) || ""}
                        onChange={(e) => setEditedDraft({ ...editedDraft, nextSteps: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Problemas</label>
                      <textarea
                        className="w-full text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5 min-h-[50px] resize-none"
                        value={(editedDraft.issues as string) || ""}
                        onChange={(e) => setEditedDraft({ ...editedDraft, issues: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Progresso (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-20 text-sm bg-background border border-border rounded-md px-2 py-1 mt-0.5"
                        value={Number(editedDraft.progress) || 0}
                        onChange={(e) => setEditedDraft({ ...editedDraft, progress: Number(e.target.value) })}
                      />
                    </div>
                  </>
                ) : (
                  // Read-only JSON preview for other types
                  Object.entries(action.draftData).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{key}</span>
                      <p className="text-sm text-foreground">{String(value)}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {action.status === "PENDING" && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={handleApprove}
              disabled={processing}
              className="flex-1 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white gap-1"
            >
              {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Aprovar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={processing}
              className="flex-1 text-xs font-bold text-rose-500 border-rose-500/20 hover:bg-rose-500/10 gap-1"
            >
              {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
              Rejeitar
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ProjectAutopilotTab({ projectId }: ProjectAutopilotTabProps) {
  const [actions, setActions] = useState<AutopilotAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState(false);
  const [filter, setFilter] = useState<"PENDING" | "ALL">("PENDING");

  const fetchActions = useCallback(async () => {
    try {
      const url = filter === "PENDING"
        ? `/api/projects/${projectId}/autopilot?status=PENDING`
        : `/api/projects/${projectId}/autopilot`;
      const res = await fetch(url);
      if (res.ok) {
        setActions(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [projectId, filter]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/autopilot`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Autopilot: ${data.autopilot.created} ação(ões) criada(s)`);
        fetchActions();
      } else {
        toast.error("Erro ao executar autopilot");
      }
    } catch {
      toast.error("Erro ao executar autopilot");
    } finally {
      setEvaluating(false);
    }
  };

  const handleApprove = async (actionId: string, editedDraft?: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/autopilot/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "APPROVED", editedDraft }),
      });
      if (res.ok) {
        toast.success("Ação aprovada e aplicada com sucesso");
        setActions((prev) => prev.filter((a) => a.id !== actionId));
      } else {
        toast.error("Erro ao aprovar ação");
      }
    } catch {
      toast.error("Erro ao aprovar ação");
    }
  };

  const handleReject = async (actionId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/autopilot/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });
      if (res.ok) {
        toast.success("Ação rejeitada");
        setActions((prev) => prev.filter((a) => a.id !== actionId));
      } else {
        toast.error("Erro ao rejeitar ação");
      }
    } catch {
      toast.error("Erro ao rejeitar ação");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Autopiloto</h2>
            <p className="text-xs text-muted-foreground">Ações sugeridas automaticamente pela IA. Revise antes de aprovar.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary rounded-lg p-0.5">
            <button
              onClick={() => setFilter("PENDING")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === "PENDING" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Pendentes
            </button>
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filter === "ALL" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Todas
            </button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEvaluate}
            disabled={evaluating}
            className="gap-1.5 font-bold text-xs"
          >
            {evaluating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Reavaliar
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : actions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <div>
            <p className="text-sm font-bold text-muted-foreground">Nenhuma ação pendente</p>
            <p className="text-xs text-muted-foreground/70">
              O autopiloto gera sugestões quando regras de inteligência são disparadas.
              <br />Clique em &quot;Reavaliar&quot; para forçar uma verificação agora.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {actions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
