"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  Search,
  Filter,
  CheckSquare,
  Clock,
  Phone,
  AlertCircle,
  Eye,
} from "lucide-react";
import { CreateSpecialExamModal } from "@/components/special-batch/CreateSpecialExamModal";
import { CompileMarksheetModal } from "@/components/special-batch/CompileMarksheetModal";
import { AssignOptionalSubjectsModal } from "@/components/special-batch/AssignOptionalSubjectsModal";
import { SpecialCourseFeesTable } from "@/components/accounts/SpecialCourseFeesTable";
import { GuardianMessageModal } from "@/components/special-batch/GuardianMessageModal";
import { EnrollSpecialBatchStudentModal } from "@/components/special-batch/EnrollSpecialBatchStudentModal";

interface SpecialBatchDetailClientProps {
  batch: {
    id: number;
    name: string;
    code: number;
    classId: string;
    programId: number;
  };
  program: {
    id: number;
    name: string;
    code: string;
    category: string;
    year: number;
    subjects: any[];
    allBatches: any[];
  };
  kpis: {
    totalStudents: number;
    studentsWithOptional: number;
    optionalCoveragePercent: number;
    totalExams: number;
    modelTestsCount: number;
    classTestsCount: number;
    totalCompilations: number;
    feeAgreed: number;
    feePaid: number;
    feeDue: number;
    feeCollectionRate: number;
  };
  students: any[];
  exams: any[];
  compilations: any[];
  isAdmin: boolean;
}

