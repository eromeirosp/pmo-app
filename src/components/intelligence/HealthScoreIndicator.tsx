"use client";

import { TrendingUp, TrendingDown, Minus, Activity, HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SparklinePoint {
  date: string;
  score: number;
}

interface HealthScoreIndicatorProps {
  score: number;
  trend: "improving" | "stable" | "declining";
  sparkline?: SparklinePoint[];
  compact?: boolean;
}

function MiniSparkline({ data }: { data: SparklinePoint[] }) {
  if (data.length < 2) return null;

  const scores = data.map((d) => d.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min || 1;

  const width = 80;
  const height = 24;
  const padding = 2;

  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((d.score - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(" ");

  return (
    <svg width={width} height={height} className="shrink-0">
      <path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary/60"
      />
    </svg>
  );
}

export function HealthScoreIndicator({
  score,
  trend,
  sparkline,
  compact = false,
}: HealthScoreIndicatorProps) {
  const color =
    score >= 80
      ? "text-emerald-500"
      : score >= 50
      ? "text-amber-500"
      : "text-rose-500";

  const bgColor =
    score >= 80
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-amber-500"
      : "bg-rose-500";

  const trendIcon =
    trend === "improving" ? (
      <TrendingUp className="h-3 w-3 text-emerald-500" />
    ) : trend === "declining" ? (
      <TrendingDown className="h-3 w-3 text-rose-500" />
    ) : (
      <Minus className="h-3 w-3 text-muted-foreground" />
    );

  const trendLabel =
    trend === "improving"
      ? "Melhorando"
      : trend === "declining"
      ? "Piorando"
      : "Estável";

  if (compact) {
    return (
      <div className="flex items-center gap-1.5" title={`Health Score: ${score}/100 — ${trendLabel}`}>
        <span className={`text-[12px] font-black ${color}`}>{score}</span>
        {trendIcon}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Activity className={`h-4 w-4 ${color}`} />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-black ${color}`}>{score}</span>
            <span className="text-[10px] text-muted-foreground font-bold">/100</span>
            {trendIcon}
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors cursor-help">
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-xs leading-relaxed space-y-1 p-3">
                <p><strong>Score de Saúde (0–100):</strong> pontuação preditiva baseada em orçamento, cronograma, riscos e escopo.</p>
                <p><strong>Barra:</strong> visualização do score atual.</p>
                <p><strong>Gráfico:</strong> evolução histórica do score.</p>
                <p><strong>Seta:</strong> tendência — melhorando, estável ou em declínio.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="w-20 h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <div
              className={`h-full rounded-full ${bgColor} transition-all duration-500`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>
      {sparkline && sparkline.length > 1 && <MiniSparkline data={sparkline} />}
    </div>
  );
}
