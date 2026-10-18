import React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: string | number;
    trend: "up" | "down" | "neutral";
    label?: string;
  };
  icon?: React.ReactNode;
  sparklineData?: number[];
  className?: string;
  isCurrency?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  icon,
  sparklineData,
  className,
  isCurrency = false,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-xs hover:border-zinc-300 transition-all",
        className
      )}
    >
      <div className="flex items-center justify-between text-zinc-500 mb-2">
        <span className="text-xs font-semibold tracking-wide uppercase">{title}</span>
        {icon && <div className="p-2 rounded-lg bg-zinc-50 text-zinc-600 border border-zinc-100">{icon}</div>}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight tabular-nums">
          {isCurrency && typeof value === "number" ? `৳${value.toLocaleString()}` : value}
        </div>

        {sparklineData && sparklineData.length > 1 && (
          <div className="h-7 w-20 flex items-end gap-1">
            {(() => {
              const max = Math.max(...sparklineData);
              const min = Math.min(...sparklineData);
              const range = max - min || 1;

              return sparklineData.map((val, idx) => {
                const heightPercent = Math.max(15, Math.round(((val - min) / range) * 100));
                const isLast = idx === sparklineData.length - 1;

                return (
                  <div
                    key={idx}
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      "flex-1 rounded-t-sm transition-all",
                      isLast ? "bg-indigo-600" : "bg-indigo-200"
                    )}
                  />
                );
              });
            })()}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3 text-xs">
        {change && (
          <div
            className={cn(
              "inline-flex items-center gap-1 font-semibold",
              change.trend === "up" && "text-emerald-600",
              change.trend === "down" && "text-rose-600",
              change.trend === "neutral" && "text-zinc-500"
            )}
          >
            {change.trend === "up" ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : change.trend === "down" ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
            <span>{change.value}</span>
            {change.label && (
              <span className="text-zinc-400 font-normal ml-0.5">{change.label}</span>
            )}
          </div>
        )}

        {subtitle && !change && (
          <span className="text-zinc-400">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
