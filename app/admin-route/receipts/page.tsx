import { ReceiptList } from "@/components/ReceiptList";
import { getReceiptsAction, getBatchesByClassAction } from "@/app/actions/receipts";
import { getStudentsAction } from "@/app/actions/data";
import { CLASSES, type Month } from "../types/admin";
import Link from "next/link";
import { Calendar, Filter, Sparkles } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/admin-route/dashboard");
  }

  const params = await searchParams;
  
  // Calculate current month date boundaries
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();

  const currentMonthStart = `${year}-${String(monthIdx + 1).padStart(2, "0")}-01`;
  const currentMonthEnd = `${year}-${String(monthIdx + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const monthName = now.toLocaleString("en-US", { month: "long" });

  const isAllTime = params.all === "true";
  const isCustomRange = Boolean(params.startDate || params.endDate);

  // Default to current month according to payment date unless explicitly requested as all time
  const startDate = isAllTime ? undefined : ((params.startDate as string) || currentMonthStart);
  const endDate = isAllTime ? undefined : ((params.endDate as string) || currentMonthEnd);

  // Extract filter params
  const className = params.class as string | undefined;
  const batchId = params.batch ? parseInt(params.batch as string) : undefined;
  const month = params.month as string | undefined;
  const search = params.search as string | undefined;

  let dateRangeLabel = `Current Month Collection (${monthName} ${year})`;
  if (isAllTime) {
    dateRangeLabel = "All Time Total Collection";
  } else if (isCustomRange) {
    dateRangeLabel = `Filtered Collection (${startDate || "Beginning"} to ${endDate || "Present"})`;
  }

  // Fetch data in parallel
  const [receiptsResult, students] = await Promise.all([
    getReceiptsAction({
      class: className,
      batchId,
      month,
      search,
      startDate,
      endDate,
    }),
    getStudentsAction(),
  ]);

  const receipts = receiptsResult.success ? receiptsResult.data : [];
  const receiptsData = receipts as any;
  const totalAmount = receiptsData.reduce((sum: number, r: any) => sum + r.amount, 0);

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">Fee Receipts & Collection</h1>
          <p className="text-zinc-500 mt-1">
            Payment transactions filtered by payment date (default: {monthName} {year}).
          </p>
        </div>

        {/* Quick Date Range Switcher */}
        <div className="inline-flex items-center gap-1.5 p-1 bg-zinc-100/90 rounded-xl border border-zinc-200 text-xs">
          <Link
            href="/admin-route/receipts"
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              !isAllTime && !isCustomRange
                ? "bg-white text-indigo-700 shadow-xs font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            This Month ({monthName})
          </Link>
          <Link
            href="/admin-route/receipts?all=true"
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              isAllTime
                ? "bg-white text-indigo-700 shadow-xs font-semibold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            All Time
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200/90 p-4">
        <form className="flex flex-wrap gap-4 items-end">
          {/* Date Range according to payment date */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Payment From
            </label>
            <input
              type="date"
              name="startDate"
              defaultValue={startDate || ""}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50/50 focus:bg-white text-zinc-800 outline-none focus-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Payment To
            </label>
            <input
              type="date"
              name="endDate"
              defaultValue={endDate || ""}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50/50 focus:bg-white text-zinc-800 outline-none focus-ring"
            />
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Class</label>
            <select
              name="class"
              defaultValue={className}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50/50 focus:bg-white text-zinc-800 outline-none focus-ring"
            >
              <option value="">All Classes</option>
              {CLASSES.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Fee Month Filter */}
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Fee For Month</label>
            <select
              name="month"
              defaultValue={month}
              className="px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50/50 focus:bg-white text-zinc-800 outline-none focus-ring"
            >
              <option value="">All Months</option>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-zinc-700 mb-1">Search Student</label>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Name, roll, or mobile..."
              className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-xs bg-zinc-50/50 focus:bg-white text-zinc-800 outline-none focus-ring"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors focus-ring"
            >
              Filter
            </button>
            <Link
              href="/admin-route/receipts"
              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-medium transition-colors"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Receipt List Table */}
      <ReceiptList 
        initialReceipts={receipts as any} 
        students={students as any}
        filters={{ class: className, batchId, month, search }}
        totalAmount={totalAmount}
        dateRangeLabel={dateRangeLabel}
      />
    </div>
  );
}
