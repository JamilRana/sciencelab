import { TeacherPaymentList } from "@/components/TeacherPaymentList";
import { getTeacherPaymentsAction, getTeachersForPaymentAction } from "@/app/actions/teacher-payments";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const monthParam = params.month as string | undefined;
  
  const [payments, teachers] = await Promise.all([
    getTeacherPaymentsAction(),
    getTeachersForPaymentAction(),
  ]);

  let filteredPayments = payments;
  let monthlyTotal = 0;
  
  if (monthParam) {
    filteredPayments = payments.filter((p: any) => p.month === monthParam);
    monthlyTotal = filteredPayments.reduce((sum: number, p: any) => sum + p.amount, 0);
  }

  return (
    <div className="py-6 px-4 md:px-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Teacher Payments</h1>
        <p className="text-gray-500 mt-1">Manage teacher salary payments.</p>
      </div>

      {/* Month Filter */}
      <div className="bg-white rounded-xl shadow border p-4 mb-6">
        <form className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              name="month"
              defaultValue={monthParam || ""}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Filter
          </button>
          {monthParam && (
            <a
              href="/admin-route/payments"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Clear
            </a>
          )}
          {monthParam && (
            <div className="ml-auto bg-purple-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-purple-600">Monthly Total: </span>
              <span className="text-lg font-bold text-purple-700">৳{monthlyTotal.toLocaleString()}</span>
            </div>
          )}
        </form>
      </div>

      <TeacherPaymentList initialPayments={filteredPayments} teachers={teachers} />
    </div>
  );
}
