import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { generateDisplayRoll } from "@/lib/roll";
import {
  Award,
  CreditCard,
  Calendar,
  Download,
  Printer,
  ChevronRight,
  TrendingUp,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return null;
  }

  // Find student by studentId, userId or username/mobile
  const student = await prisma.student.findFirst({
    where: {
      OR: [
        { id: session.user.studentId || -1 },
        { userId: parseInt(session.user.id) || -1 },
        { mobile: session.user.username },
      ],
    },
    include: {
      batch: true,
      school: true,
      receipts: {
        orderBy: { date: "desc" },
      },
      marks: {
        include: {
          examSubject: {
            include: {
              exam: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-zinc-200">
        <p className="text-sm text-zinc-500">Student academic profile could not be loaded.</p>
      </div>
    );
  }

  const displayRoll = student.batch?.code
    ? generateDisplayRoll(student.batch.code, student.roll)
    : student.roll;

  // Derive latest exam
  const examSubjectsMap = new Map<number, { exam: any; marks: any[]; total: number; max: number }>();

  student.marks.forEach((m) => {
    const exam = m.examSubject.exam;
    if (!examSubjectsMap.has(exam.id)) {
      examSubjectsMap.set(exam.id, {
        exam,
        marks: [],
        total: 0,
        max: 0,
      });
    }
    const record = examSubjectsMap.get(exam.id)!;
    record.marks.push(m);
    record.total += (m.written + m.objective);
    record.max += m.examSubject.totalMark;
  });

  const examsArray = Array.from(examSubjectsMap.values());
  const latestExam = examsArray[examsArray.length - 1];
  const latestPercentage = latestExam && latestExam.max > 0
    ? ((latestExam.total / latestExam.max) * 100).toFixed(1)
    : null;

  // Fee Status: 12-month payment timeline
  const paidMonthsSet = new Set(
    student.receipts.filter((r) => r.amount > 0).map((r) => r.month)
  );

  const currentMonthIdx = new Date().getMonth();
  const currentMonthName = MONTHS[currentMonthIdx];
  const isCurrentMonthPaid = paidMonthsSet.has(currentMonthName);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Student Greeting Card */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-medium mb-3 backdrop-blur-xs">
              <span>Class {student.class}</span>
              <span>·</span>
              <span>Batch {student.batch?.name || "Standard"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {student.name.split(" ")[0]}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1">
              Roll #{displayRoll} · {student.school?.name || "Science Lab Coaching Center"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/student-route/results"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-950 bg-white hover:bg-indigo-50 rounded-xl shadow-sm transition-all focus-ring"
            >
              <Award className="h-4 w-4 text-indigo-600" />
              <span>Report Cards</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Latest Exam Card */}
      {latestExam ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                Latest Assessment Result
              </span>
              <h2 className="text-lg font-bold text-zinc-900 mt-0.5">
                {latestExam.exam.type} Examination ({latestExam.exam.month})
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Evaluated across {latestExam.marks.length} subjects
              </p>
            </div>

            <div className="text-right">
              <span className="text-3xl font-extrabold text-zinc-900 tracking-tight tabular-nums">
                {latestPercentage}%
              </span>
              <p className="text-[11px] text-zinc-500 tabular-nums">
                {latestExam.total} / {latestExam.max} Marks
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[11px]">
                <Sparkles className="h-3 w-3" />
                <span>Performance Score: Excellent</span>
              </span>
            </div>

            <Link
              href="/student-route/results"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>Subject Breakdown</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 text-center shadow-xs">
          <Award className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-zinc-900">No Exam Records Yet</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Exam scores and rankings will appear here once entered by your teachers.
          </p>
        </div>
      )}

      {/* 12-Month Tuition Fee Status Timeline */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              Annual Tuition Fee Timeline
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Current Month: <span className="font-semibold text-zinc-700">{currentMonthName}</span> ·{" "}
              {isCurrentMonthPaid ? (
                <span className="text-emerald-600 font-semibold">Payment Cleared</span>
              ) : (
                <span className="text-rose-600 font-semibold">Payment Pending</span>
              )}
            </p>
          </div>

          <Link
            href="/student-route/fees"
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Receipts History →
          </Link>
        </div>

        {/* 12 Dots Visual Timeline */}
        <div className="pt-2 pb-1">
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 text-center">
            {MONTHS.map((month, idx) => {
              const isPaid = paidMonthsSet.has(month);
              const isCurrent = idx === currentMonthIdx;
              const isPast = idx < currentMonthIdx;

              return (
                <div
                  key={month}
                  className={`flex flex-col items-center p-2 rounded-xl border transition-all ${
                    isPaid
                      ? "bg-emerald-50/70 border-emerald-200 text-emerald-800"
                      : isCurrent
                      ? "bg-rose-50/50 border-rose-300 ring-2 ring-rose-100 text-rose-800"
                      : "bg-zinc-50 border-zinc-200/80 text-zinc-400"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">{month}</span>
                  <div
                    className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${
                      isPaid
                        ? "bg-emerald-500 shadow-xs"
                        : isCurrent
                        ? "bg-rose-500 animate-pulse"
                        : "bg-zinc-300"
                    }`}
                  />
                  <span className="text-[9px] font-medium mt-1">
                    {isPaid ? "Paid" : isPast ? "Due" : isCurrent ? "Due" : "Upcoming"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
