"use client";

import { useState, useEffect } from "react";
import { 
  Calendar,
  ChevronDown,
  ArrowRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TabHeader } from "./TabHeader";

const inputClasses = "w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-sm font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300";

function InputWrapper({ label, children, fullWidth = false }: { label: string; children: React.ReactNode; fullWidth?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-2", fullWidth ? "col-span-full" : "")}>
      <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative group">
        {children}
      </div>
    </div>
  );
}

interface ProjectInfoTabProps {
  project: any;
  saveTrigger?: number;
}

export function ProjectInfoTab({ project, saveTrigger }: ProjectInfoTabProps) {
  const getInitialData = () => ({
    name: project.name || "",
    description: project.description || "",
    manager: project.manager || "",
    stakeholders: project.stakeholders || "",
    department: project.department || "Tecnologia da Informação",
    classification: project.classification || "TRADITIONAL",
    status: project.status || "ACTIVE",
    budget: project.budget?.toString() || "",
    startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "2025-10-01",
    endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : "2026-06-30",
  });

  const [formData, setFormData] = useState(getInitialData());

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error();
      
      toast.success("Projeto atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar projeto.");
    } finally {
      setLoading(false);
    }
  };
  const handleDiscard = () => {
    setFormData(getInitialData());
    toast.info("Alterações descartadas.");
  };

  useEffect(() => {
    if (saveTrigger && saveTrigger > 0) {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  }, [saveTrigger]);

  return (
    <div className="max-w-5xl mx-auto pb-24">
      <TabHeader 
        icon={Info} 
        title="Informações do Projeto" 
        description="Gerencie os detalhes básicos e metadados estruturais do projeto."
      />

      <form onSubmit={handleSubmit} className="bg-card dark:bg-slate-900/80 border border-border dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:ring-1 dark:ring-white/5 overflow-hidden">
        {/* Card Content */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          
          {/* Nome do Projeto - Full Width */}
          <InputWrapper label="Nome do Projeto *" fullWidth>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClasses}
              placeholder="Digite o nome do projeto..."
            />
          </InputWrapper>

          {/* Descrição - Full Width */}
          <InputWrapper label="Descrição *" fullWidth>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={cn(inputClasses, "resize-none h-24 py-3")}
              placeholder="Descreva os objetivos do projeto..."
            />
          </InputWrapper>

          {/* Row 1: Gerente | Patrocinador */}
          <InputWrapper label="Gerente do Projeto *">
            <input
              type="text"
              value={formData.manager}
              onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
              className={inputClasses}
            />
          </InputWrapper>

          <InputWrapper label="Patrocinador *">
            <input
              type="text"
              value={formData.stakeholders}
              onChange={(e) => setFormData({ ...formData, stakeholders: e.target.value })}
              className={inputClasses}
            />
          </InputWrapper>

          {/* Row 2: Departamento | Tipo */}
          <InputWrapper label="Departamento *">
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className={inputClasses}
            />
          </InputWrapper>

          <InputWrapper label="Tipo de Projeto *">
            <div className="relative">
              <select
                value={formData.classification}
                onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                className={cn(inputClasses, "appearance-none pr-10")}
              >
                <option value="TRADITIONAL">Tradicional</option>
                <option value="AGILE">Ágil</option>
                <option value="HYBRID">Híbrido</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </InputWrapper>

          {/* Row 3: Status | Data Início */}
          <InputWrapper label="Status *">
            <div className="relative">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={cn(inputClasses, "appearance-none pr-10")}
              >
                <option value="GREEN">Em Execução</option>
                <option value="YELLOW">Atenção</option>
                <option value="RED">Crítico</option>
                <option value="ON_HOLD">Em Pausa</option>
                <option value="COMPLETED">Concluído</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </InputWrapper>

          <InputWrapper label="Data de Início *">
            <div className="relative">
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className={cn(inputClasses, "pr-10")}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </InputWrapper>

          {/* Row 4: Termino | Orçamento */}
          <InputWrapper label="Data de Término Prevista *">
            <div className="relative">
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className={cn(inputClasses, "pr-10")}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </InputWrapper>

          <InputWrapper label="Orçamento (R$) *">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">R$</span>
              <input
                type="text"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className={cn(inputClasses, "pl-10")}
              />
            </div>
          </InputWrapper>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 border-t border-border bg-slate-50 dark:bg-slate-800/20 flex items-center justify-end gap-6">
          <button
            type="button"
            onClick={handleDiscard}
            className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Descartar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-bold hover:bg-primary/90 transition-all duration-300 active:scale-[0.98] shadow-md disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
