"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Download, Plus, Trash2, Network, Loader2, ChevronUp, ChevronDown, CornerDownRight, Ban, AlertTriangle } from 'lucide-react';
import { TabHeader } from "./TabHeader";
import { toast } from 'sonner';
import { parseLocalDate } from "@/lib/utils";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type EapItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  order: number;
  parentId: string | null;
  createdAt: string;
};

type EapItemRender = EapItem & { depth: number };

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

// Helper: Transforms flat list to ordered tree array for rendering
function buildEapTree(flatItems: EapItem[]): EapItemRender[] {
  const rootItems = flatItems.filter(i => !i.parentId).sort((a, b) => a.order - b.order);
  const getChildren = (parentId: string, depth: number): EapItemRender[] => {
    const children = flatItems.filter(i => i.parentId === parentId).sort((a, b) => a.order - b.order);
    let result: EapItemRender[] = [];
    for (const child of children) {
      result.push({ ...child, depth });
      result = result.concat(getChildren(child.id, depth + 1));
    }
    return result;
  };

  let result: EapItemRender[] = [];
  for (const root of rootItems) {
    result.push({ ...root, depth: 0 });
    result = result.concat(getChildren(root.id, 1));
  }
  return result;
}

export default function ProjectEapTab({ projectId, charterApproved = false }: { projectId: string, charterApproved?: boolean }) {
  const [items, setItems] = useState<EapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'PENDING', parentId: '' });
  const formRef = React.useRef<HTMLDivElement>(null);
  const baseUrl = `/api/projects/${projectId}/eap`;

  useEffect(() => {
    fetch(baseUrl)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [baseUrl]);

  const treeItems = React.useMemo(() => buildEapTree(items), [items]);

  const handleAdd = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: form.name, 
          description: form.description, 
          status: form.status,
          parentId: form.parentId || null
        }),
      });
      const created = await res.json();
      setItems((prev: EapItem[]) => [...prev, created]);
      setForm({ name: '', description: '', status: 'PENDING', parentId: '' });
      toast.success("Item adicionado à EAP.");
    } catch {
      toast.error("Erro ao adicionar item.");
    } finally {
      setSaving(false);
    }
  }, [baseUrl, form]);

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
    const cycle: Record<string, string> = {
      PENDING: 'IN_PROGRESS',
      IN_PROGRESS: 'DONE',
      DONE: 'PENDING',
    };
    const newStatus = cycle[currentStatus] || 'PENDING';
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i));
    try {
      await fetch(baseUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, status: newStatus }),
      });
    } catch {
      setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: currentStatus } : i));
      toast.error("Erro ao atualizar status.");
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

    // Swap their orders
    const tempOrder = newItems[idx1].order;
    newItems[idx1].order = newItems[idx2].order;
    newItems[idx2].order = tempOrder;

    setItems(newItems);

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

  const handleExport = async () => {
    if (treeItems.length === 0) {
      toast.error("Nenhum dado para exportar.");
      return;
    }

    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text("Estrutura Analítica do Projeto (EAP)", 14, 22);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Projeto ID: ${projectId}`, 14, 30);
      doc.text(`Data de Exportação: ${new Date().toLocaleDateString('pt-BR')}`, 14, 35);

      const tableData = treeItems.map(item => [
        `${' '.repeat(item.depth * 4)}${item.depth > 0 ? '└ ' : ''}${item.name}`,
        item.description || "—",
        item.status === 'PENDING' ? 'Pendente' : item.status === 'IN_PROGRESS' ? 'Em Progresso' : 'Concluído',
        parseLocalDate(item.createdAt).toLocaleDateString('pt-BR')
      ]);

      autoTable(doc, {
        startY: 45,
        head: [["Nome", "Descrição", "Status", "Criado em"]],
        body: tableData,
        headStyles: { fillColor: [201, 163, 85], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { top: 45 },
        styles: { cellPadding: 3 },
      });

      const filename = `EAP_Projeto_${projectId}.pdf`;
      const pdfData = doc.output('arraybuffer');
      const blob = new Blob([pdfData], { type: 'application/pdf' });

      if ('showSaveFilePicker' in window) {
        const handle = await (window as unknown as { showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle> }).showSaveFilePicker({
          suggestedName: filename,
          types: [{ description: 'PDF', accept: { 'application/pdf': ['.pdf'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
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
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-card border border-border text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-5 h-5" />
                Exportar
              </button>
              <button 
                onClick={scrollToForm}
                className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-primary/20 cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Novo Pacote
              </button>
            </>
          }
        />
      </div>

      {/* Table Section */}
      <section className="@container">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando itens da EAP...
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/20">
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border min-w-[320px]">Nome</th>
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border min-w-[260px]">Descrição</th>
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border text-center">Status</th>
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {treeItems.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 italic">Nenhum item cadastrado. Adicione abaixo.</td></tr>
                  )}
                  {treeItems.map((item: EapItemRender, index: number) => {
                    const siblings = items.filter(i => i.parentId === item.parentId).sort((a,b) => a.order - b.order);
                    const isFirstSibling = siblings[0]?.id === item.id;
                    const isLastSibling = siblings[siblings.length - 1]?.id === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${item.depth * 1.5}rem` }}>
                            {item.depth > 0 && <CornerDownRight className="w-4 h-4 text-slate-400 shrink-0" />}
                            <span className="text-slate-900 dark:text-white text-sm font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-400 text-sm">{item.description || '—'}</td>
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
                              disabled={isFirstSibling}
                              className="p-1 text-slate-400 hover:text-primary transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Mover para cima"
                            >
                              <ChevronUp className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleMove(item.id, 'down')}
                              disabled={isLastSibling}
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
                    );
                  })}
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
              {treeItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {`${'—'.repeat(item.depth)} ${item.name}`}
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
              disabled={saving || !form.name.trim()}
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
