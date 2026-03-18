"use client";

import { cn } from "@/lib/utils";
import {
  Info,
  FileText,
  BookOpen,
  Network,
  AlertTriangle,
  Activity,
  Wallet,
  FileCheck
} from "lucide-react";

interface ProjectTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: "informacoes", label: "Informações", icon: Info },
  { id: "pre-projeto", label: "Pré-projeto", icon: FileText },
  { id: "termo-abertura", label: "Termo de Abertura", icon: BookOpen },
  { id: "eap", label: "EAP", icon: Network },
  { id: "matriz-risco", label: "Matriz de Risco", icon: AlertTriangle },
  { id: "status-report", label: "Status Report", icon: Activity },
  { id: "orcamento", label: "Orçamento", icon: Wallet },
  { id: "encerramento", label: "Encerramento", icon: FileCheck },
];

export function ProjectTabs({ activeTab, onTabChange }: ProjectTabsProps) {
  return (
    <div id="project-tabs-container" className="bg-background/80 backdrop-blur-md border-b border-border sticky top-[92px] sm:top-[72px] z-20 -mx-6 lg:-mx-10 mb-8 transition-all shadow-sm">
      <div className="overflow-x-auto no-scrollbar px-6 lg:px-10 py-3">
        <div className="max-w-5xl mx-auto flex gap-1 min-w-max bg-slate-100/80 dark:bg-slate-800/50 p-1.5 rounded-xl w-fit border border-slate-200 dark:border-slate-800">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ease-out whitespace-nowrap",
                  isActive
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm border border-slate-200/50 dark:border-slate-600/50 scale-100"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 scale-[0.98] hover:scale-100"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-slate-400")} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
