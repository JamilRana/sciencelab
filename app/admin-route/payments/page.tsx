import { TeacherPaymentList } from "@/components/TeacherPaymentList";
import {
  getTeacherPaymentsAction,
  getTeachersForPaymentAction,
} from "@/app/actions/teacher-payments";
import { normalizeMonth } from "@/lib/month";
import { Filter, Calendar, RotateCcw } from "lucide-react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const MONTHS = [
  { value: "Jan", label: "January (Jan)" },
  { value: "Feb", label: "February (Feb)" },
  { value: "Mar", label: "March (Mar)" },
  { value: "Apr", label: "April (Apr)" },
  { value: "May", label: "May (May)" },
  { value: "Jun", label: "June (Jun)" },
  { value: "Jul", label: "July (Jul)" },
  { value: "Aug", label: "August (Aug)" },
  { value: "Sep", label: "September (Sep)" },
  { value: "Oct", label: "October (Oct)" },
  { value: "Nov", label: "November (Nov)" },
  { value: "Dec", label: "December (Dec)" },
];

export default async function PaymentsPage({
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
  const startDate = params.startDate as string | undefined;
  const endDate = params.endDate as string | undefined;

  const [payments, teachers] = await Promise.all([
    getTeacherPaymentsAction(),
    getTeachersForPaymentAction(),
  ]);

  let filteredPayments = payments;

  // Filter by date range if provided
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    filteredPayments = payments.filter((p: any) => {
      const paymentDate = new Date(p.date);
      return paymentDate >= start && paymentDate <= end;
    });
  } else if (monthParam) {
    const norm = normalizeMonth(monthParam);
    filteredPayments = payments.filter(
      (p: any) => normalizeMonth(p.month) === norm
    );
  }

  const isFiltered = Boolean(startDate || endDate || monthParam);
  const monthlyTotal = filteredPayments.reduce(
    (sum: number, p: any) => sum + p.amount,
    0
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Teacher Remuneration & Payroll
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Manage teacher salaries, class log disbursements, and cash vouchers.
          </p>
        </div>

        {isFiltered && (
          <div className="bg-indigo-50 border border-indigo-200 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-xs text-indigo-700 font-semibold">Filtered Total:</span>
            <span className="text-sm font-black text-indigo-900 tabular-nums">
              ৳{monthlyTotal.toLocaleString()}
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
            <label className="block font-semibold text-zinc-700 mb-1">Salary Month</label>
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
              href="/admin-route/payments"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </Link>
          )}
        </form>
      </div>

      {/* Main List */}
      <TeacherPaymentList initialPayments={filteredPayments} teachers={teachers} />
    </div>
  );
}
