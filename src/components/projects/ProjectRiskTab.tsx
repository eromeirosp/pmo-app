"use client";

import { useState, useEffect, useCallback } from "react";
import { Project } from "@prisma/client";
import { AlertTriangle, PlusCircle, Plus, Trash2, Loader2, AlertCircle, Pencil, Sparkles, X } from "lucide-react";
import { TabHeader } from "./TabHeader";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProjectRiskTabProps {
  project: Project;
}

type RiskItem = {
  id: string;
  level: string;
  levelColor: string;
  title: string;
  status: string;
  probability: number;
  impact: number;
  score: number;
  category: string;
  responsible: string;
  mitigation: string;
  contingency: string;
};

const LEVEL_COLORS: Record<string, string> = {
  "Muito Alto": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "Alto": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "Médio": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Baixo": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Muito Baixo": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

const PROB_LABELS: Record<number, string> = { 1: "Muito Baixa", 2: "Baixa", 3: "Média", 4: "Alta", 5: "Muito Alta" };
const IMPACT_LABELS: Record<number, string> = { 1: "Muito Baixo", 2: "Baixo", 3: "Médio", 4: "Alto", 5: "Muito Alto" };

function calculateLevel(probability: number, impact: number): string {
  const score = probability * impact;
  if (score >= 16) return "Muito Alto";
  if (score >= 10) return "Alto";
  if (score >= 5) return "Médio";
  if (score >= 3) return "Baixo";
  return "Muito Baixo";
}

export function ProjectRiskTab({ project }: ProjectRiskTabProps) {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "", category: "", description: "",
    probability: 3, impact: 3, status: "Em Monitoramento",
    responsible: "", mitigation: "", contingency: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [form, setForm] = useState({
    title: "", category: "", description: "",
    probability: 3, impact: 3, status: "Em Monitoramento",
    responsible: "", mitigation: "", contingency: "",
  });
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [suggestedRisks, setSuggestedRisks] = useState<{ title: string; description: string; probability: number; impact: number; category: string; mitigation: string; contingency: string }[]>([]);

  const baseUrl = `/api/projects/${project.id}/risks`;

  useEffect(() => {
    fetch(baseUrl)
      .then((r) => r.json())
      .then((data: Array<{
        id: string;
        level?: string;
        title?: string;
        description?: string;
        status: string;
        category?: string;
        responsible?: string;
        mitigation?: string;
        contingency?: string;
      }>) => {
        if (!Array.isArray(data)) return;
        setRisks(data.map((r) => ({
          id: r.id,
          level: r.level || "Médio",
          levelColor: LEVEL_COLORS[r.level] || LEVEL_COLORS["Médio"],
          title: r.title || r.description,
          status: r.status,
          impact: r.level,
          category: r.category || "Geral",
          responsible: r.responsible || "—",
          mitigation: r.mitigation || "—",
          contingency: r.contingency || "—",
        })));
      })
      .finally(() => setLoading(false));
  }, [baseUrl]);

  const handleAdd = useCallback(async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const p = form.probability;
    const i = form.impact;
    const level = calculateLevel(p, i);
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || form.title,
        level,
        category: form.category || "Geral",
        responsible: form.responsible,
        mitigation: form.mitigation,
        contingency: form.contingency,
        status: form.status,
        probability: p,
        impact: i,
      }),
    });
    const created = await res.json();
    const newRisk: RiskItem = {
      id: created.id,
      level,
      levelColor: LEVEL_COLORS[level] || LEVEL_COLORS["Médio"],
      title: created.title,
      status: created.status,
      probability: p,
      impact: i,
      score: p * i,
      category: created.category,
      responsible: created.responsible || "—",
      mitigation: created.mitigation || "—",
      contingency: created.contingency || "—",
    };
    setRisks((prev) => [...prev, newRisk]);
    setForm({ title: "", category: "", description: "", probability: 3, impact: 3, status: "Em Monitoramento", responsible: "", mitigation: "", contingency: "" });
    setSaving(false);
  }, [baseUrl, form]);

  const handleDelete = useCallback(async (id: string) => {
    setRisks((prev) => prev.filter((r) => r.id !== id));
    await fetch(`${baseUrl}?itemId=${id}`, { method: "DELETE" });
  }, [baseUrl]);

  const startEditing = (risk: RiskItem) => {
    setEditForm({
      title: risk.title,
      category: risk.category,
      description: "",
      probability: risk.probability,
      impact: risk.impact,
      status: risk.status,
      responsible: risk.responsible === "—" ? "" : risk.responsible,
      mitigation: risk.mitigation === "—" ? "" : risk.mitigation,
      contingency: risk.contingency === "—" ? "" : risk.contingency,
    });
    setEditingRisk(risk);
  };

  const handleEditSave = useCallback(async () => {
    if (!editingRisk) return;
    setSavingEdit(true);
    const p = editForm.probability;
    const i = editForm.impact;
    const level = calculateLevel(p, i);
    try {
      const res = await fetch(baseUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: editingRisk.id,
          title: editForm.title,
          level,
          category: editForm.category || "Geral",
          responsible: editForm.responsible || null,
          mitigation: editForm.mitigation || null,
          contingency: editForm.contingency || null,
          status: editForm.status,
          probability: p,
          impact: i,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setRisks((prev) => prev.map((r) => r.id === editingRisk.id ? {
        ...r,
        title: updated.title,
        level,
        levelColor: LEVEL_COLORS[level] || LEVEL_COLORS["Médio"],
        status: updated.status,
        probability: p,
        impact: i,
        score: p * i,
        category: updated.category || "Geral",
        responsible: updated.responsible || "—",
        mitigation: updated.mitigation || "—",
        contingency: updated.contingency || "—",
      } : r));
      setEditingRisk(null);
      toast.success("Risco atualizado com sucesso");
    } catch {
      toast.error("Erro ao atualizar risco");
    } finally {
      setSavingEdit(false);
    }
  }, [baseUrl, editingRisk, editForm]);

  const handleAiSuggest = async () => {
    setAiSuggesting(true);
    setSuggestedRisks([]);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id, type: "risk_suggest" }),
      });
      if (!res.ok) throw new Error("Erro na IA");
      const data = await res.json();
      const raw = data.suggestions || [];
      // Validate each suggestion has required fields
      setSuggestedRisks(raw.filter((s: Record<string, unknown>) => s && typeof s === "object" && s.title).map((s: Record<string, unknown>) => ({
        title: String(s.title || ""),
        description: String(s.description || ""),
        probability: Number(s.probability) || 3,
        impact: Number(s.impact) || 3,
        category: String(s.category || "Geral"),
        mitigation: String(s.mitigation || ""),
        contingency: String(s.contingency || ""),
      })));
    } catch {
      toast.error("Erro ao gerar sugestões de riscos com IA.");
    } finally {
      setAiSuggesting(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: typeof suggestedRisks[0]) => {
    setSuggestedRisks((prev) => prev.filter((s) => s !== suggestion));
    const p = suggestion.probability;
    const i = suggestion.impact;
    const level = calculateLevel(p, i);
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: suggestion.title,
        description: suggestion.description,
        level,
        category: suggestion.category || "Geral",
        mitigation: suggestion.mitigation,
        contingency: suggestion.contingency || "",
        status: "Identificado",
        probability: p,
        impact: i,
      }),
    });
    const created = await res.json();
    setRisks((prev) => [...prev, {
      id: created.id,
      level,
      levelColor: LEVEL_COLORS[level] || LEVEL_COLORS["Médio"],
      title: created.title,
      status: created.status,
      probability: p,
      impact: i,
      score: p * i,
      category: created.category || "Geral",
      responsible: created.responsible || "—",
      mitigation: created.mitigation || "—",
      contingency: created.contingency || "—",
    }]);
    toast.success("Risco adicionado!");
  };

  const handleDismissSuggestion = (suggestion: typeof suggestedRisks[0]) => {
    setSuggestedRisks((prev) => prev.filter((s) => s !== suggestion));
  };

  const LEVEL_ORDER: Record<string, number> = {
    "Muito Alto": 0,
    "Alto": 1,
    "Médio": 2,
    "Baixo": 3,
    "Muito Baixo": 4
  };

  const sortedRisks = [...risks].sort((a, b) => {
    const orderA = LEVEL_ORDER[a.level as keyof typeof LEVEL_ORDER] ?? 5;
    const orderB = LEVEL_ORDER[b.level as keyof typeof LEVEL_ORDER] ?? 5;
    return orderA - orderB;
  });

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full pb-24 px-4 space-y-8">
      <div className="pt-4">
        <TabHeader
          icon={AlertTriangle}
          title="Matriz de Riscos"
          description="Identificação, avaliação e mitigação de riscos estruturais do projeto."
          actions={
            <button
              onClick={handleAiSuggest}
              disabled={aiSuggesting}
              className="flex items-center gap-2 rounded-xl h-10 px-4 bg-primary/10 text-primary font-medium text-sm hover:bg-primary/20 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              {aiSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Sugerir Riscos com IA
            </button>
          }
        />
      </div>

      {/* AI Risk Suggestions */}
      {suggestedRisks.length > 0 && (
        <div className="space-y-4 bg-primary/5 border border-primary/20 rounded-xl p-5">
          <p className="text-sm font-bold text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Riscos Sugeridos pela IA
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suggestedRisks.map((s, i) => (
              <div key={i} className="bg-background/80 rounded-xl p-4 border border-border space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-sm text-foreground">{s.title}</h4>
                  <button
                    onClick={() => handleDismissSuggestion(s)}
                    className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">{s.description}</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase">
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Prob: {s.probability}/5
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Impacto: {s.impact}/5
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {s.category}
                  </span>
                </div>
                {s.mitigation && (
                  <p className="text-xs text-slate-500"><span className="font-semibold">Mitigação:</span> {s.mitigation}</p>
                )}
                <button
                  onClick={() => handleAcceptSuggestion(s)}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-600 dark:bg-emerald-900/20 dark:hover:bg-emerald-600 px-3 py-2 rounded-lg transition-all cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Risco
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando riscos...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedRisks.length === 0 && (
            <p className="col-span-2 text-sm text-slate-400 italic text-center py-8">Nenhum risco cadastrado. Adicione abaixo.</p>
          )}
          {sortedRisks.map((risk) => (
            <div key={risk.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${risk.levelColor}`}>
                    Risco {risk.level}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEditing(risk)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all cursor-pointer"
                      title="Editar risco"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                          title="Excluir risco"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            Confirmar Exclusão
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o risco &quot;{risk.title}&quot;? Esta ação não pode ser desfeita e será registrada no log de auditoria.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(risk.id)}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{risk.title}</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                  <p className="text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-700 dark:text-slate-300">Status:</span> {risk.status}</p>
                  <p className="text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-700 dark:text-slate-300">Score:</span> {risk.score} ({PROB_LABELS[risk.probability]}/{IMPACT_LABELS[risk.impact]})</p>
                  <p className="text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-700 dark:text-slate-300">Categoria:</span> {risk.category}</p>
                  <p className="text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-700 dark:text-slate-300">Responsável:</span> {risk.responsible}</p>
                </div>
                <div className="space-y-3 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Estratégia de Mitigação</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{risk.mitigation}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Plano de Contingência</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{risk.contingency}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Risk Form Section */}
      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-800/20 px-6 py-4 border-b border-border">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PlusCircle className="text-primary h-6 w-6" />
            Adicionar Novo Risco
          </h2>
        </div>
        <div className="p-6">
          <form className="grid grid-cols-1 md:grid-cols-3 gap-6" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Título do Risco*</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                placeholder="Ex: Atraso na entrega do hardware"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                placeholder="Ex: Infraestrutura"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Descrição*</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                placeholder="Descreva o risco em detalhes..."
                rows={2}
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Probabilidade</label>
              <select
                value={form.probability}
                onChange={(e) => setForm({ ...form, probability: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm font-medium appearance-none focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              >
                <option value={1}>1 — Muito Baixa</option>
                <option value={2}>2 — Baixa</option>
                <option value={3}>3 — Média</option>
                <option value={4}>4 — Alta</option>
                <option value={5}>5 — Muito Alta</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Impacto</label>
              <select
                value={form.impact}
                onChange={(e) => setForm({ ...form, impact: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm font-medium appearance-none focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              >
                <option value={1}>1 — Muito Baixo</option>
                <option value={2}>2 — Baixo</option>
                <option value={3}>3 — Médio</option>
                <option value={4}>4 — Alto</option>
                <option value={5}>5 — Muito Alto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm font-medium appearance-none focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              >
                <option value="Identificado">Identificado</option>
                <option value="Em Monitoramento">Em Monitoramento</option>
                <option value="Ocorrido">Ocorrido</option>
                <option value="Encerrado">Encerrado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Responsável</label>
              <input
                type="text"
                value={form.responsible}
                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                placeholder="Nome do responsável"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Estratégia de Mitigação</label>
              <input
                type="text"
                value={form.mitigation}
                onChange={(e) => setForm({ ...form, mitigation: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                placeholder="Como evitar o risco?"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Plano de Contingência</label>
              <input
                type="text"
                value={form.contingency}
                onChange={(e) => setForm({ ...form, contingency: e.target.value })}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm font-medium focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                placeholder="O que fazer se ocorrer?"
              />
            </div>

            <div className="md:col-span-3 flex justify-end pt-4">
              <button
                type="button"
                onClick={handleAdd}
                disabled={saving || !form.title.trim()}
                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-lg font-bold hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                Adicionar Risco
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* Edit Risk Dialog */}
      <Dialog open={!!editingRisk} onOpenChange={(open) => { if (!open) setEditingRisk(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Risco</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Título do Risco</label>
              <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Categoria</label>
              <input type="text" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Probabilidade</label>
              <select value={editForm.probability} onChange={(e) => setEditForm({ ...editForm, probability: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 px-4 py-3 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value={1}>1 — Muito Baixa</option>
                <option value={2}>2 — Baixa</option>
                <option value={3}>3 — Média</option>
                <option value={4}>4 — Alta</option>
                <option value={5}>5 — Muito Alta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Impacto</label>
              <select value={editForm.impact} onChange={(e) => setEditForm({ ...editForm, impact: Number(e.target.value) })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 px-4 py-3 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value={1}>1 — Muito Baixo</option>
                <option value={2}>2 — Baixo</option>
                <option value={3}>3 — Médio</option>
                <option value={4}>4 — Alto</option>
                <option value={5}>5 — Muito Alto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 px-4 py-3 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                <option value="Identificado">Identificado</option>
                <option value="Em Monitoramento">Em Monitoramento</option>
                <option value="Ocorrido">Ocorrido</option>
                <option value="Encerrado">Encerrado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Responsável</label>
              <input type="text" value={editForm.responsible} onChange={(e) => setEditForm({ ...editForm, responsible: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Estratégia de Mitigação</label>
              <input type="text" value={editForm.mitigation} onChange={(e) => setEditForm({ ...editForm, mitigation: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Plano de Contingência</label>
              <input type="text" value={editForm.contingency} onChange={(e) => setEditForm({ ...editForm, contingency: e.target.value })} className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditingRisk(null)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancelar</button>
            <button onClick={handleEditSave} disabled={savingEdit || !editForm.title.trim()} className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50">
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

