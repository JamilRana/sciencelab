"use client";

import { useState } from "react";
import { Printer, ArrowLeft, Globe } from "lucide-react";
import { ProcessedStudentExamResult } from "@/lib/special-batch-results";
import {
  ResultLanguage,
  tTerm,
  localizeSubjectName,
  formatResultNumber,
} from "@/lib/results-i18n";

interface PrintBoardMarksheetProps {
  exam: {
    title: string;
    kind: string;
    examDate: string | Date;
    program?: { name: string; code: string };
    batch?: { name: string; code: number };
  };
  studentResult: ProcessedStudentExamResult;
  onClose?: () => void;
  language?: ResultLanguage;
  onLanguageChange?: (lang: ResultLanguage) => void;
}

export function PrintBoardMarksheet({
  exam,
  studentResult,
  onClose,
  language: initialLanguage = "en",
  onLanguageChange,
}: PrintBoardMarksheetProps) {
  const [language, setLanguage] = useState<ResultLanguage>(initialLanguage);

  const handleLangSelect = (lang: ResultLanguage) => {
    setLanguage(lang);
    onLanguageChange?.(lang);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(exam.examDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white min-h-screen text-zinc-900 font-sans print:m-0 print:p-0">
      {/* Top Toolbar (Hidden on Print) */}
      <div className="sticky top-0 z-20 bg-zinc-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden shadow-md">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition-colors"
              title="Close"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h3 className="text-sm font-bold">
              {language === "bn"
                ? "অফিসিয়াল মার্কশিট / নম্বরপত্র"
                : language === "bilingual"
                ? "Academic Transcript / অফিসিয়াল মার্কশিট"
                : "Academic Transcript / Official Marksheet"}
            </h3>
            <p className="text-xs text-zinc-400">
              {studentResult.student.name} · {tTerm("roll", language)} #{studentResult.student.displayRoll} · {exam.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-lg border border-zinc-700 text-xs">
            <div className="flex items-center gap-1 px-1.5 text-[11px] font-semibold text-zinc-400">
              <Globe className="h-3.5 w-3.5 text-indigo-400" />
              <span>Lang:</span>
            </div>
            <button
              type="button"
              onClick={() => handleLangSelect("en")}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                language === "en"
                  ? "bg-white text-zinc-900 font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLangSelect("bn")}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                language === "bn"
                  ? "bg-white text-zinc-900 font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => handleLangSelect("bilingual")}
              className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                language === "bilingual"
                  ? "bg-white text-zinc-900 font-bold shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Dual / উভয়
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all focus-ring active:scale-98"
          >
            <Printer className="h-4 w-4" />
            <span>
              {language === "bn"
                ? "প্রিন্ট মার্কশিট (A4)"
                : language === "bilingual"
                ? "Print / প্রিন্ট (A4)"
                : "Print Marksheet (A4)"}
            </span>
          </button>
        </div>
      </div>

      {/* A4 Sheet Container */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-4 print:max-w-none">
        {/* Certificate Border Frame */}
        <div className="border-2 border-indigo-950 p-6 rounded-xl relative">
          {/* Header */}
          <div className="text-center border-b-2 border-zinc-900 pb-4 mb-4">
            <div className="flex items-center justify-center gap-3 mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo2.png" alt="Logo" className="h-10 w-auto object-contain" />
              <div>
                <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">
                  {tTerm("instituteName", language)}
                </h1>
                <p className="text-xs text-zinc-600 font-medium">
                  {tTerm("specialDivisionSubtitle", language)}
                </p>
              </div>
            </div>
            <div className="mt-2 inline-block px-4 py-1 bg-zinc-900 text-white rounded font-bold text-xs uppercase tracking-widest">
              {tTerm("officialTranscript", language)}
            </div>
            <p className="text-xs text-zinc-700 font-semibold mt-1.5">
              {exam.title} — {exam.kind.replace("_", " ")}
            </p>
          </div>

          {/* Top Section: Student Meta & Board Grade Scale Reference */}
          <div className="grid grid-cols-3 gap-4 mb-5 text-xs">
            {/* Student Details (2 cols) */}
            <div className="col-span-2 border border-zinc-300 bg-zinc-50/60 p-3 rounded-lg space-y-1.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    {tTerm("candidateName", language)}
                  </span>
                  <span className="font-bold text-sm text-zinc-900">{studentResult.student.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    {tTerm("roll", language)}
                  </span>
                  <span className="font-bold text-sm text-indigo-700 tabular-nums">
                    #{formatResultNumber(studentResult.student.displayRoll, language)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    {tTerm("feederSchool", language)}
                  </span>
                  <span className="font-semibold text-zinc-800">
                    {studentResult.student.schoolName || "Science Lab"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">
                    {tTerm("programBatch", language)}
                  </span>
                  <span className="font-semibold text-zinc-800">
                    {exam.program?.name || "Special Batch"} ({exam.batch?.name || "Batch"})
                  </span>
                </div>
              </div>
            </div>

            {/* Grading System Scale Box (1 col) */}
            <div className="border border-zinc-300 p-2 rounded-lg bg-white text-[10px] leading-tight">
              <p className="font-bold text-center text-zinc-800 border-b border-zinc-200 pb-1 mb-1 uppercase tracking-wider">
                {tTerm("boardGradingScale", language)}
              </p>
              <div className="space-y-0.5 text-zinc-600">
                <div className="flex justify-between">
                  <span>{formatResultNumber(80, language)}-{formatResultNumber(100, language)}%</span>
                  <span className="font-bold text-zinc-800">A+ ({formatResultNumber("5.0", language)})</span>
                </div>
                <div className="flex justify-between">
                  <span>{formatResultNumber(70, language)}-{formatResultNumber(79, language)}%</span>
                  <span className="font-medium">A ({formatResultNumber("4.0", language)})</span>
                </div>
                <div className="flex justify-between">
                  <span>{formatResultNumber(60, language)}-{formatResultNumber(69, language)}%</span>
                  <span className="font-medium">A- ({formatResultNumber("3.5", language)})</span>
                </div>
                <div className="flex justify-between">
                  <span>{formatResultNumber(50, language)}-{formatResultNumber(59, language)}%</span>
                  <span className="font-medium">B ({formatResultNumber("3.0", language)})</span>
                </div>
                <div className="flex justify-between">
                  <span>{formatResultNumber(40, language)}-{formatResultNumber(49, language)}%</span>
                  <span className="font-medium">C ({formatResultNumber("2.0", language)})</span>
                </div>
                <div className="flex justify-between">
                  <span>{formatResultNumber(33, language)}-{formatResultNumber(39, language)}%</span>
                  <span className="font-medium">D ({formatResultNumber("1.0", language)})</span>
                </div>
                <div className="flex justify-between">
                  <span>{formatResultNumber("00", language)}-{formatResultNumber(32, language)}%</span>
                  <span className="font-bold text-rose-600">F ({formatResultNumber("0.0", language)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subjects Table */}
          <table className="w-full text-xs border-collapse border border-zinc-400 mb-4">
            <thead>
              <tr className="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-400 text-center">
                <th className="border border-zinc-400 px-2 py-1.5 w-10">{tTerm("serialNo", language)}</th>
                <th className="border border-zinc-400 px-3 py-1.5 text-left">{tTerm("subject", language)}</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">{tTerm("maxMarks", language)}</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">{tTerm("wriShort", language)}</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">{tTerm("objShort", language)}</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-18">{tTerm("totalShort", language)}</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">{tTerm("grade", language)}</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">{tTerm("gpa", language)}</th>
              </tr>
            </thead>
            <tbody>
              {studentResult.subjects.map((sr, idx) => (
                <tr
                  key={sr.subjectId}
                  className={`border-b border-zinc-300 text-center ${
                    sr.isOptional ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="border border-zinc-300 py-1.5 font-medium text-zinc-600 tabular-nums">
                    {formatResultNumber(idx + 1, language)}
                  </td>
                  <td className="border border-zinc-300 px-3 py-1.5 text-left font-semibold text-zinc-900">
                    {localizeSubjectName(sr.subjectName, language)}
                    {sr.isOptional && (
                      <span className="ml-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        {tTerm("fourthSubject", language)}
                      </span>
                    )}
                  </td>
                  <td className="border border-zinc-300 py-1.5 tabular-nums text-zinc-600">
                    {formatResultNumber(sr.maxMark, language)}
                  </td>
                  <td className="border border-zinc-300 py-1.5 tabular-nums text-zinc-800">
                    {formatResultNumber(sr.written, language)}
                  </td>
                  <td className="border border-zinc-300 py-1.5 tabular-nums text-zinc-800">
                    {formatResultNumber(sr.objective, language)}
                  </td>
                  <td className="border border-zinc-300 py-1.5 tabular-nums font-bold text-zinc-900">
                    {sr.absent ? (
                      <span className="text-rose-600">{tTerm("absent", language)}</span>
                    ) : (
                      formatResultNumber(sr.total, language)
                    )}
                  </td>
                  <td className="border border-zinc-300 py-1.5 font-bold">
                    <span
                      className={
                        sr.letter === "F"
                          ? "text-rose-600 font-bold"
                          : sr.letter === "A+"
                          ? "text-emerald-700 font-bold"
                          : "text-zinc-800"
                      }
                    >
                      {sr.letter}
                    </span>
                  </td>
                  <td className="border border-zinc-300 py-1.5 tabular-nums font-bold text-zinc-900">
                    {formatResultNumber(sr.gradePoint.toFixed(2), language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Optional Subject Bonus Box (if applicable) */}
          {studentResult.optionalSubjectResult && (
            <div className="mb-4 p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-bold">{tTerm("fourthSubjectBonus", language)}: </span>
                <span>
                  {localizeSubjectName(studentResult.optionalSubjectResult.subjectName, language)} (GP: {formatResultNumber(studentResult.optionalSubjectResult.gradePoint.toFixed(2), language)})
                </span>
                <span className="text-[11px] text-amber-700 ml-1">
                  · {language === "bn" ? "নিয়ম: ২.০০ এর উপরের পয়েন্ট জিপিএ-তে যোগ হয়েছে" : "Rule: Points above 2.00 added to GPA"}
                </span>
              </div>
              <div className="font-bold tabular-nums">
                +{formatResultNumber((studentResult.optionalBonusPoints || 0).toFixed(2), language)} GP Bonus
              </div>
            </div>
          )}

          {/* Final Results Grand Block */}
          <div className="border-2 border-zinc-900 bg-zinc-50 p-4 rounded-xl grid grid-cols-4 gap-3 text-center mb-6">
            <div className="border-r border-zinc-300 pr-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                {tTerm("totalMarks", language)}
              </span>
              <span className="text-lg font-black text-zinc-900 tabular-nums">
                {formatResultNumber(studentResult.totalMarksObtained, language)}
              </span>
            </div>
            <div className="border-r border-zinc-300 pr-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                {tTerm("gradePointAverage", language)}
              </span>
              <span className="text-2xl font-black text-indigo-700 tabular-nums">
                {formatResultNumber(studentResult.gpa.toFixed(2), language)}
              </span>
            </div>
            <div className="border-r border-zinc-300 pr-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                {tTerm("letterGrade", language)}
              </span>
              <span
                className={`text-xl font-black ${
                  studentResult.finalGradeLetter === "F" ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                {studentResult.finalGradeLetter}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                {tTerm("meritPosition", language)}
              </span>
              <span className="text-xl font-black text-amber-700 tabular-nums">
                #{studentResult.rank ? formatResultNumber(studentResult.rank, language) : "—"}
              </span>
            </div>
          </div>

          {/* Result Status Banner */}
          <div className="text-center mb-8">
            <span
              className={`inline-block px-6 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                studentResult.isPassed
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-rose-100 text-rose-800 border border-rose-300"
              }`}
            >
              {tTerm("status", language)}: {studentResult.isPassed ? tTerm("resultPassed", language) : tTerm("resultFailed", language)}
            </span>
          </div>

          {/* Signatures */}
          <div className="flex items-end justify-between text-xs text-zinc-700 pt-8 border-t border-zinc-300">
            <div className="text-center">
              <div className="w-40 border-b border-zinc-400 mb-1" />
              <p className="font-semibold">{tTerm("preparedBy", language)}</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-zinc-400 mb-1" />
              <p className="font-semibold">{tTerm("controllerOfExams", language)}</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-zinc-400 mb-1" />
              <p className="font-semibold">{tTerm("directorPrincipal", language)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
