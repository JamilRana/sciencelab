"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Plus, Loader2, Layers, CheckSquare, Square } from "lucide-react";
import { createSpecialExamAction, batchCreateLectureExamsAction } from "@/app/actions/special-exams";
import { useRouter } from "next/navigation";

interface CreateSpecialExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  programs: any[];
}

export function CreateSpecialExamModal({
  isOpen,
  onClose,
  programs,
}: CreateSpecialExamModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "batch_lectures">("single");
  const [selectedProgramId, setSelectedProgramId] = useState<number>(
    programs[0]?.id || 0
  );
  const [batchId, setBatchId] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<
    "CLASS_TEST" | "PRE_MODEL" | "MODEL_TEST" | "BOARD_EXAM"
  >("MODEL_TEST");
  const [lectureNo, setLectureNo] = useState<string>("");
  const [lectureLabel, setLectureLabel] = useState<string>("");
  const [examDate, setExamDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Subject configuration state: { [programSubjectId]: { selected: boolean, isCompulsory: boolean, totalMax: number } }
  const [subjectConfigs, setSubjectConfigs] = useState<
    Record<number, { selected: boolean; isCompulsory: boolean; totalMax: number; cqMax: number; mcqMax: number; practicalMax: number }>
  >({});

  // Batch lecture creator state
  const [batchSubjectId, setBatchSubjectId] = useState<number>(0);
  const [lectureStart, setLectureStart] = useState<number>(1);
  const [lectureEnd, setLectureEnd] = useState<number>(10);
  const [lecturePrefix, setLecturePrefix] = useState<string>("L");
  const [batchMaxMark, setBatchMaxMark] = useState<number>(20);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentProgram = programs.find((p) => p.id === Number(selectedProgramId));

  // Initialize subject configurations whenever program changes
  useEffect(() => {
    if (currentProgram?.subjects) {
      const initial: Record<number, any> = {};
      currentProgram.subjects.forEach((subj: any) => {
        initial[subj.id] = {
          selected: true,
          // Creator default: non-optional subjects are compulsory; 4th subjects default to optional
          isCompulsory: !subj.isOptional,
          totalMax: subj.fullMarks || 100,
          cqMax: subj.cqMax || 0,
          mcqMax: subj.mcqMax || 0,
          practicalMax: subj.practicalMax || 0,
        };
      });
      setSubjectConfigs(initial);
      if (currentProgram.subjects.length > 0 && !batchSubjectId) {
        setBatchSubjectId(currentProgram.subjects[0].id);
      }
    }
  }, [currentProgram, batchSubjectId]);

  if (!isOpen) return null;

  const toggleSubjectSelected = (id: number) => {
    setSubjectConfigs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        selected: !prev[id]?.selected,
      },
    }));
  };

  const toggleSubjectCompulsory = (id: number) => {
    setSubjectConfigs((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        isCompulsory: !prev[id]?.isCompulsory,
      },
    }));
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedProgramId) {
      setError("Please provide an exam title and select a program");
      return;
    }

    const selectedSubjs = Object.entries(subjectConfigs)
      .filter(([_, config]) => config.selected)
      .map(([idStr, config]) => ({
        programSubjectId: Number(idStr),
        isCompulsory: config.isCompulsory,
        totalMax: config.totalMax,
        cqMax: config.cqMax,
        mcqMax: config.mcqMax,
        practicalMax: config.practicalMax,
      }));

    if (selectedSubjs.length === 0) {
      setError("Please select at least one subject for the exam");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await createSpecialExamAction({
      programId: Number(selectedProgramId),
      batchId: batchId === "all" ? undefined : Number(batchId),
      title: title.trim(),
      kind,
      lectureNo: lectureNo ? parseInt(lectureNo) : undefined,
      lectureLabel: lectureLabel.trim() || (lectureNo ? `L-${lectureNo}` : undefined),
      examDate: new Date(examDate),
      subjects: selectedSubjs,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "Failed to schedule exam");
      return;
    }

    router.refresh();
    onClose();
  };

  const handleBatchLecturesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramId || !batchSubjectId) {
      setError("Please select a program and subject");
      return;
    }

    if (lectureStart > lectureEnd) {
      setError("Start lecture number must be less than or equal to end lecture number");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const res = await batchCreateLectureExamsAction({
      programId: Number(selectedProgramId),
      batchId: batchId === "all" ? undefined : Number(batchId),
      programSubjectId: Number(batchSubjectId),
      lectureStart: Number(lectureStart),
      lectureEnd: Number(lectureEnd),
      prefix: lecturePrefix.trim() || "L",
      defaultMaxMark: Number(batchMaxMark),
      startDate: new Date(examDate),
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "Failed to batch create lecture exams");
      return;
    }

    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                {mode === "single" ? "Schedule Special Assessment" : "Batch Create Lecture Series"}
              </h2>
              <p className="text-xs text-zinc-500">
                {mode === "single"
                  ? "Define exam type and compulsory vs optional subjects"
                  : "Quickly generate multiple sequential lecture short tests"}
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

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-50 px-5 pt-2">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              mode === "single"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Single Exam / Model Test
          </button>
          <button
            type="button"
            onClick={() => setMode("batch_lectures")}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors inline-flex items-center gap-1.5 ${
              mode === "batch_lectures"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Batch Create Lectures (L1–L10)
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* SINGLE EXAM MODE */}
        {mode === "single" ? (
          <form onSubmit={handleSingleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Academic Program <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => {
                    setSelectedProgramId(Number(e.target.value));
                    setBatchId("all");
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
                  Target Batch Scope
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="all">All Batches (Boys & Girls Combined)</option>
                  {currentProgram?.batches?.map((b: any) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (Code {b.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Exam Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Model Test 01 - Full Syllabus"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Exam Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Assessment Type
                </label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                >
                  <option value="MODEL_TEST">Model Test (Board Graded)</option>
                  <option value="PRE_MODEL">Pre-Model Test (Marks Only)</option>
                  <option value="CLASS_TEST">Class Assessment (Marks Only)</option>
                  <option value="BOARD_EXAM">Board Final Simulation</option>
                </select>
              </div>

              {kind === "CLASS_TEST" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Lecture Number
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5"
                      value={lectureNo}
                      onChange={(e) => {
                        setLectureNo(e.target.value);
                        if (!lectureLabel && e.target.value) {
                          setLectureLabel(`L-${e.target.value}`);
                        }
                      }}
                      className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Lecture Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. L-05"
                      value={lectureLabel}
                      onChange={(e) => setLectureLabel(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* SUBJECTS BREAKDOWN & COMPULSORY TOGGLES */}
            {currentProgram && (
              <div className="pt-2 border-t border-zinc-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-xs font-semibold text-zinc-900 block">
                      Define Exam Subjects & Compulsory Status
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Creator defined: Toggle checkbox to mark as Compulsory or Optional (4th subject)
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {Object.values(subjectConfigs).filter((s) => s.selected).length} Selected
                  </span>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-1.5 bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                  {currentProgram.subjects?.map((s: any) => {
                    const config = subjectConfigs[s.id] || {
                      selected: true,
                      isCompulsory: !s.isOptional,
                      totalMax: s.fullMarks || 100,
                    };

                    return (
                      <div
                        key={s.id}
                        className={`flex items-center justify-between text-xs p-2 rounded-lg border transition-colors ${
                          config.selected
                            ? "bg-white border-zinc-200 shadow-2xs"
                            : "bg-zinc-100/70 border-zinc-200/50 opacity-60"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSubjectSelected(s.id)}
                            className="text-zinc-600 hover:text-indigo-600"
                          >
                            {config.selected ? (
                              <CheckSquare className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-400" />
                            )}
                          </button>
                          <div>
                            <span className="font-semibold text-zinc-900">
                              {s.name}
                            </span>
                            {s.code && (
                              <span className="text-[10px] text-zinc-400 ml-1 font-mono">
                                ({s.code})
                              </span>
                            )}
                          </div>
                        </div>

                        {config.selected && (
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-zinc-500 tabular-nums">
                              Max: {config.totalMax}
                            </span>

                            {/* Compulsory Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => toggleSubjectCompulsory(s.id)}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                                config.isCompulsory
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                              }`}
                              title="Click to toggle Compulsory vs Optional status"
                            >
                              {config.isCompulsory ? "Compulsory" : "Optional (4th)"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Schedule Exam
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* BATCH CREATE LECTURES MODE */
          <form onSubmit={handleBatchLecturesSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Academic Program <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedProgramId}
                  onChange={(e) => {
                    setSelectedProgramId(Number(e.target.value));
                    setBatchId("all");
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
                  Target Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  value={batchSubjectId}
                  onChange={(e) => setBatchSubjectId(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  required
                >
                  {currentProgram?.subjects?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.code && `(${s.code})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  From Lecture #
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={lectureStart}
                  onChange={(e) => setLectureStart(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  To Lecture #
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={lectureEnd}
                  onChange={(e) => setLectureEnd(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Prefix
                </label>
                <input
                  type="text"
                  placeholder="e.g. L"
                  value={lecturePrefix}
                  onChange={(e) => setLecturePrefix(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Default Max Marks Per Lecture Test
                </label>
                <input
                  type="number"
                  min="1"
                  value={batchMaxMark}
                  onChange={(e) => setBatchMaxMark(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-lg text-xs text-indigo-900">
              <span className="font-bold">Preview: </span>
              Will create{" "}
              <strong>
                {Math.max(0, lectureEnd - lectureStart + 1)} sequential Class Tests
              </strong>{" "}
              (e.g.{" "}
              <span className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                {currentProgram?.subjects?.find((s: any) => s.id === batchSubjectId)?.name || "Subject"} [{lecturePrefix}-01]
              </span>{" "}
              to{" "}
              <span className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                {currentProgram?.subjects?.find((s: any) => s.id === batchSubjectId)?.name || "Subject"} [{lecturePrefix}-{String(lectureEnd).padStart(2, "0")}]
              </span>
              ) with {batchMaxMark} marks each.
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
                disabled={isSubmitting || lectureStart > lectureEnd}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Creating Series...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Create {Math.max(0, lectureEnd - lectureStart + 1)} Lecture Tests
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
