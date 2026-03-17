"use client";

import { useState, useEffect, useCallback } from "react";
import { Project, Risk } from "@prisma/client";
import { parseLocalDate } from "@/lib/utils";
import {
  FileText, Lightbulb, CheckCircle2, Trash2, Plus,
  Package, Pin, Ban, AlertTriangle, Loader2, Sparkles, X, ShieldCheck, CircleSlash
} from "lucide-react";
import { TabHeader } from "./TabHeader";
import { toast } from "sonner";

interface ProjectCharterTabProps {
  project: Project & { risks?: Risk[] };
  saveTrigger?: number;
  onApprovalChange?: (approved: boolean) => void;
}

interface CharterRow {
  id: string;
  type: string;
  text: string;
}

const TYPES = {
  CRITERIA: "CRITERIA",
  DELIVERABLE: "DELIVERABLE",
  PREMISE: "PREMISE",
  RESTRICTION: "RESTRICTION",
} as const;

const SUGGEST_TYPE_MAP: Record<string, string> = {
  CRITERIA: "charter_criteria",
  DELIVERABLE: "charter_deliverables",
  PREMISE: "charter_premises",
  RESTRICTION: "charter_restrictions",
};

interface ListSectionProps {
  title: string;
  icon: React.ReactNode;
  items: CharterRow[];
  loading: boolean;
  addLabel: string;
  onAdd: (text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  projectId: string;
  charterType: string;
}

function ListSection({ title, icon, items, loading, addLabel, onAdd, onRemove, projectId, charterType }: ListSectionProps) {
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleAdd = async () => {
    if (!inputValue.trim()) return;
    setSaving(true);
    await onAdd(inputValue.trim());
    setInputValue("");
    setSaving(false);
  };

  const handleSuggest = async () => {
    setSuggesting(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          type: SUGGEST_TYPE_MAP[charterType],
        }),
      });
      if (!res.ok) throw new Error("Erro na IA");
      const data = await res.json();
      const raw = data.suggestions || [];
      // Ensure all suggestions are strings (AI may return objects)
      setSuggestions(raw.map((s: unknown) => typeof s === "string" ? s : typeof s === "object" && s !== null && "text" in s ? String((s as { text: string }).text) : JSON.stringify(s)));
    } catch {
      toast.error("Erro ao gerar sugestões com IA.");
    } finally {
      setSuggesting(false);
    }
  };

  const handleAcceptSuggestion = async (text: string) => {
    setSuggestions((prev) => prev.filter((s) => s !== text));
    await onAdd(text);
    toast.success("Item adicionado!");
  };

  const handleDismissSuggestion = (text: string) => {
    setSuggestions((prev) => prev.filter((s) => s !== text));
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-900 dark:text-white text-md font-bold flex items-center gap-2">
          {icon}{title}
        </h3>
        <button
          onClick={handleSuggest}
          disabled={suggesting}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer disabled:opacity-50"
        >
          {suggesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Sugerir com IA
        </button>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-4 space-y-2 bg-primary/5 border border-primary/20 rounded-lg p-3">
          <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Sugestões da IA
          </p>
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 bg-background/80 rounded-lg p-2.5">
              <span className="flex-1 text-sm text-foreground break-words min-w-0">{s}</span>
              <button
                onClick={() => handleAcceptSuggestion(s)}
                className="shrink-0 text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 inline mr-0.5" />Adicionar
              </button>
              <button
                onClick={() => handleDismissSuggestion(s)}
                className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center text-slate-400 text-sm py-2">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Carregando...
        </div>
      ) : (
        <ul className="space-y-3">
          {items.length === 0 && (
            <li className="text-sm text-slate-400 italic py-2">Nenhum item cadastrado.</li>
          )}
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg group">
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{item.text}</span>
              <button
                onClick={() => onRemove(item.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={addLabel}
          className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-border text-sm px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !inputValue.trim()}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar
        </button>
      </div>
    </div>
  );
}

export function ProjectCharterTab({ project, saveTrigger, onApprovalChange }: ProjectCharterTabProps) {
  const [items, setItems] = useState<CharterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [charterApproved, setCharterApproved] = useState<boolean>((project as any).charterApproved ?? false);
  const [approvingCharter, setApprovingCharter] = useState(false);
  const baseUrl = `/api/projects/${project.id}/charter`;

  useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
      toast.success("Termo de Abertura atualizado.");
    }
  }, [saveTrigger]);

  useEffect(() => {
    fetch(baseUrl)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [baseUrl]);

  const itemsOf = (type: string) => items.filter((i) => i.type === type);

  const handleAdd = useCallback(async (type: string, text: string) => {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, text }),
    });
    const created = await res.json();
    setItems((prev) => [...prev, created]);
  }, [baseUrl]);

  const handleRemove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`${baseUrl}?itemId=${id}`, { method: "DELETE" });
  }, [baseUrl]);

  const handleApproveCharter = useCallback(async () => {
    setApprovingCharter(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charterApproved: true }),
      });
      if (!res.ok) throw new Error("Erro ao aprovar");
      setCharterApproved(true);
      onApprovalChange?.(true);
      toast.success("Termo de Abertura aprovado! A EAP agora pode ser editada.");
    } catch {
      toast.error("Erro ao aprovar o Termo de Abertura.");
    } finally {
      setApprovingCharter(false);
    }
  }, [project.id, onApprovalChange]);

  const handleRemoveApproval = useCallback(async () => {
    setApprovingCharter(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charterApproved: false }),
      });
      if (!res.ok) throw new Error("Erro ao remover aprovação");
      setCharterApproved(false);
      onApprovalChange?.(false);
      toast.success("Aprovação removida. A EAP foi bloqueada.");
    } catch {
      toast.error("Erro ao remover aprovação do Termo.");
    } finally {
      setApprovingCharter(false);
    }
  }, [project.id, onApprovalChange]);

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full pb-24 px-4 space-y-8">
      <div className="pt-4">
        <TabHeader
          icon={FileText}
          title="Termo de Abertura (Project Charter)"
          description="Documento formal que autoriza o projeto e define escopo inicial."
          actions={null}
        />
      </div>

      {/* Approval Banner */}
      <div className={`flex items-center justify-between gap-4 p-5 rounded-xl border ${charterApproved ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-700/30" : "bg-slate-50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/30"}`}>
        <div className="flex items-center gap-3">
          {charterApproved
            ? <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            : <CircleSlash className="h-6 w-6 text-slate-400 shrink-0" />
          }
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">
              Status de Aprovação: {charterApproved ? "Aprovado" : "Pendente"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {charterApproved
                ? "Termo aprovado. A EAP está liberada para edição."
                : "Aprovação necessária para liberar a edição da EAP."}
            </p>
          </div>
        </div>
        {charterApproved ? (
          <button
            onClick={handleRemoveApproval}
            disabled={approvingCharter}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all active:scale-[0.98] shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {approvingCharter
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <CircleSlash className="h-4 w-4" />
            }
            Remover Aprovação
          </button>
        ) : (
          <button
            onClick={handleApproveCharter}
            disabled={approvingCharter}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {approvingCharter
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ShieldCheck className="h-4 w-4" />
            }
            Aprovar Termo
          </button>
        )}
      </div>

      {/* Info section */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Projeto</p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{project.name}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Gerente</p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">{project.manager}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Início</p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {(project as any).startDate ? parseLocalDate((project as any).startDate).toLocaleDateString("pt-BR") : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Término</p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {(project as any).endDate ? parseLocalDate((project as any).endDate).toLocaleDateString("pt-BR") : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ListSection
          title="Critérios de Sucesso"
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          items={itemsOf(TYPES.CRITERIA)}
          loading={loading}
          addLabel="Adicionar critério de sucesso..."
          onAdd={(text) => handleAdd(TYPES.CRITERIA, text)}
          onRemove={handleRemove}
          projectId={project.id}
          charterType={TYPES.CRITERIA}
        />
        <ListSection
          title="Principais Entregas"
          icon={<Package className="h-5 w-5 text-primary" />}
          items={itemsOf(TYPES.DELIVERABLE)}
          loading={loading}
          addLabel="Adicionar entrega principal..."
          onAdd={(text) => handleAdd(TYPES.DELIVERABLE, text)}
          onRemove={handleRemove}
          projectId={project.id}
          charterType={TYPES.DELIVERABLE}
        />
        <ListSection
          title="Premissas"
          icon={<Pin className="h-5 w-5 text-blue-500" />}
          items={itemsOf(TYPES.PREMISE)}
          loading={loading}
          addLabel="Adicionar premissa..."
          onAdd={(text) => handleAdd(TYPES.PREMISE, text)}
          onRemove={handleRemove}
          projectId={project.id}
          charterType={TYPES.PREMISE}
        />
        <ListSection
          title="Restrições"
          icon={<Ban className="h-5 w-5 text-red-500" />}
          items={itemsOf(TYPES.RESTRICTION)}
          loading={loading}
          addLabel="Adicionar restrição..."
          onAdd={(text) => handleAdd(TYPES.RESTRICTION, text)}
          onRemove={handleRemove}
          projectId={project.id}
          charterType={TYPES.RESTRICTION}
        />
      </div>

      {/* Riscos iniciais */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl p-6">
        <h3 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5" /> Riscos Iniciais Identificados
        </h3>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-500">
          {!project.risks || project.risks.length === 0 ? (
            <li className="italic text-amber-600/70">Nenhum risco inicial cadastrado.</li>
          ) : (
            project.risks.map((risk) => (
              <li key={risk.id} className="flex items-start gap-2">
                <span className="font-bold shrink-0">•</span>
                <span>{risk.description}</span>
              </li>
            ))
          )}
        </ul>
        <p className="text-xs text-amber-500 mt-3 flex items-center gap-1">
          <Lightbulb className="h-3.5 w-3.5" /> Riscos detalhados são gerenciados na aba &quot;Matriz de Risco&quot;.
        </p>
      </div>
    </div>
  );
}
