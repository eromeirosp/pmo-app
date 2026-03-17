"use client";

import { useEffect, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  History, 
  PlusCircle, 
  Trash2, 
  Settings, 
  User,
  Clock,
  ArrowRight
} from "lucide-react";

// Helper for relative time in Portuguese
function formatRelativeTime(date: Date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "agora mesmo";
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)}h`;
  
  return date.toLocaleDateString('pt-BR');
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue: string | null;
  newValue: string | null;
  userId: string | null;
  createdAt: string;
}

interface ProjectAuditModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectAuditModal({ projectId, isOpen, onClose }: ProjectAuditModalProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, projectId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/audit-logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATE": return <PlusCircle className="h-4 w-4 text-emerald-500" />;
      case "DELETE": return <Trash2 className="h-4 w-4 text-rose-500" />;
      default: return <Settings className="h-4 w-4 text-blue-500" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "CREATE": return "Adicionado";
      case "DELETE": return "Removido";
      case "UPDATE": return "Atualizado";
      default: return action;
    }
  };

  const getEntityLabel = (entity: string) => {
    const labels: Record<string, string> = {
      "Objective": "Objetivo",
      "Stakeholder": "Parte Interessada",
      "Risk": "Risco",
      "ClosingItem": "Item de Encerramento",
    };
    return labels[entity] || entity;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] grid grid-rows-[auto_1fr_auto] p-0 border-none shadow-2xl bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-2 border-b border-border/50">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-primary/10 p-2 rounded-lg">
              <History className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Registro de Auditoria</DialogTitle>
              <DialogDescription className="text-sm">
                Histórico completo de alterações realizadas neste projeto.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto">
          <ScrollArea className="px-6">
            <div className="py-6 relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-8 bottom-8 w-[2px] bg-slate-200 dark:bg-slate-800" />

              {loading ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4 items-start relative z-10">
                      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                      <div className="space-y-2 w-full">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-full mb-4">
                    <History className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">Nenhum registro encontrado</h3>
                  <p className="text-sm text-slate-500 max-w-[240px]">
                    As alterações começarão a aparecer aqui assim que forem realizadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-4 items-start relative z-10 group">
                      {/* Icon container */}
                      <div className="h-10 w-10 rounded-full bg-white dark:bg-slate-900 border-4 border-background flex items-center justify-center shadow-sm shrink-0">
                        {getActionIcon(log.action)}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">
                              {getEntityLabel(log.entity)} {getActionLabel(log.action)}
                            </span>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5 uppercase font-bold text-muted-foreground border-border/60">
                              {log.entity}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            {formatRelativeTime(new Date(log.createdAt))}
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-border/40 group-hover:border-primary/20 transition-colors">
                          <div className="text-sm text-slate-600 dark:text-slate-400">
                            {log.action === "CREATE" ? (
                              <div className="flex flex-col gap-1">
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Novo Valor:</span>
                                  <span className="font-medium text-foreground">{log.newValue}</span>
                              </div>
                            ) : log.action === "DELETE" ? (
                              <div className="flex flex-col gap-1 text-rose-600 dark:text-rose-400">
                                  <span className="text-xs font-semibold uppercase tracking-tight opacity-80">Valor Removido:</span>
                                  <span className="font-medium line-through decoration-rose-300 text-slate-500 dark:text-slate-400">{log.oldValue}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex flex-col gap-1 flex-1">
                                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-tight">Anterior</span>
                                  <span className="font-medium">{log.oldValue}</span>
                                </div>
                                <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
                                <div className="flex flex-col gap-1 flex-1">
                                  <span className="text-xs font-semibold text-blue-500 uppercase tracking-tight">Novo</span>
                                  <span className="font-medium text-foreground">{log.newValue}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-1">
                          <User className="h-3 w-3" />
                          <span>Usuário: <span className="font-semibold text-foreground">Sistema</span></span>
                          <span className="mx-1 opacity-30">•</span>
                          <span>{new Date(log.createdAt).toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-border/50 text-center">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
            PMO Master Governance & Audit System
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