export function SpecialBatchDetailClient({
  batch,
  program,
  kpis,
  students,
  exams,
  compilations,
  isAdmin,
}: SpecialBatchDetailClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "students" | "exams" | "fees" | "compilations"
  >("students");

  const [studentSearch, setStudentSearch] = useState("");
  const [examFilterKind, setExamFilterKind] = useState<string>("ALL");

  // Modals state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isAssignSubjectsOpen, setIsAssignSubjectsOpen] = useState(false);
  const [isCompileModalOpen, setIsCompileModalOpen] = useState(false);
  const [isSmsModalOpen, setIsSmsModalOpen] = useState(false);

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = studentSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.fullRoll.toString().includes(q) ||
      s.roll.toString().includes(q) ||
      (s.mobile && s.mobile.includes(q)) ||
      (s.schoolName && s.schoolName.toLowerCase().includes(q))
    );
  });

  // Filter exams
  const filteredExams = exams.filter((e) => {
    if (examFilterKind === "ALL") return true;
    return e.kind === examFilterKind;
  });

  // Prepare course fees format for SpecialCourseFeesTable
  const batchCourseFees = students.map((s) => ({
    id: s.courseFeeId || s.id,
    agreedFee: s.agreedFee,
    notes: s.notes,
    totalPaid: s.totalPaid,
    installmentsCount: s.paymentsCount,
    student: {
      id: s.id,
      name: s.name,
      roll: s.roll,
      mobile: s.mobile,
      gender: s.gender,
      class: batch.classId,
      batch: {
        id: batch.id,
        name: batch.name,
        code: batch.code,
      },
    },
    program: {
      id: program.id,
      name: program.name,
      code: program.code,
      category: program.category,
    },
    payments: s.payments,
  }));

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link
          href="/admin-route/special-batch"
          className="inline-flex items-center gap-1 text-zinc-600 hover:text-indigo-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Special Batches & Programs
        </Link>
        <span>/</span>
        <span className="text-zinc-400">{program.name}</span>
        <span>/</span>
        <span className="font-semibold text-zinc-800">{batch.name}</span>
      </div>

      {/* Batch Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-zinc-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {batch.name}
            </h1>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-semibold border border-zinc-200">
              Batch #{batch.code}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                program.category === "SSC"
                  ? "bg-purple-50 text-purple-700 border border-purple-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {program.category} ({program.code})
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
              Class {batch.classId} · {program.year}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-1.5">
            Dedicated workspace for section roster, board-standard model tests, 4th subject allocation, and installment course fees.
          </p>
        </div>

        {/* Global Action Buttons for this Batch */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/admin-route/students/print?classLevel=${
              program.category === "SSC" ? "Ten" : "Eight"
            }`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Roster
          </Link>

          <button
            onClick={() => setIsAssignSubjectsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Assign 4th Subjects
          </button>

          <button
            onClick={() => setIsCompileModalOpen(true)}
            disabled={exams.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
          >
            <Layers className="w-3.5 h-3.5" />
            Compile Marksheet
          </button>

          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Enroll Student
          </button>

          <button
            onClick={() => setIsCreateExamOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            Schedule Exam
          </button>
        </div>
      </div>

      {/* Batch-Specific Scoped KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Enrolled Students */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Enrolled Students</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-2">
            {kpis.totalStudents}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Section Prefix #{batch.code}
          </p>
        </div>

        {/* KPI 2: 4th Subject Coverage */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">4th Subject Assigned</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-2">
            {kpis.studentsWithOptional}{" "}
            <span className="text-xs font-medium text-zinc-500">
              / {kpis.totalStudents}
            </span>
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">
            {kpis.optionalCoveragePercent}% mapped for board GPA bonus
          </p>
        </div>

        {/* KPI 3: Scheduled Assessments */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500">Batch Assessments</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-zinc-900 mt-2">
            {kpis.totalExams}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            {kpis.modelTestsCount} Model Tests · {kpis.classTestsCount} Class Tests
          </p>
        </div>

        {/* KPI 4: Course Fees (Admin) or Compilations */}
        {isAdmin ? (
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Fees Collection</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-700 mt-2">
              ৳{kpis.feePaid.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Due: ৳{kpis.feeDue.toLocaleString()}{" "}
              {kpis.feeAgreed > 0 && `(${kpis.feeCollectionRate}% of ৳${kpis.feeAgreed.toLocaleString()})`}
            </p>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">Compiled Marksheets</span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-zinc-900 mt-2">
              {kpis.totalCompilations}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Multi-test compilations
            </p>
          </div>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-zinc-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("students")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "students"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Roster & 4th Subjects
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-700">
              {students.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("exams")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "exams"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Model Tests & Exams
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-700">
              {exams.length}
            </span>
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab("fees")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
                activeTab === "fees"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Course Fees & Installments
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-700">
                {batchCourseFees.length}
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab("compilations")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === "compilations"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Compiled Marksheets
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-100 text-zinc-700">
              {compilations.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: Roster & 4th Subjects */}
      {activeTab === "students" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by student name, roll, phone, or school..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">
                Showing {filteredStudents.length} of {students.length} students
              </span>
              <button
                onClick={() => setIsEnrollModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Enroll Student
              </button>
              <button
                onClick={() => setIsAssignSubjectsOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                Manage 4th Subjects
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50/75 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4 w-24">Roll</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">School</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">4th Subject</th>
                    {isAdmin && <th className="py-2.5 px-4 text-right">Fee Status</th>}
                    <th className="py-2.5 px-4 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAdmin ? 7 : 6}
                        className="py-8 text-center text-zinc-400"
                      >
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                          {s.fullRoll}
                          <span className="block text-[10px] font-normal text-zinc-400">
                            Serial #{s.roll}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-zinc-900">{s.name}</span>
                          <span className="block text-[10px] text-zinc-400">
                            Gender: {s.gender}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 truncate max-w-[180px]">
                          {s.schoolName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-zinc-700">{s.mobile}</span>
                          {s.homeMobile && (
                            <span className="block font-mono text-[10px] text-zinc-400">
                              {s.homeMobile}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {s.optionalSubject ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {s.optionalSubject.name} (4th)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              Not Assigned
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-emerald-700">
                              ৳{s.totalPaid.toLocaleString()}
                            </span>
                            {s.due > 0 ? (
                              <span className="block text-[10px] text-rose-600 font-medium">
                                Due: ৳{s.due.toLocaleString()}
                              </span>
                            ) : (
                              <span className="block text-[10px] text-zinc-400">
                                {s.agreedFee ? "Fully Paid" : "No Agreement"}
                              </span>
                            )}
                          </td>
                        )}
                        <td className="py-3 px-4 text-center">
                          <Link
                            href={`/admin-route/students?search=${encodeURIComponent(
                              s.name
                            )}`}
                            className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors inline-block"
                            title="View student profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Model Tests & Exams */}
      {activeTab === "exams" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">Filter Kind:</span>
              <select
                value={examFilterKind}
                onChange={(e) => setExamFilterKind(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="ALL">All Assessments ({exams.length})</option>
                <option value="MODEL_TEST">Model Tests</option>
                <option value="PRE_MODEL">Pre-Model Tests</option>
                <option value="CLASS_TEST">Class Tests</option>
                <option value="BOARD_EXAM">Board Exams</option>
              </select>
            </div>

            <button
              onClick={() => setIsCreateExamOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              Schedule New Assessment
            </button>
          </div>

          {filteredExams.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-10 text-center">
              <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-900">
                No Special Exams Scheduled
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                Schedule your first Board-standard Model Test, Pre-Model, or lecture Class Test for this section.
              </p>
              <button
                onClick={() => setIsCreateExamOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" />
                Schedule Exam Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredExams.map((exam) => {
                const subjectsCount = exam.subjects?.length || 0;
                const totalMarksConfigured = exam.subjects?.reduce(
                  (sum: number, s: any) => sum + (s.totalMax || 0),
                  0
                );
                const hasEnteredMarks = exam.subjects?.some(
                  (s: any) => (s._count?.marks || 0) > 0
                );

                return (
                  <div
                    key={exam.id}
                    className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-zinc-900">
                          {exam.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            exam.kind === "MODEL_TEST"
                              ? "bg-purple-50 text-purple-700 border border-purple-200"
                              : exam.kind === "PRE_MODEL"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {exam.kind.replace("_", " ")}
                        </span>
                        {exam.lectureLabel && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 font-semibold">
                            {exam.lectureLabel}
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {new Date(exam.examDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-500 mt-2 flex-wrap">
                        <span>{subjectsCount} Subject Papers</span>
                        <span>•</span>
                        <span>Max Marks: {totalMarksConfigured}</span>
                        <span>•</span>
                        <span
                          className={`font-medium ${
                            hasEnteredMarks ? "text-emerald-600" : "text-amber-600"
                          }`}
                        >
                          {hasEnteredMarks ? "✓ Marks Entered" : "Pending Marks Entry"}
                        </span>
                      </div>
                    </div>

                    {/* Exam Quick Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin-route/exams/special/${exam.id}/signature-sheet`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors"
                        title="Print Exam Hall Signature Sheet"
                      >
                        <Printer className="w-3.5 h-3.5 text-zinc-500" />
                        Signature Sheet
                      </Link>

                      <Link
                        href={`/admin-route/exams/special/${exam.id}/marks`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Enter Marks
                      </Link>

                      <Link
                        href={`/admin-route/exams/special/${exam.id}/results`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        Board Results
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Course Fees & Installments (Admin Only) */}
      {isAdmin && activeTab === "fees" && (
        <div className="space-y-4">
          <SpecialCourseFeesTable
            initialCourseFees={batchCourseFees}
            programs={[program]}
          />
        </div>
      )}

      {/* TAB 4: Compiled Marksheets */}
      {activeTab === "compilations" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">
                Multi-Exam Compiled Marksheets
              </h3>
              <p className="text-xs text-zinc-500">
                Aggregate test series into official board merit rankings and print sheets.
              </p>
            </div>

            <button
              onClick={() => setIsCompileModalOpen(true)}
              disabled={exams.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              New Compilation
            </button>
          </div>

          {compilations.length === 0 ? (
            <div className="bg-white border border-dashed border-zinc-300 rounded-xl p-10 text-center">
              <Layers className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-900">
                No Compiled Marksheets Yet
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-4">
                Compile multiple model tests or lecture class tests into a single master marksheet with board standard rankings.
              </p>
              <button
                onClick={() => setIsCompileModalOpen(true)}
                disabled={exams.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Layers className="w-3.5 h-3.5" />
                Compile First Marksheet
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {compilations.map((cm) => (
                <div
                  key={cm.id}
                  className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-2xs hover:border-zinc-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-zinc-900">{cm.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {cm.examCount} Tests
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1.5">
                      <span>Total Possible Marks: {cm.totalPossibleMarks}</span>
                      <span>•</span>
                      <span>Created {new Date(cm.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin-route/special-batch/compiled-marksheets/${cm.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Board Marksheet
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <EnrollSpecialBatchStudentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        batchId={batch.id}
        batchName={batch.name}
        onEnrolled={() => router.refresh()}
      />

      {/* Modals */}
      <CreateSpecialExamModal
        isOpen={isCreateExamOpen}
        onClose={() => {
          setIsCreateExamOpen(false);
          router.refresh();
        }}
        programs={[program]}
      />

      <AssignOptionalSubjectsModal
        isOpen={isAssignSubjectsOpen}
        onClose={() => {
          setIsAssignSubjectsOpen(false);
          router.refresh();
        }}
        programId={program.id}
        programName={program.name}
        onAssigned={() => router.refresh()}
      />

      <CompileMarksheetModal
        isOpen={isCompileModalOpen}
        onClose={() => {
          setIsCompileModalOpen(false);
          router.refresh();
        }}
        programs={[program]}
        specialExams={exams}
      />
    </div>
  );
}
