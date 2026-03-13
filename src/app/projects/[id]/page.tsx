"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Project, Artifact, Risk } from "@prisma/client";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { ProjectTabs } from "@/components/projects/ProjectTabs";
import { ProjectInfoTab } from "@/components/projects/ProjectInfoTab";
import { ProjectPreProjectTab } from "@/components/projects/ProjectPreProjectTab";
import { ProjectCharterTab } from "@/components/projects/ProjectCharterTab";
import { ProjectRiskTab } from "@/components/projects/ProjectRiskTab";
import ProjectEapTab from "@/components/projects/ProjectEapTab";
import ProjectStatusReportTab from "@/components/projects/ProjectStatusReportTab";
import { ProjectEncerramentoTab } from "@/components/projects/ProjectEncerramentoTab";
import { History as HistoryIcon } from "lucide-react";
import Topbar from "@/components/layout/Topbar";

export default function ProjectDetailsPage() {
  const { id } = useParams() as { id: string };
  const [project, setProject] = useState<Project & { artifacts: Artifact[]; risks: Risk[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("informacoes");
  const [saveTrigger, setSaveTrigger] = useState(0);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
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
          <Skeleton className="h-12 w-full max-w-4xl mb-8 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <Skeleton className="h-[600px] w-full bg-slate-200 dark:bg-slate-800 rounded-2xl" />
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

  return (
    <div className="flex min-h-screen flex-col bg-background transition-colors duration-300">
      <Topbar />
      <ProjectHeader 
        project={project} 
        onSave={() => setSaveTrigger(prev => prev + 1)} 
      />

      <main className="max-w-[1200px] mx-auto w-full px-6 py-8 flex-1">
        <ProjectTabs activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="mt-2">
          {activeTab === "informacoes" && <ProjectInfoTab project={project} saveTrigger={saveTrigger} />}
          {activeTab === "pre-projeto" && <ProjectPreProjectTab project={project} saveTrigger={saveTrigger} />}
          {activeTab === "termo-abertura" && <ProjectCharterTab project={project} saveTrigger={saveTrigger} onApprovalChange={fetchProject} />}
          {activeTab === "matriz-risco" && <ProjectRiskTab project={project} />}
          {activeTab === "eap" && <ProjectEapTab projectId={project.id} charterApproved={project.charterApproved} />}
          {activeTab === "status-report" && <ProjectStatusReportTab projectId={project.id} />}
          {activeTab === "encerramento" && <ProjectEncerramentoTab projectId={project.id} />}
          
          {activeTab !== "informacoes" && activeTab !== "pre-projeto" && activeTab !== "termo-abertura" && activeTab !== "matriz-risco" && activeTab !== "eap" && activeTab !== "status-report" && activeTab !== "encerramento" && (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/60 shadow-sm min-h-[400px]">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Conteúdo em Desenvolvimento</h3>
              <p className="text-slate-500 max-w-sm text-center">
                A aba &quot;{activeTab.replace('-', ' ')}&quot; está sendo preparada para alinhamento com o novo design.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
