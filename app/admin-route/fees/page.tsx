"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { usePathname } from "next/navigation";
import { saveFee } from "@/app/actions/fees";
import { toast } from "sonner";
import { AdminFilter } from "../components/AdminFilter";
import { CLASSES, MONTHS, type BatchData, type StudentFeeData } from "../types/admin";

/**
 * Robust fetcher for SWR
 */
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  return res.json();
};

export default function FeesPage() {
  const pathname = usePathname();
  
  // State for filters
  const [activeClass, setActiveClass] = useState("Six");
  const [activeBatch, setActiveBatch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentMode, setPaymentMode] = useState<'modal' | 'quick'>("modal");

  const debouncedSearch = useDebouncedSearch(searchTerm, 300);

  // SWR data fetching
  const { 
    data: students, 
    error: studentsError, 
    isLoading: studentsLoading, 
    mutate 
  } = useSWR<StudentFeeData[]>(
    activeClass
      ? `/api/fees?class=${activeClass}${activeBatch ? `&batchId=${activeBatch}` : ''}&search=${encodeURIComponent(debouncedSearch || "")}`
      : null,
    fetcher
  );

  const { data: batches } = useSWR<BatchData[]>(
    activeClass 
      ? `/api/batches?class=${encodeURIComponent(activeClass)}` 
      : null, 
    fetcher
  );

  // Revalidate students if batch changes or search changes
  const handleUpdate = async (studentId: number, month: string, value: string) => {
    const amount = parseInt(value);
    if (isNaN(amount)) return;
    
    const result = await saveFee( studentId, month, amount );
    
    if (result.success) {
      toast.success(`Payment saved for ${month}`);
      mutate();
    } else {
      toast.error(result.error || "Failed to save payment");
    }
  };

  const handleQuickEntry = async (studentId: number, month: string, amount: number) => {
    const result = await saveFee( studentId, month, amount );
    
    if (result.success) {
      mutate();
      return true;
    } else {
      toast.error(result.error || "Failed to save payment");
      return false;
    }
  };

  if (studentsError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <p className="font-bold text-lg mb-2">Error Loading Data</p>
          <p>Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1600px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Fees</h1>
          <p className="text-gray-500 mt-1 text-sm">Track and update student monthly fee status.</p>
        </div>
        
        <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm border gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${studentsLoading ? 'bg-orange-400 animate-pulse' : 'bg-green-500'}`} />
          <span className="text-sm font-medium text-gray-600">
            {studentsLoading ? "Fetching records..." : "System Active"}
          </span>
        </div>
      </div>

      <AdminFilter 
        classes={CLASSES as unknown as string[]}
        batches={batches || []}
        activeClass={activeClass}
        activeBatch={activeBatch}
        searchTerm={searchTerm}
        paymentMode={paymentMode}
        onClassChange={setActiveClass}
        onBatchChange={setActiveBatch}
        onSearchChange={setSearchTerm}
        onPaymentModeChange={setPaymentMode}
        studentsCount={students?.length || 0}
      />
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold">Science Lab Coaching Center</h1>
        <p className="text-sm">Monthly Fee Register</p>
        <p className="text-sm">
          Class: {activeClass}
          {activeBatch && ` | Batch: ${batches?.find(b => b.id.toString() === activeBatch)?.name}`}
          {" | Year: "} {new Date().getFullYear()}
        </p>
      </div>
      {/* Fees Table */}
      <div className="mt-6 bg-white rounded-2xl shadow-xl border overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100/80 backdrop-blur-md border-b sticky top-0 z-30">
                <th className="sticky left-0 z-40 bg-gray-100 p-4 font-bold text-gray-600 min-w-[60px] border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-left">
                  Roll
                </th>
                <th className="sticky left-[60px] z-40 bg-gray-100 p-4 font-bold text-gray-600 min-w-[200px] border-r shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-left">
                  Name
                </th>
                {MONTHS.map((m) => (
                  <th key={m} className="p-4 font-bold text-gray-600 min-w-[110px] text-center border-r hover:bg-gray-200 transition-colors uppercase tracking-wider text-[11px]">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students?.map((student) => (
                <tr key={student.id} className="group hover:bg-blue-50/30 transition-all">
                  <td className="sticky left-0 z-10 bg-white group-hover:bg-blue-50/50 p-4 font-bold text-gray-900 border-r shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    {student.batch.code}{student.roll.toString().padStart(2, '0')}
                  </td>
                  <td className="sticky left-[60px] z-10 bg-white group-hover:bg-blue-50/50 p-4 border-r whitespace-nowrap font-medium text-gray-700 shadow-[2px_0_5_px_rgba(0,0,0,0.02)]">
                    {student.name}
                  </td>
                  {MONTHS.map((m) => {
                    const receipt = student.receipts.find((r) => r.month === m);
                    return (
                      <td key={m} className="p-2 border-r text-center align-middle relative">
                        {receipt ? (
                          <span className="font-bold text-blue-700">{receipt.amount}</span>
                        ) : (
                          <input
                            type="number"
                            className="w-full h-8 px-1 border rounded text-center no-print focus:ring-1 focus:ring-blue-500"
                            onBlur={(e) => {
                              if (e.target.value) {
                                if (paymentMode === 'quick') handleQuickEntry(student.id, m, parseInt(e.target.value));
                                else handleUpdate(student.id, m, e.target.value);
                              }
                            }}
                          />
                        )}
                        <span className="hidden print:block border-b border-gray-300 w-full h-4"></span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
       
      {!studentsLoading && students?.length === 0 && activeBatch && (
        <div className="mt-6 p-16 text-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed">
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg font-medium italic">No student records found</span>
            <span className="text-xs">Try adjusting your filters or add students to the database.</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility hook for debouncing
function useDebouncedSearch(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

<style jsx global>{`
  @media print {
    @page {
      size: A4 landscape;
      margin: 5mm;
    }

    body {
      background: white !important;
      -webkit-print-color-adjust: exact;
    }

    .no-print, button, input[type="number"] {
      display: none !important;
    }

    .max-h-\\[70vh\\] {
      max-height: none !important;
      overflow: visible !important;
    }

    .overflow-x-auto, .overflow-y-auto {
      overflow: visible !important;
    }

    .sticky {
      position: static !important;
      background: white !important;
    }

    table {
      width: 100% !important;
      border-collapse: collapse !important;
      font-size: 8pt !important;
    }

    th, td {
      border: 1pt solid #000 !important;
      padding: 2px !important;
      color: black !important;
    }

    th {
      background-color: #f3f4f6 !important;
      text-transform: uppercase;
    }

    .hidden\\/print\\:block {
      display: block !important;
    }
  }
`}</style>
