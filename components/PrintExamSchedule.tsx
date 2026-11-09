"use client";

import { useState } from "react";
import { Printer, ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";
import {
  localizeSubjectName,
  localizeClassName,
  localizeMonthName,
  localizeExamType,
  formatResultNumber,
} from "@/lib/results-i18n";

interface ExamSubject {
  id: number;
  subject: string;
  teacher: { name: string };
  totalMark: number;
  examDate: Date;
  examTime: string;
  topics: string;
}

interface Exam {
  id: number;
  type: string;
  month: string;
  year: string; // ✅ NEW FIELD
  class: string;
  subjects: ExamSubject[];
}

interface PrintExamProps {
  exam: Exam;
}

export function PrintExamSchedule({ exam }: PrintExamProps) {
  const [language, setLanguage] = useState<"bn" | "en">("bn");

  const handlePrint = () => {
    window.print();
  };

  const isBn = language === "bn";

  const examTitle = isBn
    ? `${localizeExamType(exam.type, "bn")} — ${localizeMonthName(exam.month, "bn")} ${formatResultNumber(exam.year, "bn")}`
    : `${exam.type} Examination – ${exam.month} ${exam.year}`;

  const classLabel = isBn
    ? `শ্রেণি: ${localizeClassName(exam.class, "bn")}`
    : `Class: ${exam.class}`;

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-xl border border-zinc-200">
        <Link
          href={`/admin-route/exams/${exam.id}/subjects`}
          className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg text-xs">
            <Globe className="h-3.5 w-3.5 text-zinc-500 ml-1.5 mr-0.5" />
            <button
              type="button"
              onClick={() => setLanguage("bn")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                isBn ? "bg-white text-zinc-900 shadow-xs font-bold" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                !isBn ? "bg-white text-zinc-900 shadow-xs font-bold" : "text-zinc-500 hover:text-zinc-900"
              }`}
            >
              English
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Printer className="h-4 w-4" />
            {isBn ? "প্রিন্ট করুন" : "Print Schedule"}
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="print-wrapper p-4">
          {[1, 2].map((copy) => (
            <div key={copy} className="print-area">
              {/* Header */}
              <div className="text-center mb-6 border-b pb-3">
                <div className="flex items-center justify-center gap-3 mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo2.png" alt="Science Lab" className="h-10 w-auto object-contain" />
                  <div>
                    <h1 className="board-title">
                      Science Lab
                    </h1>
                    <p className="board-subtitle">
                      Coaching Center
                    </p>
                  </div>
                </div>
                <p className="board-division">
                  {isBn ? "একাডেমিক কেয়ার ও পরীক্ষা বিভাগ" : "Academic Care & Examination Division"}
                </p>
                <p className="exam-meta">
                  {examTitle}
                </p>
                <p className="exam-meta">
                  {classLabel}
                </p>
              </div>

              {/* Table */}
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "6%" }}>{isBn ? "ক্র." : "SL"}</th>
                    <th style={{ width: "16%" }}>{isBn ? "বিষয়" : "Subject"}</th>
                    <th style={{ width: "14%" }}>{isBn ? "শিক্ষক" : "Teacher"}</th>
                    <th style={{ width: "8%" }}>{isBn ? "পূর্ণমান" : "Marks"}</th>
                    <th style={{ width: "11%" }}>{isBn ? "তারিখ" : "Date"}</th>
                    <th style={{ width: "12%" }}>{isBn ? "সময়" : "Time"}</th>
                    <th style={{ width: "33%" }}>{isBn ? "সিলেবাস / বিষয়বস্তু" : "Topics"}</th>
                  </tr>
                </thead>
                <tbody>
                  {exam.subjects.map((subject, index) => {
                    const topicsArray = subject.topics
                      ? subject.topics.split(",")
                      : [];

                    const isLongTopics = topicsArray.length > 5;
                    const dateFormatted = new Date(subject.examDate).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    });

                    return (
                      <tr key={subject.id}>
                        <td style={{ textAlign: "center" }}>
                          {isBn ? formatResultNumber(index + 1, "bn") : index + 1}
                        </td>
                        <td className="font-semibold">
                          {isBn ? localizeSubjectName(subject.subject, "bn") : subject.subject}
                        </td>
                        <td>{subject.teacher?.name || "—"}</td>
                        <td style={{ textAlign: "center", fontWeight: "bold" }}>
                          {isBn ? formatResultNumber(subject.totalMark, "bn") : subject.totalMark}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {isBn ? formatResultNumber(dateFormatted, "bn") : dateFormatted}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {isBn ? formatResultNumber(subject.examTime, "bn") : subject.examTime}
                        </td>
                        <td className={isLongTopics ? "small-topics" : ""}>
                          {topicsArray.length > 0 ? (
                            <ul className="topics-list">
                              {topicsArray.map((topic, i) => (
                                <li key={i}>{topic.trim()}</li>
                              ))}
                            </ul>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer */}
              <div className="footer-sign">
                <div>
                  <p>{isBn ? "কর্তৃপক্ষের স্বাক্ষর" : "Authorized Signature"}</p>
                  <div className="sign-line"></div>
                </div>
                <div>
                  <p>{isBn ? "তারিখ" : "Date"}</p>
                  <div className="sign-line short"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .print-wrapper,
          .print-wrapper * {
            visibility: visible;
          }

          .print-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }

          .print-area {
            border-right: 1px dashed #000;
            padding: 15px;
            font-size: 11px;
            line-height: 1.3;
            page-break-inside: avoid;
          }

          .print-area:last-child {
            border-right: none;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          th {
            border: 1px solid #000;
            padding: 6px;
            font-weight: bold;
            text-align: center;
            font-size: 11px;
          }

          td {
            border: 1px solid #000;
            padding: 6px;
            vertical-align: top;
            font-size: 11px;
          }

          .topics-list {
            padding-left: 15px;
            margin: 0;
          }

          .topics-list li {
            margin-bottom: 2px;
          }

          .small-topics {
            font-size: 9px;
            line-height: 1.2;
          }

          .board-title {
            font-size: 18px;
            font-weight: bold;
            letter-spacing: 1px;
            margin: 0;
          }

          .board-subtitle {
            font-size: 14px;
            margin: 2px 0;
            font-weight: 500;
          }

          .board-division {
            font-size: 11px;
            color: #555;
            margin: 2px 0;
            font-weight: 600;
          }

          .exam-meta {
            font-size: 13px;
            margin: 1px 0;
            font-weight: 600;
          }

          .footer-sign {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
          }

          .sign-line {
            height: 25px;
            border-bottom: 1px solid #000;
            width: 140px;
            margin-top: 10px;
          }

          .sign-line.short {
            width: 100px;
          }

          .no-print {
            display: none !important;
          }

          /* ✅ LANDSCAPE MODE */
          @page {
            size: A4 landscape;
            margin: 12mm;
          }
        }
      `}</style>
    </div>
  );
}