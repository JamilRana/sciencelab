"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, User, Phone, Mail, Wallet } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { DataTable, Column } from "@/components/ui/data-table";
import { TeacherForm } from "@/components/forms/TeacherForm";
import { createTeacherAction, updateTeacherAction, deleteTeacherAction } from "@/app/actions/teachers";
import { toast } from "sonner";
import type { Teacher } from "@/types";

interface TeacherListProps {
  initialTeachers: Teacher[];
  role?: string;
}

export function TeacherList({ initialTeachers, role = "STAFF" }: TeacherListProps) {
  const isAdmin = role === "ADMIN";
  const canEdit = isAdmin || role === "STAFF";
  const canDelete = isAdmin;
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const baseColumns: Column<Teacher>[] = [
    {
      key: "name",
      header: "Teacher",
      sortable: true,
      render: (teacher) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{teacher.name}</p>
            <p className="text-xs text-gray-500">{teacher.gender}</p>
          </div>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Contact",
      render: (teacher) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
            {teacher.mobile}
          </div>
          {teacher.email && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Mail className="h-3 w-3" />
              {teacher.email}
            </div>
          )}
        </div>
      ),
    },
  ];

  const adminColumns: Column<Teacher>[] = [
    {
      key: "perClass",
      header: "Per Class",
      sortable: true,
      render: (teacher) => (
        <div className="flex items-center gap-1.5 text-sm text-gray-700 font-medium">
          <Wallet className="h-4 w-4 text-green-500" />
          ৳{teacher.perClass}
        </div>
      ),
    },
  ];

  const columns = isAdmin ? [...baseColumns, ...adminColumns] : baseColumns;

  const filterOptions = [
    {
      key: "gender",
      label: "Select Gender",
      options: [
        { value: "Male", label: "Male" },
        { value: "Female", label: "Female" },
      ],
    },
  ];

  const handleOpenCreate = () => {
    setEditingTeacher(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingTeacher(null);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = editingTeacher
        ? await updateTeacherAction(editingTeacher.id, data)
        : await createTeacherAction(data);

      if (result.success) {
        toast.success(editingTeacher ? "Teacher updated" : "Teacher added");
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
    if (!confirm("Are you sure?")) return;
    try {
      const result = await deleteTeacherAction(id);
      if (result.success) {
        toast.success("Teacher deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" />
            Add Teacher
          </button>
        </div>
      )}

      <DataTable
        data={initialTeachers}
        columns={columns}
        searchFields={["name", "mobile", "email"]}
        placeholder="Search by name, mobile, or email..."
        pageSize={15}
        onEdit={canEdit ? handleOpenEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        filterOptions={filterOptions}
        emptyMessage="No teachers found"
      />

      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingTeacher ? "Edit Teacher" : "Add Teacher"}
      >
        <TeacherForm
          initialData={editingTeacher}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </DataModal>
    </div>
  );
}
