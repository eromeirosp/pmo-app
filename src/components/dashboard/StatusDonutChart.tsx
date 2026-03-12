"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StatusDonutChartProps {
  green: number;
  yellow: number;
  red: number;
}

const STATUS_COLORS = {
  "No Prazo": "var(--chart-2)",    // Emerald
  "Em Atenção": "var(--chart-4)",  // Amber
  Atrasado: "var(--chart-5)",      // Rose
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { pct: number } }[];
}) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg shadow-2xl px-3 py-2 text-sm">
        <p className="font-semibold text-foreground">{item.name}</p>
        <p className="text-muted-foreground">
          {item.value} projeto{item.value !== 1 ? "s" : ""} · {item.payload.pct}%
        </p>
      </div>
    );
  }
  return null;
};

export function StatusDonutChart({ green, yellow, red }: StatusDonutChartProps) {
  const total = green + yellow + red;

  const data = [
    {
      name: "No Prazo",
      value: green,
      pct: total > 0 ? Math.round((green / total) * 100) : 0,
    },
    {
      name: "Em Atenção",
      value: yellow,
      pct: total > 0 ? Math.round((yellow / total) * 100) : 0,
    },
    {
      name: "Atrasado",
      value: red,
      pct: total > 0 ? Math.round((red / total) * 100) : 0,
    },
  ].filter((d) => d.value > 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="relative h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 10 }} />
          <Legend
            iconType="circle"
            iconSize={8}
            verticalAlign="bottom"
            align="center"
            formatter={(value) => (
              <span className="text-[11px] text-muted-foreground font-medium">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8 z-0">
        <span className="text-3xl font-bold text-foreground tracking-tight">{total}</span>
        <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">projetos</span>
      </div>
    </div>
  );
}
