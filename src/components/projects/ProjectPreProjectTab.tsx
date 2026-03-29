"use client";

import { useState, useEffect, useCallback } from "react";
import { Project, Prisma } from "@prisma/client";
import {
  Briefcase, FileText, CheckCircle2, XCircle, Target,
  Plus, Circle, Trash2, Users, Mail, UserPlus, ClipboardList, Loader2, Pencil, Grid2x2
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, ReferenceArea, Label,
} from "recharts";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { TabHeader } from "./TabHeader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface ProjectPreProjectTabProps {
  project: Project & { artifacts?: { type: string; content: Prisma.JsonValue }[] };
  saveTrigger?: number;
}

interface StakeholderRow {
  id: string;
  name: string;
  role: string;
  email: string | null;
  interest: string;
  influence: string;
}

interface ObjectiveRow {
  id: string;
  text: string;
  order: number;
}

const inputCls = "w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300";
const selectCls = "appearance-none " + inputCls;

export function ProjectPreProjectTab({ project, saveTrigger }: ProjectPreProjectTabProps) {
  const [objectives, setObjectives] = useState<ObjectiveRow[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderRow[]>([]);
  const [newStakeholder, setNewStakeholder] = useState({ name: "", role: "", email: "", interest: "Médio", influence: "Médio" });
  const [editingStakeholder, setEditingStakeholder] = useState<StakeholderRow | null>(null);
  const [editStForm, setEditStForm] = useState({ name: "", role: "", email: "", interest: "Médio", influence: "Média" });
  const [savingStEdit, setSavingStEdit] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [loadingObj, setLoadingObj] = useState(true);
  const [loadingSt, setLoadingSt] = useState(true);
  const [savingObj, setSavingObj] = useState(false);
  const [savingSt, setSavingSt] = useState(false);

  const businessCase = (project.artifacts?.find(a => a.type === "BUSINESS_CASE")?.content as { text?: string })?.text || "";
  const escopoPreliminar = (project.artifacts?.find(a => a.type === "ESCOPO_PRELIMINAR")?.content as { text?: string })?.text || "";

  useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
      // In this tab, many fields save onBlur, but we can add a global toast or formal save if needed.
      toast.success("Dados do Pré-Projeto salvos.");
    }
  }, [saveTrigger]);

  const baseUrl = `/api/projects/${project.id}`;

  // Load objectives
  useEffect(() => {
    fetch(`${baseUrl}/objectives`)
      .then((r) => r.json())
      .then((data) => setObjectives(Array.isArray(data) ? data : []))
      .finally(() => setLoadingObj(false));
  }, [baseUrl]);

  // Load stakeholders
  useEffect(() => {
    fetch(`${baseUrl}/stakeholders`)
      .then((r) => r.json())
      .then((data) => setStakeholders(Array.isArray(data) ? data : []))
      .finally(() => setLoadingSt(false));
  }, [baseUrl]);

  const addObjective = useCallback(async () => {
    setSavingObj(true);
    const res = await fetch(`${baseUrl}/objectives`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });
    const created = await res.json();
    setObjectives((prev) => [...prev, created]);
    setSavingObj(false);
  }, [baseUrl]);

  const updateObjective = useCallback(async (id: string, text: string) => {
    // Only update local state
    setObjectives((prev) => prev.map((o) => o.id === id ? { ...o, text } : o));
    
    // Save to API
    await fetch(`${baseUrl}/objectives`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id, text }),
    });
  }, [baseUrl]);

  const removeObjective = useCallback(async (id: string) => {
    setObjectives((prev) => prev.filter((o) => o.id !== id));
    await fetch(`${baseUrl}/objectives?itemId=${id}`, { method: "DELETE" });
  }, [baseUrl]);

  const addStakeholder = useCallback(async () => {
    if (!newStakeholder.name.trim()) return;
    setSavingSt(true);
    const res = await fetch(`${baseUrl}/stakeholders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStakeholder),
    });
    const created = await res.json();
    setStakeholders((prev) => [...prev, created]);
    setNewStakeholder({ name: "", role: "", email: "", interest: "Médio", influence: "Médio" });
    setSavingSt(false);
  }, [baseUrl, newStakeholder]);

  const removeStakeholder = useCallback(async (id: string) => {
    setStakeholders((prev) => prev.filter((s) => s.id !== id));
    await fetch(`${baseUrl}/stakeholders?itemId=${id}`, { method: "DELETE" });
  }, [baseUrl]);

  const startEditingStakeholder = (s: StakeholderRow) => {
    setEditStForm({ name: s.name, role: s.role, email: s.email || "", interest: s.interest, influence: s.influence });
    setEditingStakeholder(s);
  };

  const handleStakeholderEditSave = useCallback(async () => {
    if (!editingStakeholder) return;
    setSavingStEdit(true);
    try {
      const res = await fetch(`${baseUrl}/stakeholders`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: editingStakeholder.id, ...editStForm }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setStakeholders((prev) => prev.map((s) => s.id === editingStakeholder.id ? updated : s));
      setEditingStakeholder(null);
      toast.success("Stakeholder atualizado com sucesso");
    } catch {
      toast.error("Erro ao atualizar stakeholder");
    } finally {
      setSavingStEdit(false);
    }
  }, [baseUrl, editingStakeholder, editStForm]);

  const updateProject = useCallback(async (field: string, value: string) => {
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error();
      toast.success(`${field === 'manager' ? 'Gerente' : 'Patrocinador'} atualizado.`);
    } catch {
      toast.error(`Erro ao atualizar ${field === 'manager' ? 'gerente' : 'patrocinador'}.`);
    }
  }, [project.id]);

  const getInitials = (name: string) =>
    name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();

  const influenceBadge = (influence: string) => {
    if (influence === "Alta" || influence === "Alto")
      return "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400";
    if (influence === "Média" || influence === "Médio")
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400";
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  };

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <div className="pt-4 px-4">
        <TabHeader
          icon={ClipboardList}
          title="Pré-Projeto (Iniciação)"
          description="Contexto do negócio, escopo preliminar e identificação inicial de stakeholders."
        />
      </div>

      <section className="p-4 space-y-8">

        {/* Informações Básicas */}
        <div className="bg-card dark:bg-slate-900/80 p-6 rounded-2xl border border-border dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:ring-1 dark:ring-white/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Gerente do Projeto *</label>
              <input 
                type="text" 
                defaultValue={project.manager} 
                onBlur={(e) => updateProject('manager', e.target.value)}
                className={inputCls} 
                placeholder="Ex: Ana Beatriz" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Patrocinador *</label>
              <input 
                type="text" 
                defaultValue={project.stakeholders || ""}
                onBlur={(e) => updateProject('stakeholders', e.target.value)}
                className={inputCls} 
                placeholder="Ex: Carlos Mendes" 
              />
            </div>
          </div>
        </div>

        {/* Business Case */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="text-primary h-6 w-6" />
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold">Business Case (Contexto do Negócio)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card dark:bg-slate-900/80 p-6 rounded-2xl border border-border dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:ring-1 dark:ring-white/5">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Problema Atual</h3>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {project.problems || "Não informado."}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Solução Proposta</h3>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {businessCase || "Não informada."}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-1">Benefícios Esperados</h3>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                  {project.returns || "Não informados."}
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-bold text-primary">Budget Estimado</h3>
                  <span className="text-primary font-black">{formatCurrency(project.budget, project.currency || "BRL")}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
                  <div className="bg-primary h-2 rounded-full w-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Escopo Preliminar */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="text-primary h-6 w-6" />
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold">Escopo Preliminar</h2>
          </div>
          <div className="bg-card dark:bg-slate-900/80 p-6 rounded-2xl border border-border dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:ring-1 dark:ring-white/5">
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
              {escopoPreliminar || "O escopo preliminar ainda não foi definido para este projeto."}
            </div>
          </div>
        </div>

        {/* Objetivos do Projeto */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="text-primary h-6 w-6" />
              <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold">Objetivos do Projeto</h2>
            </div>
            <button
              onClick={addObjective}
              disabled={savingObj}
              className="text-primary text-sm font-bold hover:underline flex items-center gap-1 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {savingObj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Novo Objetivo
            </button>
          </div>

          {loadingObj ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando objetivos...
            </div>
          ) : (
            <div className="space-y-3">
              {objectives.length === 0 && (
                <p className="text-sm text-slate-400 italic text-center py-4">Nenhum objetivo cadastrado. Clique em &quot;Novo Objetivo&quot; para adicionar.</p>
              )}
              {objectives.map((obj) => (
                <div key={obj.id} className="flex items-center justify-between p-4 bg-card dark:bg-slate-900/80 rounded-xl border border-border dark:border-white/10 shadow-sm group hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <Circle className="text-slate-400 h-5 w-5 shrink-0" />
                    <input
                      type="text"
                      defaultValue={obj.text}
                      onBlur={(e) => updateObjective(obj.id, e.target.value)}
                      placeholder="Descreva o objetivo..."
                      autoFocus={obj.text === ""}
                      className="flex-1 bg-transparent text-slate-700 dark:text-slate-300 font-medium focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all active:scale-[0.98] cursor-pointer ml-3"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Objetivo?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O objetivo será removido permanentemente do projeto.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => removeObjective(obj.id)} className="bg-red-500 hover:bg-red-600">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Partes Interessadas */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-primary h-6 w-6" />
            <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold">Partes Interessadas (Stakeholders)</h2>
          </div>

          {loadingSt ? (
            <div className="flex items-center justify-center py-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando stakeholders...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {stakeholders.length === 0 && (
                <p className="col-span-2 text-sm text-slate-400 italic text-center py-4">Nenhum stakeholder cadastrado.</p>
              )}
              {stakeholders.map((s) => (
                <div key={s.id} className="p-5 bg-card dark:bg-slate-900/80 rounded-2xl border border-border dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:ring-1 dark:ring-white/5 flex items-start gap-4 hover:shadow-lg transition-shadow group">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                    {getInitials(s.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-slate-100">{s.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${influenceBadge(s.influence)}`}>
                          {s.influence} Influência
                        </span>
                        <button
                          onClick={() => startEditingStakeholder(s)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-primary transition-all cursor-pointer"
                          title="Editar stakeholder"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Stakeholder?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja remover {s.name} das partes interessadas?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeStakeholder(s.id)} className="bg-red-500 hover:bg-red-600">
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{s.role}</p>
                    {s.email && (
                      <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-1">
                        <Mail className="h-3 w-3" />{s.email}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${influenceBadge(s.interest)}`}>
                        Interesse {s.interest}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Stakeholder Matrix */}
          {stakeholders.length >= 2 && (
            <div className="mb-8">
              <button
                onClick={() => setShowMatrix((v) => !v)}
                className="flex items-center gap-2 text-sm font-bold text-primary hover:underline transition-all cursor-pointer mb-4"
              >
                <Grid2x2 className="h-4 w-4" />
                {showMatrix ? "Ocultar Matriz de Stakeholders" : "Ver Matriz de Stakeholders"}
              </button>

              {showMatrix && (
                <div className="bg-card dark:bg-slate-900/80 p-6 rounded-2xl border border-border dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:ring-1 dark:ring-white/5">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Matriz Interesse × Influência</h3>
                  <ResponsiveContainer width="100%" height={360}>
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      {/* Quadrant backgrounds */}
                      <ReferenceArea x1={0.5} x2={2} y1={0.5} y2={2} fill="#94a3b8" fillOpacity={0.06} />
                      <ReferenceArea x1={2} x2={3.5} y1={0.5} y2={2} fill="#3b82f6" fillOpacity={0.06} />
                      <ReferenceArea x1={0.5} x2={2} y1={2} y2={3.5} fill="#f59e0b" fillOpacity={0.06} />
                      <ReferenceArea x1={2} x2={3.5} y1={2} y2={3.5} fill="#ef4444" fillOpacity={0.06} />

                      {/* Quadrant labels */}
                      <ReferenceArea x1={0.5} x2={2} y1={0.5} y2={2} label={{ value: "Monitorar", position: "center", fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} />
                      <ReferenceArea x1={2} x2={3.5} y1={0.5} y2={2} label={{ value: "Manter Satisfeito", position: "center", fill: "#3b82f6", fontSize: 11, fontWeight: 600 }} />
                      <ReferenceArea x1={0.5} x2={2} y1={2} y2={3.5} label={{ value: "Manter Informado", position: "center", fill: "#f59e0b", fontSize: 11, fontWeight: 600 }} />
                      <ReferenceArea x1={2} x2={3.5} y1={2} y2={3.5} label={{ value: "Gerenciar de Perto", position: "center", fill: "#ef4444", fontSize: 11, fontWeight: 600 }} />

                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        type="number"
                        dataKey="influence"
                        domain={[0.5, 3.5]}
                        ticks={[1, 2, 3]}
                        tickFormatter={(v: number) => v === 1 ? "Baixa" : v === 2 ? "Média" : "Alta"}
                        tick={{ fontSize: 11 }}
                      >
                        <Label value="Influência" position="bottom" offset={0} style={{ fontSize: 12, fontWeight: 700, fill: "var(--foreground)" }} />
                      </XAxis>
                      <YAxis
                        type="number"
                        dataKey="interest"
                        domain={[0.5, 3.5]}
                        ticks={[1, 2, 3]}
                        tickFormatter={(v: number) => v === 1 ? "Baixo" : v === 2 ? "Médio" : "Alto"}
                        tick={{ fontSize: 11 }}
                      >
                        <Label value="Interesse" angle={-90} position="left" offset={10} style={{ fontSize: 12, fontWeight: 700, fill: "var(--foreground)" }} />
                      </YAxis>
                      <RechartsTooltip
                        content={({ payload }) => {
                          if (!payload?.length) return null;
                          const d = payload[0].payload as { name: string; role: string };
                          return (
                            <div className="bg-popover text-popover-foreground border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
                              <p className="font-bold">{d.name}</p>
                              <p className="text-muted-foreground">{d.role}</p>
                            </div>
                          );
                        }}
                      />
                      <Scatter
                        data={stakeholders.map((s) => {
                          const interestMap: Record<string, number> = { "Baixo": 1, "Médio": 2, "Alto": 3 };
                          const influenceMap: Record<string, number> = { "Baixa": 1, "Média": 2, "Alta": 3, "Baixo": 1, "Médio": 2, "Alto": 3 };
                          return {
                            name: s.name,
                            role: s.role,
                            interest: interestMap[s.interest] || 2,
                            influence: influenceMap[s.influence] || 2,
                          };
                        })}
                        fill="var(--primary)"
                      >
                        {stakeholders.map((s, i) => (
                          <Cell key={s.id} fill={(() => {
                            const intMap: Record<string, number> = { "Baixo": 1, "Médio": 2, "Alto": 3 };
                            const infMap: Record<string, number> = { "Baixa": 1, "Média": 2, "Alta": 3, "Baixo": 1, "Médio": 2, "Alto": 3 };
                            const intVal = intMap[s.interest] || 2;
                            const infVal = infMap[s.influence] || 2;
                            if (intVal >= 2.5 && infVal >= 2.5) return "#ef4444";
                            if (intVal >= 2.5) return "#f59e0b";
                            if (infVal >= 2.5) return "#3b82f6";
                            return "#94a3b8";
                          })()} />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-4 mt-3 justify-center text-[10px] font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" />Gerenciar de Perto</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Manter Informado</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" />Manter Satisfeito</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" />Monitorar</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Stakeholder Form */}
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-border dark:border-white/10 p-6">
            <h3 className="text-slate-900 dark:text-slate-100 font-bold text-base mb-4 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Adicionar Stakeholder
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Nome *</label>
                <input type="text" value={newStakeholder.name} onChange={(e) => setNewStakeholder({ ...newStakeholder, name: e.target.value })} className={inputCls} placeholder="Nome completo" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Cargo / Papel</label>
                <input type="text" value={newStakeholder.role} onChange={(e) => setNewStakeholder({ ...newStakeholder, role: e.target.value })} className={inputCls} placeholder="Ex: Gerente de TI" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">E-mail</label>
                <input type="email" value={newStakeholder.email} onChange={(e) => setNewStakeholder({ ...newStakeholder, email: e.target.value })} className={inputCls} placeholder="email@empresa.com" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Interesse</label>
                <select value={newStakeholder.interest} onChange={(e) => setNewStakeholder({ ...newStakeholder, interest: e.target.value })} className={selectCls}>
                  <option>Alto</option><option>Médio</option><option>Baixo</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Influência</label>
                <select value={newStakeholder.influence} onChange={(e) => setNewStakeholder({ ...newStakeholder, influence: e.target.value })} className={selectCls}>
                  <option>Alta</option><option>Média</option><option>Baixa</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={addStakeholder}
                disabled={savingSt || !newStakeholder.name.trim()}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 cursor-pointer"
              >
                {savingSt ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Adicionar Stakeholder
              </button>
            </div>
          </div>
        </div>

      </section>

      {/* Edit Stakeholder Dialog */}
      <Dialog open={!!editingStakeholder} onOpenChange={(open) => { if (!open) setEditingStakeholder(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Stakeholder</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Nome</label>
              <input type="text" value={editStForm.name} onChange={(e) => setEditStForm({ ...editStForm, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Cargo / Papel</label>
              <input type="text" value={editStForm.role} onChange={(e) => setEditStForm({ ...editStForm, role: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">E-mail</label>
              <input type="email" value={editStForm.email} onChange={(e) => setEditStForm({ ...editStForm, email: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Interesse</label>
              <select value={editStForm.interest} onChange={(e) => setEditStForm({ ...editStForm, interest: e.target.value })} className={selectCls}>
                <option>Alto</option><option>Médio</option><option>Baixo</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">Influência</label>
              <select value={editStForm.influence} onChange={(e) => setEditStForm({ ...editStForm, influence: e.target.value })} className={selectCls}>
                <option>Alta</option><option>Média</option><option>Baixa</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setEditingStakeholder(null)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancelar</button>
            <button onClick={handleStakeholderEditSave} disabled={savingStEdit || !editStForm.name.trim()} className="px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-50">
              {savingStEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Alterações"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
