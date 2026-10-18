"use client";

import { useState } from "react";
import { DataTable, Column } from "@/components/ui/data-table";
import { CoursePaymentModal } from "@/components/accounts/CoursePaymentModal";
import { PrintCourseReceiptModal } from "@/components/accounts/PrintCourseReceiptModal";
import { generateDisplayRoll } from "@/lib/roll";
import { Plus, Receipt, History, Phone, GraduationCap, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface SpecialCourseFeesTableProps {
  initialCourseFees: any[];
  programs: any[];
}

export function SpecialCourseFeesTable({
  initialCourseFees,
  programs,
}: SpecialCourseFeesTableProps) {
  const router = useRouter();
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState<any | null>(null);
  const [selectedProgramForPayment, setSelectedProgramForPayment] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const [receiptModalData, setReceiptModalData] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleOpenPayment = (courseFee: any) => {
    setSelectedStudentForPayment(courseFee.student);
    setSelectedProgramForPayment(courseFee.program);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    setReceiptModalData({
      ...paymentData,
      student: selectedStudentForPayment,
      program: selectedProgramForPayment,
    });
    setIsReceiptModalOpen(true);
    router.refresh();
  };

  const handleOpenReceipt = (courseFee: any, payment: any) => {
    setReceiptModalData({
      ...payment,
      student: courseFee.student,
      program: courseFee.program,
      totalPaidToDate: courseFee.totalPaid,
    });
    setIsReceiptModalOpen(true);
  };

  const columns: Column<any>[] = [
    {
      key: "roll",
      header: "Roll",
      width: "100px",
      sortable: true,
      searchValue: (cf) => {
        const batchCode = cf.student?.batch?.code || "";
        const roll = cf.student?.roll || "";
        return `${batchCode}${roll} ${roll}`;
      },
      render: (cf) => {
        const roll = cf.student?.batch?.code
          ? generateDisplayRoll(cf.student.batch.code, cf.student.roll)
          : cf.student?.roll;
        return (
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded tabular-nums">
            {roll}
          </span>
        );
      },
    },
    {
      key: "name",
      header: "Student",
      sortable: true,
      searchValue: (cf) => cf.student?.name || "",
      render: (cf) => (
        <div>
          <p className="font-semibold text-zinc-900">{cf.student?.name}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span>{cf.student?.gender}</span>
            <span>·</span>
            <span>{cf.student?.batch?.name}</span>
          </div>
        </div>
      ),
    },
    {
      key: "program",
      header: "Program",
      width: "140px",
      render: (cf) => (
        <span className="text-xs font-medium text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded-md">
          {cf.program?.name || cf.program?.code}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Mobile",
      width: "130px",
      render: (cf) => (
        <span className="text-xs text-zinc-600 tabular-nums">
          {cf.student?.mobile || "—"}
        </span>
      ),
    },
    {
      key: "agreedFee",
      header: "Agreed Fee",
      width: "120px",
      render: (cf) => (
        <span className="text-xs text-zinc-600">
          {cf.agreedFee ? `৳${cf.agreedFee.toLocaleString()}` : <span className="text-zinc-400 italic">Reference note</span>}
        </span>
      ),
    },
    {
      key: "totalPaid",
      header: "Total Collected",
      sortable: true,
      align: "right",
      render: (cf) => (
        <div className="text-right">
          <span className="text-sm font-bold text-emerald-700 tabular-nums">
            ৳{cf.totalPaid?.toLocaleString() || "0"}
          </span>
          <p className="text-[10px] text-zinc-400">
            {cf.installmentsCount || cf.payments?.length || 0} installment{(cf.installmentsCount || cf.payments?.length || 0) === 1 ? "" : "s"}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      width: "160px",
      align: "right",
      render: (cf) => (
        <div className="flex items-center justify-end gap-1.5">
          {cf.payments && cf.payments.length > 0 && (
            <button
              onClick={() => handleOpenReceipt(cf, cf.payments[0])}
              className="p-1.5 text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Print Latest Receipt"
            >
              <Receipt className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => handleOpenPayment(cf)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="h-3 w-3 stroke-[2.5]" />
            <span>Installment</span>
          </button>
        </div>
      ),
    },
  ];

  const filterOptions = [
    {
      key: "programId",
      label: "All Programs",
      options: programs.map((p) => ({
        value: String(p.id),
        label: p.name,
      })),
    },
  ];

  return (
    <div className="space-y-4">
      <DataTable
        data={initialCourseFees}
        columns={columns}
        searchFields={["name", "roll", "contact"]}
        placeholder="Search special batch students by name, roll, mobile..."
        pageSize={15}
        emptyTitle="No special batch records found"
        emptyMessage="Students enrolled in SSC or Junior School special batches will appear here."
      />

      {/* Collect Installment Modal */}
      <CoursePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        student={selectedStudentForPayment}
        program={selectedProgramForPayment}
        onPaymentSuccess={handlePaymentSuccess}
      />

      {/* Print Receipt Modal */}
      <PrintCourseReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        receiptData={receiptModalData}
      />
    </div>
  );
}
