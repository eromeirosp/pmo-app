"use client";

import { ChevronLeft, Printer, Save, History, Upload, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ProjectAuditModal } from "./ProjectAuditModal";
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
  };
  onSave?: () => void;
}

export function ProjectHeader({ project, onSave }: ProjectHeaderProps) {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

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
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                project.status === "GREEN" ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20" :
                project.status === "YELLOW" ? "bg-amber-500/15 text-amber-500 border-amber-500/20" :
                "bg-rose-500/15 text-rose-500 border-rose-500/20"
              }`}>
                {project.status === 'GREEN' ? 'No Prazo' : project.status === 'YELLOW' ? 'Atenção' : 'Atrasado'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold border border-border text-muted-foreground bg-secondary">
                {project.classification?.replace('_', ' ') || 'PROJETO'}
              </span>
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

            <ProjectAuditModal
              projectId={project.id}
              isOpen={isAuditModalOpen}
              onClose={() => setIsAuditModalOpen(false)}
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
