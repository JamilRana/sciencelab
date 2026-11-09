// components/results/PrintHeader.tsx
"use client";

import { useSearchParams } from "next/navigation";
import {
  ResultLanguage,
  tTerm,
  localizeClassName,
  localizeMonthName,
  localizeExamType,
  formatResultNumber,
} from "@/lib/results-i18n";

type PrintHeaderProps = {
  exam: {
    type: string;
    month: string;
    class: string;
  };
  year: number;
  schoolName?: string;
  printLimit?: number | null;
  totalStudents?: number;
  language?: ResultLanguage;
  orientation?: "portrait" | "landscape";
};

export default function PrintHeader({
  exam,
  year,
  schoolName,
  printLimit = null,
  totalStudents = 0,
  language: languageProp,
  orientation = "portrait",
}: PrintHeaderProps) {
  const searchParams = useSearchParams();
  const urlLang = searchParams?.get("lang") as ResultLanguage | null;
  const language: ResultLanguage =
    languageProp ||
    (urlLang === "bn" || urlLang === "bilingual" || urlLang === "en" ? urlLang : "bn");
  const displaySchoolName = schoolName || tTerm("instituteName", language);

  let scopeText = "";
  if (language === "bn") {
    scopeText = printLimit
      ? `মেধাক্রম — সেরা ${formatResultNumber(printLimit, "bn")} জন শিক্ষার্থী`
      : totalStudents
      ? `অফিসিয়াল মেধা তালিকা (${formatResultNumber(totalStudents, "bn")} জন শিক্ষার্থী)`
      : "অফিসিয়াল মেধা তালিকা";
  } else if (language === "bilingual") {
    scopeText = printLimit
      ? `Merit Ranking — Top ${printLimit} Students / মেধাক্রম — সেরা ${formatResultNumber(printLimit, "bn")} জন`
      : totalStudents
      ? `Official Merit List (${totalStudents} Students / শিক্ষার্থী)`
      : "Official Merit List / মেধা তালিকা";
  } else {
    scopeText = printLimit
      ? `Merit Ranking — Top ${printLimit} Students`
      : totalStudents
      ? `Official Merit List (${totalStudents} Students)`
      : "Official Merit List";
  }

  const examTitle =
    language === "bn"
      ? `${localizeExamType(exam.type, "bn")} — ${localizeMonthName(exam.month, "bn")} ${formatResultNumber(year, "bn")}`
      : language === "bilingual"
      ? `${exam.type} Examination / পরীক্ষা — ${localizeMonthName(exam.month, "bilingual")} ${year}`
      : `${exam.type} Examination — ${exam.month} ${year}`;

  const generatedDateDisplay =
    language === "bn"
      ? formatResultNumber(
          new Date().toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
          "bn"
        )
      : new Date().toLocaleDateString();

  return (
    <div
      className={`hidden print:block text-center border-b-2 border-black text-black ${
        orientation === "landscape" ? "mb-3 pb-2" : "mb-5 pb-3.5"
      }`}
    >
      <div className="flex items-center justify-center gap-3 mb-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo2.png" alt="Logo" className="h-10 w-auto object-contain" />
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            {displaySchoolName}
          </h1>
          {tTerm("instituteSubtitle", language) && (
            <p className="text-xs font-semibold uppercase text-gray-700">
              {tTerm("instituteSubtitle", language)}
            </p>
          )}
        </div>
      </div>

      {/* Exam Title */}
      <h2 className="text-lg font-semibold mt-1">
        {examTitle}
      </h2>

      {/* Class & Scope */}
      <p className="text-sm font-medium mt-1">
        {tTerm("class", language)}: {localizeClassName(exam.class, language)} · {scopeText}
      </p>

      {/* Generated Date */}
      <p className="text-[11px] text-gray-600 mt-1">
        {tTerm("generatedOn", language)}: {generatedDateDisplay}
      </p>
    </div>
  );
}
