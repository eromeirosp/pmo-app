"use client";

import { ChevronLeft, Printer, Save, History, Upload, Trash2, Loader2, ShieldAlert, RotateCcw, Pencil, GitBranch, Mic } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { ProjectAuditModal } from "./ProjectAuditModal";
import { ProjectVersionHistory } from "./ProjectVersionHistory";
import { MeetingTranscriptModal } from "./MeetingTranscriptModal";
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
interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    classification: string | null;
    status: string;
    computedStatus?: string;
    effectiveStatus?: string;
    statusOverride?: string | null;
    statusOverrideReason?: string | null;
  };
  onSave?: () => void;
  onProjectUpdate?: () => void;
}

const STATUS_OPTIONS = [
  { value: "GREEN", label: "No Prazo", color: "bg-emerald-500" },
  { value: "YELLOW", label: "Atenção", color: "bg-amber-500" },
  { value: "RED", label: "Atrasado", color: "bg-rose-500" },
];

export function ProjectHeader({ project, onSave, onProjectUpdate }: ProjectHeaderProps) {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState(project.statusOverride || "");
  const [overrideReason, setOverrideReason] = useState(project.statusOverrideReason || "");
  const [savingOverride, setSavingOverride] = useState(false);
  const overrideRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (overrideRef.current && !overrideRef.current.contains(e.target as Node)) {
        setShowOverrideForm(false);
      }
    }
    if (showOverrideForm) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOverrideForm]);

  const handleSaveOverride = async () => {
    if (!overrideStatus) return;
    if (!overrideReason.trim()) {
      toast.error("Justificativa é obrigatória para sobrescrever o status");
      return;
    }
    setSavingOverride(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusOverride: overrideStatus, statusOverrideReason: overrideReason.trim() }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status sobrescrito com sucesso");
      setShowOverrideForm(false);
      onProjectUpdate?.();
    } catch {
      toast.error("Erro ao sobrescrever status");
    } finally {
      setSavingOverride(false);
    }
  };

  const handleClearOverride = async () => {
    setSavingOverride(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusOverride: null, statusOverrideReason: null }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status restaurado para automático");
      setOverrideStatus("");
      setOverrideReason("");
      setShowOverrideForm(false);
      onProjectUpdate?.();
    } catch {
      toast.error("Erro ao restaurar status");
    } finally {
      setSavingOverride(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Projeto excluído com sucesso");
      router.push("/");
    } catch {
      toast.error("Erro ao excluir projeto");
      setDeleting(false);
    }
  };

  return (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="max-w-[1200px] mx-auto px-6 py-6 lg:px-10">

        {/* Breadcrumb */}
        <div className="mb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {/* Hero Content */}
        <div className="flex flex-wrap justify-between items-start gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1 relative">
              {/* Status badge - shows effective status */}
              {(() => {
                const displayStatus = project.effectiveStatus || project.status;
                const isOverridden = !!project.statusOverride;
                return (
                  <>
                    <button
                      onClick={() => {
                        setOverrideStatus(project.statusOverride || "");
                        setOverrideReason(project.statusOverrideReason || "");
                        setShowOverrideForm(!showOverrideForm);
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border cursor-pointer transition-all hover:scale-105 ${
                        displayStatus === "GREEN" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" :
                        displayStatus === "YELLOW" ? "bg-amber-500/15 text-amber-500 border-amber-500/20" :
                        "bg-rose-500/15 text-rose-500 border-rose-500/20"
                      }`}
                    >
                      {displayStatus === 'GREEN' ? 'No Prazo' : displayStatus === 'YELLOW' ? 'Atenção' : 'Atrasado'}
                      {isOverridden && <Pencil className="h-2.5 w-2.5" />}
                    </button>
                    {isOverridden && (
                      <span className="text-[10px] text-muted-foreground italic" title={project.statusOverrideReason || ""}>
                        Sobrescrito
                      </span>
                    )}
                  </>
                );
              })()}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border border-border text-muted-foreground bg-secondary">
                {project.classification?.replace('_', ' ') || 'PROJETO'}
              </span>

              {/* Override popover */}
              {showOverrideForm && (
                <div ref={overrideRef} className="absolute top-full left-0 mt-2 z-50 w-80 bg-card border border-border rounded-xl shadow-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4" />
                      Sobrescrever Status
                    </h4>
                    {project.computedStatus && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        project.computedStatus === "GREEN" ? "bg-emerald-500/15 text-emerald-500" :
                        project.computedStatus === "YELLOW" ? "bg-amber-500/15 text-amber-500" :
                        "bg-rose-500/15 text-rose-500"
                      }`}>
                        Auto: {project.computedStatus === 'GREEN' ? 'No Prazo' : project.computedStatus === 'YELLOW' ? 'Atenção' : 'Atrasado'}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Novo Status</label>
                    <div className="flex gap-2">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setOverrideStatus(opt.value)}
                          className={`flex-1 text-xs font-bold py-2 rounded-lg border transition-all cursor-pointer ${
                            overrideStatus === opt.value
                              ? `${opt.color} text-white border-transparent`
                              : "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Justificativa *</label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Explique por que o status está sendo alterado manualmente..."
                      className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 min-h-[60px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveOverride}
                      disabled={!overrideStatus || !overrideReason.trim() || savingOverride}
                      className="flex-1 text-xs font-bold"
                    >
                      {savingOverride ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirmar"}
                    </Button>
                    {project.statusOverride && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleClearOverride}
                        disabled={savingOverride}
                        className="text-xs font-bold gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restaurar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
            <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-tight max-w-4xl">
              {project.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 font-bold bg-secondary text-secondary-foreground border-none hover:bg-secondary/80"
              onClick={() => setIsAuditModalOpen(true)}
            >
              <History className="h-4 w-4" />
              Auditoria
            </Button>

            <Button
              variant="outline"
              className="hidden md:flex items-center gap-2 font-bold bg-secondary text-secondary-foreground border-none hover:bg-secondary/80"
              onClick={() => setIsVersionHistoryOpen(true)}
            >
              <GitBranch className="h-4 w-4" />
              Versões
            </Button>

            <Button
              variant="outline"
              className="flex items-center gap-2 font-bold bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 shadow-sm shadow-primary/10"
              onClick={() => setIsTranscriptOpen(true)}
            >
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Registrar Reunião</span>
              <span className="sm:hidden">Reunião</span>
            </Button>

            <ProjectAuditModal
              projectId={project.id}
              isOpen={isAuditModalOpen}
              onClose={() => setIsAuditModalOpen(false)}
            />
            <ProjectVersionHistory
              projectId={project.id}
              isOpen={isVersionHistoryOpen}
              onClose={() => setIsVersionHistoryOpen(false)}
            />
            <MeetingTranscriptModal
              projectId={project.id}
              isOpen={isTranscriptOpen}
              onClose={() => setIsTranscriptOpen(false)}
            />
            <Button
              variant="outline"
              size="icon"
              className="bg-secondary text-secondary-foreground border-none hover:bg-secondary/80"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-secondary text-red-500 border-none hover:bg-red-50 dark:hover:bg-red-950/30"
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Projeto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O projeto <strong>&quot;{project.name}&quot;</strong> e todos os seus dados
                    (riscos, stakeholders, EAP, relatórios) serão permanentemente removidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white">
                    Excluir Projeto
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              className="items-center gap-2 font-bold px-6 shadow-sm"
              onClick={onSave}
            >
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
