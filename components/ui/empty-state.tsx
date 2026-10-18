import React from "react";
import { FolderOpen, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl border border-dashed border-zinc-200 bg-white/50",
        className
      )}
    >
      <div className="p-3 rounded-full bg-zinc-100 text-zinc-500 mb-3 border border-zinc-200">
        {icon || <FolderOpen className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
      <p className="text-xs text-zinc-500 max-w-sm mt-1">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition-colors focus-ring"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}
