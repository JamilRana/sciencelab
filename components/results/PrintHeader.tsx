"use client";

type PrintHeaderProps = {
  exam: {
    type: string;
    month: string;
    class: string;
  };
  year: number;
  schoolName?: string;
};

export default function PrintHeader({
  exam,
  year,
  schoolName = "Science Lab Coaching Center",
}: PrintHeaderProps) {
  return (
    <div className="hidden print:block text-center mb-6 border-b-2 border-black pb-4">

      {/* School / Coaching Name */}
      <h1 className="text-2xl font-bold uppercase tracking-wide">
        {schoolName}
      </h1>

      {/* Exam Title */}
      <h2 className="text-lg font-semibold mt-2">
        {exam.type} Examination - {exam.month} {year}
      </h2>

      {/* Class */}
      <p className="text-sm">
        Class: {exam.class}
      </p>

      {/* Generated Date */}
      <p className="text-xs text-muted-foreground mt-2">
        Generated on: {new Date().toLocaleDateString()}
      </p>

    </div>
  );
}