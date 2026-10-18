"use client";

import { useRef } from "react";
import { Printer, X, CheckCircle, FileText } from "lucide-react";

interface TeacherPaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: number;
    amount: number;
    month: string;
    date: Date | string;
    note?: string;
    teacher?: {
      name: string;
      mobile: string;
      perClass?: number;
    };
  } | null;
}

export function TeacherPaymentReceiptModal({
  isOpen,
  onClose,
  payment,
}: TeacherPaymentReceiptModalProps) {
  if (!isOpen || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment.date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-xl overflow-hidden print:p-0 print:border-none print:shadow-none print:max-w-none">
        {/* Top Action Bar (Hidden on Print) */}
        <div className="px-5 py-3.5 bg-zinc-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Teacher Payment Voucher #{payment.id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Voucher</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Slip */}
        <div className="p-8 text-zinc-900 font-sans print:p-4">
          {/* Header */}
          <div className="text-center border-b-2 border-zinc-900 pb-3 mb-5">
            <h1 className="text-lg font-black uppercase tracking-wider text-zinc-900">
              Science Lab Coaching Center
            </h1>
            <p className="text-[11px] text-zinc-600 font-medium tracking-wide uppercase">
              Academic Care & Coaching Wing · Teacher Remuneration Slip
            </p>
            <div className="mt-2 inline-block px-3 py-0.5 bg-zinc-100 border border-zinc-300 rounded font-bold text-[11px] uppercase tracking-wider text-zinc-800">
              Official Payment Voucher
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs border border-zinc-200 bg-zinc-50/50 p-3 rounded-lg mb-5">
            <div>
              <span className="font-semibold text-zinc-500">Voucher No: </span>
              <span className="font-bold font-mono text-zinc-900">TP-{String(payment.id).padStart(5, "0")}</span>
            </div>
            <div>
              <span className="font-semibold text-zinc-500">Date: </span>
              <span className="font-bold text-zinc-900">{formattedDate}</span>
            </div>
            <div>
              <span className="font-semibold text-zinc-500">Teacher: </span>
              <span className="font-bold text-zinc-900">{payment.teacher?.name || "Teacher"}</span>
            </div>
            <div>
              <span className="font-semibold text-zinc-500">Mobile: </span>
              <span className="font-mono text-zinc-800">{payment.teacher?.mobile || "—"}</span>
            </div>
            <div>
              <span className="font-semibold text-zinc-500">Salary Month: </span>
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                {payment.month}
              </span>
            </div>
            <div>
              <span className="font-semibold text-zinc-500">Rate / Class: </span>
              <span className="text-zinc-800">
                {payment.teacher?.perClass ? `৳${payment.teacher.perClass}` : "Standard"}
              </span>
            </div>
          </div>

          {/* Amount Box */}
          <div className="border border-zinc-900 rounded-xl p-4 text-center bg-zinc-50 mb-5">
            <p className="text-xs uppercase font-bold text-zinc-500 tracking-wider">
              Amount Disbursed
            </p>
            <p className="text-2xl font-black text-zinc-900 mt-1 tabular-nums">
              ৳{payment.amount.toLocaleString()}
            </p>
            {payment.note && (
              <p className="text-xs text-zinc-600 mt-2 italic border-t border-zinc-200 pt-2">
                Note: {payment.note}
              </p>
            )}
          </div>

          {/* Signatures */}
          <div className="mt-14 pt-4 flex items-end justify-between text-xs text-zinc-700">
            <div className="text-center">
              <div className="w-32 border-b border-zinc-400 mb-1" />
              <p className="font-semibold">Received By (Teacher)</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-zinc-400 mb-1" />
              <p className="font-semibold">Prepared By (Accounts)</p>
            </div>
            <div className="text-center">
              <div className="w-32 border-b border-zinc-400 mb-1" />
              <p className="font-semibold">Director / Approved By</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
