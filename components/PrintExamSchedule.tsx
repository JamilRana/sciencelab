"use client";

import { Printer, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex items-center justify-between no-print">
        <Link
          href={`/admin-route/exams/${exam.id}/subjects`}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Printer className="h-4 w-4" />
          Print
        </button>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="print-wrapper p-4">
          {[1, 2].map((copy) => (
            <div key={copy} className="print-area">
              {/* Header */}
              <div className="text-center mb-6 border-b pb-3">
                <h1 className="board-title">
                  ABC HIGH SCHOOL
                </h1>
                <p className="board-subtitle">
                  Academic Examination Schedule
                </p>
                <p className="exam-meta">
                  {exam.type} Examination – {exam.month} {exam.year}
                </p>
                <p className="exam-meta">
                  Class: {exam.class}
                </p>
              </div>

              {/* Table */}
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "5%" }}>SL</th>
                    <th style={{ width: "14%" }}>Subject</th>
                    <th style={{ width: "14%" }}>Teacher</th>
                    <th style={{ width: "7%" }}>Marks</th>
                    <th style={{ width: "10%" }}>Date</th>
                    <th style={{ width: "12%" }}>Time</th>
                    <th style={{ width: "38%" }}>Topics</th>
                  </tr>
                </thead>
                <tbody>
                  {exam.subjects.map((subject, index) => {
                    const topicsArray = subject.topics
                      ? subject.topics.split(",")
                      : [];

                    const isLongTopics = topicsArray.length > 5;

                    return (
                      <tr key={subject.id}>
                        <td>{index + 1}</td>
                        <td>{subject.subject}</td>
                        <td>{subject.teacher.name}</td>
                        <td style={{ textAlign: "center" }}>
                          {subject.totalMark}
                        </td>
                        <td>
                          {new Date(
                            subject.examDate
                          ).toLocaleDateString()}
                        </td>
                        <td>{subject.examTime}</td>
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
                  <p>Principal Signature</p>
                  <div className="sign-line"></div>
                </div>
                <div>
                  <p>Date</p>
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

          .exam-meta {
            font-size: 13px;
            margin: 1px 0;
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