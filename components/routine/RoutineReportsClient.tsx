"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CalendarClock,
  Printer,
  Download,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Award,
  BookOpen,
  Users,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRoutineAnalyticsAction,
  RoutineAnalyticsData,
  TeacherBatchRoutineStat,
  TeacherDutyStat,
  CancelledSessionDetail,
} from "@/app/actions/routine-analytics";
import { todayDhaka, addDaysDhaka, getDhakaMonthRange } from "@/lib/dhaka-time";
import { toast } from "sonner";

interface RoutineReportsClientProps {
  initialData: RoutineAnalyticsData;
}

export function RoutineReportsClient({ initialData }: RoutineReportsClientProps) {
  const [data, setData] = useState<RoutineAnalyticsData>(initialData);
  const [startDate, setStartDate] = useState(initialData.filters.startDate);
  const [endDate, setEndDate] = useState(initialData.filters.endDate);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    initialData.filters.teacherId ? String(initialData.filters.teacherId) : "all"
  );
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    initialData.filters.batchId ? String(initialData.filters.batchId) : "all"
  );
  const [activeTab, setActiveTab] = useState<"classes" | "duties" | "cancellations">("classes");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleApplyFilters = (newStart = startDate, newEnd = endDate) => {
    startTransition(async () => {
      const res = await getRoutineAnalyticsAction({
        startDate: newStart,
        endDate: newEnd,
        teacherId: selectedTeacherId !== "all" ? parseInt(selectedTeacherId, 10) : undefined,
        batchId: selectedBatchId !== "all" ? parseInt(selectedBatchId, 10) : undefined,
      });

      if (res.success && res.data) {
        setData(res.data);
        setStartDate(res.data.filters.startDate);
        setEndDate(res.data.filters.endDate);
        toast.success("Routine report updated");
      } else {
        toast.error(res.error || "Failed to load report");
      }
    });
  };

  const handlePreset = (preset: "thisMonth" | "lastMonth" | "last7" | "last30" | "thisYear") => {
    const today = todayDhaka();
    let start = today;
    let end = today;

    if (preset === "thisMonth") {
      const range = getDhakaMonthRange(today);
      start = range.startDate;
      end = range.endDate;
    } else if (preset === "lastMonth") {
      const prevMonthDate = addDaysDhaka(today.slice(0, 7) + "-01", -5);
      const range = getDhakaMonthRange(prevMonthDate);
      start = range.startDate;
      end = range.endDate;
    } else if (preset === "last7") {
      start = addDaysDhaka(today, -6);
      end = today;
    } else if (preset === "last30") {
      start = addDaysDhaka(today, -29);
      end = today;
    } else if (preset === "thisYear") {
      const year = today.slice(0, 4);
      start = `${year}-01-01`;
      end = `${year}-12-31`;
    }

    setStartDate(start);
    setEndDate(end);
    handleApplyFilters(start, end);
  };

  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,";

    if (activeTab === "classes") {
      csvContent += "Teacher,Batch,Program,Subjects,Conducted,Scheduled,Cancelled,Rescheduled,Total\n";
      for (const row of data.teacherBatchMatrix) {
        const subjects = `"${row.subjects.join("; ")}"`;
        csvContent += `"${row.teacherName}","${row.batchName}","${row.programName}",${subjects},${row.conductedCount},${row.scheduledCount},${row.cancelledCount},${row.rescheduledCount},${row.totalCount}\n`;
      }
    } else if (activeTab === "duties") {
      csvContent += "Teacher,Total Duties,Conducted Duties,Total Pay (BDT),Pending Amount Duties\n";
      for (const row of data.teacherDuties) {
        csvContent += `"${row.teacherName}",${row.totalDuties},${row.conductedDuties},${row.totalPay},${row.pendingAmountCount}\n`;
      }
    } else {
      csvContent += "Date,Time,Teacher,Batch,Subject,Status,Reason\n";
      for (const row of data.cancellationAnalysis.cancelledSessions) {
        csvContent += `"${row.date}","${row.startTime}","${row.teacherName}","${row.batchName}","${row.subjectName}","${row.status}","${row.reason}"\n`;
      }
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `routine-report-${activeTab}-${data.filters.startDate}-to-${data.filters.endDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered lists
  const filteredTeacherBatch = data.teacherBatchMatrix.filter(
    (item) =>
      item.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.programName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjects.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredDuties = data.teacherDuties.filter((item) =>
    item.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCancellations = data.cancellationAnalysis.cancelledSessions.filter(
    (item) =>
      item.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.batchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin-route/routine"
              className="text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
              Routine Analytics & Reports
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Classes conducted per teacher & batch, exam duty remuneration, and cancellation trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin-route/routine">
            <Button variant="outline" size="sm" className="text-xs">
              <CalendarDays className="h-3.5 w-3.5 mr-1.5 text-zinc-600" />
              Day Planner
            </Button>
          </Link>

          <Link href="/admin-route/routine/tomorrow">
            <Button variant="outline" size="sm" className="text-xs">
              <CalendarClock className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
              Tomorrow Board
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            className="text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs"
          >
            <Printer className="h-3.5 w-3.5 mr-1.5 text-zinc-600" />
            Print
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card className="print:hidden border-zinc-200 shadow-sm bg-zinc-50/50">
        <CardContent className="pt-4 space-y-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-zinc-500 font-medium mr-1">Presets:</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePreset("thisMonth")}
              className="h-7 text-xs px-2.5 bg-white"
            >
              This Month
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePreset("lastMonth")}
              className="h-7 text-xs px-2.5 bg-white"
            >
              Last Month
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePreset("last7")}
              className="h-7 text-xs px-2.5 bg-white"
            >
              Last 7 Days
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePreset("last30")}
              className="h-7 text-xs px-2.5 bg-white"
            >
              Last 30 Days
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handlePreset("thisYear")}
              className="h-7 text-xs px-2.5 bg-white"
            >
              This Year
            </Button>
          </div>

          {/* Form Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-xs bg-white"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">Teacher</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full h-8 px-2 text-xs border rounded-md bg-white border-zinc-200 text-zinc-800"
              >
                <option value="all">All Faculty</option>
                {data.metadata.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-600 block mb-1">Batch</label>
              <select
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                className="w-full h-8 px-2 text-xs border rounded-md bg-white border-zinc-200 text-zinc-800"
              >
                <option value="all">All Batches</option>
                {data.metadata.batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => handleApplyFilters()}
                disabled={isPending}
                className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1.5 ${isPending ? "animate-spin" : ""}`}
                />
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Total Sessions</p>
                <h3 className="text-2xl font-bold text-zinc-900 mt-1">
                  {data.summary.totalSessions}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Between {data.filters.startDate} and {data.filters.endDate}
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Conducted Classes</p>
                <h3 className="text-2xl font-bold text-emerald-700 mt-1">
                  {data.summary.conductedClasses}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              Teaching lectures & extra sessions
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Exam Duties</p>
                <h3 className="text-2xl font-bold text-purple-700 mt-1">
                  {data.summary.examDutiesCount}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2 font-medium text-purple-900">
              ৳ {data.summary.examDutiesPay.toLocaleString()} total remuneration
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-zinc-500">Cancellations</p>
                <h3 className="text-2xl font-bold text-rose-700 mt-1">
                  {data.summary.cancelledCount + data.summary.rescheduledCount}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-500 mt-2">
              {data.summary.cancellationRate}% cancellation rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-200">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("classes")}
            className={`py-2 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "classes"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Classes by Teacher & Batch ({data.teacherBatchMatrix.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("duties")}
            className={`py-2 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "duties"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Exam Duty Breakdown ({data.teacherDuties.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cancellations")}
            className={`py-2 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "cancellations"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Cancellations & Reasons ({data.cancellationAnalysis.cancelledSessions.length})
          </button>
        </nav>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 max-w-sm print:hidden">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <Input
            placeholder="Search faculty, batch, subject, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>
        {searchTerm && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm("")}
            className="h-8 text-xs px-2 text-zinc-500"
          >
            Clear
          </Button>
        )}
      </div>

      {/* TAB 1: Classes by Teacher & Batch */}
      {activeTab === "classes" && (
        <Card className="border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Program</th>
                  <th className="py-3 px-4">Subjects Covered</th>
                  <th className="py-3 px-4 text-center">Conducted</th>
                  <th className="py-3 px-4 text-center">Scheduled</th>
                  <th className="py-3 px-4 text-center">Cancelled</th>
                  <th className="py-3 px-4 text-right">Total Sessions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredTeacherBatch.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500">
                      No routine class records found for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTeacherBatch.map((row, idx) => (
                    <tr key={`${row.teacherId}:${row.batchId || idx}`} className="hover:bg-zinc-50/80">
                      <td className="py-3 px-4 font-medium text-zinc-900">{row.teacherName}</td>
                      <td className="py-3 px-4 text-zinc-800">{row.batchName}</td>
                      <td className="py-3 px-4 text-zinc-500">{row.programName}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {row.subjects.length > 0 ? (
                            row.subjects.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-[10px] py-0 px-1.5 bg-zinc-100">
                                {s}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-zinc-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        {row.conductedCount}
                      </td>
                      <td className="py-3 px-4 text-center text-zinc-600">{row.scheduledCount}</td>
                      <td className="py-3 px-4 text-center text-rose-600">
                        {row.cancelledCount + row.rescheduledCount > 0 ? (
                          <span className="font-semibold">{row.cancelledCount + row.rescheduledCount}</span>
                        ) : (
                          "0"
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-zinc-900">{row.totalCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: Exam Duties Breakdown */}
      {activeTab === "duties" && (
        <Card className="border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                <tr>
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4 text-center">Total Duties</th>
                  <th className="py-3 px-4 text-center">Conducted</th>
                  <th className="py-3 px-4 text-center">Pending Amount</th>
                  <th className="py-3 px-4 text-right">Total Remuneration (BDT)</th>
                  <th className="py-3 px-4">Duty Schedule Overview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredDuties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-500">
                      No exam duty assignments found for this period.
                    </td>
                  </tr>
                ) : (
                  filteredDuties.map((row) => (
                    <tr key={row.teacherId} className="hover:bg-zinc-50/80">
                      <td className="py-3 px-4 font-medium text-zinc-900">{row.teacherName}</td>
                      <td className="py-3 px-4 text-center font-bold text-purple-700">{row.totalDuties}</td>
                      <td className="py-3 px-4 text-center text-emerald-700 font-medium">
                        {row.conductedDuties}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.pendingAmountCount > 0 ? (
                          <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                            {row.pendingAmountCount} Needs Amount
                          </Badge>
                        ) : (
                          <span className="text-zinc-400">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-zinc-900">
                        ৳ {row.totalPay.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-md">
                          {row.duties.map((d) => (
                            <span
                              key={d.id}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 font-mono"
                            >
                              {d.date} ({d.examTitle}) {d.payAmount != null ? `৳${d.payAmount}` : "Needs Amt"}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Cancellations & Reasons */}
      {activeTab === "cancellations" && (
        <div className="space-y-4">
          {/* Reason Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {data.cancellationAnalysis.byReason.map((r, i) => (
              <Card key={i} className="border-rose-100 bg-rose-50/30">
                <CardContent className="p-3">
                  <p className="text-xs font-semibold text-rose-900 truncate" title={r.reason}>
                    {r.reason}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-bold text-rose-700">{r.count}</span>
                    <Badge variant="outline" className="text-[10px] bg-rose-100/60 text-rose-800 border-rose-200">
                      {r.percentage}% of changes
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {data.cancellationAnalysis.byReason.length === 0 && (
              <div className="col-span-full py-4 text-center text-xs text-zinc-500 bg-zinc-50 rounded-lg">
                No cancellations recorded during this period.
              </div>
            )}
          </div>

          {/* Cancellation Log Table */}
          <Card className="border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Faculty Member</th>
                    <th className="py-3 px-4">Batch / Subject</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Logged Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredCancellations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">
                        No cancelled or rescheduled sessions match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredCancellations.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-50/80">
                        <td className="py-3 px-4 font-mono text-zinc-700 whitespace-nowrap">
                          {item.date} {item.startTime}
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-900">{item.teacherName}</td>
                        <td className="py-3 px-4 text-zinc-800">
                          {item.batchName} ({item.subjectName})
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.status === "CANCELLED"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-zinc-600 italic">{item.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
