"use client";

import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrintButtonProps {
  label?: string;
  className?: string;
}

export function PrintButton({ label = "Print", className }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors",
        className
      )}
    >
      <Printer className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
