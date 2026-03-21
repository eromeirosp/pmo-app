"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckSquare, BookOpen, Lightbulb, Loader2, Plus, Trash2, Circle, Download, Sparkles, X, FileText } from "lucide-react";
import { TabHeader } from "./TabHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createPdfDoc, addSection, savePdf } from "@/lib/pdf-utils";
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

interface ClosingRow {
  id: string;
  type: string;
  text: string;
}

interface ClosingSuggestions {
  summary: string;
  deliverables: { text: string; status: string }[];
  lessons: string[];
  recommendations: string[];
}

interface EditableListProps {
  items: ClosingRow[];
  loading: boolean;
  onAdd: (text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  placeholder: string;
  emptyMessage: string;
}

function EditableList({ items, loading, onAdd, onRemove, placeholder, emptyMessage }: EditableListProps) {
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!inputValue.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd(inputValue.trim());
      setInputValue("");
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <Skeleton className="h-4 w-4 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {items.length === 0 && (
            <p className="text-sm text-slate-400 italic py-2">{emptyMessage}</p>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 group transition-all"
            >
              <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600 shrink-0" />
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{item.text}</span>

              <AlertDialog open={itemToDelete === item.id} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogTrigger asChild>
                  <button
                    onClick={() => setItemToDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente este item de encerramento.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onRemove(item.id)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </>
      )}

      <div className="flex gap-2 pt-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={placeholder}
          disabled={saving}
          className="flex-1 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-white/10 text-sm px-4 py-2.5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !inputValue.trim()}
          className="flex items-center gap-1.5 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar
        </button>
      </div>
    </div>
  );
}

interface ProjectEncerramentoTabProps {
  projectId: string;
}

const TYPES = {
  DELIVERABLE: "DELIVERABLE",
  LESSON: "LESSON",
  RECOMMENDATION: "RECOMMENDATION",
} as const;

