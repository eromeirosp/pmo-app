"use client";

import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  sub?: string;
  trend?: string;
  trendUp?: boolean;
  icon: React.ReactNode;
}

function KPICard({ title, value, sub, trend, trendUp, icon }: KPICardProps) {
  return (
    <div className="group relative overflow-hidden bg-white/80 dark:bg-black/80 backdrop-blur-md border border-border/60 dark:border-white/10 rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
          <div className="text-primary">{icon}</div>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[12px] font-bold ${
            trendUp 
              ? 'bg-emerald-500/10 text-emerald-500' 
              : trendUp === false 
              ? 'bg-rose-500/10 text-rose-500'
              : 'bg-muted text-muted-foreground'
          }`}>
            {trendUp ? '↑' : trendUp === false ? '↓' : ''} {trend}
          </div>
        )}
      </div>
      
      <div>
        <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground truncate drop-shadow-sm">
          {value}
        </h3>
        {sub && (
          <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-tight truncate">
            {sub}
          </p>
        )}
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
    </div>
  );
}

interface StatsKPIRowProps {
  total: number;
  green: number;
  yellow: number;
  red: number;
  totalBudget: number;
  avgBudget: number;
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function StatsKPIRow({
  total,
  green,
  yellow,
  red,
  totalBudget,
  avgBudget,
}: StatsKPIRowProps) {
  const healthPct = total > 0 ? Math.round((green / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
      <KPICard 
        title="Total de Projetos" 
        value={total} 
        icon={<TrendingUp size={20} />} 
      />
      <KPICard 
        title="No Prazo" 
        value={green} 
        sub={`${healthPct}% do portfólio`}
        trend={`${healthPct}%`}
        trendUp={healthPct >= 60}
        icon={<TrendingUp size={20} />} 
      />
      <KPICard 
        title="Em Atenção" 
        value={yellow} 
        sub={total > 0 ? `${Math.round((yellow / total) * 100)}% em risco` : "0%"}
        trend={yellow === 0 ? "Bom" : "Risco"}
        trendUp={yellow === 0}
        icon={<Minus size={20} />} 
      />
      <KPICard 
        title="Críticos" 
        value={red} 
        sub={total > 0 ? `${Math.round((red / total) * 100)}% urgentes` : "0%"}
        trend={red === 0 ? "Limpo" : "Urgente"}
        trendUp={red === 0}
        icon={<TrendingDown size={20} />} 
      />
      <KPICard 
        title="Orçamento Total" 
        value={formatBRL(totalBudget)} 
        sub={`Média ${formatBRL(avgBudget)}`}
        icon={<TrendingUp size={20} />} 
      />
    </div>
  );
}
