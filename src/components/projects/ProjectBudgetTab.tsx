"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Wallet, Plus, Trash2, Loader2, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react";
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

interface BudgetEntry {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string | null;
  date: string;
  createdAt: string;
}

interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  burnRate: number;
  byCategory: Record<string, number>;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateStr));

const CATEGORIES = ["Pessoal", "Infraestrutura", "Licenças", "Serviços", "Outros"];

export default function ProjectBudgetTab({ projectId, totalBudget }: { projectId: string; totalBudget: number }) {
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");

  const baseUrl = `/api/projects/${projectId}/budget`;

  const fetchBudget = useCallback(async () => {
    try {
      const res = await fetch(baseUrl);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setSummary(data.summary);
      }
    } catch {
      console.error("Failed to fetch budget");
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => { fetchBudget(); }, [fetchBudget]);

  const resetForm = () => {
    setDescription("");
    setAmount("");
    setType("EXPENSE");
    setCategory("");
    setDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amount) {
      toast.error("Descrição e valor são obrigatórios");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          amount: parseFloat(amount),
          type,
          category: category || null,
          date: date || null,
        }),
      });
      if (!res.ok) throw new Error();
      resetForm();
      setShowForm(false);
      toast.success("Lançamento registrado!");
      fetchBudget();
    } catch {
      toast.error("Erro ao registrar lançamento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      const res = await fetch(`${baseUrl}?entryId=${entryId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Lançamento excluído");
      fetchBudget();
    } catch {
      toast.error("Erro ao excluir lançamento");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const burnRate = summary?.burnRate ?? 0;
  const burnColor = burnRate > 0.9 ? "bg-rose-500" : burnRate > 0.7 ? "bg-amber-500" : "bg-emerald-500";
  const burnTextColor = burnRate > 0.9 ? "text-rose-600" : burnRate > 0.7 ? "text-amber-600" : "text-emerald-600";

  const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all duration-200";
  const selectClasses = "w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all duration-200";

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full pb-24 px-4 space-y-8 text-left">
      <div className="pt-4">
        <TabHeader
          icon={Wallet}
          title="Controle de Orçamento"
          description="Gerencie lançamentos e acompanhe a saúde financeira do projeto"
          actions={
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 rounded-xl h-10 px-4 bg-primary text-white font-medium text-sm shadow-sm hover:shadow-md hover:bg-primary/90 transition-all duration-200 active:scale-[0.98]"
            >
              <Plus className="w-5 h-5" />
              Novo Lançamento
            </button>
          }
        />
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              Orçamento Total
            </div>
            <p className="text-xl font-bold text-foreground">{formatCurrency(summary.totalBudget)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <TrendingDown className="w-4 h-4" />
              Total Gasto
            </div>
            <p className={`text-xl font-bold ${burnTextColor}`}>{formatCurrency(summary.totalSpent)}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              Restante
            </div>
            <p className={`text-xl font-bold ${summary.remaining >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(summary.remaining)}
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <PieChart className="w-4 h-4" />
              Burn Rate
            </div>
            <p className={`text-xl font-bold ${burnTextColor}`}>{Math.round(burnRate * 100)}%</p>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full mt-2" role="progressbar" aria-valuenow={Math.round(burnRate * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={`Burn rate: ${Math.round(burnRate * 100)}%`}>
              <div className={`${burnColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.min(burnRate * 100, 100)}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {summary && Object.keys(summary.byCategory).length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Gasto por Categoria</h4>
          <div className="space-y-3">
            {Object.entries(summary.byCategory)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, val]) => {
                const pct = summary.totalSpent > 0 ? (val / summary.totalSpent) * 100 : 0;
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground w-28 truncate">{cat}</span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-800 h-2 rounded-full">
                      <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-muted-foreground w-28 text-right">{formatCurrency(val)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Entries List */}
      <section className="space-y-3">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Lançamentos ({entries.length})</h4>
        {entries.length === 0 && !showForm ? (
          <div className="text-center py-16 text-muted-foreground">
            <Wallet className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-semibold">Nenhum lançamento registrado</p>
            <p className="text-sm mt-1">Clique em &quot;Novo Lançamento&quot; para começar</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between gap-4 bg-card rounded-xl border border-border p-4 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 ${entry.type === "EXPENSE" ? "bg-rose-500/80" : "bg-blue-500/80"}`}>
                  {entry.type === "EXPENSE" ? "-" : "~"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{entry.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(entry.date)}</span>
                    {entry.category && <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{entry.category}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${entry.type === "EXPENSE" ? "text-rose-600" : "text-blue-600"}`}>
                  {entry.type === "EXPENSE" ? "-" : ""}{formatCurrency(entry.amount)}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Lançamento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        O lançamento &quot;{entry.description}&quot; de {formatCurrency(entry.amount)} será permanentemente removido.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(entry.id)} className="bg-red-500 hover:bg-red-600 text-white">Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </section>

      {/* New Entry Form */}
      {showForm && (
        <section className="bg-card rounded-xl border border-primary/20 shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Plus className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Novo Lançamento</h2>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Descrição *</label>
                <input className={inputClasses} placeholder="Ex: Licença de software" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Valor (R$) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">R$</span>
                  <input className={`${inputClasses} pl-11`} type="number" step="0.01" min="0" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tipo</label>
                <select className={selectClasses} value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="EXPENSE">Despesa</option>
                  <option value="ADJUSTMENT">Ajuste</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoria</label>
                <select className={selectClasses} value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">-- Selecionar --</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Data</label>
                <input className={inputClasses} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]" type="button" onClick={() => { resetForm(); setShowForm(false); }}>
                Cancelar
              </button>
              <button className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:shadow-md hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-50" type="submit" disabled={submitting}>
                {submitting ? <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</span> : "Salvar Lançamento"}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
