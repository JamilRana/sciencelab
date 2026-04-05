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
  const startDate = params.startDate as string | undefined;
  const endDate = params.endDate as string | undefined;
  
  const [payments, teachers] = await Promise.all([
    getTeacherPaymentsAction(),
    getTeachersForPaymentAction(),
  ]);

  let filteredPayments = payments;
  let monthlyTotal = 0;
  
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
    filteredPayments = payments.filter((p: any) => p.month === monthParam);
  }
  
  monthlyTotal = filteredPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

  return (
    <div className="py-6 px-4 md:px-6">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Teacher Payments</h1>
        <p className="text-gray-500 mt-1">Manage teacher salary payments.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow border p-4 mb-6">
        <form className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              defaultValue={startDate || ""}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              defaultValue={endDate || ""}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center text-sm text-gray-500 py-2">
            or
          </div>
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
          {(startDate || endDate || monthParam) && (
            <a
              href="/admin-route/payments"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Clear
            </a>
          )}
          {(startDate || endDate || monthParam) && (
            <div className="ml-auto bg-purple-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-purple-600">Total: </span>
              <span className="text-lg font-bold text-purple-700">৳{monthlyTotal.toLocaleString()}</span>
            </div>
          )}
        </form>
      </div>

      <TeacherPaymentList initialPayments={filteredPayments} teachers={teachers} />
    </div>
  );
}
