"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatCurrency, formatCurrencyCompact, convertCurrency, getCurrencySymbol } from "@/lib/format";

interface BudgetBarChartProps {
  data: { name: string; budget: number; status: string; currency?: string }[];
}

const STATUS_FILL: Record<string, string> = {
  GREEN: "var(--chart-2)",
  YELLOW: "var(--chart-4)",
  RED: "var(--chart-5)",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const currency = payload[0]?.payload?.currency || "BRL";
    return (
      <div className="bg-popover border border-border rounded-lg shadow-2xl px-3 py-2 text-sm">
        <p className="font-semibold text-foreground max-w-[200px] truncate">{label}</p>
        <p className="text-muted-foreground mt-0.5">
          {formatCurrency(payload[0].value, currency)}
        </p>
      </div>
    );
  }
  return null;
};

export function BudgetBarChart({ data }: BudgetBarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  // Check if mixed currencies
  const uniqueCurrencies = new Set(data.map((d) => d.currency || "BRL"));
  const hasMixedCurrencies = uniqueCurrencies.size > 1;

  // When mixed currencies, normalize to BRL for the bar chart
  const chartData = hasMixedCurrencies
    ? data.map((d) => ({
        ...d,
        budget: convertCurrency(d.budget, d.currency || "BRL", "BRL"),
        originalBudget: d.budget,
        originalCurrency: d.currency || "BRL",
        name: `${d.name} (${getCurrencySymbol(d.currency || "BRL")})`,
      }))
    : data.map((d) => ({ ...d, originalBudget: d.budget, originalCurrency: d.currency || "BRL" }));

  return (
    <div className="w-full">
      {hasMixedCurrencies && (
        <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
          Valores normalizados em R$ para comparação
        </p>
      )}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            barSize={14}
          >
            <XAxis
              type="number"
              tickFormatter={(v: number) => formatCurrencyCompact(v, "BRL")}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)", opacity: 0.7 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              tickLine={false}
              axisLine={false}
              width={140}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content={({ active, payload, label }: any) => {
                if (active && payload && payload.length) {
                  const entry = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg shadow-2xl px-3 py-2 text-sm">
                      <p className="font-semibold text-foreground max-w-[200px] truncate">{label}</p>
                      <p className="text-muted-foreground mt-0.5">
                        {formatCurrency(entry.originalBudget, entry.originalCurrency)}
                      </p>
                      {hasMixedCurrencies && entry.originalCurrency !== "BRL" && (
                        <p className="text-muted-foreground/70 text-xs mt-0.5">
                          ≈ {formatCurrency(payload[0].value, "BRL")}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
            />
            <Bar dataKey="budget" radius={[0, 6, 6, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_FILL[entry.status] ?? "#6366f1"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
