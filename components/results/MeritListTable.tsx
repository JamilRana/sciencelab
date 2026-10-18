"use client";

import { Trophy, Medal, Award, Printer } from "lucide-react";
import { generateDisplayRollString } from "@/lib/roll";

interface Subject {
  id: number;
  subject: string;
  totalMark: number;
}

interface ExamResultItem {
  position: number;
  total: number;
  percentage?: string;
  maxPossible?: number;
  isCurrentStudent?: boolean;
  student: {
    id: number;
    name: string;
    roll: number;
    class: string;
    batch?: { code: number; name: string };
  };
  subjectMarks: Array<{
    subject: string;
    written: number;
    objective: number;
    total: number;
  }>;
}

interface MeritListTableProps {
  data: {
    id: number;
    type: string;
    month: string;
    class: string;
    subjects: Subject[];
  };
  results: ExamResultItem[];
  printLimit?: number | null;
  onPrintLimitChange?: (limit: number | null) => void;
}

export default function MeritListTable({
  data,
  results,
  printLimit = null,
  onPrintLimitChange,
}: MeritListTableProps) {
  const top1 = results.find((r) => r.position === 1);
  const top2 = results.find((r) => r.position === 2);
  const top3 = results.find((r) => r.position === 3);

  const getRollString = (student: any) => {
    return student?.batch?.code && student?.roll
      ? generateDisplayRollString(student.batch.code, student.roll)
      : student?.roll;
  };

  const isLimited = printLimit !== null && printLimit !== undefined && printLimit < results.length;

  return (
    <div className="space-y-6">
      {/* Active Print Limit Notice Banner */}
      {isLimited && (
        <div className="no-print flex items-center justify-between px-4 py-2.5 bg-indigo-50/90 border border-indigo-200/90 rounded-xl text-xs text-indigo-900 shadow-xs">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>
              Print scope active: Showing <strong>Top {printLimit}</strong> students in print preview ({results.length - printLimit} students will be excluded on paper/PDF).
            </span>
          </div>
          <button
            type="button"
            onClick={() => onPrintLimitChange?.(null)}
            className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline ml-3 shrink-0"
          >
            Reset to print all ({results.length})
          </button>
        </div>
      )}

      {/* Podium Top 3 View */}
      {results.length >= 3 && (
        <div className="no-print grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 2nd Place (Silver) */}
          {top2 && (
            <div className="p-4 rounded-xl bg-gradient-to-b from-zinc-100 to-white border border-zinc-200/80 shadow-xs flex flex-col items-center text-center order-2 md:order-1 mt-0 md:mt-4">
              <div className="h-10 w-10 rounded-full bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center text-sm shadow-xs mb-2">
                2
              </div>
              <Medal className="h-5 w-5 text-zinc-400 mb-1" />
              <h3 className="font-bold text-zinc-900 text-sm">{top2.student.name}</h3>
              <p className="text-[11px] text-zinc-400 tabular-nums">Roll #{getRollString(top2.student)}</p>
              <div className="mt-2.5 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-lg">
                <span className="text-sm font-extrabold text-zinc-800 tabular-nums">{top2.total}</span>
                <span className="text-[10px] text-zinc-400 font-normal ml-1">pts ({top2.percentage}%)</span>
              </div>
            </div>
          )}

          {/* 1st Place (Gold) */}
          {top1 && (
            <div className="p-5 rounded-xl bg-gradient-to-b from-amber-50 to-white border border-amber-200 shadow-sm flex flex-col items-center text-center order-1 md:order-2 ring-2 ring-amber-100">
              <div className="h-12 w-12 rounded-full bg-amber-400 text-amber-950 font-extrabold flex items-center justify-center text-base shadow-sm mb-2">
                1
              </div>
              <Trophy className="h-6 w-6 text-amber-500 mb-1" />
              <h3 className="font-extrabold text-zinc-900 text-base">{top1.student.name}</h3>
              <p className="text-xs text-amber-700/80 font-medium tabular-nums">Roll #{getRollString(top1.student)}</p>
              <div className="mt-3 px-3.5 py-1.5 bg-amber-100/60 border border-amber-200 rounded-lg">
                <span className="text-base font-extrabold text-amber-950 tabular-nums">{top1.total}</span>
                <span className="text-xs text-amber-800 font-medium ml-1">pts ({top1.percentage}%)</span>
              </div>
            </div>
          )}

          {/* 3rd Place (Bronze) */}
          {top3 && (
            <div className="p-4 rounded-xl bg-gradient-to-b from-amber-50/40 to-white border border-amber-200/50 shadow-xs flex flex-col items-center text-center order-3 mt-0 md:mt-8">
              <div className="h-10 w-10 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center text-sm shadow-xs mb-2">
                3
              </div>
              <Award className="h-5 w-5 text-amber-600 mb-1" />
              <h3 className="font-bold text-zinc-900 text-sm">{top3.student.name}</h3>
              <p className="text-[11px] text-zinc-400 tabular-nums">Roll #{getRollString(top3.student)}</p>
              <div className="mt-2.5 px-3 py-1 bg-zinc-50 border border-zinc-200 rounded-lg">
                <span className="text-sm font-extrabold text-zinc-800 tabular-nums">{top3.total}</span>
                <span className="text-[10px] text-zinc-400 font-normal ml-1">pts ({top3.percentage}%)</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ranked Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-zinc-900">
              Merit Ranking ({results.length} Students)
            </h2>
          </div>
          <span className="text-xs text-zinc-400 font-medium">
            Class {data.class} · {data.month} ({data.type})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px] print:text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider print:bg-white print:border-b-2 print:border-black">
              <tr>
                <th className="py-2.5 px-3.5 w-16 text-center">Rank</th>
                <th className="py-2.5 px-3.5 w-24">Roll</th>
                <th className="py-2.5 px-4 min-w-[160px]">Student Name</th>
                {data.subjects.map((s) => (
                  <th key={s.id} className="py-2.5 px-3 text-center min-w-[80px]">
                    {s.subject}
                    <span className="block text-[9px] text-zinc-400 font-normal print:hidden">/{s.totalMark}</span>
                  </th>
                ))}
                <th className="py-2.5 px-3.5 text-center w-24">Total</th>
                <th className="py-2.5 px-3.5 text-center w-20">Score</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 print:divide-zinc-300">
              {results.map((r, index) => {
                const isPodium = r.position <= 3;
                const isExcludedFromPrint =
                  printLimit !== null && printLimit !== undefined && index >= printLimit;

                return (
                  <tr
                    key={r.student.id}
                    className={`hover:bg-zinc-50/70 transition-colors ${
                      isExcludedFromPrint ? "print:hidden" : ""
                    } ${
                      r.isCurrentStudent
                        ? "bg-indigo-50/40 font-semibold"
                        : isPodium
                        ? "bg-amber-50/20"
                        : ""
                    }`}
                  >
                    {/* Rank Badge */}
                    <td className="py-2.5 px-3.5 text-center">
                      <span
                        className={`inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold tabular-nums print:text-black print:bg-transparent ${
                          r.position === 1
                            ? "bg-amber-400 text-amber-950 shadow-xs"
                            : r.position === 2
                            ? "bg-zinc-200 text-zinc-800"
                            : r.position === 3
                            ? "bg-amber-200 text-amber-900"
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {r.position}
                      </span>
                    </td>

                    {/* Roll */}
                    <td className="py-2.5 px-3.5 font-bold text-xs text-indigo-700 tabular-nums print:text-black">
                      {getRollString(r.student)}
                    </td>

                    {/* Student Name */}
                    <td className="py-2.5 px-4">
                      <p className="font-semibold text-zinc-900 truncate">{r.student.name}</p>
                      <p className="text-[10px] text-zinc-400 print:hidden">{r.student.batch?.name}</p>
                    </td>

                    {/* Subject Scores */}
                    {data.subjects.map((s) => {
                      const mark = r.subjectMarks.find((m) => m.subject === s.subject);
                      return (
                        <td key={s.id} className="py-2.5 px-3 text-center tabular-nums text-zinc-700 print:text-black">
                          {mark ? mark.total : "—"}
                        </td>
                      );
                    })}

                    {/* Total */}
                    <td className="py-2.5 px-3.5 text-center font-bold text-zinc-900 tabular-nums print:text-black">
                      {r.total}
                    </td>

                    {/* Percentage */}
                    <td className="py-2.5 px-3.5 text-center font-medium text-xs text-zinc-600 tabular-nums print:text-black">
                      {r.percentage ? `${r.percentage}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}