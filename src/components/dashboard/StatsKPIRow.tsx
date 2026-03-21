"use client";

import { TrendingUp, TrendingDown, Minus, CheckCircle2, AlertTriangle, DollarSign, PieChart } from "lucide-react";

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
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            trendUp
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
              : trendUp === false
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
          }`}>
            {trendUp === true && <TrendingUp size={12} className="shrink-0" />}
            {trendUp === false && <TrendingDown size={12} className="shrink-0" />}
            {trendUp === undefined && <Minus size={12} className="shrink-0" />}
            <span>{trend}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight text-foreground drop-shadow-sm">
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

interface AlertsKPICardProps {
  yellow: number;
  red: number;
  total: number;
}

function AlertsKPICard({ yellow, red, total }: AlertsKPICardProps) {
  const alertTotal = yellow + red;
  const alertPct = total > 0 ? Math.round((alertTotal / total) * 100) : 0;
  const yellowPct = alertTotal > 0 ? Math.round((yellow / alertTotal) * 100) : 0;
  const redPct = alertTotal > 0 ? 100 - yellowPct : 0;

  const trendUp = alertTotal === 0 ? true : red > 0 ? false : undefined;
  const trendLabel = alertTotal === 0 ? "Limpo" : red > 0 ? "Atrasado" : "Atenção";

  return (
    <div className="group relative overflow-hidden bg-white/80 dark:bg-black/80 backdrop-blur-md border border-border/60 dark:border-white/10 rounded-2xl p-5 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-primary/5">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
          <div className="text-primary"><AlertTriangle size={20} /></div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          trendUp
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            : trendUp === false
            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
        }`}>
          {trendUp === true && <TrendingUp size={12} className="shrink-0" />}
          {trendUp === false && <TrendingDown size={12} className="shrink-0" />}
          {trendUp === undefined && <Minus size={12} className="shrink-0" />}
          <span>{trendLabel}</span>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
          Alertas
        </p>
        <h3 className="text-xl sm:text-2xl lg:text-[28px] font-black tracking-tight text-foreground drop-shadow-sm">
          {alertTotal}
        </h3>

        <div className="flex flex-col gap-1 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">
              {yellow} em atenção
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground">
              {red} atrasado{red !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {alertTotal > 0 && (
          <div className="w-full h-1.5 rounded-full bg-muted/30 mt-2 overflow-hidden">
            <div className="h-full flex">
              {yellow > 0 && (
                <div
                  className="h-full bg-amber-400 rounded-l-full"
                  style={{ width: `${yellowPct}%` }}
                />
              )}
              {red > 0 && (
                <div
                  className={`h-full bg-rose-500 ${yellow === 0 ? 'rounded-l-full' : ''} rounded-r-full`}
                  style={{ width: `${redPct}%` }}
                />
              )}
            </div>
          </div>
        )}

        <p className="text-[10px] sm:text-[11px] font-bold text-muted-foreground mt-1 uppercase tracking-tight">
          {alertPct}% do portfólio
        </p>
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
  avgROI?: number | null;
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
  avgROI,
}: StatsKPIRowProps) {
  const healthPct = total > 0 ? Math.round((green / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
      <KPICard
        title="Total de Projetos"
        value={total}
        icon={<PieChart size={20} />}
      />
      <KPICard
        title="No Prazo"
        value={green}
        sub={`${healthPct}% do portfólio`}
        trend="Saudável"
        trendUp={true}
        icon={<CheckCircle2 size={20} />}
      />
      <AlertsKPICard yellow={yellow} red={red} total={total} />
      <KPICard
        title="Orçamento Total"
        value={formatBRL(totalBudget)}
        sub={`Média ${formatBRL(avgBudget)}`}
        icon={<DollarSign size={20} />}
      />
      <KPICard
        title="ROI Médio"
        value={avgROI !== null && avgROI !== undefined ? `${avgROI}%` : "N/A"}
        sub={avgROI !== null && avgROI !== undefined ? (avgROI > 0 ? "Retorno positivo" : "Retorno negativo") : "Sem dados"}
        trend={avgROI !== null && avgROI !== undefined ? (avgROI > 0 ? "Positivo" : "Negativo") : undefined}
        trendUp={avgROI !== null && avgROI !== undefined ? avgROI > 0 : undefined}
        icon={<TrendingUp size={20} />}
      />
    </div>
  );
}
