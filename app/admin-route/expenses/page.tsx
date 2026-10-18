import { ExpenseList } from "@/components/ExpenseList";
import { getExpensesAction } from "@/app/actions/data";
import { normalizeMonth } from "@/lib/month";
import { Filter, RotateCcw } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const MONTHS = [
  { value: "Jan", label: "January (Jan)", index: 0 },
  { value: "Feb", label: "February (Feb)", index: 1 },
  { value: "Mar", label: "March (Mar)", index: 2 },
  { value: "Apr", label: "April (Apr)", index: 3 },
  { value: "May", label: "May (May)", index: 4 },
  { value: "Jun", label: "June (Jun)", index: 5 },
  { value: "Jul", label: "July (Jul)", index: 6 },
  { value: "Aug", label: "August (Aug)", index: 7 },
  { value: "Sep", label: "September (Sep)", index: 8 },
  { value: "Oct", label: "October (Oct)", index: 9 },
  { value: "Nov", label: "November (Nov)", index: 10 },
  { value: "Dec", label: "December (Dec)", index: 11 },
];

const YEARS = [2024, 2025, 2026, 2027];

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/admin-route/dashboard");
  }

  const params = await searchParams;
  const monthParam = params.month as string | undefined;
  const yearParam = params.year as string | undefined;
  const startDate = params.startDate as string | undefined;
  const endDate = params.endDate as string | undefined;

  const currentYear = new Date().getFullYear();
  const selectedYear = yearParam ? parseInt(yearParam) : currentYear;

  const expenses = await getExpensesAction();

  let filteredExpenses = expenses;

  // Filter by date range if provided
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    filteredExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= start && expenseDate <= end;
    });
  } else if (monthParam) {
    // Filter by month and selected year
    const norm = normalizeMonth(monthParam);
    const foundMonth = MONTHS.find((m) => m.value === norm);

    if (foundMonth) {
      const filterDate = new Date(selectedYear, foundMonth.index, 1);
      const endOfMonth = new Date(selectedYear, foundMonth.index + 1, 0, 23, 59, 59, 999);

      filteredExpenses = expenses.filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= filterDate && expenseDate <= endOfMonth;
      });
    }
  }

  const isFiltered = Boolean(startDate || endDate || monthParam || yearParam);
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Institutional Operating Expenses
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Monitor center overheads, utilities, paper supplies, and audit expenditure.
          </p>
        </div>

        {isFiltered && (
          <div className="bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-xs text-rose-700 font-semibold">Filtered Expenses:</span>
            <span className="text-sm font-black text-rose-900 tabular-nums">
              ৳{totalAmount.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs">
        <form className="flex flex-wrap items-end gap-3 text-xs">
          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              defaultValue={startDate || ""}
              className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              defaultValue={endDate || ""}
              className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center text-zinc-400 py-1.5 font-bold uppercase text-[10px]">
            or
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Year</label>
            <select
              name="year"
              defaultValue={selectedYear.toString()}
              className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            >
              {YEARS.map((y) => (
                <option key={y} value={y.toString()}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-zinc-700 mb-1">Month</label>
            <select
              name="month"
              defaultValue={monthParam || ""}
              className="px-3 py-1.5 border border-zinc-300 rounded-lg text-xs bg-white text-zinc-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
            >
              <option value="">All Months</option>
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Apply Filter</span>
          </button>

          {isFiltered && (
            <Link
              href="/admin-route/expenses"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Link>
          )}
        </form>
      </div>

      {/* Main Expense Table */}
      <ExpenseList initialExpenses={filteredExpenses} />
    </div>
  );
}
