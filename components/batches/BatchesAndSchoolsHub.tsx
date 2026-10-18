"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Layers, School as SchoolIcon, Users, Sparkles } from "lucide-react";
import { BatchList } from "@/components/BatchList";
import { SchoolList } from "@/components/SchoolList";
import type { Batch, School } from "@/types";

interface BatchesAndSchoolsHubProps {
  initialBatches: Batch[];
  initialSchools: School[];
  defaultTab?: "batches" | "schools";
}

export function BatchesAndSchoolsHub({
  initialBatches,
  initialSchools,
  defaultTab = "batches",
}: BatchesAndSchoolsHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as "batches" | "schools" | null;
  const [activeTab, setActiveTab] = useState<"batches" | "schools">(
    urlTab || defaultTab
  );

  const totalBatchStudents = initialBatches.reduce(
    (acc, b) => acc + (b._count?.students || 0),
    0
  );
  const totalSchoolStudents = initialSchools.reduce(
    (acc, s) => acc + (s._count?.students || 0),
    0
  );

  const handleTabChange = (tab: "batches" | "schools") => {
    setActiveTab(tab);
    const newPath =
      tab === "schools" ? "/admin-route/schools" : "/admin-route/batches";
    window.history.replaceState(null, "", newPath);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Batches & Feeder Schools
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Academic Organization
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Manage academic batches, student distributions, and partner feeder institutions.
          </p>
        </div>

        <Link
          href="/admin-route/special-batch"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-xs w-fit"
        >
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>Special Batches & Programs</span>
        </Link>
      </div>

      {/* Modern Tab Switcher */}
      <div className="flex items-center gap-2 p-1 bg-zinc-100/90 rounded-xl max-w-md border border-zinc-200/60">
        <button
          onClick={() => handleTabChange("batches")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "batches"
              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/60"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <Layers className="h-4 w-4 text-indigo-600" />
          <span>Batches</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "batches"
                ? "bg-indigo-50 text-indigo-700"
                : "bg-zinc-200 text-zinc-600"
            }`}
          >
            {initialBatches.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("schools")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "schools"
              ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/60"
              : "text-zinc-500 hover:text-zinc-900"
          }`}
        >
          <SchoolIcon className="h-4 w-4 text-indigo-600" />
          <span>Feeder Schools</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "schools"
                ? "bg-indigo-50 text-indigo-700"
                : "bg-zinc-200 text-zinc-600"
            }`}
          >
            {initialSchools.length}
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "batches" ? (
        <BatchList initialBatches={initialBatches} />
      ) : (
        <SchoolList initialSchools={initialSchools} />
      )}
    </div>
  );
}
