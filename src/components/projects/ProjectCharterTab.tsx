"use client";

import { useState, useEffect, useCallback } from "react";
import { Project } from "@prisma/client";
import {
  FileText, Lightbulb, CheckCircle2, Trash2, Plus,
  Package, Pin, Ban, AlertTriangle, Save, Loader2
} from "lucide-react";
import { TabHeader } from "./TabHeader";

interface ProjectCharterTabProps {
  project: Project;
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

interface ListSectionProps {
  title: string;
  icon: React.ReactNode;
  items: CharterRow[];
  loading: boolean;
  addLabel: string;
  onAdd: (text: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}

function ListSection({ title, icon, items, loading, addLabel, onAdd, onRemove }: ListSectionProps) {
  const [inputValue, setInputValue] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!inputValue.trim()) return;
    setSaving(true);
    await onAdd(inputValue.trim());
    setInputValue("");
    setSaving(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-slate-900 dark:text-white text-md font-bold mb-4 flex items-center gap-2">
        {icon}{title}
      </h3>
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

export function ProjectCharterTab({ project }: ProjectCharterTabProps) {
  const [items, setItems] = useState<CharterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const baseUrl = `/api/projects/${project.id}/charter`;

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

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full pb-24 px-4 space-y-8">
      <div className="pt-4">
        <TabHeader
          icon={FileText}
          title="Termo de Abertura (Project Charter)"
          description="Documento formal que autoriza o projeto e define escopo inicial."
          actions={
            <button className="flex items-center gap-2 rounded-xl h-10 px-4 bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-all active:scale-[0.98]">
              <Save className="w-4 h-4" /> Salvar
            </button>
          }
        />
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
              {(project as any).startDate ? new Date((project as any).startDate).toLocaleDateString("pt-BR") : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Término</p>
            <p className="font-semibold text-slate-900 dark:text-white text-sm">
              {(project as any).endDate ? new Date((project as any).endDate).toLocaleDateString("pt-BR") : "—"}
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
        />
        <ListSection
          title="Principais Entregas"
          icon={<Package className="h-5 w-5 text-primary" />}
          items={itemsOf(TYPES.DELIVERABLE)}
          loading={loading}
          addLabel="Adicionar entrega principal..."
          onAdd={(text) => handleAdd(TYPES.DELIVERABLE, text)}
          onRemove={handleRemove}
        />
        <ListSection
          title="Premissas"
          icon={<Pin className="h-5 w-5 text-blue-500" />}
          items={itemsOf(TYPES.PREMISE)}
          loading={loading}
          addLabel="Adicionar premissa..."
          onAdd={(text) => handleAdd(TYPES.PREMISE, text)}
          onRemove={handleRemove}
        />
        <ListSection
          title="Restrições"
          icon={<Ban className="h-5 w-5 text-red-500" />}
          items={itemsOf(TYPES.RESTRICTION)}
          loading={loading}
          addLabel="Adicionar restrição..."
          onAdd={(text) => handleAdd(TYPES.RESTRICTION, text)}
          onRemove={handleRemove}
        />
      </div>

      {/* Riscos iniciais */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl p-6">
        <h3 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5" /> Riscos Iniciais Identificados
        </h3>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-500">
          <li className="flex items-start gap-2"><span className="font-bold">•</span> Resistência dos usuários à mudança de processos e sistemas.</li>
          <li className="flex items-start gap-2"><span className="font-bold">•</span> Qualidade e consistência dos dados legados a serem migrados.</li>
          <li className="flex items-start gap-2"><span className="font-bold">•</span> Indisponibilidade de key users para participação ativa no projeto.</li>
        </ul>
        <p className="text-xs text-amber-500 mt-3 flex items-center gap-1">
          <Lightbulb className="h-3.5 w-3.5" /> Riscos detalhados são gerenciados na aba &quot;Matriz de Risco&quot;.
        </p>
      </div>
    </div>
  );
}
