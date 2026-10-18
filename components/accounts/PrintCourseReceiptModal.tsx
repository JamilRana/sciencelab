"use client";

import { useRef } from "react";
import { DataModal } from "@/components/ui/data-modal";
import { Printer, Download, CheckCircle2, ShieldCheck } from "lucide-react";
import { generateDisplayRoll } from "@/lib/roll";

interface PrintCourseReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receiptData: any | null;
}

export function PrintCourseReceiptModal({
  isOpen,
  onClose,
  receiptData,
}: PrintCourseReceiptModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!receiptData) return null;

  const handlePrint = () => {
    window.print();
  };

  const student = receiptData.student || receiptData.courseFee?.student;
  const program = receiptData.program || receiptData.courseFee?.program;
  const displayRoll = student?.batch?.code
    ? generateDisplayRoll(student.batch.code, student.roll)
    : student?.roll;

  const receiptDate = new Date(receiptData.paymentDate || receiptData.createdAt || Date.now()).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <DataModal
      isOpen={isOpen}
      onClose={onClose}
      title="Installment Money Receipt"
      className="sm:max-w-xl max-w-xl print:max-w-none print:m-0 print:border-none print:shadow-none"
    >
      <div className="space-y-4">
        {/* Printable Receipt Paper */}
        <div
          ref={printAreaRef}
          className="bg-white border border-zinc-200 rounded-xl p-6 text-zinc-900 print:border-none print:p-0 space-y-4 font-sans"
        >
          {/* Header */}
          <div className="text-center border-b border-zinc-200 pb-3">
            <h2 className="text-lg font-black tracking-tight text-zinc-900 uppercase">
              Science Lab Coaching Center
            </h2>
            <p className="text-xs text-zinc-500">
              Special Care Program · Academic Excellence & Board Standard Mentorship
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 bg-zinc-100 rounded-full text-[11px] font-bold text-zinc-700 uppercase tracking-widest border border-zinc-200">
              Money Receipt / Cash Voucher
            </div>
          </div>

          {/* Receipt Meta */}
          <div className="flex items-center justify-between text-xs text-zinc-600 border-b border-zinc-100 pb-2">
            <div>
              <span className="text-zinc-400">Receipt No: </span>
              <span className="font-bold font-mono text-zinc-900">{receiptData.receiptNo || "CR-2026-####"}</span>
            </div>
            <div>
              <span className="text-zinc-400">Date: </span>
              <span className="font-semibold tabular-nums text-zinc-900">{receiptDate}</span>
            </div>
          </div>

          {/* Student Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs bg-zinc-50/60 p-3 rounded-lg border border-zinc-100">
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Student Name</span>
              <span className="font-bold text-zinc-900">{student?.name || "Student Name"}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Display Roll</span>
              <span className="font-bold text-indigo-700 tabular-nums">#{displayRoll}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Program / Batch</span>
              <span className="font-medium text-zinc-800">{program?.name || "Special Batch"} ({student?.batch?.name})</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[10px] uppercase font-semibold">Contact</span>
              <span className="font-medium tabular-nums text-zinc-800">{student?.mobile || "—"}</span>
            </div>
          </div>

          {/* Payment Detail Box */}
          <div className="border border-indigo-100 bg-indigo-50/30 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-900">Course Fee Installment</p>
                <p className="text-[11px] text-zinc-500">
                  Method: {receiptData.paymentMethod || "CASH"} {receiptData.note ? `· ${receiptData.note}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-semibold text-zinc-400">Amount Received</p>
                <p className="text-xl font-black text-indigo-700 tabular-nums">
                  ৳{Number(receiptData.amount || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Total Paid Summary */}
          {receiptData.totalPaidToDate !== undefined && (
            <div className="flex justify-between items-center text-xs px-2 text-zinc-600">
              <span>Cumulative Paid to Date:</span>
              <span className="font-bold text-emerald-700 tabular-nums">৳{receiptData.totalPaidToDate.toLocaleString()}</span>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-8 flex justify-between items-end text-xs text-zinc-500">
            <div className="text-center">
              <div className="w-32 border-b border-zinc-300 mb-1" />
              <span>Student / Guardian</span>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-zinc-300 mb-1" />
              <span className="font-semibold text-zinc-800">Authorized Office</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 print:hidden pt-2 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors focus-ring"
          >
            <Printer className="h-4 w-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </DataModal>
  );
}
