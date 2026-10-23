"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Download,
  Search,
  Layers,
  Users,
  Trophy,
} from "lucide-react";
import { ProcessedCompiledMarksheet } from "@/lib/special-batch-results";

interface CompiledMarksheetViewerClientProps {
  marksheet: any;
  processed: ProcessedCompiledMarksheet;
}

export function CompiledMarksheetViewerClient({
  marksheet,
  processed,
}: CompiledMarksheetViewerClientProps) {
  const [sectionFilter, setSectionFilter] = useState<"ALL" | "BOYS" | "GIRLS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const exams = processed.exams || [];
  const allRows = processed.rows || [];

  // Filter rows by section and search query
  const filteredRows = useMemo(() => {
    return allRows.filter((r) => {
      // Section filter
      if (sectionFilter === "BOYS") {
        const isBoy = r.student.section === "BOYS" || String(r.student.displayRoll).startsWith("2620") || String(r.student.displayRoll).startsWith("2682");
        if (!isBoy) return false;
      } else if (sectionFilter === "GIRLS") {
        const isGirl = r.student.section === "GIRLS" || String(r.student.displayRoll).startsWith("2610") || String(r.student.displayRoll).startsWith("2681");
        if (!isGirl) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = r.student.name.toLowerCase().includes(q);
        const rollMatch = String(r.student.displayRoll).includes(q) || String(r.student.roll).includes(q);
        const schoolMatch = r.student.schoolName?.toLowerCase().includes(q);
        return nameMatch || rollMatch || schoolMatch;
      }

      return true;
    });
  }, [allRows, sectionFilter, searchQuery]);

  // Recalculate ranks if a section filter is active so section has independent ranks 1, 1, 3
  const displayRows = useMemo(() => {
    if (sectionFilter === "ALL") return filteredRows;

    let currentRank = 1;
    let prevTotal: number | null = null;

    return filteredRows.map((row, index) => {
      if (index > 0 && row.totalMarksObtained !== prevTotal) {
        currentRank = index + 1;
      }
      prevTotal = row.totalMarksObtained;
      return {
        ...row,
        rank: currentRank,
      };
    });
  }, [filteredRows, sectionFilter]);

  // Top 3 performers in current view
  const top3 = displayRows.slice(0, 3);

  // Export matrix to CSV
  const handleExportCSV = () => {
    const headers = [
      "Rank",
      "Roll",
      "Student Name",
      "Section",
      "Feeder School",
      ...exams.map((e) => e.lectureLabel || e.title),
      "Total Obtained",
      "Total Possible",
      "Percentage",
    ];

    const rowsData = displayRows.map((r) => {
      const examScores = exams.map((e) => {
        const detail = r.examMarks[e.id];
        if (!detail) return "0";
        if (detail.isAbsent) return "ABS";
        return detail.mark;
      });

      return [
        r.rank,
        r.student.displayRoll,
        `"${r.student.name.replace(/"/g, '""')}"`,
        r.student.section || "—",
        `"${(r.student.schoolName || "Science Lab").replace(/"/g, '""')}"`,
        ...examScores,
        r.totalMarksObtained,
        r.totalMarksPossible,
        `${r.overallPercentage}%`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rowsData].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${marksheet.title.replace(/[^a-zA-Z0-9_-]/g, "_")}_${sectionFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/admin-route/special-batch?tab=compilations"
              className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Back to Compiled Marksheets</span>
            </Link>
            <span className="text-zinc-300">·</span>
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
              Ungraded Aggregate
            </span>
          </div>

          <h1 className="text-xl font-bold text-zinc-900">{marksheet.title}</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {marksheet.program?.name} · {exams.length} Included Exams · Total Possible: {processed.totalPossibleMarks} Marks
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-zinc-500" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Sheet ({sectionFilter})</span>
          </button>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
          {top3.map((winner, idx) => {
            const podiumColors = [
              "border-amber-300 bg-gradient-to-b from-amber-50/70 to-white text-amber-900",
              "border-slate-300 bg-gradient-to-b from-slate-50/70 to-white text-slate-900",
              "border-amber-400 bg-gradient-to-b from-amber-50/40 to-white text-amber-900",
            ];
            const trophyColors = ["text-amber-500", "text-slate-400", "text-amber-700"];

            return (
              <div
                key={winner.studentId}
                className={`p-4 rounded-xl border ${podiumColors[idx]} shadow-2xs flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white border border-zinc-200 shadow-2xs">
                    <Trophy className={`h-6 w-6 ${trophyColors[idx]}`} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      Rank #{winner.rank} Position
                    </span>
                    <h4 className="font-bold text-zinc-900 text-sm truncate max-w-[150px]">
                      {winner.student.name}
                    </h4>
                    <p className="text-[11px] text-zinc-500 font-medium tabular-nums">
                      Roll #{winner.student.displayRoll} · {winner.student.schoolName || "Science Lab"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-black text-indigo-700 tabular-nums block">
                    {winner.totalMarksObtained}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-600 tabular-nums">
                    {winner.overallPercentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter Toolbar: Section switcher & Search */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 font-medium">Filter Section:</span>
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-xs">
            {(["ALL", "BOYS", "GIRLS"] as const).map((sec) => (
              <button
                key={sec}
                onClick={() => setSectionFilter(sec)}
                className={`px-3 py-1 rounded-md font-semibold transition-all ${
                  sectionFilter === sec
                    ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {sec === "ALL" ? "All Students" : sec === "BOYS" ? "Boys Section" : "Girls Section"}
              </button>
            ))}
          </div>

          <span className="text-xs text-zinc-500 ml-2">
            Showing <strong className="text-zinc-900">{displayRows.length}</strong> candidates
          </span>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search student or roll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg outline-none text-zinc-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* PRINT-ONLY HEADER (visible during print) */}
      <div className="hidden print:block">
        <div className="text-center mb-4 border-b-2 border-black pb-3">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Science Lab Logo" className="h-9 w-auto object-contain" />
            <h1 className="text-xl font-black uppercase tracking-wider text-black">
              Science Lab Coaching Center
            </h1>
          </div>
          <p className="text-xs font-semibold text-gray-700 uppercase">
            Special Batch Assessment Division · {marksheet.program?.name}
          </p>
          <h2 className="text-sm font-bold mt-1 text-black">
            {marksheet.title} — Tabulation Matrix
          </h2>
          <p className="text-[11px] text-gray-600 mt-0.5">
            Section Scope: {sectionFilter === "ALL" ? "All Sections (Boys & Girls)" : sectionFilter === "BOYS" ? "Boys Section" : "Girls Section"} · Total Exams: {exams.length} · Max Possible Marks: {processed.totalPossibleMarks}
          </p>
        </div>
      </div>

      {/* Main Interactive Matrix Spreadsheet */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full border-collapse text-left text-xs print:text-[8pt]">
            <thead className="sticky top-0 bg-zinc-100/90 backdrop-blur-xs border-b border-zinc-200 z-10 text-[11px] font-bold text-zinc-600 uppercase tracking-wider print:bg-gray-200 print:text-black">
              <tr>
                <th className="py-2 px-2.5 w-10 text-center border-r border-zinc-200 print:border-black">#</th>
                <th className="py-2 px-2.5 w-14 text-center border-r border-zinc-200 print:border-black">Rank</th>
                <th className="py-2 px-2.5 w-20 text-center border-r border-zinc-200 print:border-black">Roll</th>
                <th className="py-2 px-3 border-r border-zinc-200 print:border-black min-w-[140px]">Student Name</th>
                <th className="py-2 px-2.5 border-r border-zinc-200 print:border-black min-w-[110px] hidden sm:table-cell print:table-cell">Feeder School</th>

                {/* Dynamic Lecture Columns */}
                {exams.map((e) => (
                  <th
                    key={e.id}
                    className="py-2 px-2 text-center border-r border-zinc-200 print:border-black font-mono font-bold min-w-[50px]"
                    title={`${e.title} (${e.maxMark}m)`}
                  >
                    <div>{e.lectureLabel || `L${e.lectureNo || ""}`}</div>
                    <div className="text-[9px] font-normal text-zinc-400 print:text-gray-600">({e.maxMark})</div>
                  </th>
                ))}

                <th className="py-2 px-3 w-20 text-center font-bold text-zinc-900 border-r border-zinc-200 print:border-black bg-indigo-50/50 print:bg-gray-100">
                  Total
                </th>
                <th className="py-2 px-2.5 w-16 text-center font-bold text-zinc-700">
                  %
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-100 print:divide-black">
              {displayRows.map((row, idx) => {
                let rankBadge = "text-zinc-600 bg-zinc-100";
                if (row.rank === 1) rankBadge = "text-amber-800 bg-amber-100 font-bold border border-amber-300";
                else if (row.rank === 2) rankBadge = "text-slate-800 bg-slate-200 font-bold border border-slate-300";
                else if (row.rank === 3) rankBadge = "text-amber-900 bg-amber-200/70 font-bold border border-amber-300";

                return (
                  <tr
                    key={row.studentId}
                    className="hover:bg-zinc-50/70 transition-colors print:hover:bg-transparent"
                  >
                    {/* Index */}
                    <td className="py-1.5 px-2.5 text-center text-zinc-400 tabular-nums border-r border-zinc-100 print:border-black">
                      {idx + 1}
                    </td>

                    {/* Rank */}
                    <td className="py-1.5 px-2.5 text-center border-r border-zinc-100 print:border-black">
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[11px] tabular-nums font-bold ${rankBadge} print:bg-transparent print:border-none`}>
                        #{row.rank}
                      </span>
                    </td>

                    {/* Display Roll */}
                    <td className="py-1.5 px-2.5 text-center font-mono font-bold text-indigo-700 border-r border-zinc-100 print:border-black print:text-black tabular-nums">
                      {row.student.displayRoll}
                    </td>

                    {/* Student Name */}
                    <td className="py-1.5 px-3 font-semibold text-zinc-900 border-r border-zinc-100 print:border-black truncate max-w-[160px]">
                      {row.student.name}
                    </td>

                    {/* Feeder School */}
                    <td className="py-1.5 px-2.5 text-zinc-500 border-r border-zinc-100 print:border-black truncate max-w-[120px] hidden sm:table-cell print:table-cell">
                      {row.student.schoolName || "—"}
                    </td>

                    {/* Lecture Exam Scores */}
                    {exams.map((e) => {
                      const entry = row.examMarks[e.id];
                      const isAbs = entry?.isAbsent;
                      const mark = entry ? entry.mark : 0;

                      return (
                        <td
                          key={e.id}
                          className="py-1.5 px-2 text-center border-r border-zinc-100 print:border-black font-semibold tabular-nums text-zinc-800"
                        >
                          {isAbs ? (
                            <span className="text-[10px] text-rose-600 font-bold">ABS</span>
                          ) : mark > 0 ? (
                            mark
                          ) : (
                            <span className="text-zinc-300 print:text-gray-400">0</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Obtained */}
                    <td className="py-1.5 px-3 text-center font-black text-indigo-700 bg-indigo-50/40 border-r border-zinc-100 print:border-black print:text-black tabular-nums">
                      {row.totalMarksObtained}
                    </td>

                    {/* Percentage */}
                    <td className="py-1.5 px-2.5 text-center font-semibold text-zinc-600 tabular-nums">
                      {row.overallPercentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT-ONLY SIGNATURE FOOTER */}
      <div className="hidden print:block pt-10">
        <div className="flex items-end justify-between text-xs text-black">
          <div className="text-center">
            <div className="w-36 border-b border-black mb-1" />
            <p className="font-semibold">Prepared By</p>
          </div>
          <div className="text-center">
            <div className="w-36 border-b border-black mb-1" />
            <p className="font-semibold">Verified By</p>
          </div>
          <div className="text-center">
            <div className="w-36 border-b border-black mb-1" />
            <p className="font-semibold">Principal / Director</p>
          </div>
        </div>
      </div>
    </div>
  );
}
