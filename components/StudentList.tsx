// components/StudentList.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, User, Phone, GraduationCap, Download } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { DataTable, Column } from "@/components/ui/data-table";
import { StudentForm, StudentFormValues } from "@/components/forms/StudentForm";
import { createStudentAction, updateStudentAction, deleteStudentAction } from "@/app/actions/students";
import { createUserAndProfileAction } from "@/app/actions/registration";
import { toast } from "sonner";
import type { Student, School, Batch } from "@/types";
import { generateDisplayRoll } from "@/lib/roll";
import { exportToCSV } from "@/lib/export";

interface StudentListProps {
  initialStudents: Student[];
  schools: School[];
  batches: Batch[];
  role?: string;
}

export function StudentList({ initialStudents, schools, batches, role = "STAFF" }: StudentListProps) {
  const isAdmin = role === "ADMIN" || role === "STAFF";
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const columns: Column<Student>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      fuzzyWeight: 1.2, // Higher weight for name matches
      render: (student) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{student.name}</p>
            <p className="text-xs text-gray-500">{student.gender}</p>
          </div>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Contact",
      fuzzyWeight: 1.0,
      render: (student) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            {student.mobile}
          </div>
          {student.email && (
            <p className="text-xs text-gray-400 pl-5">{student.email}</p>
          )}
        </div>
      ),
    },
    {
      key: "roll",
      header: "Roll",
      sortable: true,
      searchValue: (student) => {
        const batchCode = student.batch?.code?.toString() || "";
        const roll = student.roll?.toString() || "";
        return `${batchCode}${roll} ${roll}`; // Search both combined and standalone
      },
      render: (student) => (
        <span className="text-sm font-medium text-blue-600">
          {student.batch?.code 
            ? generateDisplayRoll(student.batch.code, student.roll) 
            : student.roll}
        </span>
      ),
    },
  ];

  const filterOptions = [
    {
      key: "class",
      label: "Select Class",
      options: [
        { value: "Six", label: "Class Six" },
        { value: "Seven", label: "Class Seven" },
        { value: "Eight", label: "Class Eight" },
        { value: "Nine", label: "Class Nine" },
        { value: "Ten", label: "Class Ten" },
      ],
    },
    {
      key: "batchId",
      label: "Select Batch",
      options: batches.map((b) => ({ value: String(b.id), label: b.name })),
    },
  ];

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
  };

  const onSubmit = async (data: StudentFormValues) => {
    setIsLoading(true);
    try {
      let result;
      if (editingStudent) {
        result = await updateStudentAction(editingStudent.id, data);
      } else {
        // Create student with user account
        result = await createUserAndProfileAction({
          ...data,
          role: "STUDENT",
        } as any);
      }

      if (result.success) {
        toast.success(editingStudent ? "Student updated" : "Student registered with login");
        handleClose();
        router.refresh();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    
    try {
      const result = await deleteStudentAction(id);
      if (result.success) {
        toast.success("Student deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Failed to delete student");
    }
  };

  const handleExport = () => {
    const exportData = initialStudents.map(s => ({
      name: s.name,
      mobile: s.mobile,
      email: s.email || '',
      class: s.class,
      roll: s.roll,
      batch: s.batch?.name || '',
      school: s.school?.name || '',
      gender: s.gender,
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      address: s.address || '',
    }));
    exportToCSV(exportData, 'students');
  };

  // 🔹 Optional: Custom search for advanced scenarios
  const customStudentSearch = (student: Student, query: string): boolean => {
    const q = query.toLowerCase().trim();
    
    // Name (fuzzy)
    if (student.name.toLowerCase().includes(q)) return true;
    
    // Mobile (substring - handles partial numbers)
    if (student.mobile.includes(query)) return true;
    
    // Roll with batch code prefix: "6105" matches roll 5 in batch 61
    const batchCode = student.batch?.code?.toString() || "";
    const fullRoll = `${batchCode}${student.roll.toString().padStart(2, '0')}`;
    if (fullRoll.includes(query) || student.roll.toString().includes(query)) return true;
    
    // Email
    if (student.email?.toLowerCase().includes(q)) return true;
    
    // Parent names
    if (student.fatherName?.toLowerCase().includes(q)) return true;
    if (student.motherName?.toLowerCase().includes(q)) return true;
    
    // Address
    if (student.address?.toLowerCase().includes(q)) return true;
    
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all active:scale-95"
        >
          <Download className="h-5 w-5" />
          Export CSV
        </button>
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Add Student
          </button>
        )}
      </div>

      <DataTable<Student>
        data={initialStudents}
        columns={columns}
        searchFields={["name", "mobile", "roll"]}
        placeholder="Search by name, mobile, or roll (e.g., 'john', '017', '6105')..."
        pageSize={15}
        onEdit={isAdmin ? handleOpenEdit : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
        filterOptions={filterOptions}
        emptyMessage="No students found"
        customSearchFn={customStudentSearch}
        // 🔹 Fuzzy search configuration
        fuzzySearch={{
          enabled: true,
          threshold: 0.35, // Slightly lower for more matches
          minQueryLength: 2, // Only fuzzy match queries with 2+ chars
        }}
        // 🔹 Debounce: Wait 300ms after typing stops before searching
        searchDebounceMs={300}
        // 🔹 Default sort: batch code first, then roll
        defaultSort={(a, b) => {
          const aBatch = a.batch?.code ?? 0;
          const bBatch = b.batch?.code ?? 0;
          if (aBatch !== bBatch) return aBatch - bBatch;
          return a.roll - b.roll;
        }}
      />

      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingStudent ? "Edit Student Details" : "Register New Student"}
      >
        <StudentForm
          initialData={editingStudent}
          onSubmit={onSubmit}
          isLoading={isLoading}
          schools={schools}
          batches={batches}
        />
      </DataModal>
    </div>
  );
}