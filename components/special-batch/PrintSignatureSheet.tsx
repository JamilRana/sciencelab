"use client";

import { useState } from "react";
import Link from "next/link";
import { Printer, ArrowLeft, Users, FileCheck, Layers } from "lucide-react";
import { generateDisplayRoll } from "@/lib/roll";

export interface PrintSubjectConfig {
  id: number;
  name: string;
  code?: string;
  teacherName?: string;
  cqMax?: number;
  mcqMax?: number;
  practicalMax?: number;
  totalMax?: number;
}

export interface PrintStudentItem {
  id: number;
  name: string;
  roll: number;
  gender?: string;
  batchName?: string;
  batchCode: number;
  schoolName?: string;
}

interface PrintSignatureSheetProps {
  exam: {
    id: number;
    title: string;
    kind: string;
    examDate: string | Date;
    program?: { name: string; code: string };
    batch?: { name: string; code: number };
  };
  subjects: PrintSubjectConfig[];
  initialSubjectId?: number;
  students: PrintStudentItem[];
  onClose?: () => void;
}

export function PrintSignatureSheet({
  exam,
  subjects,
  initialSubjectId,
  students,
  onClose,
}: PrintSignatureSheetProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<number>(
    initialSubjectId || subjects[0]?.id || 0
  );
  const [sheetType, setSheetType] = useState<"attendance" | "marks">("attendance");
  const [sectionFilter, setSectionFilter] = useState<"ALL" | "BOYS" | "GIRLS">("ALL");

  const currentSubject =
    subjects.find((s) => s.id === selectedSubjectId) || subjects[0] || {
      id: 0,
      name: "General Subject",
    };

  // Filter students by section
  const filteredStudents = students.filter((stu) => {
    if (sectionFilter === "ALL") return true;
    const isBoy =
      stu.gender?.toLowerCase() === "male" ||
      stu.batchName?.toLowerCase().includes("boy");
    if (sectionFilter === "BOYS") return isBoy;
    if (sectionFilter === "GIRLS") return !isBoy;
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(exam.examDate).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sectionLabel =
    sectionFilter === "BOYS"
      ? "Boys Section"
      : sectionFilter === "GIRLS"
      ? "Girls Section"
      : "All Sections (Combined)";

  return (
    <div className="bg-white min-h-screen text-zinc-900 font-sans print:m-0 print:p-0">
      {/* Top Toolbar (Hidden on Print) */}
      <div className="sticky top-0 z-20 bg-zinc-900 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-4 print:hidden shadow-md">
        <div className="flex items-center gap-3">
          {onClose ? (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={`/admin-route/exams/special/${exam.id}/results`}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-300 transition-colors flex items-center gap-1 text-xs"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Results
            </Link>
          )}
          <div>
            <h3 className="text-sm font-bold">
              {sheetType === "attendance"
                ? "Exam Hall Attendance Register (Written + MCQ)"
                : "Evaluation & Signature Sheet"}
            </h3>
            <p className="text-xs text-zinc-400">
              {exam.title} · {currentSubject.name} ({filteredStudents.length} Students)
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sheet Type Toggle */}
          <div className="bg-zinc-800 p-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setSheetType("attendance")}
              className={`px-3 py-1.5 rounded transition-colors ${
                sheetType === "attendance"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Hall Attendance (Written/MCQ)
            </button>
            <button
              onClick={() => setSheetType("marks")}
              className={`px-3 py-1.5 rounded transition-colors ${
                sheetType === "marks"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Marks & Signatures
            </button>
          </div>

          {/* Section Filter */}
          <div className="bg-zinc-800 p-1 rounded-lg flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setSectionFilter("ALL")}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                sectionFilter === "ALL"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              All ({students.length})
            </button>
            <button
              onClick={() => setSectionFilter("BOYS")}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                sectionFilter === "BOYS"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Boys
            </button>
            <button
              onClick={() => setSectionFilter("GIRLS")}
              className={`px-2.5 py-1.5 rounded transition-colors ${
                sectionFilter === "GIRLS"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Girls
            </button>
          </div>

          {/* Subject Switcher (if multiple subjects exist) */}
          {subjects.length > 1 && (
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
              className="bg-zinc-800 text-white text-xs rounded-lg px-3 py-2 border border-zinc-700 font-medium focus:ring-1 focus:ring-indigo-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.code ? `(${s.code})` : ""}
                </option>
              ))}
            </select>
          )}

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-all"
          >
            <Printer className="h-4 w-4" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet Container */}
      <div className="max-w-[210mm] mx-auto p-8 print:p-2 print:max-w-none text-zinc-900">
        {/* Institute Header */}
        <div className="text-center border-b-2 border-zinc-900 pb-3 mb-4">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Logo" className="h-9 w-auto object-contain" />
            <h1 className="text-xl font-black uppercase tracking-wider text-zinc-900">
              Science Lab Coaching Center
            </h1>
          </div>
          <p className="text-xs text-zinc-600 uppercase font-medium tracking-wide">
            Special Care Academic Program · SSC & Junior Examination Wing
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-4 py-1 bg-zinc-100 border border-zinc-300 rounded font-bold text-xs uppercase tracking-widest text-zinc-800">
            <span>
              {sheetType === "attendance"
                ? "Exam Hall Signature & Attendance Register"
                : "Evaluation & Marks Signature Sheet"}
            </span>
            <span className="text-zinc-400">|</span>
            <span className="text-indigo-700">{sectionLabel}</span>
          </div>
        </div>

        {/* Examination Meta Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border border-zinc-300 bg-zinc-50/50 p-3 rounded mb-4">
          <div>
            <span className="font-semibold text-zinc-600">Examination: </span>
            <span className="font-bold text-zinc-900">
              {exam.title} ({exam.kind.replace("_", " ")})
            </span>
          </div>
          <div>
            <span className="font-semibold text-zinc-600">Program / Batch: </span>
            <span className="font-bold text-zinc-900">
              {exam.program?.name || "Special Batch"} — {exam.batch?.name || sectionLabel}
            </span>
          </div>
          <div>
            <span className="font-semibold text-zinc-600">Subject: </span>
            <span className="font-bold text-zinc-900">
              {currentSubject.name} {currentSubject.code ? `(${currentSubject.code})` : ""}
            </span>
          </div>
          <div>
            <span className="font-semibold text-zinc-600">Max Marks: </span>
            <span className="font-bold text-zinc-900">
              Total: {currentSubject.totalMax ?? "—"}
              {currentSubject.cqMax ? ` (Written: ${currentSubject.cqMax})` : ""}
              {currentSubject.mcqMax ? ` (MCQ: ${currentSubject.mcqMax})` : ""}
            </span>
          </div>
          <div>
            <span className="font-semibold text-zinc-600">Date: </span>
            <span className="font-bold text-zinc-900">{formattedDate}</span>
          </div>
          <div>
            <span className="font-semibold text-zinc-600">Invigilator: </span>
            <span className="text-zinc-800">
              {currentSubject.teacherName || "________________________"}
            </span>
          </div>
        </div>

        {/* Students Table */}
        <table className="w-full text-xs border-collapse border border-zinc-400 print:text-[11px]">
          <thead>
            {sheetType === "attendance" ? (
              <tr className="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-400 text-center">
                <th className="border border-zinc-400 px-1.5 py-1.5 w-10">Sl</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-20">Display Roll</th>
                <th className="border border-zinc-400 px-2 py-1.5 text-left">Student Name</th>
                <th className="border border-zinc-400 px-2 py-1.5 text-left w-32">Feeder School</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-24">Written Script No.</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-32">Written Signature</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-24">MCQ OMR No.</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-32">MCQ Signature</th>
                <th className="border border-zinc-400 px-1.5 py-1.5 w-16">Invig. Initial</th>
              </tr>
            ) : (
              <tr className="bg-zinc-100 text-zinc-900 font-bold border-b border-zinc-400 text-center">
                <th className="border border-zinc-400 px-1.5 py-1.5 w-10">Sl</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-24">Display Roll</th>
                <th className="border border-zinc-400 px-3 py-1.5 text-left">Student Name</th>
                <th className="border border-zinc-400 px-2 py-1.5 text-left w-36">Feeder School</th>
                <th className="border border-zinc-400 px-2 py-1.5 w-20">
                  Written ({currentSubject.cqMax ?? "—"})
                </th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">
                  MCQ ({currentSubject.mcqMax ?? "—"})
                </th>
                <th className="border border-zinc-400 px-2 py-1.5 w-16">
                  Total ({currentSubject.totalMax ?? "—"})
                </th>
                <th className="border border-zinc-400 px-2 py-1.5 w-36">Student Signature</th>
                <th className="border border-zinc-400 px-1.5 py-1.5 w-16">Sign / Init</th>
              </tr>
            )}
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td
                  colSpan={sheetType === "attendance" ? 9 : 9}
                  className="p-8 text-center text-zinc-500 font-medium"
                >
                  No students found for this section.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student, index) => {
                const displayRoll = student.batchCode
                  ? generateDisplayRoll(student.batchCode, student.roll)
                  : student.roll;

                return (
                  <tr
                    key={student.id}
                    className="border-b border-zinc-300 h-9 print:h-8 break-inside-avoid"
                  >
                    <td className="border border-zinc-300 text-center font-medium tabular-nums text-zinc-600">
                      {index + 1}
                    </td>
                    <td className="border border-zinc-300 text-center font-bold tabular-nums text-zinc-900">
                      {displayRoll}
                    </td>
                    <td className="border border-zinc-300 px-2 font-semibold text-zinc-900">
                      {student.name}
                    </td>
                    <td className="border border-zinc-300 px-2 text-zinc-600 truncate max-w-[130px]">
                      {student.schoolName || "—"}
                    </td>

                    {sheetType === "attendance" ? (
                      <>
                        <td className="border border-zinc-300 text-center"></td>
                        <td className="border border-zinc-300 text-center"></td>
                        <td className="border border-zinc-300 text-center"></td>
                        <td className="border border-zinc-300 text-center"></td>
                        <td className="border border-zinc-300 text-center"></td>
                      </>
                    ) : (
                      <>
                        <td className="border border-zinc-300 text-center"></td>
                        <td className="border border-zinc-300 text-center"></td>
                        <td className="border border-zinc-300 text-center"></td>
                        <td className="border border-zinc-300 text-center"></td>
                        <td className="border border-zinc-300 text-center"></td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Hall Attendance Summary Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-300 grid grid-cols-4 gap-3 text-xs text-zinc-700 break-inside-avoid">
          <div className="p-2 border border-zinc-200 rounded">
            <span className="font-semibold">Registered: </span>
            <span className="font-bold tabular-nums">{filteredStudents.length}</span>
          </div>
          <div className="p-2 border border-zinc-200 rounded">
            <span className="font-semibold">Present: </span>
            <span>________</span>
          </div>
          <div className="p-2 border border-zinc-200 rounded">
            <span className="font-semibold">Absent: </span>
            <span>________</span>
          </div>
          <div className="p-2 border border-zinc-200 rounded">
            <span className="font-semibold">Room / Hall No: </span>
            <span>________</span>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-12 flex items-end justify-between text-xs text-zinc-700 pt-6 break-inside-avoid">
          <div className="text-center">
            <div className="w-44 border-b border-zinc-400 mb-1" />
            <p className="font-semibold">Hall Invigilator's Signature</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-zinc-400 mb-1" />
            <p className="font-semibold">Prepared By</p>
          </div>
          <div className="text-center">
            <div className="w-44 border-b border-zinc-400 mb-1" />
            <p className="font-semibold">Controller of Examinations</p>
          </div>
        </div>
      </div>
    </div>
  );
}
