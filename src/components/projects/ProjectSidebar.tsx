"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Project, Artifact } from "@prisma/client";
import {
  Info,
  FileText,
  BookOpen,
  Network,
  AlertTriangle,
  Activity,
  Wallet,
  FileCheck,
  FileStack,
  ChevronDown,
  CheckCircle2,
  Clock,
  Shield,
  Star,
  Bot,
  FlaskConical,
} from "lucide-react";
import {
  DOCUMENT_CATALOG,
  type ProjectClassification,
} from "@/lib/ai-document-prompts";

interface ProjectSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  project: Project & { artifacts: Artifact[] };
  className?: string;
  onItemClick?: () => void;
}

const SIDEBAR_SECTIONS = [
  {
    label: "GERAL",
    items: [{ id: "informacoes", label: "Informações", icon: Info }],
  },
  {
    label: "INICIAÇÃO",
    items: [
      { id: "pre-projeto", label: "Pré-projeto", icon: FileText },
      { id: "termo-abertura", label: "Termo de Abertura", icon: BookOpen },
    ],
  },
  {
    label: "PLANEJAMENTO",
    items: [
      { id: "eap", label: "EAP", icon: Network },
      { id: "matriz-risco", label: "Matriz de Risco", icon: AlertTriangle },
      { id: "orcamento", label: "Orçamento", icon: Wallet },
    ],
  },
  {
    label: "MONITORAMENTO",
    items: [
      { id: "status-report", label: "Status Report", icon: Activity },
      { id: "autopiloto", label: "Autopiloto", icon: Bot },
      { id: "simulador", label: "Simulador", icon: FlaskConical },
      { id: "regras-ia", label: "Regras de IA", icon: Shield },
      { id: "documentos", label: "Documentos", icon: FileStack, expandable: true },
    ],
  },
  {
    label: "ENCERRAMENTO",
    items: [{ id: "encerramento", label: "Encerramento", icon: FileCheck }],
  },
] as const;

const CATEGORY_ORDER = ["Iniciação", "Planejamento", "Execução", "Encerramento"] as const;

export function ProjectSidebar({
  activeTab,
  onTabChange,
  project,
  className,
  onItemClick,
}: ProjectSidebarProps) {
  const [docsExpanded, setDocsExpanded] = useState(activeTab.startsWith("doc:"));
  const classification = (project.classification || "TRADITIONAL") as ProjectClassification;

  const getArtifactForType = (type: string): Artifact | undefined => {
    return project.artifacts.find((a) => a.type === type);
  };

  const handleItemClick = (id: string) => {
    if (id === "documentos") {
      setDocsExpanded((prev) => !prev);
      return;
    }
    onTabChange(id);
    onItemClick?.();
  };

  const handleDocItemClick = (docType: string) => {
    onTabChange(`doc:${docType}`);
    onItemClick?.();
  };

  // Group catalog entries by category
  const groupedCatalog = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    entries: DOCUMENT_CATALOG.filter((d) => d.category === cat),
  })).filter((g) => g.entries.length > 0);

  // Progress stats
  const requiredDocs = DOCUMENT_CATALOG.filter(
    (d) => d.requirements[classification] === "REQUIRED"
  );
  const requiredDone = requiredDocs.filter((d) => getArtifactForType(d.type));
  const totalDocs = DOCUMENT_CATALOG.length;
  const totalDone = DOCUMENT_CATALOG.filter((d) => getArtifactForType(d.type)).length;

  const isDocSubItemActive = activeTab.startsWith("doc:");

  return (
    <aside
      className={cn(
        "w-64 shrink-0 border-r border-border bg-background/50 overflow-y-auto flex flex-col",
        className
      )}
    >
      <nav className="flex-1 px-3 py-4 space-y-4">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 px-3">
              {section.label}
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isExpandable = "expandable" in item && item.expandable;
              const isActive = !isExpandable
                ? activeTab === item.id
                : isDocSubItemActive;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={cn(
                      "flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/70")} />
                    <span className="flex-1 truncate">{item.label}</span>
                    {isExpandable && (
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-200",
                          docsExpanded && "rotate-180"
                        )}
                      />
                    )}
                  </button>

                  {/* Document sub-items */}
                  {isExpandable && docsExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-border pl-2">
                      {groupedCatalog.map((group) => (
                        <div key={group.category}>
                          <div className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider mt-2 mb-1 px-2">
                            {group.category}
                          </div>
                          {group.entries.map((entry) => {
                            const isDocActive = activeTab === `doc:${entry.type}`;
                            const isGenerated = !!getArtifactForType(entry.type);
                            const requirement = entry.requirements[classification] || "DESIRABLE";

                            return (
                              <button
                                key={entry.type}
                                onClick={() => handleDocItemClick(entry.type)}
                                className={cn(
                                  "flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                                  isDocActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                )}
                              >
                                {isGenerated ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                                ) : (
                                  <Clock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                )}
                                <span className="flex-1 truncate">{entry.label}</span>
                                {requirement === "REQUIRED" ? (
                                  <span title="Obrigatório"><Shield className="h-3 w-3 text-amber-500 shrink-0" /></span>
                                ) : (
                                  <span title="Desejável"><Star className="h-3 w-3 text-muted-foreground/30 shrink-0" /></span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Progress summary */}
      <div className="px-3 pb-4 mt-auto">
        <div className="p-3 rounded-xl bg-accent/50 border border-border">
          <div className="text-xs font-bold text-muted-foreground mb-2">
            Progresso Documental
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Obrigatórios</span>
              <span className="font-bold text-amber-600">
                {requiredDone.length}/{requiredDocs.length}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all"
                style={{
                  width: `${requiredDocs.length > 0 ? (requiredDone.length / requiredDocs.length) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs mt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-primary">
                {totalDone}/{totalDocs}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${totalDocs > 0 ? (totalDone / totalDocs) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
