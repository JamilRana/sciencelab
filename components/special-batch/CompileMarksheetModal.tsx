"use client";

import { useState, useMemo } from "react";
import { X, Layers, Plus, Loader2, CheckSquare, Square, Filter } from "lucide-react";
import { createCompiledMarksheetAction } from "@/app/actions/compiled-marksheets";
import { useRouter } from "next/navigation";

interface CompileMarksheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  programs: any[];
  specialExams: any[];
}

export function CompileMarksheetModal({
  isOpen,
  onClose,
  programs,
  specialExams,
}: CompileMarksheetModalProps) {
  const router = useRouter();

  const [selectedProgramId, setSelectedProgramId] = useState<number>(
    programs[0]?.id || 0
  );
  const [batchId, setBatchId] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // Exam Selection State
  const [selectedExamIds, setSelectedExamIds] = useState<number[]>([]);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(10);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProgram = programs.find((p) => p.id === Number(selectedProgramId));

  // Available exams for the selected program
  const candidateExams = useMemo(() => {
    return specialExams.filter((e) => {
      if (e.programId !== Number(selectedProgramId)) return false;
      if (subjectFilter !== "all") {
        const hasSubj = e.subjects?.some(
          (s: any) => s.programSubjectId === Number(subjectFilter) || s.programSubject?.name === subjectFilter
        );
        if (!hasSubj) return false;
      }
      return true;
    }).sort((a, b) => {
      // Sort by lectureNo if available, then by date
      if (a.lectureNo && b.lectureNo) return a.lectureNo - b.lectureNo;
      return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
    });
  }, [specialExams, selectedProgramId, subjectFilter]);

  if (!isOpen) return null;

  const toggleExam = (id: number) => {
    setSelectedExamIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllCandidates = () => {
    setSelectedExamIds(candidateExams.map((e) => e.id));
  };

  const handleClearSelection = () => {
    setSelectedExamIds([]);
  };

  // Quick select by lecture range e.g. Lectures 1 to 10
  const handleSelectRange = () => {
    const matching = candidateExams.filter((e) => {
      if (e.lectureNo !== null && e.lectureNo !== undefined) {
        return e.lectureNo >= rangeStart && e.lectureNo <= rangeEnd;
      }
      return false;
    });

    if (matching.length === 0) {
      alert(`No exams found with lecture numbers between ${rangeStart} and ${rangeEnd}`);
      return;
    }

    const ids = matching.map((m) => m.id);
    setSelectedExamIds((prev) => Array.from(new Set([...prev, ...ids])));

    if (!title.trim()) {
      setTitle(`Lecture Assessment Compilation (${rangeStart}–${rangeEnd})`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProgramId) {
      setError("Please provide a title and select a program");
      return;
    }

    if (selectedExamIds.length === 0) {
      setError("Please select at least one exam to include in the compilation");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createCompiledMarksheetAction({
      programId: Number(selectedProgramId),
      batchId: batchId === "all" ? undefined : Number(batchId),
      title: title.trim(),
      description: description.trim(),
      examIds: selectedExamIds,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "Failed to compile marksheet");
      return;
    }

    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-2xl overflow-hidden my-8">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Compile Marksheet from Short / Lecture Tests
              </h2>
              <p className="text-xs text-zinc-500">
                Bundle any set of exams (e.g. Lectures 1–10) into an ungraded aggregate marksheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Program & Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Academic Program <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedProgramId}
                onChange={(e) => {
                  setSelectedProgramId(Number(e.target.value));
                  setSelectedExamIds([]);
                }}
                className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Section Scope
              </label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="all">Entire Program (Boys & Girls)</option>
                {currentProgram?.batches?.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (Code {b.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title & Notes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Marksheet Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Physics Lectures 01–10 Consolidated Sheet"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Reference / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Evaluated in Sep"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Range Picker Fast Tool */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                Quick Range Selection (by Lecture #)
              </span>
              <span className="text-[11px] text-indigo-700 font-medium">
                {selectedExamIds.length} of {candidateExams.length} exams selected
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <div className="flex items-center gap-1">
                <span className="text-zinc-600">Lectures</span>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={rangeStart}
                  onChange={(e) => setRangeStart(Number(e.target.value))}
                  className="w-14 px-2 py-1 bg-white border border-indigo-200 rounded text-center font-semibold text-xs"
                />
                <span className="text-zinc-600">to</span>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={rangeEnd}
                  onChange={(e) => setRangeEnd(Number(e.target.value))}
                  className="w-14 px-2 py-1 bg-white border border-indigo-200 rounded text-center font-semibold text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSelectRange}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded shadow-2xs transition-colors"
              >
                Select Range
              </button>

              <button
                type="button"
                onClick={handleSelectAllCandidates}
                className="px-2.5 py-1 bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium text-xs rounded transition-colors"
              >
                Select All ({candidateExams.length})
              </button>

              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2.5 py-1 text-zinc-500 hover:text-zinc-800 text-xs transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Candidate Exams List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-800">
                Pick Assessment Exams to Include in this Sheet:
              </label>
              {candidateExams.length === 0 && (
                <span className="text-xs text-rose-500">
                  No exams found for this program. Schedule exams first!
                </span>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-zinc-200 rounded-xl p-2 bg-zinc-50">
              {candidateExams.map((e) => {
                const isSelected = selectedExamIds.includes(e.id);
                const maxMarks = e.subjects?.reduce((sum: number, s: any) => sum + s.totalMax, 0) || 100;
                const formattedDate = new Date(e.examDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={e.id}
                    onClick={() => toggleExam(e.id)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                      isSelected
                        ? "bg-white border-indigo-300 ring-1 ring-indigo-200 shadow-2xs"
                        : "bg-white/60 border-zinc-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <button type="button" className="text-zinc-500">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>
                      <div>
                        <span className="font-semibold text-zinc-900 block">
                          {e.title}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {e.lectureLabel ? `${e.lectureLabel} · ` : ""}
                          {formattedDate} · {e.kind.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-zinc-800 tabular-nums">
                        {maxMarks} marks
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedExamIds.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Compiling...
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5" />
                  Save Compiled Marksheet ({selectedExamIds.length} Exams)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
