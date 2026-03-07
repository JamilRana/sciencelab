import { ExpenseList } from "@/components/ExpenseList";
import { getExpensesAction } from "@/app/actions/data";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const monthParam = params.month as string | undefined;
  
  const expenses = await getExpensesAction();
  
  let filteredExpenses = expenses;
  let monthlyTotal = 0;
  
  if (monthParam) {
    const monthIndex = MONTHS.indexOf(monthParam);
    if (monthIndex >= 0) {
      const now = new Date();
      const filterDate = new Date(now.getFullYear(), monthIndex, 1);
      const endOfMonth = new Date(now.getFullYear(), monthIndex + 1, 0);
      
      filteredExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= filterDate && expenseDate <= endOfMonth;
      });
      monthlyTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    }
  }

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Expense Tracking</h1>
        <p className="text-gray-500 mt-1">Monitor operational costs and maintaining financial transparency.</p>
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
              href="/admin-route/expenses"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Clear
            </a>
          )}
          {monthParam && (
            <div className="ml-auto bg-red-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-red-600">Total: </span>
              <span className="text-lg font-bold text-red-700">৳{monthlyTotal.toLocaleString()}</span>
            </div>
          )}
        </form>
      </div>

      <ExpenseList initialExpenses={filteredExpenses} />
    </div>
  );
}
