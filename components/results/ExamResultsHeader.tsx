// components/results/ExamResultsHeader.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText, Printer, SlidersHorizontal, Globe } from "lucide-react";
import {
  ResultLanguage,
  tTerm,
  localizeClassName,
  localizeMonthName,
  formatResultNumber,
} from "@/lib/results-i18n";

interface ExamResultsHeaderProps {
  exam: any;
  year: number;
  role: string | null;
  printLimit?: number | null;
  onPrintLimitChange?: (limit: number | null) => void;
  totalStudents?: number;
  language?: ResultLanguage;
  onLanguageChange?: (lang: ResultLanguage) => void;
  orientation?: "portrait" | "landscape";
  onOrientationChange?: (orientation: "portrait" | "landscape") => void;
  examCount?: number;
}

export default function ExamResultsHeader({
  exam,
  year,
  role,
  printLimit = null,
  onPrintLimitChange,
  totalStudents = 0,
  language: languageProp,
  onLanguageChange,
  orientation: orientationProp,
  onOrientationChange,
  examCount: examCountProp,
}: ExamResultsHeaderProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const examCount = examCountProp ?? exam?.subjects?.length ?? 0;
  const effectiveOrientation =
    orientationProp ?? (examCount > 4 ? "landscape" : "portrait");

  const urlLang = searchParams?.get("lang") as ResultLanguage | null;
  const language: ResultLanguage =
    languageProp && languageProp !== "en"
      ? languageProp
      : urlLang === "bn" || urlLang === "bilingual" || urlLang === "en"
      ? urlLang
      : languageProp || "en";

  const handleSelectLang = (newLang: ResultLanguage) => {
    onLanguageChange?.(newLang);
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

  const [customInput, setCustomInput] = useState<string>("");

  const handleCustomChange = (val: string) => {
    setCustomInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed > 0) {
      onPrintLimitChange?.(parsed);
    } else if (val === "") {
      onPrintLimitChange?.(null);
    }
  };

  const presets = [
    { label: language === "bn" ? "সকল" : "All", value: null },
    { label: language === "bn" ? "সেরা ১০" : "Top 10", value: 10 },
    { label: language === "bn" ? "সেরা ২০" : "Top 20", value: 20 },
    { label: language === "bn" ? "সেরা ৩০" : "Top 30", value: 30 },
    { label: language === "bn" ? "সেরা ৫০" : "Top 50", value: 50 },
  ];

  return (
    <div className="mb-6 no-print space-y-4">
      {/* Back Link */}
      {(role === "ADMIN" || role === "STAFF") && (
        <Link
          href="/admin-route/exams"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Exams</span>
        </Link>
      )}
      {role === "STUDENT" && (
        <Link
          href="/student-route/results"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Results</span>
        </Link>
      )}
      {role === "TEACHER" && (
        <Link
          href="/teacher-route/results"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Results</span>
        </Link>
      )}

      {/* Main Header Card with Controls */}
      <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zinc-900">
                {tTerm("meritListTitle", language)}
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                {tTerm("class", language)} {localizeClassName(exam.class, language)}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              {exam.type} Examination · {localizeMonthName(exam.month, language)} {formatResultNumber(year, language)} · {formatResultNumber(totalStudents, language)} {tTerm("allStudents", language)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80 text-xs">
            <div className="flex items-center gap-1 px-1.5 text-[11px] font-semibold text-zinc-500">
              <Globe className="h-3.5 w-3.5 text-indigo-600" />
              <span>Lang:</span>
            </div>
            <button
              type="button"
              onClick={() => handleSelectLang("en")}
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
              onClick={() => handleSelectLang("bn")}
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
              onClick={() => handleSelectLang("bilingual")}
              className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                language === "bilingual"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200 font-bold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              Dual / উভয়
            </button>
          </div>

          {/* Page Orientation Selector */}
          <div className="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80 text-xs">
            <div className="flex items-center gap-1 px-1.5 text-[11px] font-semibold text-zinc-500">
              <svg className="h-3.5 w-3.5 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" />
              </svg>
              <span>{tTerm("pageOrientation", language)}:</span>
            </div>
            <button
              type="button"
              onClick={() => onOrientationChange?.("portrait")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                effectiveOrientation === "portrait"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200 font-bold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
              title="Portrait page orientation (A4)"
            >
              <span className="inline-block w-2.5 h-3.5 border border-current rounded-[1px] opacity-80" />
              <span>{tTerm("portrait", language).split(" ")[0]}</span>
            </button>
            <button
              type="button"
              onClick={() => onOrientationChange?.("landscape")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                effectiveOrientation === "landscape"
                  ? "bg-white text-zinc-900 shadow-xs border border-zinc-200 font-bold"
                  : "text-zinc-500 hover:text-zinc-900"
              }`}
              title="Landscape page orientation (A4 - recommended for >4 exams)"
            >
              <span className="inline-block w-3.5 h-2.5 border border-current rounded-[1px] opacity-80" />
              <span>{tTerm("landscape", language).split(" ")[0]}</span>
              {examCount > 4 && (
                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                  Auto
                </span>
              )}
            </button>
          </div>

          {/* Print Scope Selector */}
          <div className="flex items-center gap-1 bg-zinc-100/90 p-1 rounded-xl border border-zinc-200/80">
            <div className="flex items-center gap-1 px-2 text-[11px] font-semibold text-zinc-500">
              <SlidersHorizontal className="h-3 w-3" />
              <span>Print:</span>
            </div>

            {presets.map((preset) => {
              const isActive =
                preset.value === null
                  ? printLimit === null && !customInput
                  : printLimit === preset.value;

              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setCustomInput("");
                    onPrintLimitChange?.(preset.value);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-zinc-900 shadow-xs border border-zinc-200/80 font-bold"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}

            {/* Custom limit input */}
            <div className="flex items-center gap-1 pl-1.5 pr-1 border-l border-zinc-200">
              <span className="text-[10px] text-zinc-400 font-medium">
                {language === "bn" ? "শীর্ষ" : "Top"}
              </span>
              <input
                type="number"
                min="1"
                max={totalStudents || 999}
                placeholder="N"
                value={customInput}
                onChange={(e) => handleCustomChange(e.target.value)}
                className="w-11 h-6 px-1 text-center bg-white border border-zinc-300 rounded text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                title="Print specific number of top students"
              />
            </div>
          </div>

          {/* Print Trigger Button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors active:scale-98"
          >
            <Printer className="h-4 w-4" />
            <span>
              {language === "bn"
                ? `প্রিন্ট ${printLimit ? `(সেরা ${printLimit})` : ""}`
                : language === "bilingual"
                ? `Print / প্রিন্ট`
                : `Print ${printLimit ? `Top ${printLimit}` : "Results"}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
