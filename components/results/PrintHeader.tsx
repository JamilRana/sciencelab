// components/results/PrintHeader.tsx
"use client";

import { useSearchParams } from "next/navigation";
import {
  ResultLanguage,
  tTerm,
  localizeClassName,
  localizeMonthName,
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
};

export default function PrintHeader({
  exam,
  year,
  schoolName,
  printLimit = null,
  totalStudents = 0,
  language: languageProp,
}: PrintHeaderProps) {
  const searchParams = useSearchParams();
  const urlLang = searchParams?.get("lang") as ResultLanguage | null;
  const language: ResultLanguage =
    languageProp && languageProp !== "en"
      ? languageProp
      : urlLang === "bn" || urlLang === "bilingual" || urlLang === "en"
      ? urlLang
      : languageProp || "en";
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
      ? `${exam.type} পরীক্ষা — ${localizeMonthName(exam.month, "bn")} ${formatResultNumber(year, "bn")}`
      : language === "bilingual"
      ? `${exam.type} Examination / পরীক্ষা — ${exam.month} ${year}`
      : `${exam.type} Examination — ${exam.month} ${year}`;

  return (
    <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4 text-black">
      <div className="flex items-center justify-center gap-3 mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo2.png" alt="Logo" className="h-10 w-auto object-contain" />
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">
            {displaySchoolName}
          </h1>
          <p className="text-xs font-semibold uppercase text-gray-700">
            {tTerm("instituteSubtitle", language)}
          </p>
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
        {tTerm("generatedOn", language)}: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
