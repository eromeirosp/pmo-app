"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckSquare, BookOpen, Lightbulb, Loader2, Plus, Trash2, Circle, Download } from "lucide-react";
import { TabHeader } from "./TabHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
      // Otimista: remove do estado imediatamente
      setItems((prev) => prev.filter((i) => i.id !== id));
      
      const res = await fetch(`${baseUrl}?itemId=${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Se falhar, reverte (mais complexo, vamos re-buscar por enquanto se falhar)
        fetchItems();
        throw new Error("Erro ao remover item");
      }
    } catch (error) {
      console.error(error);
    }
  }, [baseUrl, fetchItems]);

  const handleExport = async () => {
    const deliverables = itemsOf(TYPES.DELIVERABLE);
    const lessons = itemsOf(TYPES.LESSON);
    const recommendations = itemsOf(TYPES.RECOMMENDATION);

    if (deliverables.length === 0 && lessons.length === 0 && recommendations.length === 0) {
      toast.error("Nenhum dado para exportar.");
      return;
    }

    try {
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text("Termo de Encerramento do Projeto", 14, 22);

      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Projeto ID: ${projectId}`, 14, 30);
      doc.text(`Data de Exportação: ${new Date().toLocaleDateString('pt-BR')}`, 14, 35);

      let startY = 48;

      if (deliverables.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(0);
        doc.text("Entregáveis Finais", 14, startY);
        autoTable(doc, {
          startY: startY + 4,
          head: [["#", "Entregável"]],
          body: deliverables.map((item, i) => [String(i + 1), item.text]),
          headStyles: { fillColor: [201, 163, 85], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });
        startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      }

      if (lessons.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(0);
        doc.text("Lições Aprendidas", 14, startY);
        autoTable(doc, {
          startY: startY + 4,
          head: [["#", "Lição"]],
          body: lessons.map((item, i) => [String(i + 1), item.text]),
          headStyles: { fillColor: [201, 163, 85], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });
        startY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
      }

      if (recommendations.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(0);
        doc.text("Recomendações para Projetos Futuros", 14, startY);
        autoTable(doc, {
          startY: startY + 4,
          head: [["#", "Recomendação"]],
          body: recommendations.map((item, i) => [String(i + 1), item.text]),
          headStyles: { fillColor: [201, 163, 85], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [248, 250, 252] },
        });
      }

      const filename = `Encerramento_Projeto_${projectId}.pdf`;
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

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full pb-24 px-4 space-y-8">
      <div className="pt-4">
        <TabHeader
          icon={CheckSquare}
          title="Encerramento do Projeto"
          description="Formalização do encerramento, lições aprendidas e recomendações para projetos futuros."
          actions={
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-card border border-border text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 active:scale-[0.98] cursor-pointer"
            >
              <Download className="w-5 h-5" />
              Exportar
            </button>
          }
        />
      </div>

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

