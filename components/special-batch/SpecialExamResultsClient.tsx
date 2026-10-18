"use client";

import { useState } from "react";
import Link from "next/link";
import { PrintBoardMarksheet } from "@/components/special-batch/PrintBoardMarksheet";
import { GuardianMessageModal } from "@/components/special-batch/GuardianMessageModal";
import { 
  Trophy, 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  FileText,
  MessageSquare,
  Edit3
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { ProcessedStudentExamResult } from "@/lib/special-batch-results";

interface SpecialExamResultsClientProps {
  exam: any;
  meritList: ProcessedStudentExamResult[];
  subjectsConfig: any[];
}

export function SpecialExamResultsClient({
  exam,
  meritList,
  subjectsConfig,
}: SpecialExamResultsClientProps) {
  const isModelTest = exam.kind === "MODEL_TEST";
  const [selectedStudentForMarksheet, setSelectedStudentForMarksheet] = useState<ProcessedStudentExamResult | null>(null);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [printLimit, setPrintLimit] = useState<number | null>(null);
  const [customLimit, setCustomLimit] = useState<string>("");

  const top3 = meritList.slice(0, 3);
  const printedList = printLimit ? meritList.slice(0, printLimit) : meritList;

  const handleCustomLimitChange = (val: string) => {
    setCustomLimit(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setPrintLimit(parsed);
    } else if (val === "") {
      setPrintLimit(null);
    }
  };

  const presets = [
    { label: "All", value: null },
    { label: "Top 10", value: 10 },
    { label: "Top 20", value: 20 },
    { label: "Top 50", value: 50 },
  ];

  const baseColumns: Column<ProcessedStudentExamResult>[] = [
    {
      key: "rank",
      header: "Rank",
      width: "80px",
      sortable: true,
      render: (r) => {
        let badgeStyle = "text-zinc-600 bg-zinc-100";
        if (r.rank === 1) badgeStyle = "text-amber-800 bg-amber-100 border border-amber-300 font-black";
        else if (r.rank === 2) badgeStyle = "text-slate-800 bg-slate-200 border border-slate-300 font-bold";
        else if (r.rank === 3) badgeStyle = "text-amber-900 bg-amber-200/60 border border-amber-300 font-bold";

        return (
          <span className={`inline-flex items-center justify-center h-6 w-8 rounded text-xs tabular-nums ${badgeStyle}`}>
            #{r.rank}
          </span>
        );
      },
    },
    {
      key: "roll",
      header: "Roll",
      width: "100px",
      sortable: true,
      searchValue: (r) => `${r.student.displayRoll} ${r.student.roll}`,
      render: (r) => (
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded tabular-nums">
          {r.student.displayRoll}
        </span>
      ),
    },
    {
      key: "name",
      header: "Student",
      sortable: true,
      searchValue: (r) => r.student.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-zinc-900">{r.student.name}</p>
          <p className="text-[11px] text-zinc-400">{r.student.schoolName || "Science Lab"}</p>
        </div>
      ),
    },
    {
      key: "totalMarksObtained",
      header: "Total Marks",
      sortable: true,
      align: "right",
      render: (r) => (
        <span className="font-bold text-zinc-900 tabular-nums">
          {r.totalMarksObtained} <span className="text-[10px] text-zinc-400 font-normal">/ {r.totalMarksPossible}</span>
        </span>
      ),
    },
    {
      key: "percentage",
      header: "Percentage",
      sortable: true,
      align: "right",
      render: (r) => (
        <span className="font-semibold text-zinc-700 tabular-nums">
          {r.overallPercentage}%
        </span>
      ),
    },
  ];

  const modelTestColumns: Column<ProcessedStudentExamResult>[] = [
    {
      key: "gpa",
      header: "Board GPA",
      sortable: true,
      align: "right",
      render: (r) => (
        <span
          className={`font-black tabular-nums text-sm ${
            r.gpa === 5 ? "text-emerald-700" : r.gpa >= 4 ? "text-indigo-700" : "text-zinc-800"
          }`}
        >
          {r.gpa.toFixed(2)}
        </span>
      ),
    },
    {
      key: "finalGradeLetter",
      header: "Grade",
      width: "90px",
      render: (r) => (
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
            r.finalGradeLetter === "A+"
              ? "bg-emerald-100 text-emerald-800"
              : r.finalGradeLetter === "F"
              ? "bg-rose-100 text-rose-800"
              : "bg-zinc-100 text-zinc-800"
          }`}
        >
          {r.finalGradeLetter}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
            r.isPassed ? "text-emerald-700" : "text-rose-600"
          }`}
        >
          {r.isPassed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {r.isPassed ? "Passed" : "Failed"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Transcript",
      width: "120px",
      align: "right",
      render: (r) => (
        <button
          onClick={() => setSelectedStudentForMarksheet(r)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-2xs transition-colors"
        >
          <Eye className="h-3 w-3 text-zinc-400" />
          <span>Marksheet</span>
        </button>
      ),
    },
  ];

  const columns: Column<ProcessedStudentExamResult>[] = isModelTest
    ? [...baseColumns, ...modelTestColumns]
    : baseColumns;

  return (
    <div className="space-y-6">
      {/* Header with Navigation and Print CTAs */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin-route/special-batch?tab=exams"
              className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Exams</span>
            </Link>
            <span className="text-zinc-300">·</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              {exam.kind.replace("_", " ")}
            </span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900">{exam.title}</h2>
          <p className="text-xs text-zinc-500">
            {exam.program?.name} · {exam.batch?.name || "All Batches"} · {isModelTest ? "Official Board Standard (GPA & Grades)" : "Marks Only Assessment"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Enter Marks Shortcut */}
          <Link
            href={`/admin-route/exams/special/${exam.id}/marks`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg shadow-2xs transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
            <span>Enter / Edit Marks</span>
          </Link>

          {/* Guardian SMS / Message generator */}
          <button
            type="button"
            onClick={() => setIsGuardianModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg shadow-2xs transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
            <span>Guardian Messages</span>
          </button>

          {exam.subjects && exam.subjects[0] && (
            <Link
              href={`/admin-route/exams/special/${exam.id}/signature-sheet?subjectId=${exam.subjects[0].id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg shadow-2xs transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-zinc-500" />
              <span>Signature Sheet</span>
            </Link>
          )}

          {/* Print Scope Presets */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs">
            <span className="text-[11px] font-semibold text-zinc-500 px-1.5">Print:</span>
            {presets.map((p) => {
              const isActive =
                p.value === null
                  ? printLimit === null && !customLimit
                  : printLimit === p.value;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    setCustomLimit("");
                    setPrintLimit(p.value);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-zinc-900 shadow-xs border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
            <div className="flex items-center gap-1 pl-1 border-l border-zinc-200">
              <span className="text-[10px] text-zinc-400">Top</span>
              <input
                type="number"
                min="1"
                max={meritList.length}
                placeholder="N"
                value={customLimit}
                onChange={(e) => handleCustomLimitChange(e.target.value)}
                className="w-10 h-6 px-1 text-center bg-white border border-zinc-300 rounded text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print {printLimit ? `Top ${printLimit}` : "Tabulation"}</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((winner, idx) => {
            const podiumColors = [
              "border-amber-300 bg-gradient-to-b from-amber-50/70 to-white text-amber-900",
              "border-slate-300 bg-gradient-to-b from-slate-50/70 to-white text-slate-900",
              "border-amber-400 bg-gradient-to-b from-amber-50/40 to-white text-amber-900",
            ];

            const trophyColors = ["text-amber-500", "text-slate-400", "text-amber-700"];

            return (
              <div
                key={winner.student.id}
                className={`p-4 rounded-xl border ${podiumColors[idx]} shadow-xs flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                    <Trophy className={`h-6 w-6 ${trophyColors[idx]}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      Rank #{winner.rank} Position
                    </span>
                    <h4 className="font-bold text-zinc-900 text-sm truncate max-w-[150px]">
                      {winner.student.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-medium tabular-nums">
                      Roll #{winner.student.displayRoll} · {winner.student.schoolName || "Science Lab"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-indigo-700 tabular-nums block">
                    {winner.gpa.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-600 tabular-nums">
                    {winner.totalMarksObtained} Marks
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Print Scope Notice */}
      {printLimit !== null && printLimit < meritList.length && (
        <div className="no-print flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 shadow-xs">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>
              Print scope active: Showing <strong>Top {printLimit}</strong> students on paper/PDF ({meritList.length - printLimit} remaining students excluded in printout).
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCustomLimit("");
              setPrintLimit(null);
            }}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline ml-3 shrink-0"
          >
            Reset to print all ({meritList.length})
          </button>
        </div>
      )}

      {/* Printable Sheet (visible only during print) */}
      <div className="hidden print:block">
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            Science Lab Coaching Center
          </h1>
          <h2 className="text-lg font-semibold mt-1">
            {exam.title} — Tabulation & Merit List
          </h2>
          <p className="text-sm font-medium mt-1">
            Program: {exam.program?.name} · {exam.batch?.name || "All Batches"} · {printLimit ? `Top ${printLimit} Students` : `Complete Merit List (${meritList.length} Students)`}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Generated on: {new Date().toLocaleDateString()}
          </p>
        </div>

        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-[11px]">
              <th className="border border-black p-1.5 text-center w-12">Rank</th>
              <th className="border border-black p-1.5 text-center w-20">Roll</th>
              <th className="border border-black p-1.5 text-left">Student Name</th>
              <th className="border border-black p-1.5 text-left">Feeder School</th>
              <th className="border border-black p-1.5 text-center w-16">GPA</th>
              <th className="border border-black p-1.5 text-center w-16">Grade</th>
              <th className="border border-black p-1.5 text-center w-20">Marks</th>
              <th className="border border-black p-1.5 text-center w-16">Result</th>
            </tr>
          </thead>
          <tbody>
            {printedList.map((r) => (
              <tr key={r.student.id} className="border-b border-black">
                <td className="border border-black p-1.5 text-center font-bold">#{r.rank}</td>
                <td className="border border-black p-1.5 text-center font-mono font-bold">{r.student.displayRoll}</td>
                <td className="border border-black p-1.5 font-semibold">{r.student.name}</td>
                <td className="border border-black p-1.5">{r.student.schoolName || "Science Lab"}</td>
                <td className="border border-black p-1.5 text-center font-bold">{r.gpa.toFixed(2)}</td>
                <td className="border border-black p-1.5 text-center font-bold">{r.finalGradeLetter}</td>
                <td className="border border-black p-1.5 text-center font-bold">{r.totalMarksObtained}</td>
                <td className="border border-black p-1.5 text-center font-bold">{r.isPassed ? "PASSED" : "FAILED"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Full Ranked Tabulation Merit List */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs print:hidden">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-zinc-900">Ranked Tabulation & Merit List</h3>
          <p className="text-xs text-zinc-500">
            Ties resolved by total marks obtained; optional subject bonus points applied automatically.
          </p>
        </div>

        <DataTable
          data={meritList}
          columns={columns}
          placeholder="Filter candidate by name or roll..."
          pageSize={20}
          customSearchFn={(r, query) => {
            const q = query.toLowerCase();
            return (
              r.student.name.toLowerCase().includes(q) ||
              String(r.student.displayRoll).includes(q) ||
              String(r.student.roll).includes(q)
            );
          }}
        />
      </div>

      {/* Individual Marksheet Modal */}
      {selectedStudentForMarksheet && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8">
            <PrintBoardMarksheet
              exam={exam}
              studentResult={selectedStudentForMarksheet}
              onClose={() => setSelectedStudentForMarksheet(null)}
            />
          </div>
        </div>
      )}

      {/* Guardian SMS / Message Dispatch Modal */}
      <GuardianMessageModal
        isOpen={isGuardianModalOpen}
        onClose={() => setIsGuardianModalOpen(false)}
        exam={exam}
        meritList={meritList}
      />
    </div>
  );
}
