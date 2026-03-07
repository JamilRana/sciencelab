//app/admin-route/components/dashboard/StudentAnalyticsCharts.tsx
"use client";

import {
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

const COLORS = ["#3b82f6", "#ec4899", "#22c55e", "#f59e0b", "#8b5cf6"];

export function StudentAnalyticsChart({ data }: { data: any }) {
  if (!data) return <div className="h-64 flex items-center justify-center text-muted-foreground">Loading analytics...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Gender Distribution */}
      <div className="h-64">
        <p className="text-sm font-medium mb-2">By Gender</p>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.byGender}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              nameKey="label"
            >
              {data.byGender.map((_: any, index: number) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
  formatter={(value) => {
    const num = Number(value ?? 0);
    return [`${num} students`, "Gender"];
  }}
/>
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Class Distribution */}
      <div className="h-64">
        <p className="text-sm font-medium mb-2">By Class</p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.byClass} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" fontSize={12} tickLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
            <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}