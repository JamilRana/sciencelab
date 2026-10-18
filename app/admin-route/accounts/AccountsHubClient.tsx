"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  Receipt as ReceiptIcon,
  TrendingDown,
  Banknote,
  Plus,
  Printer,
  Calendar,
  DollarSign,
  Download,
  Trash2,
  GraduationCap,
} from "lucide-react";
import { DataTable, Column } from "@/components/ui/data-table";
import { DataModal } from "@/components/ui/data-modal";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { createExpenseAction, deleteExpenseAction } from "@/app/actions/expenses";
import { createTeacherPaymentAction, deleteTeacherPaymentAction } from "@/app/actions/teacher-payments";
import { TeacherPaymentReceiptModal } from "@/components/TeacherPaymentReceiptModal";
import { generateDisplayRoll } from "@/lib/roll";
import { toast } from "sonner";
import Link from "next/link";
import { SpecialCourseFeesTable } from "@/components/accounts/SpecialCourseFeesTable";

interface AccountsHubClientProps {
  initialTab: string;
  receipts: any[];
  expenses: any[];
  teacherPayments: any[];
  students: any[];
  teachers: any[];
  courseFees?: any[];
  programs?: any[];
}

export function AccountsHubClient({
  initialTab,
  receipts: initialReceipts,
  expenses: initialExpenses,
  teacherPayments: initialTeacherPayments,
  students,
  teachers,
  courseFees = [],
  programs = [],
}: AccountsHubClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab || "fees");

  // Expenses state
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Teacher Payments state
  const [teacherPayments, setTeacherPayments] = useState(initialTeacherPayments);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentForVoucher, setSelectedPaymentForVoucher] = useState<any>(null);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.replace(`/admin-route/accounts?tab=${tab}`, { scroll: false });
  };

  // Receipts Columns
  const receiptColumns: Column<any>[] = [
    {
      key: "id",
      header: "Receipt #",
      width: "100px",
      render: (r) => (
        <span className="font-semibold text-zinc-900 tabular-nums">#{r.id}</span>
      ),
    },
    {
      key: "roll",
      header: "Roll",
      width: "110px",
      searchValue: (r) => {
        const batchCode = r.student?.batch?.code || "";
        return `${batchCode}${r.student?.roll}`;
      },
      render: (r) => {
        const roll = r.student?.batch?.code
          ? generateDisplayRoll(r.student.batch.code, r.student.roll)
          : r.student?.roll;
        return (
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded tabular-nums">
            {roll}
          </span>
        );
      },
    },
    {
      key: "student",
      header: "Student",
      sortable: true,
      searchValue: (r) => r.student?.name || "",
      render: (r) => (
        <div>
          <p className="font-semibold text-zinc-900">{r.student?.name}</p>
          <p className="text-[11px] text-zinc-400">Class {r.student?.class} · {r.student?.batch?.name}</p>
        </div>
      ),
    },
    {
      key: "month",
      header: "Month",
      sortable: true,
      width: "100px",
      render: (r) => (
        <span className="text-xs font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
          {r.month}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      render: (r) => (
        <span className="font-bold text-emerald-700 tabular-nums">৳{r.amount.toLocaleString()}</span>
      ),
    },
    {
      key: "date",
      header: "Date Paid",
      sortable: true,
      align: "right",
      render: (r) => (
        <span className="text-xs text-zinc-500 tabular-nums">
          {new Date(r.date).toLocaleDateString()}
        </span>
      ),
    },
  ];

  // Expenses Columns
  const expenseColumns: Column<any>[] = [
    {
      key: "id",
      header: "ID",
      width: "80px",
      render: (e) => <span className="text-xs text-zinc-400 tabular-nums">#{e.id}</span>,
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
      render: (e) => <span className="font-semibold text-zinc-900">{e.description}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      render: (e) => (
        <span className="font-bold text-rose-600 tabular-nums">৳{e.amount.toLocaleString()}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      align: "right",
      render: (e) => (
        <span className="text-xs text-zinc-500 tabular-nums">
          {new Date(e.date).toLocaleDateString()}
        </span>
      ),
    },
  ];

  // Teacher Payments Columns
  const paymentColumns: Column<any>[] = [
    {
      key: "id",
      header: "ID",
      width: "80px",
      render: (p) => <span className="text-xs text-zinc-400 tabular-nums">#{p.id}</span>,
    },
    {
      key: "teacher",
      header: "Teacher",
      sortable: true,
      searchValue: (p) => p.teacher?.name || "",
      render: (p) => (
        <div>
          <p className="font-semibold text-zinc-900">{p.teacher?.name}</p>
          <p className="text-[11px] text-zinc-400 tabular-nums">{p.teacher?.mobile}</p>
        </div>
      ),
    },
    {
      key: "month",
      header: "Month",
      sortable: true,
      width: "100px",
      render: (p) => (
        <span className="text-xs font-medium text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded">
          {p.month}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Disbursed",
      sortable: true,
      align: "right",
      render: (p) => (
        <span className="font-bold text-indigo-700 tabular-nums">৳{p.amount.toLocaleString()}</span>
      ),
    },
    {
      key: "note",
      header: "Note",
      render: (p) => <span className="text-xs text-zinc-500">{p.note || "—"}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      align: "right",
      render: (p) => (
        <span className="text-xs text-zinc-500 tabular-nums">
          {new Date(p.date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Voucher",
      width: "80px",
      align: "center",
      render: (p) => (
        <button
          onClick={() => setSelectedPaymentForVoucher(p)}
          className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 rounded-lg transition-colors"
          title="Print Payment Voucher"
        >
          <Printer className="h-3.5 w-3.5" />
        </button>
      ),
    },
  ];

  // Handlers
  const handleCreateExpense = async (data: any) => {
    try {
      const res = await createExpenseAction(data);
      if (res.success) {
        toast.success("Expense recorded successfully");
        setIsExpenseModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to add expense");
      }
    } catch {
      toast.error("Error creating expense");
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!confirm("Are you sure you want to remove this expense entry?")) return;
    try {
      const res = await deleteExpenseAction(id);
      if (res.success) {
        toast.success("Expense removed");
        setExpenses((prev) => prev.filter((e) => e.id !== id));
      } else {
        toast.error("Failed to delete expense");
      }
    } catch {
      toast.error("Error deleting expense");
    }
  };

  const handleCreatePayment = async (data: any) => {
    try {
      const res = await createTeacherPaymentAction(data);
      if (res.success) {
        toast.success("Teacher disbursement recorded");
        setIsPaymentModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to record payment");
      }
    } catch {
      toast.error("Error recording payment");
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm("Are you sure you want to remove this teacher payment?")) return;
    try {
      const res = await deleteTeacherPaymentAction(id);
      if (res.success) {
        toast.success("Payment record deleted");
        setTeacherPayments((prev) => prev.filter((p) => p.id !== id));
      } else {
        toast.error("Failed to delete payment");
      }
    } catch {
      toast.error("Error deleting payment");
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-xl max-w-fit border border-zinc-200/80">
        <button
          onClick={() => handleTabChange("fees")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "fees"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Fees Matrix</span>
        </button>

        <button
          onClick={() => handleTabChange("course-fees")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "course-fees"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <GraduationCap className="h-3.5 w-3.5" />
          <span>Special Batch Course Fees</span>
        </button>

        <button
          onClick={() => handleTabChange("receipts")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "receipts"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <ReceiptIcon className="h-3.5 w-3.5" />
          <span>Receipts Archive</span>
        </button>

        <button
          onClick={() => handleTabChange("expenses")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "expenses"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <TrendingDown className="h-3.5 w-3.5" />
          <span>Institutional Expenses</span>
        </button>

        <button
          onClick={() => handleTabChange("payments")}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "payments"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Banknote className="h-3.5 w-3.5" />
          <span>Teacher Payroll</span>
        </button>
      </div>

      {/* Tab 1: Fees Matrix Shortcut Banner */}
      {activeTab === "fees" && (
        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                12-Month Student Tuition Matrix
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xl">
                Open the interactive fee register to view color-coded payment statuses across all classes, filter overdue students, and collect payments with printable receipts.
              </p>
            </div>
            <Link
              href="/admin-route/fees"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors shrink-0"
            >
              <CreditCard className="h-4 w-4" />
              <span>Launch Full Fees Matrix →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Tab: Special Batch Course Fees */}
      {activeTab === "course-fees" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200 p-4 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Special Batch Course Fees & Installments</h3>
              <p className="text-xs text-zinc-500">
                Track one-time course fees paid over multiple installments for SSC and Junior School special programs.
              </p>
            </div>
            <div className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-lg">
              {courseFees.length} Enrolled Students
            </div>
          </div>

          <SpecialCourseFeesTable
            initialCourseFees={courseFees}
            programs={programs}
          />
        </div>
      )}

      {/* Tab 2: Receipts Archive */}
      {activeTab === "receipts" && (
        <div className="space-y-3">
          <DataTable<any>
            data={initialReceipts}
            columns={receiptColumns}
            searchFields={["student", "month"]}
            placeholder="Search receipts by student name or month..."
            pageSize={15}
            emptyTitle="No receipts recorded"
            emptyMessage="Tuition fee collections will automatically appear here."
            exportFileName="fee_receipts_archive"
          />
        </div>
      )}

      {/* Tab 3: Institutional Expenses */}
      {activeTab === "expenses" && (
        <div className="space-y-3">
          <DataTable<any>
            data={expenses}
            columns={expenseColumns}
            searchFields={["description"]}
            placeholder="Search expenses by description..."
            pageSize={15}
            onAdd={() => setIsExpenseModalOpen(true)}
            addLabel="+ Add Expense"
            onDelete={(id) => handleDeleteExpense(id)}
            emptyTitle="No expenses recorded"
            emptyMessage="Record operational coaching center costs such as utilities, rent, and prints."
            exportFileName="center_expenses"
          />

          <DataModal
            isOpen={isExpenseModalOpen}
            onClose={() => setIsExpenseModalOpen(false)}
            title="Record New Expense"
          >
            <ExpenseForm
              onSubmit={handleCreateExpense}
              isLoading={false}
            />
          </DataModal>
        </div>
      )}

      {/* Tab 4: Teacher Payments */}
      {activeTab === "payments" && (
        <div className="space-y-3">
          <DataTable<any>
            data={teacherPayments}
            columns={paymentColumns}
            searchFields={["teacher", "month", "note"]}
            placeholder="Search disbursements by teacher name, month, or note..."
            pageSize={15}
            onAdd={() => setIsPaymentModalOpen(true)}
            addLabel="+ Disburse Payment"
            onDelete={(id) => handleDeletePayment(id)}
            emptyTitle="No teacher payments recorded"
            emptyMessage="Disburse faculty earnings based on monthly class logs."
            exportFileName="teacher_payroll_disbursements"
          />

          <DataModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            title="Disburse Teacher Remuneration"
          >
            <PaymentForm
              onSubmit={handleCreatePayment}
              isLoading={false}
              teachers={teachers}
            />
          </DataModal>
        </div>
      )}

      {/* Printable Payment Voucher Modal */}
      <TeacherPaymentReceiptModal
        isOpen={!!selectedPaymentForVoucher}
        onClose={() => setSelectedPaymentForVoucher(null)}
        payment={selectedPaymentForVoucher}
      />
    </div>
  );
}
