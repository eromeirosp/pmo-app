"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Mic,
  CheckCircle2,
  AlertTriangle,
  Users,
  ListChecks,
  FileText,
  Gavel,
  ArrowUpDown,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface MeetingTranscriptResult {
  summary: string;
  statusReport?: {
    accomplishments: string;
    nextSteps: string;
    issues: string;
    overallStatus?: string;
    statusJustification?: string;
  };
  stakeholders?: Array<{ name: string; role: string; alreadyRegistered?: boolean }>;
  eapItems?: Array<{ name: string; description: string }>;
  eapUpdates?: Array<{ name: string; newStatus: string; reason: string }>;
  risks?: Array<{
    title: string;
    description: string;
    probability: number;
    impact: number;
    category: string;
  }>;
  decisions?: Array<{
    description: string;
    madeBy: string;
    context: string;
  }>;
}

interface MeetingTranscriptModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MeetingTranscriptModal({
  projectId,
  isOpen,
  onClose,
}: MeetingTranscriptModalProps) {
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MeetingTranscriptResult | null>(null);
  const [applying, setApplying] = useState(false);

  // Track which individual items are selected (default: all selected)
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      toast.error("Cole a transcrição da reunião.");
      return;
    }

    setLoading(true);
    setResult(null);
    setSelectedItems({});
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          type: "meeting_transcript",
          transcript: transcript.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Erro ao analisar transcrição.");
      }
      const data = await res.json();
      setResult(data);

      // Default all items to selected
      const defaults: Record<string, boolean> = {};
      if (data.statusReport) defaults["statusReport"] = true;
      data.stakeholders?.forEach((s: { alreadyRegistered?: boolean }, i: number) => { defaults[`stakeholder_${i}`] = !s.alreadyRegistered; });
      data.eapItems?.forEach((_: unknown, i: number) => { defaults[`eapItem_${i}`] = true; });
      data.eapUpdates?.forEach((_: unknown, i: number) => { defaults[`eapUpdate_${i}`] = true; });
      data.risks?.forEach((_: unknown, i: number) => { defaults[`risk_${i}`] = true; });
      data.decisions?.forEach((_: unknown, i: number) => { defaults[`decision_${i}`] = true; });
      setSelectedItems(defaults);

      toast.success("Transcrição analisada com sucesso!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao analisar transcrição.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (key: string) => {
    setSelectedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApplyAll = async () => {
    if (!result) return;
    setApplying(true);
    let applied = 0;

    try {
      // Apply Status Report
      if (selectedItems["statusReport"] && result.statusReport &&
          (result.statusReport.accomplishments || result.statusReport.nextSteps || result.statusReport.issues)) {
        await fetch(`/api/projects/${projectId}/status-reports`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            period: new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
            reportDate: new Date().toISOString().split("T")[0],
            overallStatus: result.statusReport.overallStatus || "Verde (Saudável)",
            scopeStatus: "No Escopo",
            scheduleStatus: "No Prazo",
            budgetStatus: "Em Dia",
            progress: 0,
            accomplishments: result.statusReport.accomplishments,
            nextSteps: result.statusReport.nextSteps,
            issues: result.statusReport.issues,
          }),
        });
        applied++;
      }

      // Apply Stakeholders (skip already registered)
      const selectedStakeholders = result.stakeholders?.filter((s, i) => selectedItems[`stakeholder_${i}`] && !s.alreadyRegistered) || [];
      for (const s of selectedStakeholders) {
        await fetch(`/api/projects/${projectId}/stakeholders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: s.name, role: s.role }),
        });
        applied++;
      }

      // Apply new EAP Items
      const selectedEapItems = result.eapItems?.filter((_, i) => selectedItems[`eapItem_${i}`]) || [];
      for (const item of selectedEapItems) {
        await fetch(`/api/projects/${projectId}/eap`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: item.name, description: item.description }),
        });
        applied++;
      }

      // Apply EAP Updates (status changes)
      const selectedEapUpdates = result.eapUpdates?.filter((_, i) => selectedItems[`eapUpdate_${i}`]) || [];
      if (selectedEapUpdates.length > 0) {
        // Fetch current EAP items to match by name
        const eapRes = await fetch(`/api/projects/${projectId}/eap`);
        if (eapRes.ok) {
          const currentEapItems = await eapRes.json();
          for (const update of selectedEapUpdates) {
            const match = currentEapItems.find(
              (e: { name: string }) => e.name.toLowerCase().includes(update.name.toLowerCase()) ||
                update.name.toLowerCase().includes(e.name.toLowerCase())
            );
            if (match) {
              await fetch(`/api/projects/${projectId}/eap`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: match.id, status: update.newStatus }),
              });
              applied++;
            }
          }
        }
      }

      // Apply Risks
      const selectedRisks = result.risks?.filter((_, i) => selectedItems[`risk_${i}`]) || [];
      for (const risk of selectedRisks) {
        await fetch(`/api/projects/${projectId}/risks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: risk.title,
            description: risk.description,
            probability: risk.probability,
            impact: risk.impact,
            category: risk.category,
            status: "Identificado",
          }),
        });
        applied++;
      }

      // Apply Decisions
      const selectedDecisions = result.decisions?.filter((_, i) => selectedItems[`decision_${i}`]) || [];
      for (const decision of selectedDecisions) {
        await fetch(`/api/projects/${projectId}/decisions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: decision.description,
            madeBy: decision.madeBy,
            context: decision.context,
          }),
        });
        applied++;
      }

      toast.success(`${applied} item(ns) aplicado(s) com sucesso!`);
    } catch {
      toast.error("Erro ao aplicar alguns itens.");
    } finally {
      setApplying(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setSelectedItems({});
    onClose();
  };

  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const totalCount = Object.keys(selectedItems).length;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !loading && (v ? undefined : handleClose())}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-lg">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Transcrição de Reunião
              </DialogTitle>
              <DialogDescription className="text-xs">
                Cole a transcrição e a IA extrai status reports, stakeholders,
                tarefas, riscos e decisões automaticamente.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4 mt-4">
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Cole aqui a transcrição da reunião, ata, notas ou bullet points informais...&#10;&#10;Exemplo:&#10;- João apresentou o progresso do módulo de relatórios (80% concluído)&#10;- Ficou decidido que o prazo será estendido em 2 semanas&#10;- Maria levantou risco de dependência do fornecedor X&#10;- Próxima reunião: revisar protótipos com o cliente"
              className="w-full min-h-[220px] rounded-xl border border-border bg-background px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={loading || !transcript.trim()}
                className="gap-2 font-bold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Analisar com IA
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-border p-4">
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Resumo da Reunião
              </h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {result.summary}
              </p>
            </div>

            {/* Selection header */}
            <div className="flex items-center justify-between bg-primary/5 rounded-lg px-4 py-2 border border-primary/20">
              <span className="text-xs font-bold text-primary">
                {selectedCount} de {totalCount} item(ns) selecionado(s)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const all: Record<string, boolean> = {};
                    Object.keys(selectedItems).forEach((k) => { all[k] = true; });
                    setSelectedItems(all);
                  }}
                  className="text-xs text-primary hover:underline"
                >
                  Selecionar todos
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  onClick={() => {
                    const none: Record<string, boolean> = {};
                    Object.keys(selectedItems).forEach((k) => { none[k] = false; });
                    setSelectedItems(none);
                  }}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Status Report */}
            {result.statusReport &&
              (result.statusReport.accomplishments ||
                result.statusReport.nextSteps ||
                result.statusReport.issues) && (
                <SelectableSection
                  icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                  title="Status Report"
                  selected={!!selectedItems["statusReport"]}
                  onToggle={() => toggleItem("statusReport")}
                >
                  {result.statusReport.overallStatus && (
                    <p className="text-xs font-bold text-primary mb-1">
                      Status sugerido: {result.statusReport.overallStatus}
                      {result.statusReport.statusJustification && ` — ${result.statusReport.statusJustification}`}
                    </p>
                  )}
                  {result.statusReport.accomplishments && (
                    <p className="text-sm text-muted-foreground"><strong>Realizações:</strong> {result.statusReport.accomplishments}</p>
                  )}
                  {result.statusReport.nextSteps && (
                    <p className="text-sm text-muted-foreground mt-1"><strong>Próximos Passos:</strong> {result.statusReport.nextSteps}</p>
                  )}
                  {result.statusReport.issues && (
                    <p className="text-sm text-muted-foreground mt-1"><strong>Problemas:</strong> {result.statusReport.issues}</p>
                  )}
                </SelectableSection>
              )}

            {/* Decisions */}
            {result.decisions && result.decisions.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                  <Gavel className="h-4 w-4 text-purple-500" />
                  Decisões ({result.decisions.length})
                </h3>
                {result.decisions.map((d, i) => (
                  <SelectableItem
                    key={`decision_${i}`}
                    selected={!!selectedItems[`decision_${i}`]}
                    onToggle={() => toggleItem(`decision_${i}`)}
                    primary={d.description}
                    secondary={[
                      d.madeBy && `Por: ${d.madeBy}`,
                      d.context && `Contexto: ${d.context}`,
                    ].filter(Boolean).join(" | ")}
                  />
                ))}
              </div>
            )}

            {/* EAP Updates */}
            {result.eapUpdates && result.eapUpdates.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                  <ArrowUpDown className="h-4 w-4 text-indigo-500" />
                  Atualizações de EAP ({result.eapUpdates.length})
                </h3>
                {result.eapUpdates.map((u, i) => (
                  <SelectableItem
                    key={`eapUpdate_${i}`}
                    selected={!!selectedItems[`eapUpdate_${i}`]}
                    onToggle={() => toggleItem(`eapUpdate_${i}`)}
                    primary={`${u.name} → ${u.newStatus}`}
                    secondary={u.reason}
                  />
                ))}
              </div>
            )}

            {/* Stakeholders */}
            {result.stakeholders && result.stakeholders.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                  <Users className="h-4 w-4 text-blue-500" />
                  Stakeholders ({result.stakeholders.length})
                </h3>
                {result.stakeholders.map((s, i) => (
                  <SelectableItem
                    key={`stakeholder_${i}`}
                    selected={!!selectedItems[`stakeholder_${i}`]}
                    onToggle={() => toggleItem(`stakeholder_${i}`)}
                    primary={s.name}
                    secondary={s.role}
                    badge={s.alreadyRegistered ? "Já cadastrado" : undefined}
                  />
                ))}
              </div>
            )}

            {/* New EAP Items */}
            {result.eapItems && result.eapItems.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                  <ListChecks className="h-4 w-4 text-amber-500" />
                  Novos Itens da EAP ({result.eapItems.length})
                </h3>
                {result.eapItems.map((item, i) => (
                  <SelectableItem
                    key={`eapItem_${i}`}
                    selected={!!selectedItems[`eapItem_${i}`]}
                    onToggle={() => toggleItem(`eapItem_${i}`)}
                    primary={item.name}
                    secondary={item.description}
                  />
                ))}
              </div>
            )}

            {/* Risks */}
            {result.risks && result.risks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 px-1">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  Riscos ({result.risks.length})
                </h3>
                {result.risks.map((r, i) => (
                  <SelectableItem
                    key={`risk_${i}`}
                    selected={!!selectedItems[`risk_${i}`]}
                    onToggle={() => toggleItem(`risk_${i}`)}
                    primary={r.title}
                    secondary={`P:${r.probability} I:${r.impact} — ${r.category}${r.description ? ` — ${r.description}` : ""}`}
                  />
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center gap-3 pt-3 border-t border-border">
              <Button variant="outline" size="sm" onClick={() => { setResult(null); setSelectedItems({}); }}>
                Nova Transcrição
              </Button>
              <div className="flex gap-3">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Fechar
                </Button>
                <Button
                  onClick={handleApplyAll}
                  disabled={applying || selectedCount === 0}
                  className="font-bold gap-2"
                >
                  {applying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Aplicar {selectedCount} selecionado(s)
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SelectableSection({
  icon,
  title,
  selected,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  selected: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-all cursor-pointer ${
        selected
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card opacity-60"
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          {icon}
          {title}
        </h3>
        <ToggleCheck selected={selected} />
      </div>
      <div onClick={(e) => e.stopPropagation()}>{children}</div>
    </div>
  );
}

function SelectableItem({
  selected,
  onToggle,
  primary,
  secondary,
  badge,
}: {
  selected: boolean;
  onToggle: () => void;
  primary: string;
  secondary?: string;
  badge?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer ${
        selected
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card opacity-60"
      }`}
      onClick={onToggle}
    >
      <ToggleCheck selected={selected} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{primary}</p>
          {badge && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {badge}
            </span>
          )}
        </div>
        {secondary && (
          <p className="text-xs text-muted-foreground mt-0.5">{secondary}</p>
        )}
      </div>
    </div>
  );
}

function ToggleCheck({ selected }: { selected: boolean }) {
  return (
    <div
      className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
        selected
          ? "bg-primary border-primary text-white"
          : "border-slate-300 dark:border-slate-600"
      }`}
    >
      {selected ? <Check className="h-3 w-3" /> : null}
    </div>
  );
}
