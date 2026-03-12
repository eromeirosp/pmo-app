"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sparkles, Info, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    manager: "",
    budget: "",
    stakeholders: "",
    problems: "",
    returns: "",
    impacts: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      manager: "",
      budget: "",
      stakeholders: "",
      problems: "",
      returns: "",
      impacts: "",
    });
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.budget || !formData.problems) {
      toast.error("Preencha ao menos Nome, Orçamento e Problemas.");
      return;
    }

    setLoading(true);
    toast.info(
      "A IA está analisando seu projeto... isso pode levar alguns segundos."
    );

    try {
      const aiResponse = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!aiResponse.ok) {
        throw new Error("Falha na análise da IA");
      }

      const aiResult = await aiResponse.json();

      const finalProjectPayload = {
        ...formData,
        classification: aiResult.classification,
        businessCase: aiResult.businessCase,
        preliminaryScope: aiResult.preliminaryScope,
        preliminaryTimeline: aiResult.preliminaryTimeline,
        milestones: aiResult.milestones,
        successCriteria: aiResult.successCriteria,
        initialRisks: aiResult.initialRisks,
      };

      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalProjectPayload),
      });

      const projectData = await projectResponse.json();

      if (!projectResponse.ok) {
        throw new Error(projectData.error || "Erro ao salvar o projeto");
      }

      toast.success("Projeto criado com sucesso!");
      resetForm();
      onClose();
      router.push(`/projects/${projectData.id}/documents`);
    } catch (error) {
      console.error(error);
      const err = error as Error;
      toast.error(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none px-4 py-2.5 text-foreground placeholder:text-muted-foreground/60 transition-all text-sm";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-primary/10 p-2.5 rounded-lg">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                Criar Novo Projeto com IA
              </DialogTitle>
              <DialogDescription className="text-sm">
                A IA analisará as informações para sugerir cronogramas, recursos
                e riscos.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <form id="create-project-form" onSubmit={handleSubmit}>
            <div className="p-6 space-y-5">
              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    Preenchimento Inteligente
                  </span>{" "}
                  — A IA analisará as informações fornecidas para sugerir
                  cronogramas, recursos e riscos potenciais.
                </p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                  <label className="block text-sm font-semibold mb-1.5 text-foreground">
                    Nome do Projeto{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Ex: Expansão de Mercado 2024"
                    type="text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-foreground">
                    Gerente do Projeto
                  </label>
                  <input
                    name="manager"
                    value={formData.manager}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Selecione o responsável"
                    type="text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5 text-foreground">
                    Orçamento (R$){" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <input
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="0,00"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">
                  Stakeholders Principais
                </label>
                <textarea
                  name="stakeholders"
                  value={formData.stakeholders}
                  onChange={handleChange}
                  className={`${inputClass} resize-y`}
                  placeholder="Ex: Diretoria Financeira, Time de Marketing..."
                  rows={2}
                />
              </div>

              {/* Context Section */}
              <div className="pt-4 border-t border-border/50">
                <h3 className="text-sm font-bold mb-4 text-foreground uppercase tracking-wide">
                  Objetivos e Contexto
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-foreground">
                      Problemas a serem resolvidos{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <textarea
                      name="problems"
                      value={formData.problems}
                      onChange={handleChange}
                      className={`${inputClass} resize-y`}
                      placeholder="Descreva os desafios atuais..."
                      rows={2}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 text-foreground">
                      Benefícios Esperados
                    </label>
                    <textarea
                      name="returns"
                      value={formData.returns}
                      onChange={handleChange}
                      className={`${inputClass} resize-y`}
                      placeholder="O que o projeto deve alcançar?"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1.5 text-foreground">
                  Impactos de Não Solução
                </label>
                <input
                  name="impacts"
                  value={formData.impacts}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Riscos se nada for feito"
                  type="text"
                />
              </div>
            </div>
          </form>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border/50 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="font-semibold"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-project-form"
            disabled={loading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 min-w-[200px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Criar Projeto com IA
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CreateProjectButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="hidden sm:flex bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-4 rounded-xl font-bold tracking-tight transition-all shadow-lg shadow-primary/20"
      >
        <Plus className="mr-2 h-4 w-4" />
        Novo Projeto
      </Button>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="sm:hidden bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20"
      >
        <Plus className="h-4 w-4" />
      </Button>
      <CreateProjectModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
