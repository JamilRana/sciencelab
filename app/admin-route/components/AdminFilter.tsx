"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";

interface BatchData {
  id: number;
  name: string;
  code: number;
}

interface StudentFeeData {
  id: number;
  name: string;
  roll: number;
  class: string;
  batch: BatchData;
  receipts: { month: string; amount: number }[];
}

interface AdminFilterProps {
  classes: string[];
  batches: BatchData[] | null;
  onClassChange: (cls: string) => void;
  onBatchChange: (batchId: string) => void;
  onSearchChange: (search: string) => void;
  onPaymentModeChange: (mode: 'modal' | 'quick') => void;
  paymentMode?: 'modal' | 'quick';
  searchTerm?: string;
  activeClass?: string;
  activeBatch?: string;
  showPaymentMode?: boolean;
  showTotalStudents?: boolean;
  showPrintButton?: boolean;
  studentsCount?: number;
}

export function AdminFilter({
  classes,
  batches,
  onClassChange,
  onBatchChange,
  onSearchChange,
  onPaymentModeChange,
  paymentMode = 'modal',
  searchTerm = '',
  activeClass = 'Six',
  activeBatch = '',
  showPaymentMode = true,
  showTotalStudents = true,
  showPrintButton = true,
  studentsCount = 0,
}: AdminFilterProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeClass) params.set("class", activeClass);
    if (activeBatch) params.set("batch", activeBatch);
    if (searchTerm) params.set("search", searchTerm);
    window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
  }, [activeClass, activeBatch, searchTerm, pathname]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
      <div className="border-b">
        <Tabs.Root defaultValue="Six" value={activeClass} onValueChange={onClassChange}>
          <Tabs.List className="flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {classes.map((cls) => (
                  <Tabs.Trigger key={cls} value={cls}>
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeClass === cls
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}>
                      Class {cls}
                    </div>
                  </Tabs.Trigger>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={activeBatch}
                  onChange={(e) => onBatchChange(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  disabled={!activeClass}
                >
                  <option value="">All Batches</option>
                  {batches?.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.code})
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
                  
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Tabs.List>
        </Tabs.Root>
      </div>

      {showPaymentMode && (
        <div className="border-b bg-gray-50/80">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Payment Mode:</span>
              <button
                onClick={() => onPaymentModeChange('modal')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  paymentMode === 'modal'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Modal Entry
              </button>
              <button
                onClick={() => onPaymentModeChange('quick')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  paymentMode === 'quick'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Quick Entry
              </button>
            </div>
            
            {showTotalStudents && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">
                  Total Students: {studentsCount}
                </span>
                {showPrintButton && (
                  <button
                    onClick={() => window.print()}
                    className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm no-print"
                  >
                    Print
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

<style jsx global>{`
  @media print {
    @page {
      size: A4 landscape;
      margin: 8mm;
    }

    body {
      background: white !important;
      -webkit-print-color-adjust: exact;
    }

    .no-print, button, input {
      display: none !important;
    }

    .max-h-\\[70vh\\] {
      max-height: none !important;
      overflow: visible !important;
    }
    
    .overflow-x-auto {
      overflow: visible !important;
    }

    .sticky {
      position: static !important;
      background: white !important;
    }

    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }

    th, td {
      border: 1pt solid #000 !important;
      padding: 4px 2px !important;
      font-size: 8pt !important;
      color: black !important;
    }

    th {
      background-color: #f3f4f6 !important;
      text-transform: uppercase;
      font-weight: bold;
    }
  }
`}</style>
    </div>
  );
}