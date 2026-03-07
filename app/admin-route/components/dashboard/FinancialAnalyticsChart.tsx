//app/admin-route/components/dashboard/FinancialAnalyticsChart.tsx
"use client";

import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from "recharts";

export function FinancialAnalyticsChart({ data }: { data: any }) {
  // Merge revenue and expense by month
  const merged = data.revenueTrend.map((r: any) => ({
    month: r.month,
    revenue: r.amount,
    expense: data.expenseTrend.find((e: any) => e.month === r.month)?.amount || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={merged} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="4 4" vertical={false} />
        <XAxis dataKey="month" fontSize={12} tickLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `৳${v/1000}k`} />
        <Tooltip 
          formatter={(value) => {
  const num = Number(value ?? 0);
  return [`৳${num.toLocaleString()}`, "Revenue"];
}}
          labelFormatter={(label) => `Month: ${label}`}
        />
        <Legend />
        <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} opacity={0.9} />
        <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.9} />
        <Line 
          type="monotone" 
          dataKey={(d) => d.revenue - d.expense} 
          name="Net Flow" 
          stroke="#8b5cf6" 
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}