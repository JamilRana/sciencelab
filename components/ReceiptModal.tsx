// components/ReceiptModal.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

interface Student {
  id: number;
  name: string;
  roll: number;
  class: string;
  batch: { id: number; name: string; code: number };
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  students: Student[];
  initialData?: {
    studentId: string;
    month: string;
    amount: string;
    date: string;
  };
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
] as const;

export function ReceiptModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  students, 
  initialData 
}: ReceiptModalProps) {
  const [formData, setFormData] = useState({
    studentId: initialData?.studentId || "",
    month: initialData?.month || "",
    amount: initialData?.amount || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Find selected student for display
  useEffect(() => {
    if (formData.studentId) {
      const student = students.find(s => s.id === parseInt(formData.studentId));
      setSelectedStudent(student || null);
    } else {
      setSelectedStudent(null);
    }
  }, [formData.studentId, students]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        studentId: "",
        month: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
      });
      setSelectedStudent(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentId || !formData.month || !formData.amount) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        studentId: parseInt(formData.studentId),
        amount: parseFloat(formData.amount),
      });
      onClose();
    } catch (error) {
      toast.error("Failed to save receipt");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Format roll: batchCode + roll (e.g., "61" + "1" = "6101")
  const formatRoll = (student: Student) => {
    return `${student.batch.code}${student.roll}`;
  };

  // Filter students by search (optional enhancement)
  const [studentSearch, setStudentSearch] = useState("");
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    formatRoll(s).includes(studentSearch)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {initialData ? "Edit Receipt" : "Add New Receipt"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Student Search & Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Student <span className="text-red-500">*</span>
            </label>
            
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by name, roll, or mobile..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
            />
            
            {/* Student Dropdown */}
            <select
              value={formData.studentId}
              onChange={(e) => handleChange("studentId", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-h-48 overflow-y-auto"
              required
            >
              <option value="">Select a student...</option>
              {filteredStudents.map((student) => (
                <option key={student.id} value={student.id}>
                  {formatRoll(student)} • {student.name} ({student.class} • {student.batch.name})
                </option>
              ))}
            </select>
            
            {/* Selected Student Preview */}
            {selectedStudent && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  {formatRoll(selectedStudent)} • {selectedStudent.name}
                </p>
                <p className="text-xs text-blue-700">
                  {selectedStudent.class} • {selectedStudent.batch.name}
                </p>
              </div>
            )}
          </div>

          {/* Month & Amount Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.month}
                onChange={(e) => handleChange("month", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select month...</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Amount (৳) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Payment Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                initialData ? "Update Receipt" : "Create Receipt"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}