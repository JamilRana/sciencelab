//app/admin-route/components/dashboard/StatsGrid.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Role } from "@prisma/client";


interface StatsGridProps {
  stats: any;
  role: Role;
}

export function StatsGrid({ stats, role }: StatsGridProps) {
  const cards = [
    {
      label: "Total Students",
      value: stats?.studentCount ?? 0,
      sub: `✅ ${stats?.activeStudents ?? 0} Active • ❌ ${stats?.inactiveStudents ?? 0} Inactive`,
      icon: "🎓",
      trend: stats?.studentGrowth?.growthRate,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Teachers",
      value: stats?.teacherCount ?? 0,
      sub: `${stats?.batchCount ?? 0} Batches Active`,
      icon: "👨‍🏫",
      color: "from-purple-500 to-pink-500",
    },
    {
      label: "Exams",
      value: stats?.examCount ?? 0,
      sub: "Conducted This Session",
      icon: "📝",
      color: "from-orange-500 to-amber-500",
    },
    // 🔒 Financial card - ADMIN only
    ...(role === "ADMIN" && stats?.netBalance !== undefined
      ? [{
          label: "Net Balance",
          value: `৳${(stats.netBalance ?? 0).toLocaleString()}`,
          sub: `📥 ৳${(stats.totalRevenue ?? 0).toLocaleString()} • 📤 ৳${(stats.totalExpenses ?? 0).toLocaleString()}`,
          icon: "💰",
          trend: stats.netBalance >= 0 ? "+Healthy" : "-Alert",
          color: stats.netBalance >= 0 
            ? "from-green-500 to-emerald-500" 
            : "from-red-500 to-rose-500",
        }]
      : []),
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-0">
            <div className={`p-4 bg-gradient-to-r ${card.color}`}>
              <div className="flex justify-between items-start">
                <span className="text-3xl">{card.icon}</span>
                {card.trend && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    card.trend.includes("+") || card.trend === "Healthy"
                      ? "bg-white/20 text-white" 
                      : "bg-white/20 text-white"
                  }`}>
                    {card.trend}
                  </span>
                )}
              </div>
            </div>
            <div className="p-4">
              <p className="text-3xl font-bold tracking-tight">{card.value}</p>
              <p className="text-sm font-medium text-muted-foreground mt-1">{card.label}</p>
              <p className="text-xs text-muted-foreground mt-2">{card.sub}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}