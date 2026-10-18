"use client";

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
};

export default function PrintHeader({
  exam,
  year,
  schoolName = "Science Lab Coaching Center",
  printLimit = null,
  totalStudents = 0,
}: PrintHeaderProps) {
  const scopeText = printLimit
    ? `Merit Ranking — Top ${printLimit} Students`
    : totalStudents
    ? `Official Merit List (${totalStudents} Students)`
    : "Official Merit List";

  return (
    <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">
      {/* School / Coaching Name */}
      <h1 className="text-2xl font-bold uppercase tracking-wide">
        {schoolName}
      </h1>

      {/* Exam Title */}
      <h2 className="text-lg font-semibold mt-1">
        {exam.type} Examination — {exam.month} {year}
      </h2>

      {/* Class & Scope */}
      <p className="text-sm font-medium mt-1">
        Class: {exam.class} · {scopeText}
      </p>

      {/* Generated Date */}
      <p className="text-[11px] text-gray-500 mt-1">
        Generated on: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}