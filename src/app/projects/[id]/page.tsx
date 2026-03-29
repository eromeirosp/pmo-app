"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Project, Artifact, Risk } from "@prisma/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectSidebar } from "@/components/projects/ProjectSidebar";
import { ProjectInfoTab } from "@/components/projects/ProjectInfoTab";
import { ProjectPreProjectTab } from "@/components/projects/ProjectPreProjectTab";
import { ProjectCharterTab } from "@/components/projects/ProjectCharterTab";
import { ProjectRiskTab } from "@/components/projects/ProjectRiskTab";
import ProjectEapTab from "@/components/projects/ProjectEapTab";
import ProjectStatusReportTab from "@/components/projects/ProjectStatusReportTab";
import ProjectBudgetTab from "@/components/projects/ProjectBudgetTab";
import { ProjectEncerramentoTab } from "@/components/projects/ProjectEncerramentoTab";
import { ProjectDocumentsTab } from "@/components/projects/ProjectDocumentsTab";
import { ProjectRulesTab } from "@/components/projects/ProjectRulesTab";
import { ProjectAutopilotTab } from "@/components/projects/ProjectAutopilotTab";
import { ProjectSimulatorTab } from "@/components/projects/ProjectSimulatorTab";
import { Menu, X, Lock, ArrowRight } from "lucide-react";
import Topbar from "@/components/layout/Topbar";

export default function ProjectDetailsPage() {
  const { id } = useParams() as { id: string };
  const [project, setProject] = useState<Project & { artifacts: Artifact[]; risks: Risk[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("informacoes");
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Falha ao buscar projeto");
      const data = await res.json();
      setProject(data);
    } catch (err) {
      console.error("Failed to fetch project:", err);
      toast.error("Erro ao carregar o projeto");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="h-20 bg-card border-b border-border animate-pulse" />
        <main className="max-w-[1600px] mx-auto w-full px-6 py-8">
          <Skeleton className="h-12 w-full max-w-4xl mb-8 bg-muted rounded-xl" />
          <Skeleton className="h-[600px] w-full bg-muted rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <h2 className="text-xl font-bold text-foreground">Projeto não encontrado</h2>
        <p className="text-muted-foreground mt-2">O projeto que você está procurando não existe ou foi removido.</p>
      </div>
    );
  }

  const isDocTab = activeTab.startsWith("doc:");
  const isClosed = project.closingApproved === true;
  const isEncerramento = activeTab === "encerramento";

  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors duration-300">
      <Topbar />
      <ProjectHeader
        project={project}
        onSave={() => setSaveTrigger(prev => prev + 1)}
        onProjectUpdate={() => fetchProject()}
      />

      <div className="flex flex-1 min-h-0">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 left-6 z-30 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Desktop sidebar */}
        <ProjectSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          project={project}
          className="hidden lg:flex sticky top-0 h-screen"
        />

        {/* Mobile drawer overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative z-10 flex flex-col h-full animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
                <span className="text-sm font-bold text-foreground">Navegação</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 rounded-md hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <ProjectSidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                project={project}
                onItemClick={() => setSidebarOpen(false)}
                className="flex-1"
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 px-6 lg:px-10 py-8 max-w-[1200px]">
          {/* Closed project banner */}
          {isClosed && !isEncerramento && (
            <div className="flex items-center justify-between gap-4 p-4 mb-6 rounded-xl border bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-700/30">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Projeto encerrado — para editar, reabra na aba Encerramento.
                </p>
              </div>
              <button
                onClick={() => handleTabChange("encerramento")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-all active:scale-[0.98] cursor-pointer shrink-0"
              >
                Ir para Encerramento
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={isClosed && !isEncerramento ? "pointer-events-none opacity-60 select-none" : ""}
            >
              {activeTab === "informacoes" && <ProjectInfoTab project={project} saveTrigger={saveTrigger} />}
              {activeTab === "pre-projeto" && <ProjectPreProjectTab project={project} saveTrigger={saveTrigger} />}
              {activeTab === "termo-abertura" && <ProjectCharterTab project={project} saveTrigger={saveTrigger} onApprovalChange={() => fetchProject()} />}
              {activeTab === "matriz-risco" && <ProjectRiskTab project={project} />}
              {activeTab === "eap" && <ProjectEapTab projectId={project.id} charterApproved={project.charterApproved ?? false} />}
              {activeTab === "status-report" && <ProjectStatusReportTab projectId={project.id} currency={project.currency || "BRL"} />}
              {activeTab === "orcamento" && <ProjectBudgetTab projectId={project.id} totalBudget={project.budget} currency={project.currency || "BRL"} />}
              {activeTab === "regras-ia" && <ProjectRulesTab projectId={project.id} />}
              {activeTab === "autopiloto" && <ProjectAutopilotTab projectId={project.id} />}
              {activeTab === "simulador" && <ProjectSimulatorTab projectId={project.id} />}
              {activeTab === "encerramento" && <ProjectEncerramentoTab project={project} onClosingChange={() => fetchProject()} />}
              {isDocTab && (
                <ProjectDocumentsTab
                  project={project}
                  activeDocumentType={activeTab.replace("doc:", "")}
                  onProjectUpdate={fetchProject}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
