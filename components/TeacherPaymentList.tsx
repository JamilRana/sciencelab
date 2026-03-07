"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, User, Calendar, DollarSign } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { DataTable, Column } from "@/components/ui/data-table";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { createTeacherPaymentAction, deleteTeacherPaymentAction, getTeachersForPaymentAction } from "@/app/actions/teacher-payments";
import { toast } from "sonner";
import type { Teacher } from "@/types";

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

  const columns: Column<Payment>[] = [
    {
      key: "teacher",
      header: "Teacher",
      render: (payment) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <User className="h-5 w-5" />
          </div>
          <p className="font-semibold text-gray-900">{payment.teacher?.name}</p>
        </div>
      ),
    },
    {
      key: "month",
      header: "Month",
      sortable: true,
      render: (payment) => (
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
          {payment.month}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      render: (payment) => (
        <span className="font-bold text-green-600">৳{payment.amount.toLocaleString()}</span>
      ),
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (payment) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          {new Date(payment.date).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "note",
      header: "Note",
      render: (payment) => (
        <span className="text-sm text-gray-500">{payment.note || "-"}</span>
      ),
    },
  ];

  const totalPaid = initialPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = await createTeacherPaymentAction(data);

      if (result.success) {
        toast.success("Payment added successfully");
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
    if (!confirm("Are you sure you want to delete this payment?")) return;
    try {
      const result = await deleteTeacherPaymentAction(id);
      if (result.success) {
        toast.success("Payment deleted");
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
      <div className="flex justify-between items-center bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-2xl shadow-lg">
        <div>
          <p className="text-purple-100 text-sm font-medium">Total Paid</p>
          <p className="text-white text-3xl font-bold">৳{totalPaid.toLocaleString()}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 h-11 bg-white text-purple-600 font-bold rounded-xl shadow-lg transition-all active:scale-95"
        >
          <Plus className="h-5 w-5" />
          Add Payment
        </button>
      </div>

      <DataTable
        data={initialPayments}
        columns={columns}
        searchFields={["month", "note"]}
        placeholder="Search payments..."
        pageSize={15}
        onDelete={handleDelete}
        emptyMessage="No payments found"
      />

      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Add Teacher Payment"
      >
        <PaymentForm
          onSubmit={onSubmit}
          isLoading={isLoading}
          teachers={teachers}
        />
      </DataModal>
    </div>
  );
}
