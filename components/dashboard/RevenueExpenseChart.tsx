"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendData {
  month: string;
  revenue: number;
  expense: number;
}

interface RevenueExpenseChartProps {
  data: TrendData[];
}

export function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-zinc-400">
        No transaction history recorded yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={{ stroke: "#e4e4e7" }}
            tick={{ fontSize: 11, fill: "#71717a" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "#71717a" }}
            tickFormatter={(value) => `৳${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
          />
          <Tooltip
            cursor={{ fill: "#f4f4f5" }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white p-2.5 rounded-lg border border-zinc-200 shadow-md text-xs">
                    <p className="font-bold text-zinc-900 mb-1">{label}</p>
                    <div className="space-y-0.5 tabular-nums">
                      <p className="text-emerald-600 font-medium">
                        Revenue: ৳{Number(payload[0]?.value || 0).toLocaleString()}
                      </p>
                      <p className="text-rose-600 font-medium">
                        Expense: ৳{Number(payload[1]?.value || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
          />
          <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={32} />
          <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
