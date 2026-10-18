"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteCompiledMarksheetAction } from "@/app/actions/compiled-marksheets";
import {
  Layers,
  Calendar,
  ExternalLink,
  Printer,
  Trash2,
  Plus,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { CompileMarksheetModal } from "./CompileMarksheetModal";

interface CompiledMarksheetsTableProps {
  initialCompiledMarksheets: any[];
  programs: any[];
  specialExams: any[];
}

export function CompiledMarksheetsTable({
  initialCompiledMarksheets,
  programs,
  specialExams,
}: CompiledMarksheetsTableProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete compiled marksheet "${title}"? This will not affect the underlying exams or marks.`)) {
      return;
    }

    setDeletingId(id);
    const res = await deleteCompiledMarksheetAction(id);
    setDeletingId(null);

    if (res.success) {
      toast.success("Compiled marksheet deleted successfully");
      router.refresh();
    } else {
      toast.error("Failed to delete compiled marksheet");
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">
            Saved Compiled Marksheets ({initialCompiledMarksheets.length})
          </h3>
          <p className="text-xs text-zinc-500">
            Ungraded cumulative aggregations across selected lecture series (e.g. L1–L10, L11–L20).
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          disabled={specialExams.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Compile New Marksheet</span>
        </button>
      </div>

      {initialCompiledMarksheets.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-10 text-center">
          <Layers className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-zinc-900">
            No Compiled Marksheets Yet
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
            Select a series of short tests (such as Lectures 1 to 10 or 11 to 20) and generate an ungraded total-ranked marksheet with custom titles.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={specialExams.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Compile First Marksheet</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialCompiledMarksheets.map((sheet) => {
            const formattedDate = new Date(sheet.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={sheet.id}
                className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-2xs flex flex-col justify-between hover:border-indigo-300 transition-colors"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                        {sheet.program?.code || "Program"}
                      </span>
                      <h4 className="text-sm font-bold text-zinc-900 mt-1.5">
                        {sheet.title}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(sheet.id, sheet.title)}
                      disabled={deletingId === sheet.id}
                      className="text-zinc-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Delete Compilation"
                    >
                      {deletingId === sheet.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="text-xs text-zinc-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Exams Included:</span>
                      <strong className="text-zinc-800 tabular-nums">
                        {sheet.examCount || sheet.exams?.length || 0} exams
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Max Possible:</span>
                      <span className="font-semibold text-zinc-800 tabular-nums">
                        {sheet.totalPossibleMarks || 0} marks
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Section Scope:</span>
                      <span className="text-zinc-800">
                        {sheet.batch ? sheet.batch.name : "All Sections (Boys & Girls)"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100">
                      <span>Compiled on:</span>
                      <span>{formattedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <Link
                    href={`/admin-route/special-batch/compiled-marksheets/${sheet.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Open Sheet & Matrix</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CompileMarksheetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        programs={programs}
        specialExams={specialExams}
      />
    </div>
  );
}
