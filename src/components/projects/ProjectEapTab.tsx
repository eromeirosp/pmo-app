"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Plus, Trash2, Network, Loader2, ChevronUp, ChevronDown, Lock, Link2, X, Sparkles, ChevronRight, Ban, AlertTriangle } from 'lucide-react';
import { TabHeader } from "./TabHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { parseLocalDate } from "@/lib/utils";
import { createPdfDoc, addTable, savePdf } from "@/lib/pdf-utils";

type EapItem = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  status: string;
  order: number;
  dependsOn: string[];
  createdAt: string;
};

type EapSuggestion = {
  name: string;
  description: string;
  children: { name: string; description: string }[];
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

function DependencyPicker({ item, allItems, onChange, disabled }: {
  item: EapItem;
  allItems: EapItem[];
  onChange: (deps: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const candidates = allItems.filter((i) => i.id !== item.id);
  const depNames = item.dependsOn
    .map((depId) => allItems.find((i) => i.id === depId)?.name)
    .filter(Boolean);

  const toggle = (depId: string) => {
    const next = item.dependsOn.includes(depId)
      ? item.dependsOn.filter((d) => d !== depId)
      : [...item.dependsOn, depId];
    onChange(next);
  };

  if (candidates.length === 0) {
    return <span className="text-xs text-slate-400 italic">—</span>;
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        title="Gerenciar dependências"
      >
        <Link2 className="h-3.5 w-3.5 shrink-0" />
        {depNames.length > 0 ? (
          <span className="max-w-[180px] truncate">{depNames.join(", ")}</span>
        ) : (
          <span className="italic">Nenhuma</span>
        )}
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-xl p-2 space-y-1 max-h-48 overflow-y-auto">
          <p className="text-[10px] font-bold text-muted-foreground uppercase px-1 mb-1">Depende de:</p>
          {candidates.map((c) => (
            <label key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={item.dependsOn.includes(c.id)}
                onChange={() => toggle(c.id)}
                className="rounded border-slate-300 text-primary focus:ring-primary/50"
              />
              <span className="truncate text-foreground">{c.name}</span>
              <span className={`ml-auto text-[10px] font-bold ${c.status === 'DONE' ? 'text-green-600' : c.status === 'IN_PROGRESS' ? 'text-blue-600' : 'text-slate-400'}`}>
                {c.status === 'DONE' ? '✓' : c.status === 'IN_PROGRESS' ? '◎' : '○'}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function buildTree(items: EapItem[]): (EapItem & { depth: number })[] {
  const result: (EapItem & { depth: number })[] = [];
  const childrenMap = new Map<string | null, EapItem[]>();

  for (const item of items) {
    const key = item.parentId || null;
    if (!childrenMap.has(key)) childrenMap.set(key, []);
    childrenMap.get(key)!.push(item);
  }

  function walk(parentId: string | null, depth: number) {
    const children = childrenMap.get(parentId) || [];
    for (const child of children) {
      result.push({ ...child, depth });
      walk(child.id, depth + 1);
    }
  }

  walk(null, 0);
  return result;
}

export default function ProjectEapTab({ projectId, charterApproved = false }: { projectId: string; charterApproved?: boolean }) {
  const [items, setItems] = useState<EapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'PENDING', parentId: '' });
  const formRef = React.useRef<HTMLDivElement>(null);
  const baseUrl = `/api/projects/${projectId}/eap`;

  // AI Suggestions state
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<EapSuggestion[]>([]);
  const [acceptingAll, setAcceptingAll] = useState(false);

  useEffect(() => {
    fetch(baseUrl)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [baseUrl]);

  const treeItems = React.useMemo(() => buildTree(items), [items]);

  const handleAdd = useCallback(async () => {
    if (!charterApproved || !form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, description: form.description, status: form.status, parentId: form.parentId || null }),
      });
      const created = await res.json();
      setItems((prev: EapItem[]) => [...prev, created].sort((a, b) => a.order - b.order));
      setForm({ name: '', description: '', status: 'PENDING', parentId: '' });
      toast.success("Item adicionado à EAP.");
    } catch {
      toast.error("Erro ao adicionar item.");
    } finally {
      setSaving(false);
    }
  }, [baseUrl, form, charterApproved]);

  const handleRemove = useCallback(async (id: string) => {
    // Check if it has children first on UI level
    const hasChildren = items.some(i => i.parentId === id);
    if (hasChildren) {
      toast.error("Não é possível excluir um item que possui sub-itens.");
      return;
    }

    try {
      const res = await fetch(`${baseUrl}?itemId=${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.error || "Erro ao excluir.");
        return;
      }
      
      setItems((prev: EapItem[]) => prev.filter((i: EapItem) => i.id !== id));
      toast.success("Item removido.");
    } catch {
      toast.error("Erro ao excluir.");
    }
  }, [baseUrl, items]);

  const handleStatusChange = useCallback(async (id: string, currentStatus: string) => {
    if (!charterApproved) return;
    const cycle: Record<string, string> = {
      PENDING: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
      DONE: 'PENDING',
    };
    const newStatus = cycle[currentStatus] || 'PENDING';
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i));
    try {
      const res = await fetch(baseUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 422 && data.blockedBy) {
          toast.error(`Dependências pendentes: ${data.blockedBy.join(", ")}`);
        } else {
          toast.error("Erro ao atualizar status.");
        }
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: currentStatus } : i));
        return;
      }
    } catch {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: currentStatus } : i));
      toast.error("Erro ao atualizar status.");
    }
  }, [baseUrl, charterApproved]);

  const handleDepsChange = useCallback(async (itemId: string, newDeps: string[]) => {
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, dependsOn: newDeps } : i));
    try {
      await fetch(baseUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, dependsOn: newDeps }),
      });
    } catch {
      toast.error("Erro ao salvar dependências.");
    }
  }, [baseUrl]);

  const handleMove = useCallback(async (id: string, direction: 'up' | 'down') => {
    const item = items.find(i => i.id === id);
    if (!item) return;

    // Get all siblings (nodes with same parent)
    const siblings = items.filter(i => i.parentId === item.parentId).sort((a,b) => a.order - b.order);
    const sibIndex = siblings.findIndex(i => i.id === id);
    
    if (direction === 'up' && sibIndex === 0) return;
    if (direction === 'down' && sibIndex === siblings.length - 1) return;

    const targetIndex = direction === 'up' ? sibIndex - 1 : sibIndex + 1;
    
    // Create new array to avoid mutating state directly
    const newItems = [...items];
    
    // Find absolute indices of items to swap
    const idx1 = newItems.findIndex(i => i.id === siblings[sibIndex].id);
    const idx2 = newItems.findIndex(i => i.id === siblings[targetIndex].id);

    const updatedItems = newItems.map((item: EapItem, idx: number) => ({ ...item, order: idx * 1000 }));
    setItems(updatedItems);

    try {
      await fetch(baseUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [
          { id: newItems[idx1].id, order: newItems[idx1].order },
          { id: newItems[idx2].id, order: newItems[idx2].order }
        ] }),
      });
    } catch {
      toast.error("Erro ao salvar nova ordem.");
      // Revert in real app (omitted for brevity)
    }
  }, [baseUrl, items]);

  // AI Suggest
  const handleSuggest = async () => {
    setSuggesting(true);
    setSuggestions([]);
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, type: "eap_suggest" }),
      });
      if (!res.ok) throw new Error("Erro na IA");
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {
      toast.error("Erro ao gerar sugestões de EAP com IA.");
    } finally {
      setSuggesting(false);
    }
  };

  const handleAcceptSuggestion = async (suggestion: EapSuggestion) => {
    try {
      // Create parent
      const parentRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: suggestion.name, description: suggestion.description, status: 'PENDING', parentId: null }),
      });
      const parent = await parentRes.json();

      const newItems: EapItem[] = [parent];

      // Create children
      for (const child of suggestion.children || []) {
        const childRes = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: child.name, description: child.description, status: 'PENDING', parentId: parent.id }),
        });
        const created = await childRes.json();
        newItems.push(created);
      }

      setItems((prev) => [...prev, ...newItems].sort((a, b) => a.order - b.order));
      setSuggestions((prev) => prev.filter((s) => s.name !== suggestion.name));
      toast.success(`"${suggestion.name}" adicionado à EAP!`);
    } catch {
      toast.error("Erro ao adicionar sugestão.");
    }
  };

  const handleAcceptAll = async () => {
    setAcceptingAll(true);
    try {
      for (const suggestion of suggestions) {
        await handleAcceptSuggestion(suggestion);
      }
      setSuggestions([]);
      toast.success("Todas as sugestões adicionadas!");
    } catch {
      toast.error("Erro ao adicionar algumas sugestões.");
    } finally {
      setAcceptingAll(false);
    }
  };

  const handleExport = async () => {
    if (treeItems.length === 0) {
      toast.error("Nenhum dado para exportar.");
      return;
    }

    try {
      const { doc, startY } = createPdfDoc({
        title: "Estrutura Analítica do Projeto (EAP)",
        projectId,
      });

      const tableData = items.map(item => {
        const depNames = item.dependsOn
          .map((depId: string) => items.find((i: EapItem) => i.id === depId)?.name)
          .filter(Boolean)
          .join(", ");
        return [
          item.name,
          item.description || "—",
          depNames || "—",
          item.status === 'PENDING' ? 'Pendente' : item.status === 'IN_PROGRESS' ? 'Em Progresso' : 'Concluído',
          parseLocalDate(item.createdAt).toLocaleDateString('pt-BR')
        ];
      });

      addTable(doc, startY, [["Nome", "Descrição", "Dependências", "Status", "Criado em"]], tableData);

      await savePdf(doc, `EAP_Projeto_${projectId}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Erro ao gerar PDF.");
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
    const input = formRef.current?.querySelector('input');
    if (input) input.focus();
  };

  if (!charterApproved) {
    return (
      <div className="flex-1 max-w-5xl mx-auto w-full pb-24 px-4">
        <div className="pt-4">
          <TabHeader
            icon={Network}
            title="EAP (Estrutura Analítica do Projeto)"
            description="Decomposição hierárquica do trabalho necessário para o projeto."
            actions={null}
          />
        </div>

        <div className="mt-8 flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
          <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-2xl mb-6">
            <Ban className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Planejamento Bloqueado</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
            Para iniciar o detalhamento da EAP, o **Termo de Abertura (Charter)** deve estar formalmente aprovado.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 p-4 rounded-xl flex items-start gap-3 text-left max-w-md">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 dark:text-amber-500">
              A aprovação do Charter garante que os objetivos e premissas foram validados antes de gastar esforço no detalhamento de tarefas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full pb-24 px-4 space-y-8">
      <div className="pt-4 px-4">
        <TabHeader
          icon={Network}
          title="Estrutura Analítica (EAP)"
          description="Gerencie a decomposição hierárquica do escopo do projeto."
          actions={
            <>
              <button
                onClick={handleSuggest}
                disabled={suggesting || !charterApproved}
                className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-card border border-primary/30 text-primary font-semibold text-sm hover:bg-primary/5 transition-all duration-300 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Sugerir com IA
              </button>
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-card border border-border text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-5 h-5" />
                Exportar
              </button>
              <button
                onClick={scrollToForm}
                disabled={!charterApproved}
                className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                Novo Pacote
              </button>
            </>
          }
        />
      </div>

      {/* Charter Gate */}
      {!charterApproved && (
        <div className="flex items-center gap-3 p-5 rounded-xl border border-amber-200 dark:border-amber-700/30 bg-amber-50 dark:bg-amber-900/10">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <p className="font-bold text-sm text-amber-800 dark:text-amber-300">EAP bloqueada</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              O Termo de Abertura precisa ser aprovado antes de editar a EAP. Vá à aba &quot;Termo de Abertura&quot; e clique em &quot;Aprovar Termo&quot;.
            </p>
          </div>
        </div>
      )}

      {/* AI Suggestions Panel */}
      {suggestions.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-primary flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Sugestões da IA — Estrutura Hierárquica
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptAll}
                disabled={acceptingAll}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                {acceptingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Aceitar Tudo
              </button>
              <button
                onClick={() => setSuggestions([])}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {suggestions.map((s, i) => (
            <div key={i} className="bg-background/80 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">{s.name}</p>
                  {s.description && <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleAcceptSuggestion(s)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5 inline mr-0.5" />Adicionar
                  </button>
                  <button
                    onClick={() => setSuggestions((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {s.children && s.children.length > 0 && (
                <div className="ml-4 space-y-1 border-l-2 border-primary/20 pl-3">
                  {s.children.map((child, ci) => (
                    <div key={ci} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 shrink-0 text-primary/40" />
                      <span className="font-medium text-foreground">{child.name}</span>
                      {child.description && <span className="hidden sm:inline">— {child.description}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Progress Summary */}
      {!loading && items.length > 0 && (() => {
        const done = items.filter(i => i.status === 'DONE').length;
        const inProgress = items.filter(i => i.status === 'IN_PROGRESS').length;
        const pending = items.filter(i => i.status === 'PENDING').length;
        const total = items.length;
        const pctDone = Math.round((done / total) * 100);
        const pctInProgress = Math.round((inProgress / total) * 100);
        return (
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">{pctDone}%</span>
                <span className="text-sm text-muted-foreground font-medium">concluído</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  {done} concluído{done !== 1 ? 's' : ''}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  {inProgress} em progresso
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                  {pending} pendente{pending !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              {pctDone > 0 && (
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${pctDone}%` }}
                />
              )}
              {pctInProgress > 0 && (
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${pctInProgress}%` }}
                />
              )}
            </div>
          </div>
        );
      })()}

      {/* Table Section */}
      <section className="@container">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
          <div className="overflow-x-auto">
            {loading ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/20">
                    <th className="px-4 py-4 border-b border-border min-w-[220px]"><Skeleton className="h-4 w-16" /></th>
                    <th className="px-4 py-4 border-b border-border min-w-[240px]"><Skeleton className="h-4 w-20" /></th>
                    <th className="px-4 py-4 border-b border-border min-w-[160px]"><Skeleton className="h-4 w-24" /></th>
                    <th className="px-4 py-4 border-b border-border text-center"><Skeleton className="h-4 w-14 mx-auto" /></th>
                    <th className="px-4 py-4 border-b border-border text-right"><Skeleton className="h-4 w-12 ml-auto" /></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-52" /></td>
                      <td className="px-4 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-4 py-4 text-center"><Skeleton className="h-6 w-24 rounded-full mx-auto" /></td>
                      <td className="px-4 py-4 text-right"><Skeleton className="h-5 w-20 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/20">
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border min-w-[220px]">Nome</th>
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border min-w-[240px]">Descrição</th>
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border min-w-[160px]">Dependências</th>
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border text-center">Status</th>
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400 italic">Nenhum item cadastrado. Adicione abaixo.</td></tr>
                  )}
                  {buildTree(items).map((item, index) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-4 text-slate-900 dark:text-white text-sm font-medium">
                        <span style={{ paddingLeft: `${item.depth * 24}px` }} className="flex items-center gap-1.5">
                          {item.depth > 0 && <span className="text-slate-300 dark:text-slate-600">└</span>}
                          {item.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 text-sm">{item.description || '—'}</td>
                      <td className="px-4 py-4">
                        <DependencyPicker
                          item={item}
                          allItems={items}
                          onChange={(deps) => handleDepsChange(item.id, deps)}
                          disabled={!charterApproved}
                        />
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleStatusChange(item.id, item.status)}
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all ${STATUS_COLORS[item.status] || STATUS_COLORS.PENDING}`}
                          title="Clique para alterar o status"
                        >
                          {item.status === 'PENDING' ? 'Pendente' : item.status === 'IN_PROGRESS' ? 'Em Progresso' : 'Concluído'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={() => handleMove(item.id, 'up')}
                            disabled={index === 0}
                            className="p-1 text-slate-400 hover:text-primary transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            <ChevronUp className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleMove(item.id, 'down')}
                            disabled={index === items.length - 1}
                            className="p-1 text-slate-400 hover:text-primary transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="h-5 w-5" />
                          </button>
                          <button
                              onClick={() => handleRemove(item.id)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-all cursor-pointer ml-1"
                              title="Remover"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section ref={formRef} className="bg-card rounded-xl border border-border p-6 shadow-md mb-12">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
          <Plus className="text-primary h-5 w-5" /> Adicionar Item à EAP
        </h2>
        <form className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left" onSubmit={(e) => { e.preventDefault(); handleAdd(); }}>
          <div className="md:col-span-8">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome do Pacote/Atividade *</label>
            <input
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              placeholder="Ex: Kick-off e Mobilização"
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          
          <div className="md:col-span-4">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status</label>
            <select
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="PENDING">Pendente</option>
              <option value="IN_PROGRESS">Em Progresso</option>
              <option value="DONE">Concluído</option>
            </select>
          </div>

          <div className="md:col-span-12">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Pacote Pai (Opcional)</label>
            <select
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            >
              <option value="">-- Raiz (Nenhum pacote pai) --</option>
              {treeItems.filter((item) => item.depth === 0).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-12">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Descrição</label>
            <textarea
              className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-4 py-3 text-sm focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
              placeholder="Descreva o escopo deste item..."
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="md:col-span-12 flex justify-end pt-4 border-t border-border">
            <button
              onClick={handleAdd}
              disabled={saving || !form.name.trim() || !charterApproved}
              className="flex items-center justify-center gap-2 px-8 h-12 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
              type="button"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
              Adicionar Item à EAP
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
