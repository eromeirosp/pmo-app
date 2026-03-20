"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  ChevronDown,
  ArrowRight,
  Info,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { cn, parseLocalDate, calculateROI } from "@/lib/utils";
import { toast } from "sonner";
import { TabHeader } from "./TabHeader";

const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300";

function InputWrapper({ label, children, fullWidth = false }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-2", fullWidth ? "col-span-full" : "")}>
      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative group">
        {children}
      </div>
    </div>
  );
}

interface Ritual {
  name: string;
  recommended: boolean;
  frequency: string;
  justification: string;
}

interface CadenceData {
  governanceSummary: string;
  rituals: Ritual[];
}

interface ProjectInfoTabProps {
  project: {
    id: string;
    name?: string | null;
    description?: string | null;
    manager?: string | null;
    stakeholders?: string | null;
    department?: string | null;
    classification?: string | null;
    status?: string | null;
    budget?: number | string | null;
    expectedReturn?: number | null;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    computedStatus?: string | null;
    artifacts?: Array<{ type: string; content: unknown }>;
  };
  saveTrigger?: number;
}

export function ProjectInfoTab({ project, saveTrigger }: ProjectInfoTabProps) {
  const getInitialData = () => ({
    name: project.name || "",
    description: project.description || "",
    manager: project.manager || "",
    stakeholders: project.stakeholders || "",
    department: project.department || "Tecnologia da Informação",
    classification: project.classification || "TRADITIONAL",
    status: project.status || "ACTIVE",
    budget: project.budget?.toString() || "",
    expectedReturn: project.expectedReturn?.toString() || "",
    startDate: project.startDate ? parseLocalDate(project.startDate).toISOString().split('T')[0] : "2025-10-01",
    endDate: project.endDate ? parseLocalDate(project.endDate).toISOString().split('T')[0] : "2026-06-30",
  });

  const [formData, setFormData] = useState(getInitialData());

  const [loading, setLoading] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiClassification, setAiClassification] = useState<{ classification: string; justification: string } | null>(null);
  const [cadenceSuggesting, setCadenceSuggesting] = useState(false);

  // Extract cadence data from artifacts
  const cadenceArtifact = project.artifacts?.find((a) => a.type === "CADENCE_RITUALS");
  const [cadenceData, setCadenceData] = useState<CadenceData | null>(
    cadenceArtifact ? (cadenceArtifact.content as CadenceData) : null
  );

  const handleSuggestCadence = async () => {
    setCadenceSuggesting(true);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, type: "cadence_suggest" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCadenceData(data);
      toast.success("Cadência atualizada pela IA.");
    } catch {
      toast.error("Erro ao obter sugestão de cadência.");
    } finally {
      setCadenceSuggesting(false);
    }
  };

  const handleSuggestClassification = async () => {
    setAiSuggesting(true);
    setAiClassification(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, type: "classification" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAiClassification(data);
    } catch {
      toast.error("Erro ao obter sugestão da IA.");
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleAcceptClassification = () => {
    if (aiClassification) {
      setFormData({ ...formData, classification: aiClassification.classification });
      toast.success("Classificação aplicada.");
      setAiClassification(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error();
      
      toast.success("Projeto atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar projeto.");
    } finally {
      setLoading(false);
    }
  };
  const handleDiscard = () => {
    setFormData(getInitialData());
    toast.info("Alterações descartadas.");
  };

  useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  }, [saveTrigger]);

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <TabHeader 
        icon={Info} 
        title="Informações do Projeto" 
        description="Gerencie os detalhes básicos e metadados estruturais do projeto."
      />

      <form onSubmit={handleSubmit} className="bg-card dark:bg-slate-900/80 border border-border dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:ring-1 dark:ring-white/5 overflow-hidden">
        {/* Card Content */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* Nome do Projeto - Full Width */}
          <InputWrapper label="Nome do Projeto *" fullWidth>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClasses}
              placeholder="Digite o nome do projeto..."
            />
          </InputWrapper>

          {/* Descrição - Full Width */}
          <InputWrapper label="Descrição *" fullWidth>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={cn(inputClasses, "resize-none h-24 py-3")}
              placeholder="Descreva os objetivos do projeto..."
            />
          </InputWrapper>

          {/* Row 1: Gerente | Patrocinador */}
          <InputWrapper label="Gerente do Projeto *">
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className={inputClasses}
            />
          </InputWrapper>

          <InputWrapper label="Patrocinador *">
            <input
              type="text"
              value={formData.stakeholders}
              onChange={(e) => setFormData({ ...formData, stakeholders: e.target.value })}
              className={inputClasses}
            />
          </InputWrapper>

          {/* Row 2: Departamento | Tipo */}
          <InputWrapper label="Departamento *">
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className={inputClasses}
            />
          </InputWrapper>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tipo de Projeto *</label>
              <button
                type="button"
                onClick={handleSuggestClassification}
                disabled={aiSuggesting}
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer disabled:opacity-50"
              >
                {aiSuggesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                Sugerir IA
              </button>
            </div>
            <div className="relative group">
              <div className="relative">
                <select
                  value={formData.classification}
                  onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                  className={cn(inputClasses, "appearance-none pr-10")}
                >
                  <option value="TRADITIONAL">Tradicional</option>
                  <option value="AGILE">Ágil</option>
                  <option value="HYBRID">Híbrido</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              {aiClassification && (
                <div className="mt-2 p-3 rounded-lg border border-primary/20 bg-primary/5 dark:bg-primary/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Sugestão: {aiClassification.classification === "TRADITIONAL" ? "Tradicional" : aiClassification.classification === "AGILE" ? "Ágil" : "Híbrido"}
                    </span>
                    <button
                      type="button"
                      onClick={handleAcceptClassification}
                      className="text-xs font-bold text-primary hover:text-primary/80 px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                    >
                      Aceitar
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">{aiClassification.justification}</p>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Status | Data Início */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Status *</label>
            <div className="relative group">
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={cn(inputClasses, "appearance-none pr-10")}
                >
                  <option value="GREEN">Em Execução</option>
                  <option value="YELLOW">Atenção</option>
                  <option value="RED">Crítico</option>
                  <option value="ON_HOLD">Em Pausa</option>
                  <option value="COMPLETED">Concluído</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              {project.computedStatus && (() => {
                const computed = project.computedStatus;
                const current = formData.status;
                const statusLabels: Record<string, string> = { GREEN: "Em Execução", YELLOW: "Atenção", RED: "Crítico" };
                const statusColors: Record<string, string> = {
                  GREEN: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
                  YELLOW: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
                  RED: "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800",
                };
                const differs = computed !== current && current !== "ON_HOLD" && current !== "COMPLETED";
                return (
                  <div className={cn("mt-2 px-3 py-2 rounded-lg border text-xs", statusColors[computed] || statusColors.GREEN)}>
                    <span className="font-bold">Sugerido: {statusLabels[computed] || computed}</span>
                    {differs && (
                      <span className="ml-2 opacity-75">
                        (difere do manual)
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, status: computed })}
                          className="ml-1 underline font-bold hover:opacity-100 cursor-pointer"
                        >
                          Aceitar
                        </button>
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <InputWrapper label="Data de Início *">
            <div className="relative">
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={cn(inputClasses, "pr-10")}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </InputWrapper>

          {/* Row 4: Termino | Orçamento */}
          <InputWrapper label="Data de Término Prevista *">
            <div className="relative">
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={cn(inputClasses, "pr-10")}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </InputWrapper>

          <InputWrapper label="Orçamento (R$) *">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R$</span>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className={cn(inputClasses, "pl-10")}
              />
            </div>
          </InputWrapper>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Retorno Esperado (R$)</label>
            <div className="relative group">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R$</span>
                <input
                  type="text"
                  value={formData.expectedReturn}
                  onChange={(e) => setFormData({ ...formData, expectedReturn: e.target.value })}
                  className={cn(inputClasses, "pl-10")}
                  placeholder="Valor estimado de retorno"
                />
              </div>
              {(() => {
                const budgetNum = parseFloat(String(formData.budget).replace(/[^\d.]/g, ''));
                const returnNum = parseFloat(String(formData.expectedReturn).replace(/[^\d.]/g, ''));
                const roi = calculateROI(budgetNum, returnNum);
                if (roi === null) return null;
                return (
                  <div className={cn(
                    "mt-1.5 text-xs font-bold px-2 py-1 rounded-md inline-flex items-center gap-1",
                    roi > 0 ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20" : "text-rose-600 bg-rose-50 dark:bg-rose-900/20"
                  )}>
                    ROI: {Math.round(roi)}%
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-border bg-slate-50 dark:bg-slate-800/20 flex items-center justify-end gap-6">
          <button
            type="button"
            onClick={handleDiscard}
            className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Descartar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] shadow-md disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>

      {/* Cadência e Rituais Recomendados */}
      <div className="mt-8 bg-card dark:bg-slate-900/80 border border-border dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:ring-1 dark:ring-white/5 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Cadência e Rituais Recomendados
              </h3>
              {cadenceData?.governanceSummary && (
                <p className="text-sm text-muted-foreground italic mt-2 max-w-3xl">
                  {cadenceData.governanceSummary}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleSuggestCadence}
              disabled={cadenceSuggesting}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer disabled:opacity-50 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10"
            >
              {cadenceSuggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {cadenceData ? "Regenerar" : "Sugerir Cadência"}
            </button>
          </div>

          {cadenceData?.rituals && cadenceData.rituals.length > 0 ? (
            <div className="space-y-3">
              {cadenceData.rituals.map((ritual, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border transition-colors",
                    ritual.recommended
                      ? "bg-emerald-50/50 border-emerald-200/50 dark:bg-emerald-950/20 dark:border-emerald-800/30"
                      : "bg-slate-50/50 border-slate-200/50 dark:bg-slate-800/20 dark:border-slate-700/30 opacity-60"
                  )}
                >
                  {ritual.recommended ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-sm font-bold",
                        ritual.recommended
                          ? "text-slate-900 dark:text-slate-100"
                          : "text-slate-500 dark:text-slate-400 line-through"
                      )}>
                        {ritual.name}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                        ritual.recommended
                          ? "bg-primary/10 text-primary"
                          : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                      )}>
                        {ritual.frequency}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ritual.justification}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma recomendação de cadência disponível.</p>
              <p className="text-xs mt-1">Clique em &quot;Sugerir Cadência&quot; para gerar recomendações com IA.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
