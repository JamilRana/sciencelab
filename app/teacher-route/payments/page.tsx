"use client";

import { useState, useEffect } from "react";
import { getTeacherPaymentHistoryAction } from "@/app/actions/teacher-analytics";
import { DollarSign, Calendar, FileText, Search } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Payment {
  id: number;
  date: Date;
  month: string;
  amount: number;
  note: string;
}

export default function TeacherPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPayments();
  }, [filterMonth]);

  const fetchPayments = async () => {
    try {
      const data = await getTeacherPaymentHistoryAction(0, filterMonth);
      setPayments(data as Payment[]);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) =>
    !searchQuery ||
    p.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPaid = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Payment History</h1>
        <p className="text-gray-500 mt-1">View your payment ledger and history.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payments found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(payment.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {payment.month}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                      ৳{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {payment.note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-700">
                    Total Paid
                  </td>
                  <td className="px-4 py-3 text-right text-lg font-bold text-green-700">
                    ৳{totalPaid.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
