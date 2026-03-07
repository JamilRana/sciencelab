//app/admin-route/components/dashboard/ExamAnalyticsChart.tsx
"use client";

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Cell
} from "recharts";

const SCORE_COLORS = ["#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];

export function ExamAnalyticsChart({ data }: { data: any[] }) {
  if (!data?.length) return <div className="h-64 flex items-center justify-center text-muted-foreground">No exam data</div>;

  const chartData = data.map((exam, i) => ({
    name: `${exam.month}\n${exam.class}`,
    avg: parseFloat(exam.averageScore),
    students: exam.students,
    fill: SCORE_COLORS[i % SCORE_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={256}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          fontSize={11} 
          tickLine={false} 
          angle={-10} 
          textAnchor="end"
          height={50}
        />
        <YAxis fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
        <Tooltip 
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const data = payload[0].payload;
            return (
              <div className="bg-card border rounded-lg p-3 shadow-lg text-sm">
                <p className="font-medium">{data.name.replace('\n', ' - ')}</p>
                <p className="text-primary">Avg Score: {data.avg}%</p>
                <p className="text-muted-foreground">Students: {data.students}</p>
              </div>
            );
          }}
        />
        <Bar dataKey="avg" radius={[6, 6, 0, 0]} name="Average Score">
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}