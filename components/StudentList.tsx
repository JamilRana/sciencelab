"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, User, Phone, GraduationCap, Download } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { DataTable, Column } from "@/components/ui/data-table";
import { StudentForm, StudentFormValues } from "@/components/forms/StudentForm";
import { createStudentAction, updateStudentAction, deleteStudentAction } from "@/app/actions/students";
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
  const isAdmin = role === "ADMIN";
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const columns: Column<Student>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
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
      key: "class",
      header: "Class",
      sortable: true,
      render: (student) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
            <GraduationCap className="h-4 w-4 text-blue-500" />
            Class {student.class}
          </div>
          <p className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-fit">
            {student.batch?.name || "No Batch"}
          </p>
        </div>
      ),
    },
    {
      key: "roll",
      header: "Roll",
      sortable: true,
      render: (student) => (
        <span className="text-sm font-medium text-blue-600">
          {student.batch?.code ? generateDisplayRoll(student.batch.code, student.roll) : student.roll}
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
      const result = editingStudent
        ? await updateStudentAction(editingStudent.id, data)
        : await createStudentAction(data);

      if (result.success) {
        toast.success(editingStudent ? "Student updated" : "Student registered");
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

      <DataTable
        data={initialStudents}
        columns={columns}
        searchFields={["name", "mobile", "email"]}
        placeholder="Search by name, mobile, or email..."
        pageSize={15}
        onEdit={isAdmin ? handleOpenEdit : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
        filterOptions={filterOptions}
        emptyMessage="No students found"
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
