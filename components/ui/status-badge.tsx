import React from "react";
import { cn } from "@/lib/utils";

export type StatusVariant =
  | "paid"
  | "partial"
  | "due"
  | "present"
  | "absent"
  | "active"
  | "inactive"
  | "neutral"
  | "info";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string }> = {
  paid: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  present: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  active: {
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  partial: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  due: {
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  absent: {
    bg: "bg-rose-50 border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  inactive: {
    bg: "bg-zinc-100 border-zinc-200",
    text: "text-zinc-600",
    dot: "bg-zinc-400",
  },
  neutral: {
    bg: "bg-zinc-100 border-zinc-200",
    text: "text-zinc-700",
    dot: "bg-zinc-500",
  },
  info: {
    bg: "bg-sky-50 border-sky-200",
    text: "text-sky-700",
    dot: "bg-sky-500",
  },
};

export function StatusBadge({
  status,
  variant = "neutral",
  className,
  dot = true,
}: StatusBadgeProps) {
  // Auto-detect variant if not explicitly provided
  let resolvedVariant = variant;
  const lower = status.toLowerCase();

  if (variant === "neutral") {
    if (lower.includes("paid") || lower.includes("present") || lower.includes("active")) {
      resolvedVariant = "paid";
    } else if (lower.includes("partial") || lower.includes("pending")) {
      resolvedVariant = "partial";
    } else if (lower.includes("due") || lower.includes("absent") || lower.includes("fail")) {
      resolvedVariant = "due";
    } else if (lower.includes("inactive")) {
      resolvedVariant = "inactive";
    }
  }

  const style = variantStyles[resolvedVariant] || variantStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border select-none",
        style.bg,
        style.text,
        className
      )}
    >
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", style.dot)} />}
      <span>{status}</span>
    </span>
  );
}
