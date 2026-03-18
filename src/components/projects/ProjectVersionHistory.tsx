"use client";

import { useState, useEffect, useCallback } from "react";
import { History, RotateCcw, ChevronDown, ChevronUp, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface Version {
  id: string;
  projectId: string;
  label: string | null;
  artifactType: string | null;
  snapshotData: unknown;
  createdAt: string;
}

const formatDateTime = (dateStr: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));

const ARTIFACT_LABELS: Record<string, string> = {
  BUSINESS_CASE: "Business Case",
  ESCOPO_PRELIMINAR: "Escopo Preliminar",
  RISCOS_INICIAIS: "Riscos Iniciais",
};

export function ProjectVersionHistory({
  projectId,
  isOpen,
  onClose,
}: {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch {
      console.error("Failed to fetch versions");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isOpen) fetchVersions();
  }, [isOpen, fetchVersions]);

  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      const res = await fetch(`/api/projects/${projectId}/versions?versionId=${versionId}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      toast.success("Versão restaurada com sucesso!");
      fetchVersions();
    } catch {
      toast.error("Erro ao restaurar versão");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5 text-primary" />
            Histórico de Versões
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">Nenhuma versão registrada</p>
              <p className="text-sm mt-1">Versões são criadas automaticamente ao editar documentos do projeto.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => (
                <div key={version.id} className="relative">
                  {/* Timeline connector */}
                  {index < versions.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
                  )}

                  <div className="flex gap-3">
                    {/* Timeline dot */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0 z-10">
                      <History className="w-4 h-4 text-primary" />
                    </div>

                    <div className="flex-1 bg-card rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-foreground">
                            {version.label || "Versão salva"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(version.createdAt)}
                            </span>
                            {version.artifactType && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-bold">
                                {ARTIFACT_LABELS[version.artifactType] || version.artifactType}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setExpandedId(expandedId === version.id ? null : version.id)}
                            className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                          >
                            {expandedId === version.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {expandedId === version.id ? "Ocultar" : "Ver"}
                          </button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                                disabled={restoringId === version.id}
                              >
                                {restoringId === version.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                                Restaurar
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Restaurar esta versão?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  O conteúdo atual do documento será substituído pela versão de{" "}
                                  <strong>{formatDateTime(version.createdAt)}</strong>.
                                  Uma cópia do estado atual será salva antes da restauração.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRestore(version.id)}
                                  className="bg-amber-500 hover:bg-amber-600 text-white"
                                >
                                  Restaurar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      {expandedId === version.id && (
                        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-auto max-h-64">
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-words">
                            {JSON.stringify(version.snapshotData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
