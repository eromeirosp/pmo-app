"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Download, Plus, Trash2, Network, Loader2 } from 'lucide-react';
import { TabHeader } from "./TabHeader";

type EapItem = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DONE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
};

export default function ProjectEapTab({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<EapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', status: 'PENDING' });
  const baseUrl = `/api/projects/${projectId}/eap`;

  useEffect(() => {
    fetch(baseUrl)
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [baseUrl]);

  const handleAdd = useCallback(async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, description: form.description, status: form.status }),
    });
    const created = await res.json();
    setItems((prev) => [...prev, created]);
    setForm({ name: '', description: '', status: 'PENDING' });
    setSaving(false);
  }, [baseUrl, form]);

  const handleRemove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`${baseUrl}?itemId=${id}`, { method: 'DELETE' });
  }, [baseUrl]);


  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full pb-24 gap-8">
      <div className="pt-4 px-4">
        <TabHeader
          icon={Network}
          title="Estrutura Analítica (EAP)"
          description="Gerencie a decomposição hierárquica do escopo do projeto."
          actions={
            <>
              <button className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-card border border-border text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 active:scale-[0.98]">
                <Download className="w-5 h-5" />
                Exportar
              </button>
              <button className="flex items-center justify-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] shadow-lg shadow-primary/20">
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
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border min-w-[280px]">Nome</th>
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border min-w-[300px]">Descrição</th>
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border text-center">Status</th>
                    <th className="px-4 py-4 text-slate-900 dark:text-slate-100 text-sm font-bold border-b border-border text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400 italic">Nenhum item cadastrado. Adicione abaixo.</td></tr>
                  )}
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                      <td className="px-4 py-4 text-slate-900 dark:text-white text-sm font-medium">{item.name}</td>
                      <td className="px-4 py-4 text-slate-600 dark:text-slate-400 text-sm">{item.description || '—'}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[item.status] || STATUS_COLORS.PENDING}`}>
                          {item.status === 'PENDING' ? 'Pendente' : item.status === 'IN_PROGRESS' ? 'Em Progresso' : 'Concluído'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
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
      <section className="bg-card rounded-xl border border-border p-6 shadow-md mb-12">
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
