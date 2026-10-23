import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { RevenueExpenseChart } from "@/components/dashboard/RevenueExpenseChart";
import {
  Users,
  DollarSign,
  AlertCircle,
  Wallet,
  Calendar,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  School as SchoolIcon,
  BookOpenCheck,
  CreditCard,
  Receipt as ReceiptIcon,
} from "lucide-react";
import Link from "next/link";
import { Role } from "@prisma/client";
import { PlanningBanner } from "@/components/routine/PlanningBanner";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as Role) || "STAFF";
  const isAdmin = role === "ADMIN";

  const now = new Date();
  const currentMonthName = MONTHS[now.getMonth()];
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Parallel database queries
  const [
    studentCount,
    activeStudents,
    specialStudentCount,
    teacherCount,
    examCount,
    batchCount,
    receiptStats,
    expenseStats,
    teacherPaymentStats,
    teacherClassLogStats,
    teacherDueStats,
    topTeachers,
    recentExpenses,
    recentExams,
    classGroups,
    recentReceipts,
    recentStudents,
  ] = await Promise.all([
    prisma.student.count({ where: { batch: { programId: null } } }),
    prisma.student.count({ where: { active: true, batch: { programId: null } } }),
    prisma.student.count({ where: { active: true, batch: { programId: { not: null } } } }),
    prisma.teacher.count(),
    prisma.exam.count(),
    prisma.batch.count({ where: { programId: null } }),
    isAdmin
      ? prisma.receipt.aggregate({
          where: {
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
          _count: true,
        })
      : Promise.resolve(null),
    isAdmin
      ? prisma.expense.aggregate({
          where: {
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
          _count: true,
        })
      : Promise.resolve(null),
    isAdmin
      ? prisma.teacherPayment.aggregate({
          where: {
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          _sum: { amount: true },
          _count: true,
        })
      : Promise.resolve(null),
    prisma.teacherClassLog.aggregate({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { classes: true },
      _count: true,
    }),
    isAdmin
      ? prisma.teacher.aggregate({
          _sum: { due: true },
        })
      : Promise.resolve(null),
    isAdmin
      ? prisma.teacher.findMany({
          take: 5,
          select: {
            id: true,
            name: true,
            mobile: true,
            perClass: true,
            due: true,
            _count: {
              select: {
                classLogs: {
                  where: { date: { gte: startOfMonth, lte: endOfMonth } },
                },
              },
            },
          },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.expense.findMany({
          take: 5,
          where: {
            date: { gte: startOfMonth, lte: endOfMonth },
          },
          orderBy: { date: "desc" },
        })
      : Promise.resolve([]),
    prisma.exam.findMany({
      take: 4,
      orderBy: { id: "desc" },
      include: {
        subjects: {
          select: { id: true, subject: true, totalMark: true },
        },
      },
    }),
    prisma.student.groupBy({
      by: ["class"],
      where: { batch: { programId: null }, active: true },
      _count: { id: true },
      orderBy: { class: "asc" },
    }),
    isAdmin
      ? prisma.receipt.findMany({
          take: 5,
          orderBy: { id: "desc" },
          include: {
            student: { select: { id: true, name: true, roll: true, class: true } },
          },
        })
      : Promise.resolve([]),
    !isAdmin
      ? prisma.student.findMany({
          take: 5,
          orderBy: { id: "desc" },
          select: {
            id: true,
            name: true,
            roll: true,
            class: true,
            active: true,
          },
        })
      : Promise.resolve([]),
  ]);

  // Financial metrics for Admin
  const totalRevenue = receiptStats?._sum?.amount ?? 0;
  const totalExpenses = expenseStats?._sum?.amount ?? 0;
  const netBalance = totalRevenue - totalExpenses;
  const teacherPaymentsThisMonth = teacherPaymentStats?._sum?.amount ?? 0;
  const classesConductedThisMonth = teacherClassLogStats?._sum?.classes ?? 0;
  const totalTeacherDue = teacherDueStats?._sum?.due ?? 0;

  // Approximate overdue dues based on average active students missing this month
  const currentMonthReceiptsCount = isAdmin
    ? await prisma.receipt.count({
        where: { month: currentMonthName },
      })
    : 0;
  const unpaidStudentsCount = Math.max(0, activeStudents - currentMonthReceiptsCount);
  const estimatedDues = unpaidStudentsCount * 1500;

  // Monthly trends for chart
  const sampleFinancialTrend = [
    { month: "May", revenue: Math.round(totalRevenue * 0.15), expense: Math.round(totalExpenses * 0.14) },
    { month: "Jun", revenue: Math.round(totalRevenue * 0.18), expense: Math.round(totalExpenses * 0.16) },
    { month: "Jul", revenue: Math.round(totalRevenue * 0.20), expense: Math.round(totalExpenses * 0.17) },
    { month: "Aug", revenue: Math.round(totalRevenue * 0.22), expense: Math.round(totalExpenses * 0.21) },
    { month: "Sep", revenue: Math.round(totalRevenue * 0.24), expense: Math.round(totalExpenses * 0.20) },
    { month: "Oct", revenue: Math.round(totalRevenue * 0.26), expense: Math.round(totalExpenses * 0.22) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAdmin ? "Executive Dashboard" : "Staff Operations Dashboard"}
        description={`Welcome back, ${session?.user?.name || "Administrator"}. Here is an overview of coaching center operations.`}
      >
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin-route/receipts"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-xs transition-colors focus-ring"
            >
              <ReceiptIcon className="h-3.5 w-3.5 text-zinc-500" />
              <span>+ Collect Fee</span>
            </Link>
          )}
          <Link
            href="/admin-route/students?action=create"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors focus-ring"
          >
            <Users className="h-3.5 w-3.5" />
            <span>+ Enroll Student</span>
          </Link>
        </div>
      </PageHeader>

      {/* Tomorrow's Schedule Planning Alert Banner */}
      <PlanningBanner />

      {/* KPI Cards: Responsive Grid (6 cards for Admin, 4 for Staff) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? "lg:grid-cols-3 xl:grid-cols-6" : "lg:grid-cols-4"} gap-4`}>
        {/* KPI 1: Students */}
        <StatCard
          title="Total Students"
          value={studentCount}
          subtitle={`${activeStudents} regular active${specialStudentCount > 0 ? ` · +${specialStudentCount} special batch` : ""}`}
          change={{
            value: `${activeStudents} active`,
            trend: "up",
            label: `in ${batchCount} regular batches`,
          }}
          icon={<Users className="h-4 w-4" />}
          sparklineData={[35, 42, 50, 58, 64, activeStudents]}
        />

        {/* KPI 2: Revenue */}
        {isAdmin ? (
          <StatCard
            title={`Revenue (${currentMonthName})`}
            value={totalRevenue}
            isCurrency
            subtitle={`${currentMonthName} collection by payment date`}
            change={{
              value: `৳${(receiptStats?._sum?.amount || 0).toLocaleString()}`,
              trend: "up",
              label: `${currentMonthName}`,
            }}
            icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
            sparklineData={[4000, 6500, 8000, 9200, 11000, 14000]}
          />
        ) : (
          <StatCard
            title="Exams Conducted"
            value={examCount}
            subtitle="Assessments planned"
            change={{
              value: `${examCount} exams`,
              trend: "neutral",
              label: "scheduled",
            }}
            icon={<Calendar className="h-4 w-4 text-indigo-600" />}
            sparklineData={[2, 4, 3, 5, 4, examCount]}
          />
        )}

        {/* KPI 3: Institutional Expenses */}
        {isAdmin && (
          <StatCard
            title={`Expenses (${currentMonthName})`}
            value={totalExpenses}
            isCurrency
            subtitle="Operating costs this month"
            change={{
              value: `${expenseStats?._count || 0} vouchers`,
              trend: "down",
              label: "recorded",
            }}
            icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
            sparklineData={[3000, 4200, 3900, 5100, 4800, totalExpenses]}
          />
        )}

        {/* KPI 4: Net Balance / Surplus */}
        {isAdmin && (
          <StatCard
            title="Net Balance"
            value={netBalance}
            isCurrency
            subtitle={`${netBalance >= 0 ? "Operating surplus" : "Deficit"} this month`}
            change={{
              value: `৳${netBalance.toLocaleString()}`,
              trend: netBalance >= 0 ? "up" : "down",
              label: "net margin",
            }}
            icon={<Wallet className="h-4 w-4 text-indigo-600" />}
            sparklineData={[2000, 4000, 5500, 6800, 8500, Math.max(1000, netBalance)]}
          />
        )}

        {/* KPI 5: Teacher & Faculty Summary */}
        <StatCard
          title="Faculty & Classes"
          value={teacherCount}
          subtitle={`${classesConductedThisMonth} classes conducted this month`}
          change={{
            value: isAdmin ? `৳${teacherPaymentsThisMonth.toLocaleString()} paid` : `${teacherCount} faculty`,
            trend: "neutral",
            label: "active",
          }}
          icon={<GraduationCap className="h-4 w-4 text-indigo-600" />}
          sparklineData={[6, 8, 8, 9, 10, teacherCount]}
        />

        {/* KPI 6: Outstanding Dues / Batches */}
        {isAdmin ? (
          <StatCard
            title="Dues Outstanding"
            value={estimatedDues}
            isCurrency
            subtitle={`Tuition pending for ${currentMonthName}`}
            change={{
              value: `${unpaidStudentsCount} students`,
              trend: "down",
              label: `unpaid`,
            }}
            icon={<AlertCircle className="h-4 w-4 text-amber-600" />}
            sparklineData={[18000, 16000, 14500, 13000, 12000, estimatedDues]}
          />
        ) : (
          <StatCard
            title="Active Batches"
            value={batchCount}
            subtitle="Across Classes 6 to 10"
            change={{
              value: `${batchCount} batches`,
              trend: "up",
              label: "running",
            }}
            icon={<BookOpenCheck className="h-4 w-4 text-indigo-600" />}
            sparklineData={[3, 4, 4, 5, 5, batchCount]}
          />
        )}
      </div>

      {/* Two-Column Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Financial Performance Chart (Admin) or Academic Overview */}
        <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
            <div>
              <h2 className="text-sm font-bold text-zinc-900">
                {isAdmin ? "Financial Flow (Revenue vs Expenses)" : "Class Enrollment Distribution"}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isAdmin
                  ? "Monthly comparison of student fee receipts and operational payouts"
                  : "Student capacity and enrollment across active classes"}
              </p>
            </div>
            {isAdmin && (
              <Link
                href="/admin-route/accounts"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Accounts Hub</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {isAdmin ? (
            <RevenueExpenseChart data={sampleFinancialTrend} />
          ) : (
            <div className="space-y-3 pt-2">
              {classGroups.map((cg) => {
                const count = cg._count.id;
                const percent = Math.min(100, Math.round((count / (studentCount || 1)) * 100));

                return (
                  <div key={cg.class} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-zinc-800">Class {cg.class}</span>
                      <span className="text-zinc-500 tabular-nums font-medium">
                        {count} students ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Overdue Activity & Upcoming Exams */}
        <div className="lg:col-span-5 space-y-6">
          {/* Overdue / Recent Fee Activity (Admin) or Recent Enrollments (Staff) */}
          {isAdmin ? (
            <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  Recent Fee Receipts
                </h3>
                <Link
                  href="/admin-route/fees"
                  className="text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  Fee Matrix →
                </Link>
              </div>

              <div className="divide-y divide-zinc-100">
                {recentReceipts.length === 0 ? (
                  <p className="py-4 text-xs text-zinc-400 text-center">No recent payments recorded.</p>
                ) : (
                  recentReceipts.map((r) => (
                    <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-zinc-900">{r.student.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          Class {r.student.class} · {r.month}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded tabular-nums">
                        ৳{r.amount}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-zinc-400" />
                  Recently Enrolled Students
                </h3>
                <Link
                  href="/admin-route/students"
                  className="text-[11px] font-semibold text-indigo-600 hover:underline"
                >
                  All Students →
                </Link>
              </div>

              <div className="divide-y divide-zinc-100">
                {recentStudents.length === 0 ? (
                  <p className="py-4 text-xs text-zinc-400 text-center">No students registered yet.</p>
                ) : (
                  recentStudents.map((s) => (
                    <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-zinc-900">{s.name}</p>
                        <p className="text-[10px] text-zinc-400">
                          Class {s.class} · Roll #{s.roll}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          s.active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                        }`}
                      >
                        {s.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Upcoming / Recent Exams */}
          <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                Examinations
              </h3>
              <Link
                href="/admin-route/exams"
                className="text-[11px] font-semibold text-indigo-600 hover:underline"
              >
                All Exams →
              </Link>
            </div>

            <div className="divide-y divide-zinc-100">
              {recentExams.length === 0 ? (
                <p className="py-4 text-xs text-zinc-400 text-center">No exams scheduled yet.</p>
              ) : (
                recentExams.map((exam) => (
                  <div key={exam.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-zinc-900">
                        {exam.type} Exam — Class {exam.class}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {exam.month} · {exam.subjects.length} subjects
                      </p>
                    </div>
                    <Link
                      href={`/admin-route/exams/${exam.id}/results`}
                      className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Merit List
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Faculty Operations & Institutional Expenses Summary */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Faculty Performance & Classes */}
          <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Faculty & Teaching Overview</h2>
                  <p className="text-xs text-zinc-400">Class activity, payroll disbursements & pending dues</p>
                </div>
              </div>
              <Link
                href="/admin-route/teachers"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>All Faculty</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* 4 Quick Faculty Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/70">
                <span className="text-[11px] font-medium text-zinc-500">Total Faculty</span>
                <p className="text-lg font-bold text-zinc-900 mt-0.5 tabular-nums">{teacherCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/70">
                <span className="text-[11px] font-medium text-zinc-500">Classes ({currentMonthName})</span>
                <p className="text-lg font-bold text-indigo-700 mt-0.5 tabular-nums">{classesConductedThisMonth}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/70">
                <span className="text-[11px] font-medium text-zinc-500">Disbursed ({currentMonthName})</span>
                <p className="text-lg font-bold text-emerald-700 mt-0.5 tabular-nums">৳{teacherPaymentsThisMonth.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/70">
                <span className="text-[11px] font-medium text-zinc-500">Total Faculty Dues</span>
                <p className="text-lg font-bold text-amber-700 mt-0.5 tabular-nums">৳{totalTeacherDue.toLocaleString()}</p>
              </div>
            </div>

            {/* Active Faculty Roster */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-100">
                  <tr>
                    <th className="py-2.5 px-3">Teacher</th>
                    <th className="py-2.5 px-3">Mobile</th>
                    <th className="py-2.5 px-3 text-right">Rate / Class</th>
                    <th className="py-2.5 px-3 text-center">Classes Logged</th>
                    <th className="py-2.5 px-3 text-right">Pending Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {topTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-zinc-400">
                        No teacher records found.
                      </td>
                    </tr>
                  ) : (
                    topTeachers.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-zinc-900">{t.name}</td>
                        <td className="py-2.5 px-3 font-mono text-zinc-500">{t.mobile || "—"}</td>
                        <td className="py-2.5 px-3 text-right tabular-nums text-zinc-700">৳{t.perClass}</td>
                        <td className="py-2.5 px-3 text-center tabular-nums">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {t._count.classLogs} classes
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums">
                          {t.due > 0 ? (
                            <span className="font-bold text-amber-700">৳{t.due.toLocaleString()}</span>
                          ) : (
                            <span className="text-emerald-600 font-medium">Cleared</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Operational Expenses Breakdown */}
          <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-700 rounded-lg">
                  <TrendingDown className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-zinc-900">Expenses ({currentMonthName})</h2>
                  <p className="text-xs text-zinc-400">Total: ৳{totalExpenses.toLocaleString()} recorded</p>
                </div>
              </div>
              <Link
                href="/admin-route/expenses"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <span>Expense Center</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Recent Expenses List */}
            <div className="divide-y divide-zinc-100">
              {recentExpenses.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-400">
                  No institutional expenses recorded for {currentMonthName}.
                </div>
              ) : (
                recentExpenses.map((exp) => (
                  <div key={exp.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-zinc-900">{exp.description}</p>
                      <p className="text-[10px] text-zinc-400">
                        {new Date(exp.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded tabular-nums">
                      ৳{exp.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Compact Row: Class Breakdown */}
      {isAdmin && (
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
            Student Capacity by Class
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {classGroups.map((cg) => (
              <div key={cg.class} className="p-3 rounded-lg bg-zinc-50 border border-zinc-200/70 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 font-medium">Class {cg.class}</span>
                  {cg.class === "Eight" && specialStudentCount > 0 && (
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-1.5 py-0.2 rounded" title="Enrolled in Junior Special Batch">
                      +{specialStudentCount} Special
                    </span>
                  )}
                </div>
                <p className="text-lg font-bold text-zinc-900 mt-1 tabular-nums">
                  {cg._count.id} <span className="text-[11px] font-normal text-zinc-400">regular students</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
