"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, User, Calendar, DollarSign, Download, Printer, Search } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { DataTable, Column } from "@/components/ui/data-table";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { TeacherPaymentReceiptModal } from "@/components/TeacherPaymentReceiptModal";
import { createTeacherPaymentAction, deleteTeacherPaymentAction } from "@/app/actions/teacher-payments";
import { toast } from "sonner";
import type { Teacher } from "@/types";
import { exportToCSV } from "@/lib/export";

interface Payment {
  id: number;
  teacherId: number;
  month: string;
  amount: number;
  date: Date;
  note: string;
  teacher?: Teacher;
}

interface TeacherPaymentListProps {
  initialPayments: Payment[];
  teachers: Teacher[];
}

export function TeacherPaymentList({ initialPayments, teachers }: TeacherPaymentListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);

  const columns: Column<Payment>[] = [
    {
      key: "id",
      header: "Voucher",
      width: "90px",
      render: (payment) => (
        <span className="font-mono text-xs font-bold text-zinc-600">
          TP-{String(payment.id).padStart(4, "0")}
        </span>
      ),
    },
    {
      key: "teacher",
      header: "Teacher",
      sortable: true,
      render: (payment) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
            {payment.teacher?.name ? payment.teacher.name[0].toUpperCase() : <User className="h-4 w-4" />}
          </div>
          <div>
            <p className="font-semibold text-xs text-zinc-900">{payment.teacher?.name || "Teacher"}</p>
            <p className="text-[11px] text-zinc-500 font-mono">{payment.teacher?.mobile || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "month",
      header: "Month",
      sortable: true,
      width: "100px",
      render: (payment) => (
        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-xs font-bold">
          {payment.month}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Disbursed",
      sortable: true,
      align: "right",
      render: (payment) => (
        <span className="font-bold text-xs text-emerald-700 tabular-nums">
          ৳{payment.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      align: "right",
      render: (payment) => (
        <div className="flex items-center justify-end gap-1 text-xs text-zinc-500 tabular-nums">
          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
          {new Date(payment.date).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "note",
      header: "Note",
      render: (payment) => (
        <span className="text-xs text-zinc-500 truncate max-w-[150px] inline-block">
          {payment.note || "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Voucher",
      width: "90px",
      align: "center",
      render: (payment) => (
        <button
          onClick={() => setSelectedPaymentForReceipt(payment)}
          className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-zinc-100 rounded-lg transition-colors"
          title="Print Payment Voucher"
        >
          <Printer className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const totalPaid = initialPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleExport = () => {
    const exportData = initialPayments.map((p) => ({
      voucher: `TP-${String(p.id).padStart(4, "0")}`,
      date: new Date(p.date).toLocaleDateString(),
      teacher: p.teacher?.name || "",
      mobile: p.teacher?.mobile || "",
      month: p.month,
      amount: p.amount,
      note: p.note || "",
    }));
    exportToCSV(exportData, "teacher_payments");
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await createTeacherPaymentAction(data);

      if (result.success) {
        toast.success("Payment recorded and synchronized with accounts");
        handleClose();
        router.refresh();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this payment record? Associated expense will also be removed.")) {
      return;
    }
    try {
      const result = await deleteTeacherPaymentAction(id);
      if (result.success) {
        toast.success("Payment and associated ledger entry deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete payment");
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI & Actions Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900 text-white p-5 rounded-xl shadow-xs">
        <div>
          <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
            Total Remuneration Disbursed
          </p>
          <p className="text-white text-2xl font-black tabular-nums mt-0.5">
            ৳{totalPaid.toLocaleString()}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Across {initialPayments.length} recorded disbursement vouchers
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-lg transition-colors border border-zinc-700"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Payment</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={initialPayments}
        columns={columns}
        placeholder="Filter by teacher, month, or note..."
        pageSize={15}
        onDelete={handleDelete}
        emptyMessage="No payments found"
        customSearchFn={(payment, query) => {
          const q = query.toLowerCase();
          return (
            (payment.teacher?.name && payment.teacher.name.toLowerCase().includes(q)) ||
            (payment.teacher?.mobile && payment.teacher.mobile.includes(q)) ||
            payment.month.toLowerCase().includes(q) ||
            (payment.note && payment.note.toLowerCase().includes(q)) ||
            String(payment.id).includes(q)
          );
        }}
      />

      {/* Add Payment Modal */}
      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Disburse Teacher Remuneration"
      >
        <PaymentForm
          onSubmit={onSubmit}
          isLoading={isLoading}
          teachers={teachers}
        />
      </DataModal>

      {/* Printable Voucher Modal */}
      <TeacherPaymentReceiptModal
        isOpen={!!selectedPaymentForReceipt}
        onClose={() => setSelectedPaymentForReceipt(null)}
        payment={selectedPaymentForReceipt}
      />
    </div>
  );
}
