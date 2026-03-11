import { LucideIcon } from "lucide-react";
import React from "react";

interface TabHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function TabHeader({ icon: Icon, title, description, actions }: TabHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-white/10">
      <div className="flex items-start sm:items-center gap-4">
        <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0 ring-1 ring-primary/20 shadow-inner">
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            {title}
          </h2>
          {description && (
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
