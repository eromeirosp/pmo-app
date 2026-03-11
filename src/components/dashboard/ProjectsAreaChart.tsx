"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ProjectsAreaChartProps {
  data: { month: string; projetos: number }[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg shadow-2xl px-3 py-2 text-sm backdrop-blur-md">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-muted-foreground mt-0.5">
          {payload[0].value} projeto{payload[0].value !== 1 ? "s" : ""} criado
          {payload[0].value !== 1 ? "s" : ""}
        </p>
      </div>
    );
  }
  return null;
};

export function ProjectsAreaChart({ data }: ProjectsAreaChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        Nenhum dado disponível
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorProjetos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--white-10)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255, 255, 255, 0.1)" }} />
          <Area
            type="monotone"
            dataKey="projetos"
            stroke="var(--primary)"
            strokeWidth={3}
            fill="url(#colorProjetos)"
            dot={{ fill: "var(--primary)", strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--black-100)", fill: "var(--primary)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