export function ProjectEncerramentoTab({ projectId }: ProjectEncerramentoTabProps) {
  const [items, setItems] = useState<ClosingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = `/api/projects/${projectId}/closing`;

  // AI state
  const [suggesting, setSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ClosingSuggestions | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch(baseUrl);
      if (!res.ok) throw new Error("Erro ao buscar itens");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const itemsOf = (type: string) => items.filter((i) => i.type === type);

  const handleAdd = useCallback(async (type: string, text: string) => {
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, text }),
      });

      if (!res.ok) throw new Error("Erro ao criar item");

      const created = await res.json();
      setItems((prev) => [...prev, created]);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }, [baseUrl]);

  const handleRemove = useCallback(async (id: string) => {
    try {
      setItems((prev) => prev.filter((i) => i.id !== id));

      const res = await fetch(`${baseUrl}?itemId=${id}`, { method: "DELETE" });
      if (!res.ok) {
        fetchItems();
        throw new Error("Erro ao remover item");
      }
    } catch (error) {
      console.error(error);
    }
  }, [baseUrl, fetchItems]);

  // AI Suggest
  const handleSuggest = async () => {
    setSuggesting(true);
    setAiSuggestions(null);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type: "closing_suggest" }),
      });
      if (!res.ok) throw new Error("Erro na IA");
      const data = await res.json();
      setAiSuggestions(data);
    } catch {
      toast.error("Erro ao gerar sugestões de encerramento com IA.");
    } finally {
      setSuggesting(false);
    }
  };

  const handleAcceptDeliverable = async (d: { text: string; status: string }) => {
    const fullText = `${d.text} [${d.status}]`;
    await handleAdd(TYPES.DELIVERABLE, fullText);
    setAiSuggestions((prev) => prev ? {
      ...prev,
      deliverables: prev.deliverables.filter((item) => item.text !== d.text),
    } : null);
    toast.success("Entregável adicionado!");
  };

  const handleAcceptLesson = async (lesson: string) => {
    await handleAdd(TYPES.LESSON, lesson);
    setAiSuggestions((prev) => prev ? {
      ...prev,
      lessons: prev.lessons.filter((l) => l !== lesson),
    } : null);
    toast.success("Lição adicionada!");
  };

  const handleAcceptRecommendation = async (rec: string) => {
    await handleAdd(TYPES.RECOMMENDATION, rec);
    setAiSuggestions((prev) => prev ? {
      ...prev,
      recommendations: prev.recommendations.filter((r) => r !== rec),
    } : null);
    toast.success("Recomendação adicionada!");
  };

  const handleAcceptAll = async () => {
    if (!aiSuggestions) return;
    try {
      for (const d of aiSuggestions.deliverables) {
        await handleAdd(TYPES.DELIVERABLE, `${d.text} [${d.status}]`);
      }
      for (const l of aiSuggestions.lessons) {
        await handleAdd(TYPES.LESSON, l);
      }
      for (const r of aiSuggestions.recommendations) {
        await handleAdd(TYPES.RECOMMENDATION, r);
      }
      setAiSuggestions(null);
      toast.success("Todas as sugestões adicionadas!");
    } catch {
      toast.error("Erro ao adicionar algumas sugestões.");
    }
  };

  const handleExport = async () => {
    const deliverables = itemsOf(TYPES.DELIVERABLE);
    const lessons = itemsOf(TYPES.LESSON);
    const recommendations = itemsOf(TYPES.RECOMMENDATION);

    if (deliverables.length === 0 && lessons.length === 0 && recommendations.length === 0) {
      toast.error("Nenhum dado para exportar.");
      return;
    }

    try {
      const { doc, startY: initialY } = createPdfDoc({
        title: "Termo de Encerramento do Projeto",
        projectId,
      });

      let startY = initialY;

      if (deliverables.length > 0) {
        startY = addSection(doc, startY, "Entregáveis Finais",
          deliverables.map((item, i) => [String(i + 1), item.text])
        );
      }

      if (lessons.length > 0) {
        startY = addSection(doc, startY, "Lições Aprendidas",
          lessons.map((item, i) => [String(i + 1), item.text])
        );
      }

      if (recommendations.length > 0) {
        addSection(doc, startY, "Recomendações para Projetos Futuros",
          recommendations.map((item, i) => [String(i + 1), item.text])
        );
      }

      await savePdf(doc, `Encerramento_Projeto_${projectId}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Erro ao gerar PDF.");
    }
  };

  const STATUS_BADGE: Record<string, string> = {
    "concluído": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "parcial": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "não entregue": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full pb-24 px-4 space-y-8">
      <div className="pt-4">
        <TabHeader
          icon={CheckSquare}
          title="Encerramento do Projeto"
          description="Formalização do encerramento, lições aprendidas e recomendações para projetos futuros."
          actions={
            <>
              <button
                onClick={handleSuggest}
                disabled={suggesting}
                className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-card border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-all duration-300 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Gerar com IA
              </button>
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-card border border-border text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-5 h-5" />
                Exportar
              </button>
            </>
          }
        />
      </div>

      {/* AI Suggestions Panel */}
      {aiSuggestions && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Sugestões da IA — Encerramento
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptAll}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Aceitar Tudo
              </button>
              <button
                onClick={() => setAiSuggestions(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Executive Summary */}
          {aiSuggestions.summary && (
            <div className="bg-background/80 rounded-lg p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Resumo Executivo
              </p>
              <p className="text-sm text-foreground whitespace-pre-line">{aiSuggestions.summary}</p>
            </div>
          )}

          {/* Deliverables */}
          {aiSuggestions.deliverables.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <CheckSquare className="h-3.5 w-3.5" /> Entregáveis ({aiSuggestions.deliverables.length})
              </p>
              {aiSuggestions.deliverables.map((d, i) => (
                <div key={i} className="flex items-center gap-2 bg-background/80 rounded-lg p-2.5">
                  <span className="flex-1 text-sm text-foreground">{d.text}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[d.status] || STATUS_BADGE["concluído"]}`}>
                    {d.status}
                  </span>
                  <button
                    onClick={() => handleAcceptDeliverable(d)}
                    className="shrink-0 text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 inline mr-0.5" />Adicionar
                  </button>
                  <button
                    onClick={() => setAiSuggestions((prev) => prev ? { ...prev, deliverables: prev.deliverables.filter((_, idx) => idx !== i) } : null)}
                    className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Lessons */}
          {aiSuggestions.lessons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" /> Lições Aprendidas ({aiSuggestions.lessons.length})
              </p>
              {aiSuggestions.lessons.map((l, i) => (
                <div key={i} className="flex items-start gap-2 bg-background/80 rounded-lg p-2.5">
                  <span className="flex-1 text-sm text-foreground break-words min-w-0">{l}</span>
                  <button
                    onClick={() => handleAcceptLesson(l)}
                    className="shrink-0 text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 inline mr-0.5" />Adicionar
                  </button>
                  <button
                    onClick={() => setAiSuggestions((prev) => prev ? { ...prev, lessons: prev.lessons.filter((_, idx) => idx !== i) } : null)}
                    className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {aiSuggestions.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" /> Recomendações ({aiSuggestions.recommendations.length})
              </p>
              {aiSuggestions.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2 bg-background/80 rounded-lg p-2.5">
                  <span className="flex-1 text-sm text-foreground break-words min-w-0">{r}</span>
                  <button
                    onClick={() => handleAcceptRecommendation(r)}
                    className="shrink-0 text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 inline mr-0.5" />Adicionar
                  </button>
                  <button
                    onClick={() => setAiSuggestions((prev) => prev ? { ...prev, recommendations: prev.recommendations.filter((_, idx) => idx !== i) } : null)}
                    className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: "Entregáveis Finais", count: itemsOf(TYPES.DELIVERABLE).length, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/30" },
          { label: "Lições Aprendidas", count: itemsOf(TYPES.LESSON).length, color: "text-primary", bg: "bg-primary/5 border-primary/20" },
          { label: "Recomendações", count: itemsOf(TYPES.RECOMMENDATION).length, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30" },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl border p-5 ${card.bg}`}>
            <p className={`text-3xl font-black ${card.color}`}>{card.count}</p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Entregáveis Finais */}
      <div className="bg-card dark:bg-slate-900/80 p-6 rounded-2xl border border-border dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100 mb-5">
          <CheckSquare className="h-5 w-5 text-emerald-500" />
          Entregáveis Finais
        </h2>
        <EditableList
          items={itemsOf(TYPES.DELIVERABLE)}
          loading={loading}
          onAdd={(text) => handleAdd(TYPES.DELIVERABLE, text)}
          onRemove={handleRemove}
          placeholder="Ex: Relatório final de implantação..."
          emptyMessage="Nenhum entregável cadastrado ainda."
        />
      </div>

      {/* Lições Aprendidas */}
      <div className="bg-card dark:bg-slate-900/80 p-6 rounded-2xl border border-border dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100 mb-5">
          <BookOpen className="h-5 w-5 text-primary" />
          Lições Aprendidas
        </h2>
        <EditableList
          items={itemsOf(TYPES.LESSON)}
          loading={loading}
          onAdd={(text) => handleAdd(TYPES.LESSON, text)}
          onRemove={handleRemove}
          placeholder="Ex: Envolver usuários mais cedo no processo..."
          emptyMessage="Nenhuma lição aprendida cadastrada ainda."
        />
      </div>

      {/* Recomendações */}
      <div className="bg-card dark:bg-slate-900/80 p-6 rounded-2xl border border-border dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-slate-100 mb-5">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          Recomendações para Projetos Futuros
        </h2>
        <EditableList
          items={itemsOf(TYPES.RECOMMENDATION)}
          loading={loading}
          onAdd={(text) => handleAdd(TYPES.RECOMMENDATION, text)}
          onRemove={handleRemove}
          placeholder="Ex: Definir sponsors executivos antes do kick-off..."
          emptyMessage="Nenhuma recomendação cadastrada ainda."
        />
      </div>
    </div>
  );
}
