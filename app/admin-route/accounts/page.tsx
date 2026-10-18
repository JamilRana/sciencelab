import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { AccountsHubClient } from "./AccountsHubClient";
import { getSpecialCourseFeesAction, getSpecialProgramsAction } from "@/app/actions/course-fees";
import {
  Wallet,
  Receipt,
  CreditCard,
  TrendingDown,
  Banknote,
  DollarSign,
  Printer,
} from "lucide-react";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    redirect("/admin-route/dashboard");
  }

  const params = await searchParams;
  const initialTab = params.tab || "fees";

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthName = now.toLocaleString("en-US", { month: "short" });

  // Fetch financial summary & initial datasets
  const [
    receiptsSum,
    expensesSum,
    teacherPaymentsSum,
    allReceiptsSum,
    receipts,
    expenses,
    teacherPayments,
    students,
    teachers,
    courseFeesRes,
    programsRes,
  ] = await Promise.all([
    prisma.receipt.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.teacherPayment.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.receipt.aggregate({ _sum: { amount: true }, _count: true }),
    prisma.receipt.findMany({
      take: 50,
      orderBy: { id: "desc" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
            class: true,
            batch: { select: { id: true, name: true, code: true } },
          },
        },
      },
    }),
    prisma.expense.findMany({
      take: 50,
      orderBy: { date: "desc" },
    }),
    prisma.teacherPayment.findMany({
      take: 50,
      orderBy: { date: "desc" },
      include: {
        teacher: { select: { id: true, name: true, mobile: true } },
      },
    }),
    prisma.student.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        roll: true,
        class: true,
        batch: { select: { id: true, name: true, code: true } },
      },
      orderBy: { roll: "asc" },
    }),
    prisma.teacher.findMany({
      select: { id: true, name: true, perClass: true, due: true },
      orderBy: { name: "asc" },
    }),
    getSpecialCourseFeesAction(),
    getSpecialProgramsAction(),
  ]);

  const totalRevenue = receiptsSum._sum.amount ?? 0;
  const totalExpenses = expensesSum._sum.amount ?? 0;
  const totalTeacherPayments = teacherPaymentsSum._sum.amount ?? 0;
  const netBalance = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Accounts & Financial Hub"
        description="Unified financial center for student fees, receipts, institutional expenses, and teacher payroll."
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg shadow-xs">
          <Printer className="h-3.5 w-3.5 text-zinc-500" />
          <span>Financial Summary</span>
        </div>
      </PageHeader>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`Collection (${monthName})`}
          value={totalRevenue}
          isCurrency
          subtitle="Current month by payment date"
          change={{
            value: `৳${(allReceiptsSum._sum.amount || 0).toLocaleString()}`,
            trend: "up",
            label: "all-time",
          }}
          icon={<Receipt className="h-4 w-4 text-emerald-600" />}
        />

        <StatCard
          title="Institutional Expenses"
          value={totalExpenses}
          isCurrency
          change={{
            value: `${expensesSum._count} records`,
            trend: "down",
            label: "recorded",
          }}
          icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
        />

        <StatCard
          title="Teacher Disbursements"
          value={totalTeacherPayments}
          isCurrency
          change={{
            value: `${teacherPaymentsSum._count} payments`,
            trend: "neutral",
            label: "disbursed",
          }}
          icon={<Banknote className="h-4 w-4 text-indigo-600" />}
        />

        <StatCard
          title="Net Operating Balance"
          value={netBalance}
          isCurrency
          change={{
            value: `৳${netBalance.toLocaleString()}`,
            trend: netBalance >= 0 ? "up" : "down",
            label: "surplus",
          }}
          icon={<Wallet className="h-4 w-4 text-indigo-600" />}
        />
      </div>

      {/* Tabbed Interface */}
      <AccountsHubClient
        initialTab={initialTab}
        receipts={receipts as any}
        expenses={expenses as any}
        teacherPayments={teacherPayments as any}
        students={students as any}
        teachers={teachers as any}
        courseFees={courseFeesRes.data as any}
        programs={programsRes.data as any}
      />
    </div>
  );
}
