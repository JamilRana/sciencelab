"use client";

import { Printer, ArrowLeft } from "lucide-react";
import { ProcessedStudentExamResult } from "@/lib/special-batch-results";

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
}

export function PrintBoardMarksheet({
  exam,
  studentResult,
  onClose,
}: PrintBoardMarksheetProps) {
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
      <div className="sticky top-0 z-20 bg-zinc-900 text-white px-6 py-3 flex items-center justify-between print:hidden shadow-md">
        <div className="flex items-center gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h3 className="text-sm font-bold">Academic Transcript / Official Marksheet</h3>
            <p className="text-xs text-zinc-400">
              {studentResult.student.name} · Roll #{studentResult.student.displayRoll} · {exam.title}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all focus-ring"
        >
          <Printer className="h-4 w-4" />
          <span>Print Marksheet (A4)</span>
        </button>
      </div>

      {/* A4 Sheet Container */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-4 print:max-w-none">
        {/* Certificate Border Frame */}
        <div className="border-2 border-indigo-900 p-6 rounded-xl relative">
          {/* Header */}
          <div className="text-center border-b-2 border-zinc-900 pb-4 mb-4">
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">
              Science Lab Coaching Center
            </h1>
            <p className="text-xs text-zinc-600 font-medium">
              Academic Care & Board Standard Examination Division
            </p>
            <div className="mt-2 inline-block px-4 py-1 bg-zinc-900 text-white rounded font-bold text-xs uppercase tracking-widest">
              Official Academic Transcript & Marksheet
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
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Candidate Name</span>
                  <span className="font-bold text-sm text-zinc-900">{studentResult.student.name}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Display Roll</span>
                  <span className="font-bold text-sm text-indigo-700 tabular-nums">
                    #{studentResult.student.displayRoll}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-200">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Feeder School</span>
                  <span className="font-semibold text-zinc-800">
                    {studentResult.student.schoolName || "Science Lab"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Program / Batch</span>
                  <span className="font-semibold text-zinc-800">
                    {exam.program?.name || "Special Batch"} ({exam.batch?.name || "Batch"})
                  </span>
                </div>
              </div>
            </div>

            {/* Grading System Scale Box (1 col) */}
            <div className="border border-zinc-300 p-2 rounded-lg bg-white text-[10px] leading-tight">
              <p className="font-bold text-center text-zinc-800 border-b border-zinc-200 pb-1 mb-1 uppercase tracking-wider">
                Board Grading Scale
              </p>
              <div className="space-y-0.5 text-zinc-600">
                <div className="flex justify-between"><span>80-100%</span><span className="font-bold text-zinc-800">A+ (5.0)</span></div>
                <div className="flex justify-between"><span>70-79%</span><span className="font-medium">A (4.0)</span></div>
                <div className="flex justify-between"><span>60-69%</span><span className="font-medium">A- (3.5)</span></div>
                <div className="flex justify-between"><span>50-59%</span><span className="font-medium">B (3.0)</span></div>
                <div className="flex justify-between"><span>40-49%</span><span className="font-medium">C (2.0)</span></div>
                <div className="flex justify-between"><span>33-39%</span><span className="font-medium">D (1.0)</span></div>
                <div className="flex justify-between"><span>00-32%</span><span className="font-bold text-rose-600">F (0.0)</span></div>
              </div>
            </div>
          </div>

          {/* Subjects Table */}
          <table className="w-full text-xs border-collapse border border-zinc-400 mb-4">
            <thead>
              <tr className="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-400 text-center">
                <th className="border border-zinc-400 px-2 py-1.5 w-10">Sl</th>
                <th className="border border-zinc-400 px-3 py-1.5 text-left">Subject Name</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">Full</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">Written</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">Objective</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-18">Total</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">Grade</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">GP</th>
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
                    {idx + 1}
                  </td>
                  <td className="border border-zinc-300 px-3 py-1.5 text-left font-semibold text-zinc-900">
                    {sr.subjectName}
                    {sr.isOptional && (
                      <span className="ml-1.5 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                        4th Subject
                      </span>
                    )}
                  </td>
                  <td className="border border-zinc-300 py-1.5 tabular-nums text-zinc-600">{sr.maxMark}</td>
                  <td className="border border-zinc-300 py-1.5 tabular-nums text-zinc-800">{sr.written}</td>
                  <td className="border border-zinc-300 py-1.5 tabular-nums text-zinc-800">{sr.objective}</td>
                  <td className="border border-zinc-300 py-1.5 tabular-nums font-bold text-zinc-900">
                    {sr.absent ? <span className="text-rose-600">ABS</span> : sr.total}
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
                    {sr.gradePoint.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Optional Subject Bonus Box (if applicable) */}
          {studentResult.optionalSubjectResult && (
            <div className="mb-4 p-2.5 bg-amber-50/60 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
              <div>
                <span className="font-bold">4th Subject Bonus Calculation: </span>
                <span>
                  {studentResult.optionalSubjectResult.subjectName} (GP: {studentResult.optionalSubjectResult.gradePoint.toFixed(2)})
                </span>
                <span className="text-[11px] text-amber-700 ml-1">
                  · Rule: Points above 2.00 added to GPA
                </span>
              </div>
              <div className="font-bold tabular-nums">
                +{(studentResult.optionalBonusPoints || 0).toFixed(2)} GP Bonus
              </div>
            </div>
          )}

          {/* Final Results Grand Block */}
          <div className="border-2 border-zinc-900 bg-zinc-50 p-4 rounded-xl grid grid-cols-4 gap-3 text-center mb-6">
            <div className="border-r border-zinc-300 pr-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Marks</span>
              <span className="text-lg font-black text-zinc-900 tabular-nums">
                {studentResult.totalMarksObtained}
              </span>
            </div>
            <div className="border-r border-zinc-300 pr-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Grade Point Average</span>
              <span className="text-2xl font-black text-indigo-700 tabular-nums">
                {studentResult.gpa.toFixed(2)}
              </span>
            </div>
            <div className="border-r border-zinc-300 pr-2">
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Letter Grade</span>
              <span
                className={`text-xl font-black ${
                  studentResult.finalGradeLetter === "F" ? "text-rose-600" : "text-emerald-700"
                }`}
              >
                {studentResult.finalGradeLetter}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Merit Position</span>
              <span className="text-xl font-black text-amber-700 tabular-nums">
                #{studentResult.rank || "—"}
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
              Result: {studentResult.isPassed ? "PASSED (Promoted)" : "FAILED (Needs Retake)"}
            </span>
          </div>

          {/* Signatures */}
          <div className="flex items-end justify-between text-xs text-zinc-700 pt-8 border-t border-zinc-300">
            <div className="text-center">
              <div className="w-40 border-b border-zinc-400 mb-1" />
              <p className="font-semibold">Prepared By</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-zinc-400 mb-1" />
              <p className="font-semibold">Controller of Examinations</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-b border-zinc-400 mb-1" />
              <p className="font-semibold">Director / Principal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
