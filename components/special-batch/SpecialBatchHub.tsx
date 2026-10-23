"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles,
  Layers,
  GraduationCap,
  Calendar,
  CreditCard,
  Plus,
  Printer,
  ExternalLink,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  FileCheck2,
  BookOpen,
  ArrowRight,
  Database,
  Loader2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { SpecialCourseFeesTable } from "@/components/accounts/SpecialCourseFeesTable";
import { CreateProgramModal } from "@/components/special-batch/CreateProgramModal";
import { CreateSpecialExamModal } from "@/components/special-batch/CreateSpecialExamModal";
import { CompiledMarksheetsTable } from "@/components/special-batch/CompiledMarksheetsTable";
import { CompileMarksheetModal } from "@/components/special-batch/CompileMarksheetModal";
import { AssignOptionalSubjectsModal } from "@/components/special-batch/AssignOptionalSubjectsModal";
import { ManageCurriculumModal } from "@/components/special-batch/ManageCurriculumModal";
import { EnrollSpecialBatchStudentModal } from "@/components/special-batch/EnrollSpecialBatchStudentModal";
import { seedStandardProgramsAction } from "@/app/actions/course-fees";

interface SpecialBatchHubProps {
  userRole?: string;
  programs: any[];
  specialExams: any[];
  courseFees: any[];
  compiledMarksheets?: any[];
}

