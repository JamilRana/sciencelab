"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  GraduationCap,
  Calendar,
  Search,
  Filter,
  CheckSquare,
  Square,
  Loader2,
  ShieldAlert,
  ArrowUpRight,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import {
  BatchMapping,
  StudentPromotionDecision,
  executePromotionWizardAction,
} from "@/app/actions/promotion";

interface StudentItem {
  id: number;
  name: string;
  roll: number;
  displayRoll: number;
  class: string;
  nextClass: string;
  batchId: number;
  batchName: string;
  gender: string;
  mobile: string;
  schoolName: string;
}

interface AnnualPromotionWizardProps {
  initialData: {
    sourceYear: number;
    targetYear: number;
    eligibleStudentsCount: number;
    classTenCount: number;
    batchesByClass: Record<string, any[]>;
    defaultMappings: BatchMapping[];
    students: StudentItem[];
  };
}

export function AnnualPromotionWizard({ initialData }: AnnualPromotionWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [sourceYear, setSourceYear] = useState(initialData.sourceYear);
  const [targetYear, setTargetYear] = useState(initialData.targetYear);

  // Step 2: Batch Mappings
  const [mappings, setMappings] = useState<BatchMapping[]>(initialData.defaultMappings);

  // Step 3: Decisions & Filters
  const [decisions, setDecisions] = useState<Record<number, StudentPromotionDecision>>({});
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState<"ALL" | "PROMOTE" | "HOLD_BACK" | "EXCLUDE">("ALL");

  // Step 4: Execution
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Helper for batch mapping selection
  const handleUpdateMapping = (sourceBatchId: number, targetBatchId: number) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.sourceBatchId === sourceBatchId) {
          const targetBatchList = initialData.batchesByClass[m.targetClass] || [];
          const found = targetBatchList.find((tb) => tb.id === targetBatchId);
          return {
            ...m,
            targetBatchId,
            targetBatchName: found ? found.name : m.targetBatchName,
          };
        }
        return m;
      })
    );
  };

  // Helper for individual student decision
  const setStudentDecision = (
    studentId: number,
    decision: "PROMOTE" | "HOLD_BACK" | "EXCLUDE",
    note?: string
  ) => {
    setDecisions((prev) => ({
      ...prev,
      [studentId]: {
        studentId,
        decision,
        note: note || prev[studentId]?.note,
      },
    }));
  };

  // Batch-level quick actions
  const setAllInBatch = (
    batchId: number,
    decision: "PROMOTE" | "HOLD_BACK" | "EXCLUDE"
  ) => {
    const batchStudents = initialData.students.filter((s) => s.batchId === batchId);
    setDecisions((prev) => {
      const next = { ...prev };
      for (const st of batchStudents) {
        next[st.id] = { studentId: st.id, decision };
      }
      return next;
    });
    toast.success(`Set ${batchStudents.length} students in batch to ${decision}`);
  };

  // Filtered student list for Step 3
  const filteredStudents = initialData.students.filter((s) => {
    const matchesClass =
      selectedClassFilter === "ALL" || s.class === selectedClassFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.displayRoll.toString().includes(q) ||
      s.batchName.toLowerCase().includes(q) ||
      (s.mobile && s.mobile.includes(q));

    const decision = decisions[s.id]?.decision || "PROMOTE";
    const matchesAction = filterAction === "ALL" || decision === filterAction;

    return matchesClass && matchesSearch && matchesAction;
  });

  // Calculate decision statistics
  const totalEligible = initialData.students.length;
  let promoteCount = 0;
  let holdBackCount = 0;
  let excludeCount = 0;

  for (const st of initialData.students) {
    const d = decisions[st.id]?.decision || "PROMOTE";
    if (d === "PROMOTE") promoteCount++;
    else if (d === "HOLD_BACK") holdBackCount++;
    else if (d === "EXCLUDE") excludeCount++;
  }

  // Execute promotion
  const handleExecute = async () => {
    if (!confirm(`Are you sure you want to execute Annual Promotion from Session ${sourceYear} to ${targetYear}? This will advance ${promoteCount} students, hold back ${holdBackCount}, and archive/exclude ${excludeCount}.`)) {
      return;
    }

    setIsExecuting(true);
    try {
      const payloadDecisions: StudentPromotionDecision[] = Object.values(decisions);

      const res = await executePromotionWizardAction({
        sourceYear,
        targetYear,
        batchMappings: mappings.map((m) => ({
          sourceBatchId: m.sourceBatchId,
          targetBatchId: m.targetBatchId,
          targetClass: m.targetClass,
        })),
        studentDecisions: payloadDecisions,
      });

      if (res.success) {
        setExecutionResult(res);
        toast.success(res.message || "Annual Promotion completed successfully!");
      } else {
        toast.error(res.error || "Failed to execute promotion");
      }
    } catch (err: any) {
      toast.error(err?.message || "An unexpected error occurred");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Annual Student Promotion Wizard
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              Session Transition
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Advance Classes Six to Nine into prepared batches for the upcoming academic session.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin-route/class-ten-lifecycle"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors shadow-2xs"
          >
            <Archive className="w-3.5 h-3.5" />
            Class 10 & SSC Transition
          </Link>
          <Link
            href="/admin-route/students"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors shadow-2xs"
          >
            Exit Wizard
          </Link>
        </div>
      </div>

      {/* Wizard Steps Stepper */}
      <div className="grid grid-cols-4 gap-2 bg-white p-3 rounded-2xl border border-zinc-200 shadow-2xs">
        {[
          { num: 1, title: "1. Overview & Setup", desc: "Sessions & Scope" },
          { num: 2, title: "2. Batch Mapping", desc: "Link Source & Target" },
          { num: 3, title: "3. Student Review", desc: "Hold Backs & Exclusions" },
          { num: 4, title: "4. Execution", desc: "Confirm & Advance" },
        ].map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => !executionResult && setStep(s.num as any)}
            className={`text-left p-3 rounded-xl transition flex flex-col justify-between ${
              step === s.num
                ? "bg-indigo-50 border border-indigo-200 text-indigo-900"
                : step > s.num
                ? "bg-zinc-50 border border-zinc-100 text-zinc-700"
                : "text-zinc-400 border border-transparent opacity-60"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold">{s.title}</span>
              {step > s.num && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            </div>
            <span className="text-[10px] mt-1 text-zinc-500">{s.desc}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: Overview & Setup */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-2">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Academic Sessions
              </span>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-center">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Current Session</span>
                  <p className="text-xl font-bold text-zinc-900 mt-0.5">{sourceYear}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-500" />
                <div className="flex-1 p-3 bg-indigo-50 rounded-xl border border-indigo-200 text-center">
                  <span className="text-[10px] text-indigo-600 uppercase font-semibold">Target Session</span>
                  <p className="text-xl font-bold text-indigo-900 mt-0.5">{targetYear}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Promotion Candidates
                </span>
                <Users className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-3xl font-extrabold text-zinc-900">{totalEligible}</p>
              <p className="text-xs text-zinc-500">
                Active regular students in Classes Six, Seven, Eight & Nine
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                  Class Ten Policy
                </span>
                <ShieldAlert className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-zinc-900">
                {initialData.classTenCount} Students
              </p>
              <p className="text-xs text-zinc-500">
                Class 10 students are <strong>never promoted</strong> to 11. They transition to SSC special batch or are archived at year end.
              </p>
            </div>
          </div>

          {/* Promotion Rules Banner */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">How Annual Student Promotion Works:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-amber-800">
                <li>Students in Class Six move to Seven; Seven to Eight; Eight to Nine; Nine to Ten.</li>
                <li>Before moving, a historical snapshot is recorded in each student&apos;s academic history for Session {sourceYear}, preserving past rolls, marks, and receipts.</li>
                <li>Individual students can be held back (repeat the same class) or excluded (marked left / archived).</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
            >
              <span>Continue to Batch Mapping</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Batch Mappings Configuration */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Configure Batch Destination Mappings</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Select which destination batch each existing class batch should promote into.
              </p>
            </div>

            <div className="overflow-x-auto border border-zinc-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Current Batch ({sourceYear})</th>
                    <th className="py-3 px-4">Current Class</th>
                    <th className="py-3 px-4 text-center">Direction</th>
                    <th className="py-3 px-4">Promoted Class</th>
                    <th className="py-3 px-4">Target Batch ({targetYear})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {mappings.map((m) => {
                    const targetBatchesForClass =
                      initialData.batchesByClass[m.targetClass] || [];

                    return (
                      <tr key={m.sourceBatchId} className="hover:bg-zinc-50/60">
                        <td className="py-3 px-4 font-bold text-zinc-900">
                          {m.sourceBatchName}
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-600">
                          Class {m.sourceClass}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <ArrowRight className="w-4 h-4 text-indigo-500 inline" />
                        </td>
                        <td className="py-3 px-4 font-semibold text-indigo-700">
                          Class {m.targetClass}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={m.targetBatchId}
                            onChange={(e) =>
                              handleUpdateMapping(
                                m.sourceBatchId,
                                parseInt(e.target.value)
                              )
                            }
                            className="px-3 py-1.5 text-xs font-semibold bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                          >
                            {targetBatchesForClass.map((tb) => (
                              <option key={tb.id} value={tb.id}>
                                {tb.name} (Code: {tb.code})
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
            >
              <span>Review Students & Hold Backs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Student Review & Individual Overrides */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Decision Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-zinc-400">Total Reviewed</span>
              <p className="text-xl font-bold text-zinc-900 mt-0.5">{totalEligible}</p>
            </div>
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/70 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-emerald-700">To Promote</span>
              <p className="text-xl font-bold text-emerald-800 mt-0.5">{promoteCount}</p>
            </div>
            <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/70 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-amber-700">Held Back (Repeat)</span>
              <p className="text-xl font-bold text-amber-800 mt-0.5">{holdBackCount}</p>
            </div>
            <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200/70 shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-rose-700">Exclude / Left</span>
              <p className="text-xl font-bold text-rose-800 mt-0.5">{excludeCount}</p>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 outline-none font-medium"
              >
                <option value="ALL">All Classes (6-9)</option>
                <option value="Six">Class Six Only</option>
                <option value="Seven">Class Seven Only</option>
                <option value="Eight">Class Eight Only</option>
                <option value="Nine">Class Nine Only</option>
              </select>

              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-800 outline-none font-medium"
              >
                <option value="ALL">All Decisions</option>
                <option value="PROMOTE">Promoted Only</option>
                <option value="HOLD_BACK">Held Back Only</option>
                <option value="EXCLUDE">Excluded Only</option>
              </select>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search student, roll, or batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Student Review Table */}
          <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-4 w-28">Current Roll</th>
                    <th className="py-2.5 px-4">Student</th>
                    <th className="py-2.5 px-4">Current Batch</th>
                    <th className="py-2.5 px-4">Target Batch</th>
                    <th className="py-2.5 px-4 text-center">Decision</th>
                    <th className="py-2.5 px-4">Note / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        No students matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((st) => {
                      const decision = decisions[st.id]?.decision || "PROMOTE";
                      const mapping = mappings.find(
                        (m) => m.sourceBatchId === st.batchId
                      );

                      return (
                        <tr
                          key={st.id}
                          className={`hover:bg-zinc-50/70 transition ${
                            decision === "HOLD_BACK"
                              ? "bg-amber-50/30"
                              : decision === "EXCLUDE"
                              ? "bg-rose-50/30"
                              : ""
                          }`}
                        >
                          <td className="py-2.5 px-4 font-mono font-bold text-zinc-900">
                            {st.displayRoll}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-semibold text-zinc-900">{st.name}</span>
                            <span className="block text-[10px] text-zinc-400">
                              {st.gender} · {st.schoolName}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-zinc-600">
                            Class {st.class} ({st.batchName})
                          </td>
                          <td className="py-2.5 px-4 font-semibold">
                            {decision === "PROMOTE" ? (
                              <span className="text-indigo-700">
                                Class {mapping?.targetClass || st.nextClass} ({mapping?.targetBatchName || "N/A"})
                              </span>
                            ) : decision === "HOLD_BACK" ? (
                              <span className="text-amber-700">
                                Class {st.class} (Repeats {st.batchName})
                              </span>
                            ) : (
                              <span className="text-rose-600 line-through">
                                Not promoted
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 bg-zinc-50 gap-0.5">
                              <button
                                type="button"
                                onClick={() => setStudentDecision(st.id, "PROMOTE")}
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                                  decision === "PROMOTE"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "text-zinc-600 hover:text-zinc-900"
                                }`}
                                title="Promote to next class"
                              >
                                Promote
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setStudentDecision(st.id, "HOLD_BACK", "Held back")
                                }
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                                  decision === "HOLD_BACK"
                                    ? "bg-amber-500 text-white shadow-xs"
                                    : "text-zinc-600 hover:text-zinc-900"
                                }`}
                                title="Hold back in same class"
                              >
                                Hold Back
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setStudentDecision(st.id, "EXCLUDE", "Excluded / Left")
                                }
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                                  decision === "EXCLUDE"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "text-zinc-600 hover:text-zinc-900"
                                }`}
                                title="Exclude / Archive student"
                              >
                                Exclude
                              </button>
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            {decision !== "PROMOTE" && (
                              <input
                                type="text"
                                placeholder="Reason/Note..."
                                value={decisions[st.id]?.note || ""}
                                onChange={(e) =>
                                  setStudentDecision(st.id, decision, e.target.value)
                                }
                                className="px-2 py-1 text-xs border border-zinc-200 rounded bg-white w-full max-w-[150px]"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
            >
              <span>Proceed to Final Execution</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: Review & Final Execution */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="space-y-6">
          {executionResult ? (
            /* Execution Success Card */
            <div className="bg-white p-8 rounded-2xl border border-emerald-200 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  Annual Promotion Successfully Completed!
                </h2>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                  {executionResult.message}
                </p>
              </div>

              <div className="grid grid-cols-3 max-w-md mx-auto gap-3 py-2">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Promoted</span>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">
                    {executionResult.data?.promotedCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Held Back</span>
                  <p className="text-lg font-bold text-amber-700 mt-0.5">
                    {executionResult.data?.heldBackCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Excluded</span>
                  <p className="text-lg font-bold text-rose-700 mt-0.5">
                    {executionResult.data?.excludedCount || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3">
                <Link
                  href="/admin-route/students"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
                >
                  View Updated Student Directory
                </Link>
                <Link
                  href="/admin-route/fees"
                  className="px-5 py-2.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition"
                >
                  Go to Fee Collection
                </Link>
              </div>
            </div>
          ) : (
            /* Pre-Execution Confirmation */
            <div className="bg-white p-6 rounded-2xl border border-zinc-200 space-y-6 shadow-2xs">
              <div>
                <h2 className="text-base font-bold text-zinc-900">
                  Confirm Annual Student Promotion (Session {sourceYear} &rarr; {targetYear})
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Review the final promotion breakdown below before applying updates to the live database.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    Students to Promote
                  </span>
                  <p className="text-3xl font-extrabold">{promoteCount}</p>
                  <p className="text-[11px] text-emerald-700">
                    Will advance to new class, assigned batch, and newly calculated sequential rolls.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    Students Held Back
                  </span>
                  <p className="text-3xl font-extrabold">{holdBackCount}</p>
                  <p className="text-[11px] text-amber-700">
                    Will repeat their current grade level; history snapshot saved.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                    Excluded / Left
                  </span>
                  <p className="text-3xl font-extrabold">{excludeCount}</p>
                  <p className="text-[11px] text-rose-700">
                    Will be moved to Archived Students with reason recorded.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-2">
                <p className="font-semibold text-zinc-800">
                  Data Safety & Historical Integrity Guarantee:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-zinc-500">
                  <li>
                    Every student will have an immutable academic record for Session {sourceYear} in <code className="text-zinc-700 font-semibold">student_academic_histories</code>.
                  </li>
                  <li>
                    All past exams, marks, receipts, and merit positions from Session {sourceYear} remain completely intact and tied to their historical year.
                  </li>
                  <li>
                    January fee collection for Session {targetYear} will open cleanly without interference from past payments.
                  </li>
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Review
                </button>
                <button
                  type="button"
                  disabled={isExecuting}
                  onClick={handleExecute}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition shadow-xs"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Promoting Students...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Execute Annual Promotion Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
