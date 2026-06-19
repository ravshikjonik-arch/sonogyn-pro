"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SalesChartProps = {
  data: { date: string; amountRub: number; count: number }[];
};

export function SalesChart({ data }: SalesChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickFormatter={(v: string) => v.slice(5)}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11 }} width={48} />
          <Tooltip
            formatter={(value, name) => {
              const num = typeof value === "number" ? value : Number(value ?? 0);
              return name === "amountRub"
                ? [`${num.toLocaleString("ru-RU")} ₽`, "Выручка"]
                : [num, "Продаж"];
            }}
            labelFormatter={(label) => `Дата: ${label}`}
          />
          <Line type="monotone" dataKey="amountRub" stroke="var(--clinical-primary)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
