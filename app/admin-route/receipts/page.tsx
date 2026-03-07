// app/admin-route/receipts/page.tsx
import { ReceiptList } from "@/components/ReceiptList";
import { getReceiptsAction, getBatchesByClassAction } from "@/app/actions/receipts";
import { getStudentsAction } from "@/app/actions/data";
import { CLASSES, type Month } from "../types/admin";

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  
  // Extract filter params
  const className = params.class as string | undefined;
  const batchId = params.batch ? parseInt(params.batch as string) : undefined;
  const month = params.month as string | undefined;
  const search = params.search as string | undefined;

  // Fetch data in parallel
  const [receiptsResult, students] = await Promise.all([
    getReceiptsAction({
      class: className,
      batchId,
      month,
      search,
    }),
    getStudentsAction(),
  ]);

  const receipts = receiptsResult.success ? receiptsResult.data : [];
  const receiptsData = receipts as any;
  const totalAmount = receiptsData.reduce((sum: number, r: any) => sum + r.amount, 0);

  return (
    <div className="max-w-[1400px] mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Fee Receipts</h1>
        <p className="text-gray-500 mt-1">Monitor payments and transaction history.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow border p-4 mb-6">
        <form className="flex flex-wrap gap-4 items-end">
          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              name="class"
              defaultValue={className}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {CLASSES.map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              name="month"
              defaultValue={month}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Months</option>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Name, roll, or mobile..."
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Filter
            </button>
            <a
              href="/admin-route/receipts"
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Clear
            </a>
          </div>
        </form>
      </div>

      {/* Receipt List Table */}
      <ReceiptList 
        initialReceipts={receipts as any} 
        students={students as any}
        filters={{ class: className, batchId, month, search }}
        totalAmount={totalAmount}
      />
    </div>
  );
}
