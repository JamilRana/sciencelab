import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getDashboardStats, getReceiptsAction } from "@/app/actions/data";
import { getClassLogStatsAction } from "@/app/actions/teacher-analytics";
import Link from "next/link";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const monthParam = params.month as string | undefined;
  const now = new Date();
  
  let filterDate: Date;
  let filterLabel: string;
  
  if (monthParam) {
    const monthIndex = MONTHS.indexOf(monthParam);
    if (monthIndex >= 0) {
      filterDate = new Date(now.getFullYear(), monthIndex, 1);
      filterLabel = monthParam;
    } else {
      filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
      filterLabel = MONTHS[now.getMonth()];
    }
  } else {
    filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
    filterLabel = MONTHS[now.getMonth()];
  }
  
  const endOfMonth = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0);

  const session = await getServerSession(authOptions);
  const role = (session?.user?.role as string) || "STAFF";
  const isAdmin = role === "ADMIN";

  const [stats, receipts, classLogStats] = await Promise.all([
    getDashboardStats(),
    getReceiptsAction(),
    isAdmin ? getClassLogStatsAction(filterLabel) : Promise.resolve(null),
  ]);
  
  const recentReceipts = receipts.slice(0, 5);

  const currentMonthReceipts = receipts.filter(r => {
    const receiptDate = new Date(r.date);
    return receiptDate >= filterDate && receiptDate <= endOfMonth;
  });
  const monthlyIncome = currentMonthReceipts.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="py-6 px-4 md:px-0">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {isAdmin ? "Admin" : "Staff"} Dashboard
        </h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {session?.user?.name}
        </p>
      </div>

      {/* Month Filter */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <form className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Month</label>
              <select
                name="month"
                defaultValue={monthParam || ""}
                className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Current Month</option>
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
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Link href="/admin-route/students" className="bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:border-blue-300 transition-colors">
          <p className="text-gray-500 text-sm">Total Students</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.studentCount}</p>
        </Link>
        <Link href="/admin-route/teachers" className="bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:border-purple-300 transition-colors">
          <p className="text-gray-500 text-sm">Total Teachers</p>
          <p className="text-2xl md:text-3xl font-bold text-purple-600">{stats.teacherCount}</p>
        </Link>
        <Link href="/admin-route/exams" className="bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:border-green-300 transition-colors">
          <p className="text-gray-500 text-sm">Total Exams</p>
          <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.examCount}</p>
        </Link>
        {isAdmin && (
          <Link href="/admin-route/fees" className="bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:border-orange-300 transition-colors">
            <p className="text-gray-500 text-sm">Total Receipts</p>
            <p className="text-2xl md:text-3xl font-bold text-orange-600">{stats.receiptCount}</p>
          </Link>
        )}
      </div>

      {/* Monthly Stats */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500 text-sm">Income ({filterLabel})</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">৳{monthlyIncome.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500 text-sm">Expense ({filterLabel})</p>
            <p className="text-2xl md:text-3xl font-bold text-red-600">৳{stats.monthlyExpense.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500 text-sm">Total Income</p>
            <p className="text-2xl md:text-3xl font-bold text-green-700">৳{stats.totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
            <p className="text-gray-500 text-sm">Total Expense</p>
            <p className="text-2xl md:text-3xl font-bold text-red-700">৳{stats.totalExpense.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Teacher Class Log Stats */}
      {isAdmin && classLogStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Link href="/admin-route/class-log" className="bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:border-pink-300 transition-colors">
            <p className="text-gray-500 text-sm">Total Classes ({filterLabel})</p>
            <p className="text-2xl md:text-3xl font-bold text-pink-600">{classLogStats.totalClasses}</p>
          </Link>
          <Link href="/admin-route/class-log" className="bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:border-purple-300 transition-colors">
            <p className="text-gray-500 text-sm">Teachers</p>
            <p className="text-2xl md:text-3xl font-bold text-purple-600">{classLogStats.teacherCount}</p>
          </Link>
          <Link href="/admin-route/class-log" className="bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:border-green-300 transition-colors">
            <p className="text-gray-500 text-sm">Teacher Paid</p>
            <p className="text-2xl md:text-3xl font-bold text-green-600">৳{classLogStats.totalPaid.toLocaleString()}</p>
          </Link>
          <Link href="/admin-route/class-log" className="bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:border-red-300 transition-colors">
            <p className="text-gray-500 text-sm">Teacher Due</p>
            <p className="text-2xl md:text-3xl font-bold text-red-600">৳{classLogStats.totalDue.toLocaleString()}</p>
          </Link>
          <Link href="/admin-route/payments" className="bg-white p-4 md:p-6 rounded-xl shadow-sm border hover:border-orange-300 transition-colors">
            <p className="text-gray-500 text-sm">Log Entries</p>
            <p className="text-2xl md:text-3xl font-bold text-orange-600">{classLogStats.logsCount}</p>
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <Link href="/admin-route/students" className="bg-white p-4 rounded-xl shadow-sm border hover:border-blue-300 transition-colors">
          <p className="text-2xl mb-2">👥</p>
          <p className="font-semibold text-gray-900">Students</p>
          <p className="text-xs text-gray-500">Manage students</p>
        </Link>
        <Link href="/admin-route/teachers" className="bg-white p-4 rounded-xl shadow-sm border hover:border-purple-300 transition-colors">
          <p className="text-2xl mb-2">👨‍🏫</p>
          <p className="font-semibold text-gray-900">Teachers</p>
          <p className="text-xs text-gray-500">Manage teachers</p>
        </Link>
        <Link href="/admin-route/exams" className="bg-white p-4 rounded-xl shadow-sm border hover:border-green-300 transition-colors">
          <p className="text-2xl mb-2">📝</p>
          <p className="font-semibold text-gray-900">Exams</p>
          <p className="text-xs text-gray-500">Manage exams</p>
        </Link>
        {isAdmin && (
        <Link href="/admin-route/fees" className="bg-white p-4 rounded-xl shadow-sm border hover:border-orange-300 transition-colors">
          <p className="text-2xl mb-2">💰</p>
          <p className="font-semibold text-gray-900">Fees</p>
          <p className="text-xs text-gray-500">Manage fees</p>
        </Link>
        )}
        <Link href="/admin-route/marks" className="bg-white p-4 rounded-xl shadow-sm border hover:border-indigo-300 transition-colors">
          <p className="text-2xl mb-2">📊</p>
          <p className="font-semibold text-gray-900">Marks</p>
          <p className="text-xs text-gray-500">Bulk entry</p>
        </Link>
        <Link href="/admin-route/class-log" className="bg-white p-4 rounded-xl shadow-sm border hover:border-pink-300 transition-colors">
          <p className="text-2xl mb-2">📅</p>
          <p className="font-semibold text-gray-900">Class Log</p>
          <p className="text-xs text-gray-500">Teacher logs</p>
        </Link>
      </div>

      {isAdmin && (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg md:text-xl font-bold mb-4">Recent Payments</h2>
          {recentReceipts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[300px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Student</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Month</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-left py-2 text-sm font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReceipts.map((receipt) => (
                    <tr key={receipt.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 text-sm">{receipt.student?.name}</td>
                      <td className="py-2 text-sm">{receipt.month}</td>
                      <td className="py-2 text-sm font-medium text-green-600">৳{receipt.amount}</td>
                      <td className="py-2 text-sm text-gray-500">{new Date(receipt.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No recent payments</p>
          )}
        </div>
      )}
    </div>
  );
}
