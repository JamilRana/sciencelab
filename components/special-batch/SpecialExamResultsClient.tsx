"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
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
  Edit3,
  GraduationCap,
  Globe,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { ProcessedStudentExamResult } from "@/lib/special-batch-results";
import {
  ResultLanguage,
  tTerm,
  formatResultNumber,
} from "@/lib/results-i18n";

interface SpecialExamResultsClientProps {
  exam: any;
  meritList: ProcessedStudentExamResult[];
  subjectsConfig: any[];
  canEditMarks?: boolean;
  enterMarksUrl?: string;
  backUrl?: string;
}

export function SpecialExamResultsClient({
  exam,
  meritList,
  subjectsConfig,
  canEditMarks = false,
  enterMarksUrl,
  backUrl,
}: SpecialExamResultsClientProps) {
  const isModelTest = exam.kind === "MODEL_TEST";
  const [selectedStudentForMarksheet, setSelectedStudentForMarksheet] = useState<ProcessedStudentExamResult | null>(null);
  const [isGuardianModalOpen, setIsGuardianModalOpen] = useState(false);
  const [printLimit, setPrintLimit] = useState<number | null>(null);
  const [customLimit, setCustomLimit] = useState<string>("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const urlLang = searchParams?.get("lang") as ResultLanguage | null;
  const [language, setLanguage] = useState<ResultLanguage>(
    urlLang === "bn" || urlLang === "bilingual" || urlLang === "en" ? urlLang : "en"
  );

  const handleLanguageChange = (newLang: ResultLanguage) => {
    setLanguage(newLang);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newLang === "en") {
        url.searchParams.delete("lang");
      } else {
        url.searchParams.set("lang", newLang);
      }
      router.replace(url.pathname + url.search, { scroll: false });
    }
  };

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
    { label: language === "bn" ? "সকল" : "All", value: null },
    { label: language === "bn" ? "সেরা ১০" : "Top 10", value: 10 },
    { label: language === "bn" ? "সেরা ২০" : "Top 20", value: 20 },
    { label: language === "bn" ? "সেরা ৫০" : "Top 50", value: 50 },
  ];

  const baseColumns: Column<ProcessedStudentExamResult>[] = [
    {
      key: "rank",
      header: tTerm("rank", language),
      width: "80px",
      sortable: true,
      render: (r) => {
        let badgeStyle = "text-zinc-600 bg-zinc-100";
        if (r.rank === 1) badgeStyle = "text-amber-800 bg-amber-100 border border-amber-300 font-black";
        else if (r.rank === 2) badgeStyle = "text-slate-800 bg-slate-200 border border-slate-300 font-bold";
        else if (r.rank === 3) badgeStyle = "text-amber-900 bg-amber-200/60 border border-amber-300 font-bold";

        return (
          <span className={`inline-flex items-center justify-center h-6 w-8 rounded text-xs tabular-nums ${badgeStyle}`}>
            #{formatResultNumber(r.rank, language)}
          </span>
        );
      },
    },
    {
      key: "roll",
      header: tTerm("roll", language),
      width: "100px",
      sortable: true,
      searchValue: (r) => `${r.student.displayRoll} ${r.student.roll}`,
      render: (r) => (
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded tabular-nums">
          {formatResultNumber(r.student.displayRoll, language)}
        </span>
      ),
    },
    {
      key: "name",
      header: tTerm("studentName", language),
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
      header: tTerm("totalMarks", language),
      sortable: true,
      align: "right",
      render: (r) => (
        <span className="font-bold text-zinc-900 tabular-nums">
          {formatResultNumber(r.totalMarksObtained, language)}{" "}
          <span className="text-[10px] text-zinc-400 font-normal">
            / {formatResultNumber(r.totalMarksPossible, language)}
          </span>
        </span>
      ),
    },
    {
      key: "percentage",
      header: tTerm("percentage", language),
      sortable: true,
      align: "right",
      render: (r) => (
        <span className="font-semibold text-zinc-700 tabular-nums">
          {formatResultNumber(r.overallPercentage, language)}%
        </span>
      ),
    },
  ];

  const modelTestColumns: Column<ProcessedStudentExamResult>[] = [
    {
      key: "gpa",
      header: tTerm("gpa", language),
      sortable: true,
      align: "right",
      render: (r) => (
        <span
          className={`font-black tabular-nums text-sm ${
            r.gpa === 5 ? "text-emerald-700" : r.gpa >= 4 ? "text-indigo-700" : "text-zinc-800"
          }`}
        >
          {formatResultNumber(r.gpa.toFixed(2), language)}
        </span>
      ),
    },
    {
      key: "finalGradeLetter",
      header: tTerm("grade", language),
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
      header: tTerm("status", language),
      width: "110px",
      render: (r) => (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
            r.isPassed ? "text-emerald-700" : "text-rose-600"
          }`}
        >
          {r.isPassed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {r.isPassed ? tTerm("passed", language) : tTerm("failed", language)}
        </span>
      ),
    },
    {
      key: "actions",
      header: tTerm("marksheet", language),
      width: "120px",
      align: "right",
      render: (r) => (
        <button
          onClick={() => setSelectedStudentForMarksheet(r)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-2xs transition-colors"
        >
          <Eye className="h-3 w-3 text-zinc-400" />
          <span>{tTerm("marksheet", language)}</span>
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
              href={backUrl || "/admin-route/special-batch?tab=exams"}
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
            {exam.program?.name} · {exam.batch?.name || "All Batches"} · {isModelTest ? tTerm("boardStandardNote", language) : tTerm("marksOnlyNote", language)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Enter Marks Shortcut */}
          {canEditMarks ? (
            <Link
              href={`/admin-route/exams/special/${exam.id}/marks`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg shadow-2xs transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
              <span>Enter / Edit Marks</span>
            </Link>
          ) : enterMarksUrl ? (
            <Link
              href={enterMarksUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg shadow-2xs transition-colors"
            >
              <GraduationCap className="h-3.5 w-3.5 text-indigo-600" />
              <span>Enter Marks</span>
            </Link>
          ) : null}

          {/* Guardian SMS / Message generator */}
          <button
            type="button"
            onClick={() => setIsGuardianModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg shadow-2xs transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
            <span>{tTerm("guardianMessages", language)}</span>
          </button>

          {exam.subjects && exam.subjects[0] && (
            <Link
              href={`/admin-route/exams/special/${exam.id}/signature-sheet?subjectId=${exam.subjects[0].id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 rounded-lg shadow-2xs transition-colors"
            >
              <FileText className="h-3.5 w-3.5 text-zinc-500" />
              <span>{tTerm("signatureSheet", language)}</span>
            </Link>
          )}

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80 text-xs">
            <div className="flex items-center gap-1 px-1.5 text-[11px] font-semibold text-zinc-500">
              <Globe className="h-3.5 w-3.5 text-indigo-600" />
              <span>Lang:</span>
            </div>
            <button
              type="button"
              onClick={() => handleLanguageChange("en")}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                language === "en"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200 font-bold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("bn")}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                language === "bn"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200 font-bold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange("bilingual")}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                language === "bilingual"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200 font-bold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Dual / উভয়
            </button>
          </div>

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
              <span className="text-[10px] text-zinc-400">
                {language === "bn" ? "শীর্ষ" : "Top"}
              </span>
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
            <span>
              {language === "bn"
                ? `প্রিন্ট ${printLimit ? `(সেরা ${formatResultNumber(printLimit, "bn")})` : "ফলাফল"}`
                : language === "bilingual"
                ? "Print / প্রিন্ট"
                : `Print ${printLimit ? `Top ${printLimit}` : "Tabulation"}`}
            </span>
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
                      {tTerm("rank", language)} #{formatResultNumber(winner.rank, language)}
                    </span>
                    <h4 className="font-bold text-zinc-900 text-sm truncate max-w-[150px]">
                      {winner.student.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-medium tabular-nums">
                      {tTerm("roll", language)} #{formatResultNumber(winner.student.displayRoll, language)} · {winner.student.schoolName || "Science Lab"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-indigo-700 tabular-nums block">
                    {formatResultNumber(winner.gpa.toFixed(2), language)}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-600 tabular-nums">
                    {formatResultNumber(winner.totalMarksObtained, language)} {tTerm("totalShort", language)}
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
              {language === "bn" ? (
                <>প্রিন্ট সীমাবদ্ধতা সক্রিয়: কাগজে/পিডিএফ-এ <strong>সেরা {formatResultNumber(printLimit, "bn")}</strong> জন শিক্ষার্থী দেখানো হচ্ছে।</>
              ) : (
                <>Print scope active: Showing <strong>Top {printLimit}</strong> students on paper/PDF ({meritList.length - printLimit} remaining students excluded in printout).</>
              )}
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
            {language === "bn" ? `সকল (${formatResultNumber(meritList.length, "bn")}) দেখতে রিসেট করুন` : `Reset to print all (${meritList.length})`}
          </button>
        </div>
      )}

      {/* Printable Sheet (visible only during print) */}
      <div className="hidden print:block">
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <div className="flex items-center justify-center gap-3 mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Science Lab Logo" className="h-10 w-auto object-contain" />
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              {tTerm("instituteName", language)}
            </h1>
          </div>
          <h2 className="text-lg font-semibold mt-1">
            {exam.title} — {tTerm("tabulationSheet", language)}
          </h2>
          <p className="text-sm font-medium mt-1">
            {tTerm("programBatch", language)}: {exam.program?.name} · {exam.batch?.name || "All Batches"} ·{" "}
            {printLimit
              ? `${tTerm("topScope", language)} ${formatResultNumber(printLimit, language)}`
              : `${tTerm("allStudents", language)} (${formatResultNumber(meritList.length, language)})`}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            {tTerm("generatedOn", language)}: {new Date().toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB")}
          </p>
        </div>

        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-[11px]">
              <th className="border border-black p-1.5 text-center w-12">{tTerm("rank", language)}</th>
              <th className="border border-black p-1.5 text-center w-20">{tTerm("roll", language)}</th>
              <th className="border border-black p-1.5 text-left">{tTerm("studentName", language)}</th>
              <th className="border border-black p-1.5 text-left">{tTerm("feederSchool", language)}</th>
              <th className="border border-black p-1.5 text-center w-16">{tTerm("gpa", language)}</th>
              <th className="border border-black p-1.5 text-center w-16">{tTerm("grade", language)}</th>
              <th className="border border-black p-1.5 text-center w-20">{tTerm("totalMarks", language)}</th>
              <th className="border border-black p-1.5 text-center w-16">{tTerm("status", language)}</th>
            </tr>
          </thead>
          <tbody>
            {printedList.map((r) => (
              <tr key={r.student.id} className="border-b border-black">
                <td className="border border-black p-1.5 text-center font-bold">
                  #{formatResultNumber(r.rank, language)}
                </td>
                <td className="border border-black p-1.5 text-center font-mono font-bold">
                  {formatResultNumber(r.student.displayRoll, language)}
                </td>
                <td className="border border-black p-1.5 font-semibold">{r.student.name}</td>
                <td className="border border-black p-1.5">{r.student.schoolName || "Science Lab"}</td>
                <td className="border border-black p-1.5 text-center font-bold">
                  {formatResultNumber(r.gpa.toFixed(2), language)}
                </td>
                <td className="border border-black p-1.5 text-center font-bold">{r.finalGradeLetter}</td>
                <td className="border border-black p-1.5 text-center font-bold">
                  {formatResultNumber(r.totalMarksObtained, language)}
                </td>
                <td className="border border-black p-1.5 text-center font-bold">
                  {r.isPassed ? tTerm("passed", language) : tTerm("failed", language)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tabulation Sheet Signatures */}
        <div className="flex items-end justify-between text-xs text-zinc-900 pt-12 mt-8 border-t border-zinc-400">
          <div className="text-center">
            <div className="w-36 border-b border-black mb-1" />
            <p className="font-semibold">{tTerm("preparedBy", language)}</p>
          </div>
          <div className="text-center">
            <div className="w-36 border-b border-black mb-1" />
            <p className="font-semibold">{tTerm("controllerOfExams", language)}</p>
          </div>
          <div className="text-center">
            <div className="w-36 border-b border-black mb-1" />
            <p className="font-semibold">{tTerm("directorPrincipal", language)}</p>
          </div>
        </div>
      </div>

      {/* Full Ranked Tabulation Merit List */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs print:hidden">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-zinc-900">{tTerm("rankedTabulation", language)}</h3>
          <p className="text-xs text-zinc-500">
            {tTerm("tieBreakNote", language)}
          </p>
        </div>

        <DataTable
          data={meritList}
          columns={columns}
          placeholder={tTerm("filterCandidate", language)}
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
              language={language}
              onLanguageChange={setLanguage}
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