export function SpecialBatchHub({
  userRole,
  programs,
  specialExams,
  courseFees,
  compiledMarksheets = [],
}: SpecialBatchHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdmin = userRole === "ADMIN";
  const initialTab = searchParams.get("tab") as
    | "programs"
    | "exams"
    | "fees"
    | "compilations"
    | null;

  const [activeTab, setActiveTab] = useState<"programs" | "exams" | "fees" | "compilations">(
    initialTab === "fees" && !isAdmin ? "programs" : (initialTab || "programs")
  );
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<
    "all" | number
  >("all");
  const [isCreateProgramOpen, setIsCreateProgramOpen] = useState(false);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);
  const [isAssignSubjectsOpen, setIsAssignSubjectsOpen] = useState(false);
  const [selectedProgramForSubjects, setSelectedProgramForSubjects] = useState<any>(null);
  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [selectedProgramForCurriculum, setSelectedProgramForCurriculum] = useState<any>(null);
  const [enrollBatch, setEnrollBatch] = useState<{ id: number; name: string } | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const handleTabChange = (tab: "programs" | "exams" | "fees" | "compilations") => {
    if (tab === "fees" && !isAdmin) return;
    setActiveTab(tab);
    window.history.replaceState(null, "", `/admin-route/special-batch?tab=${tab}`);
  };

  const handleSeedStandardPrograms = async () => {
    if (
      !confirm(
        "Initialize SSC-2026 and Junior School-2026 standard programs with standard 9-subject and 5-subject board curriculums, sections, and batch codes?"
      )
    ) {
      return;
    }

    setIsSeeding(true);
    setSeedMessage(null);

    const res = await seedStandardProgramsAction();
    setIsSeeding(false);

    if (res.success) {
      setSeedMessage({
        text: "Standard SSC-2026 & JSC-2026 programs initialized successfully!",
        type: "success",
      });
      router.refresh();
    } else {
      setSeedMessage({
        text: res.error || "Failed to initialize programs",
        type: "error",
      });
    }
  };

  // Institute-level aggregates
  const totalPrograms = programs.length;
  const allBatches = programs.flatMap((p) => p.batches || []);
  const totalSpecialBatches = allBatches.length;
  const totalEnrolledStudents = allBatches.reduce(
    (acc, b) => acc + (b._count?.students || 0),
    0
  );

  const totalCourseFeeAgreed = courseFees.reduce(
    (acc, cf) => acc + (cf.agreedFee || 0),
    0
  );
  const totalCourseFeePaid = courseFees.reduce(
    (acc, cf) => acc + (cf.totalPaid || 0),
    0
  );
  const totalCourseFeeDue = totalCourseFeeAgreed - totalCourseFeePaid;

  // Filtered views
  const filteredPrograms =
    selectedProgramFilter === "all"
      ? programs
      : programs.filter((p) => p.id === selectedProgramFilter);

  const filteredExams =
    selectedProgramFilter === "all"
      ? specialExams
      : specialExams.filter((e) => e.programId === selectedProgramFilter);

  const filteredCourseFees =
    selectedProgramFilter === "all"
      ? courseFees
      : courseFees.filter((cf) => cf.programId === selectedProgramFilter);

  // Current program metrics if a single program is selected
  const currentProgram =
    selectedProgramFilter !== "all"
      ? programs.find((p) => p.id === selectedProgramFilter)
      : null;

  const currentProgramBatches = currentProgram?.batches || [];
  const currentProgramStudents = currentProgramBatches.reduce(
    (acc: number, b: any) => acc + (b._count?.students || 0),
    0
  );
  const currentProgramSubjects = currentProgram?.subjects || [];
  const currentProgramExams = currentProgram
    ? specialExams.filter((e) => e.programId === currentProgram.id)
    : [];
  const currentProgramModelTests = currentProgramExams.filter((e) => e.kind === "MODEL_TEST").length;
  const currentProgramClassTests = currentProgramExams.filter((e) => e.kind !== "MODEL_TEST").length;
  const currentProgramCompilations = currentProgram
    ? compiledMarksheets.filter((cm) => cm.programId === currentProgram.id)
    : [];
  const currentProgramFees = currentProgram
    ? courseFees.filter((cf) => cf.programId === currentProgram.id)
    : [];
  const currentProgramFeePaid = currentProgramFees.reduce(
    (acc, cf) => acc + (cf.totalPaid || 0),
    0
  );
  const currentProgramFeeAgreed = currentProgramFees.reduce(
    (acc, cf) => acc + (cf.agreedFee || 0),
    0
  );
  const currentProgramFeeDue = Math.max(0, currentProgramFeeAgreed - currentProgramFeePaid);

  // Special batch-wise KPI summaries for each section batch
  const specialBatchKpis = programs.flatMap((p) => {
    return (p.batches || []).map((batch: any) => {
      const studentCount = batch._count?.students || 0;
      const batchExams = specialExams.filter(
        (e) => e.programId === p.id && (!e.batchId || e.batchId === batch.id)
      );
      const modelTestsCount = batchExams.filter((e) => e.kind === "MODEL_TEST").length;
      const classTestsCount = batchExams.filter((e) => e.kind !== "MODEL_TEST").length;
      const batchCompilations = compiledMarksheets.filter((cm) => cm.programId === p.id);

      const batchFees = courseFees.filter(
        (cf) => cf.student?.batch?.id === batch.id
      );
      const feeAgreed = batchFees.reduce((sum, cf) => sum + (cf.agreedFee || 0), 0);
      const feePaid = batchFees.reduce((sum, cf) => sum + (cf.totalPaid || 0), 0);
      const feeDue = Math.max(0, feeAgreed - feePaid);

      return {
        batchId: batch.id,
        batchName: batch.name,
        batchCode: batch.code,
        classId: batch.classId,
        programId: p.id,
        programName: p.name,
        programCode: p.code,
        programCategory: p.category,
        subjectsCount: p.subjects?.length || 0,
        studentCount,
        modelTestsCount,
        classTestsCount,
        totalExamsCount: batchExams.length,
        compilationsCount: batchCompilations.length,
        feeAgreed,
        feePaid,
        feeDue,
      };
    });
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Special Batches & Programs
            </h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Board Standard
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            SSC & Junior School special model tests, installment course fees, and board-standard merit rankings.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {programs.length === 0 && (
            <button
              onClick={handleSeedStandardPrograms}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSeeding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              Initialize Standard Programs (SSC & JSC 2026)
            </button>
          )}

          <button
            onClick={() => setIsCreateProgramOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Program
          </button>

          <button
            onClick={() => {
              const prog =
                (selectedProgramFilter !== "all"
                  ? programs.find((p) => p.id === selectedProgramFilter)
                  : programs[0]) || null;
              setSelectedProgramForCurriculum(prog);
              setIsCurriculumModalOpen(true);
            }}
            disabled={programs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Curriculum
          </button>

          <button
            onClick={() => {
              const prog =
                (selectedProgramFilter !== "all"
                  ? programs.find((p) => p.id === selectedProgramFilter)
                  : programs[0]) || null;
              setSelectedProgramForSubjects(prog);
              setIsAssignSubjectsOpen(true);
            }}
            disabled={programs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <Users className="w-3.5 h-3.5" />
            Assign 4th Subjects
          </button>

          <button
            onClick={() => setIsCompileModalOpen(true)}
            disabled={specialExams.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <Layers className="w-3.5 h-3.5" />
            Compile Marksheet
          </button>

          <button
            onClick={() => setIsCreateExamOpen(true)}
            disabled={programs.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <Calendar className="w-3.5 h-3.5" />
            Schedule Special Exam
          </button>
        </div>
      </div>

      {/* Banner notification if seed was triggered */}
      {seedMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            seedMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{seedMessage.text}</span>
          <button
            onClick={() => setSeedMessage(null)}
            className="text-xs font-medium underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Adaptive KPI Cards (Program Specific or All Programs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {currentProgram ? (
          <>
            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  {currentProgram.code} Students
                </span>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-zinc-900 mt-2">
                {currentProgramStudents}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1 truncate">
                {currentProgramBatches.map((b: any) => `${b.name}: ${b._count?.students || 0}`).join(" · ")}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Dynamic Curriculum
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedProgramForCurriculum(currentProgram);
                    setIsCurriculumModalOpen(true);
                  }}
                  className="p-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
                  title="Configure Curriculum"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              </div>
              <div className="text-2xl font-bold text-zinc-900 mt-2">
                {currentProgramSubjects.length} <span className="text-xs font-medium text-zinc-500">Subjects</span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {currentProgramSubjects.filter((s: any) => !s.isOptional).length} Compulsory · {currentProgramSubjects.filter((s: any) => s.isOptional).length} 4th/Optional
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Program Assessments
                </span>
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-zinc-900 mt-2">
                {currentProgramExams.length}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {currentProgramModelTests} Model Tests · {currentProgramClassTests} Class Tests
              </p>
            </div>

            {isAdmin ? (
              <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Course Fees Collection
                  </span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-2">
                  ৳{currentProgramFeePaid.toLocaleString()}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Due: ৳{currentProgramFeeDue.toLocaleString()} (Total ৳{currentProgramFeeAgreed.toLocaleString()})
                </p>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Compiled Marksheets
                  </span>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-900 mt-2">
                  {currentProgramCompilations.length}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Compilations for {currentProgram.code}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Active Programs
                </span>
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-zinc-900 mt-2">
                {totalPrograms}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                {totalSpecialBatches} Section Batches registered
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Enrolled Students
                </span>
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-zinc-900 mt-2">
                {totalEnrolledStudents}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Across Special Batches
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500">
                  Special Model Tests
                </span>
                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-zinc-900 mt-2">
                {specialExams.length}
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">
                Board-standard assessments
              </p>
            </div>

            {isAdmin ? (
              <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Course Fees Collection
                  </span>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-emerald-600 mt-2">
                  ৳{totalCourseFeePaid.toLocaleString()}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Due: ৳{totalCourseFeeDue.toLocaleString()} (Total ৳{totalCourseFeeAgreed.toLocaleString()})
                </p>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">
                    Compiled Marksheets
                  </span>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-zinc-900 mt-2">
                  {compiledMarksheets.length}
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Multi-exam compilations
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Special Batch Wise Summary Cards */}
      {specialBatchKpis.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Special Batch Wise Summaries ({specialBatchKpis.length})
              </h3>
              <span className="text-[11px] text-zinc-400 hidden sm:inline">
                Individual section enrollment, model tests, and fee collection
              </span>
            </div>
            {selectedProgramFilter !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedProgramFilter("all")}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
              >
                View all special batches
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {specialBatchKpis
              .filter(
                (bk) =>
                  selectedProgramFilter === "all" || bk.programId === selectedProgramFilter
              )
              .map((bk) => (
                <div
                  key={bk.batchId}
                  className={`p-3.5 rounded-xl border bg-white transition-all shadow-2xs hover:shadow-sm ${
                    selectedProgramFilter === bk.programId
                      ? "border-indigo-400 ring-2 ring-indigo-500/10"
                      : "border-zinc-200/80 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin-route/special-batch/batches/${bk.batchId}`}
                          className="font-bold text-xs text-zinc-900 hover:text-indigo-600 transition-colors"
                        >
                          {bk.batchName}
                        </Link>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 bg-zinc-100 text-zinc-700 font-semibold rounded">
                          #{bk.batchCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Class {bk.classId} · {bk.programCode}
                      </p>
                    </div>
                    <Link
                      href={`/admin-route/special-batch/batches/${bk.batchId}`}
                      className="p-1 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title="Open dedicated batch workspace"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-zinc-100 text-center">
                    <div>
                      <span className="text-[10px] text-zinc-400 font-medium">Students</span>
                      <p className="text-sm font-bold text-zinc-900 mt-0.5">{bk.studentCount}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-medium">Model Tests</span>
                      <p className="text-sm font-bold text-indigo-600 mt-0.5">{bk.modelTestsCount}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 font-medium">Compilations</span>
                      <p className="text-sm font-bold text-amber-600 mt-0.5">{bk.compilationsCount}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-500">Collected:</span>
                      <span className="font-bold text-emerald-700">
                        ৳{bk.feePaid.toLocaleString()}
                        {bk.feeDue > 0 && (
                          <span className="text-zinc-400 font-normal ml-1">
                            (Due ৳{bk.feeDue.toLocaleString()})
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="mt-2.5 pt-2 border-t border-zinc-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setEnrollBatch({ id: bk.batchId, name: bk.batchName })}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
                      title={`Enroll student in ${bk.batchName}`}
                    >
                      <UserPlus className="w-3 h-3" /> Enroll
                    </button>
                    <Link
                      href={`/admin-route/special-batch/batches/${bk.batchId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Open Module <ArrowRight className="w-3 h-3" />
                    </Link>
                    <Link
                      href={`/admin-route/students?search=${encodeURIComponent(bk.batchName)}`}
                      className="text-[10px] text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      Roster
                    </Link>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Tabs & Program Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleTabChange("programs")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "programs"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Programs & Batches
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "programs"
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {programs.length}
            </span>
          </button>

          <button
            onClick={() => handleTabChange("exams")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "exams"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Special Model Tests
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "exams"
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {specialExams.length}
            </span>
          </button>

          {isAdmin && (
            <button
              onClick={() => handleTabChange("fees")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeTab === "fees"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Course Fees & Payments
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === "fees"
                    ? "bg-indigo-500 text-white"
                    : "bg-zinc-200 text-zinc-700"
                }`}
              >
                {courseFees.length}
              </span>
            </button>
          )}

          <button
            onClick={() => handleTabChange("compilations")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === "compilations"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Compiled Marksheets
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === "compilations"
                  ? "bg-indigo-500 text-white"
                  : "bg-zinc-200 text-zinc-700"
              }`}
            >
              {compiledMarksheets.length}
            </span>
          </button>
        </div>

        {/* Program Filter Switcher */}
        {programs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Program:</span>
            <select
              value={selectedProgramFilter}
              onChange={(e) =>
                setSelectedProgramFilter(
                  e.target.value === "all" ? "all" : Number(e.target.value)
                )
              }
              className="text-xs px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} ({p.name})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: Programs & Batches */}
      {activeTab === "programs" && (
        <div className="space-y-6">
          {filteredPrograms.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-10 text-center">
              <Sparkles className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-zinc-900">
                No Special Programs Found
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                Initialize standard SSC-2026 and Junior School-2026 programs with standard board subject structures and sections, or create a custom program.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleSeedStandardPrograms}
                  disabled={isSeeding}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                >
                  <Database className="w-3.5 h-3.5" />
                  Initialize Standard Programs (SSC & JSC)
                </button>
                <button
                  onClick={() => setIsCreateProgramOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Custom Program
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPrograms.map((program) => {
                const programStudentCount = (program.batches || []).reduce(
                  (acc: number, b: any) => acc + (b._count?.students || 0),
                  0
                );

                return (
                  <div
                    key={program.id}
                    className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    {/* Program Header */}
                    <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-zinc-900">
                              {program.name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                program.category === "SSC"
                                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {program.category}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                              Year {program.year}
                            </span>
                          </div>
                          <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                            <span>Code: <span className="font-mono font-medium text-zinc-700">{program.code}</span></span>
                            <span>•</span>
                            <span>{program.batches?.length || 0} Section Batches</span>
                            <span>•</span>
                            <span className="font-medium text-indigo-600">{programStudentCount} Enrolled Students</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedProgramFilter(program.id);
                              setActiveTab("exams");
                            }}
                            className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/60 rounded-md transition-colors"
                            title="View Program Exams"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Program Body */}
                    <div className="p-5 space-y-4 flex-1">
                      {/* Section Batches */}
                      <div>
                        <h4 className="text-xs font-semibold text-zinc-800 mb-2 flex items-center justify-between">
                          <span>Assigned Section Batches</span>
                          <span className="text-[11px] font-normal text-zinc-500">
                            Class Roster & Prefixes
                          </span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {program.batches?.map((batch: any) => (
                            <div
                              key={batch.id}
                              className="p-2.5 rounded-lg border border-zinc-200 bg-white hover:border-indigo-300 transition-colors flex items-center justify-between"
                            >
                              <div>
                                <Link
                                  href={`/admin-route/special-batch/batches/${batch.id}`}
                                  className="text-xs font-semibold text-zinc-900 hover:text-indigo-600 transition-colors"
                                >
                                  {batch.name}
                                </Link>
                                <div className="text-[11px] text-zinc-500 flex items-center gap-1.5 mt-0.5">
                                  <span>Prefix: <span className="font-mono font-medium text-zinc-700">{batch.code}</span></span>
                                  <span>•</span>
                                  <span>Class {batch.classId}</span>
                                </div>
                              </div>

                              <div className="text-right flex items-center gap-1.5">
                                <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-full mr-1">
                                  {batch._count?.students || 0} sts
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEnrollBatch({ id: batch.id, name: batch.name })}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded transition-colors"
                                  title="Enroll student in batch"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  Enroll
                                </button>
                                <Link
                                  href={`/admin-route/special-batch/batches/${batch.id}`}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 rounded"
                                  title="Open Batch Module"
                                >
                                  Open
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic Curriculum Subjects */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Curriculum Subjects ({program.subjects?.length || 0})</span>
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProgramForCurriculum(program);
                              setIsCurriculumModalOpen(true);
                            }}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                          >
                            <span>Manage Dynamic Curriculum →</span>
                          </button>
                        </div>
                        {program.subjects && program.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {program.subjects.map((subj: any) => (
                              <span
                                key={subj.id}
                                className={`text-[11px] px-2 py-0.5 rounded border ${
                                  subj.isOptional
                                    ? "bg-amber-50 text-amber-800 border-amber-200"
                                    : subj.isCombined
                                    ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                    : "bg-zinc-50 text-zinc-700 border-zinc-200"
                                }`}
                              >
                                {subj.name}
                                {subj.isOptional && " (4th)"}
                                {subj.isCombined && ` [${subj.combinedGroupId}]`}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-zinc-50 border border-dashed border-zinc-200 rounded-lg text-center">
                            <p className="text-[11px] text-zinc-500">No subjects configured yet.</p>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProgramForCurriculum(program);
                                setIsCurriculumModalOpen(true);
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:underline mt-1"
                            >
                              + Load Template or Add Subjects
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Program Footer Quick Actions */}
                    <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/admin-route/students/print?classLevel=${
                            program.category === "SSC" ? "Ten" : "Eight"
                          }`}
                          className="text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print Roster
                        </Link>

                        <button
                          onClick={() => {
                            setSelectedProgramForCurriculum(program);
                            setIsCurriculumModalOpen(true);
                          }}
                          className="text-zinc-600 hover:text-purple-700 font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Curriculum ({program.subjects?.length || 0})
                        </button>

                        <button
                          onClick={() => {
                            setSelectedProgramForSubjects(program);
                            setIsAssignSubjectsOpen(true);
                          }}
                          className="text-zinc-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <Users className="w-3.5 h-3.5" />
                          4th Subjects
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedProgramFilter(program.id);
                            setActiveTab("fees");
                          }}
                          className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
                        >
                          Course Fees
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Special Model Tests */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Scheduled Special Examinations & Model Tests
              </h3>
              <p className="text-xs text-zinc-500">
                Generate student signature sheets with photo grids and view official Bangladesh Board tabulation sheets.
              </p>
            </div>
            <button
              onClick={() => setIsCreateExamOpen(true)}
              disabled={programs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              Schedule Exam
            </button>
          </div>

          {filteredExams.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-10 text-center">
              <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-zinc-900">
                No Special Exams Scheduled
              </h4>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                Schedule your first Board Simulation, Model Test, or Assessment. Subjects and pass rules will be configured automatically.
              </p>
              <button
                onClick={() => setIsCreateExamOpen(true)}
                disabled={programs.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Schedule Special Exam
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExams.map((exam) => {
                const formattedDate = new Date(exam.examDate).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                );

                return (
                  <div
                    key={exam.id}
                    className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm flex flex-col justify-between"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase">
                            {exam.kind.replace("_", " ")}
                          </span>
                          <h4 className="text-sm font-bold text-zinc-900 mt-1.5">
                            {exam.title}
                          </h4>
                        </div>
                        <span className="text-xs font-medium text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
                          {formattedDate}
                        </span>
                      </div>

                      <div className="text-xs text-zinc-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Program:</span>
                          <span className="font-medium text-zinc-800">
                            {exam.program?.code || "Standard Program"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Batch Scope:</span>
                          <span className="font-medium text-zinc-800">
                            {exam.batch ? exam.batch.name : "All Program Batches"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-500">Curriculum:</span>
                          <span className="font-medium text-zinc-800">
                            {exam.subjects?.length || 0} Subjects
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50/80 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <Link
                        href={`/admin-route/exams/special/${exam.id}/marks`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Enter Marks
                      </Link>

                      <Link
                        href={`/admin-route/exams/special/${exam.id}/signature-sheet`}
                        className="inline-flex items-center justify-center p-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg transition-colors"
                        title="Signature Sheet"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-zinc-500" />
                      </Link>

                      <Link
                        href={`/admin-route/exams/special/${exam.id}/results`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg transition-colors shadow-2xs"
                      >
                        {exam.kind === "MODEL_TEST" ? "Board Result" : "Results"}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Course Fees & Installments */}
      {activeTab === "fees" && isAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Special Program Course Fees & Installment Ledger
              </h3>
              <p className="text-xs text-zinc-500">
                Track agreed course fees, installment payments, and print formal thermal or standard payment vouchers.
              </p>
            </div>
          </div>

          <SpecialCourseFeesTable
            initialCourseFees={filteredCourseFees}
            programs={programs}
          />
        </div>
      )}

      {/* TAB 4: Compiled Marksheets */}
      {activeTab === "compilations" && (
        <div className="space-y-4">
          <CompiledMarksheetsTable
            initialCompiledMarksheets={
              selectedProgramFilter === "all"
                ? compiledMarksheets
                : compiledMarksheets.filter((cm: any) => cm.programId === selectedProgramFilter)
            }
            programs={programs}
            specialExams={filteredExams}
          />
        </div>
      )}

      {/* Modals */}
      <CreateProgramModal
        isOpen={isCreateProgramOpen}
        onClose={() => setIsCreateProgramOpen(false)}
      />

      <CreateSpecialExamModal
        isOpen={isCreateExamOpen}
        onClose={() => setIsCreateExamOpen(false)}
        programs={programs}
      />

      <CompileMarksheetModal
        isOpen={isCompileModalOpen}
        onClose={() => setIsCompileModalOpen(false)}
        programs={programs}
        specialExams={filteredExams}
      />

      {selectedProgramForSubjects && (
        <AssignOptionalSubjectsModal
          isOpen={isAssignSubjectsOpen}
          onClose={() => setIsAssignSubjectsOpen(false)}
          programId={selectedProgramForSubjects.id}
          programName={selectedProgramForSubjects.name}
          onAssigned={() => router.refresh()}
        />
      )}

      {selectedProgramForCurriculum && (
        <ManageCurriculumModal
          isOpen={isCurriculumModalOpen}
          onClose={() => setIsCurriculumModalOpen(false)}
          program={selectedProgramForCurriculum}
          onUpdated={() => router.refresh()}
        />
      )}

      {enrollBatch && (
        <EnrollSpecialBatchStudentModal
          isOpen={!!enrollBatch}
          onClose={() => setEnrollBatch(null)}
          batchId={enrollBatch.id}
          batchName={enrollBatch.name}
          onEnrolled={() => router.refresh()}
        />
      )}
    </div>
  );
}
