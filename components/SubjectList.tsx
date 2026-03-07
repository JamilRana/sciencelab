"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, Plus, Search, Book, User, Calendar, ClipboardList } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { SubjectForm } from "@/components/forms/SubjectForm";
import { createSubjectAction, updateSubjectAction, deleteSubjectAction } from "@/app/actions/subjects";
import { toast } from "sonner";
import type { ExamSubject, Teacher } from "@/types";

interface SubjectListProps {
  initialSubjects: ExamSubject[];
  teachers: Teacher[];
  examId: number;
  currentUserId?: number;
  currentUserRole?: string;
}

export function SubjectList({ 
  initialSubjects, 
  teachers, 
  examId,
  currentUserId,
  currentUserRole,
}: SubjectListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<ExamSubject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isAdminOrStaff = currentUserRole === "ADMIN" || currentUserRole === "STAFF";
  const canViewAllMarks = isAdminOrStaff;

  const filtered = initialSubjects.filter((s) =>
    s.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.teacher?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canEnterMarks = (subject: ExamSubject) => {
    // Admin/Staff can see all Enter Marks buttons
    if (isAdminOrStaff) return true;
    // Teachers can only see Enter Marks for their assigned subjects
    if (currentUserRole === "TEACHER" && subject.teacherId === currentUserId) return true;
    return false;
  };

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (subject: ExamSubject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingSubject(null);
    setIsModalOpen(false);
  };

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const result = editingSubject
        ? await updateSubjectAction(editingSubject.id, { ...data, examId })
        : await createSubjectAction({ ...data, examId });

      if (result.success) {
        toast.success(editingSubject ? "Subject updated" : "Subject added");
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
    if (!confirm("Remove this subject from the exam?")) return;
    try {
      const result = await deleteSubjectAction(id);
      if (result.success) {
        toast.success("Removed");
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search subjects or teachers..."
            className="w-full pl-10 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 whitespace-nowrap"
        >
          <Plus className="h-5 w-5" />
          Schedule Subject
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 font-bold text-gray-600 text-sm">Subject</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Teacher</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-center">Marks</th>
                <th className="p-4 font-bold text-gray-600 text-sm">Date</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-center">Status</th>
                <th className="p-4 font-bold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-blue-50/20 transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                        <Book className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">{s.subject}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mt-1">
                          {s.topics?.substring(0, 30)}...
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <User className="h-4 w-4 text-gray-400" />
                      {s.teacher?.name || <span className="text-gray-400">Not assigned</span>}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-full text-xs font-black">
                      {s.totalMark}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(s.examDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {s.status === 1 ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Enter Marks Button - Visible to Admin/Staff or Teacher for their subjects */}
                      {canEnterMarks(s) && (
                        <Link
                          href={`/admin-route/exams/${examId}/subjects/${s.id}/marks`}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors opacity-0 group-hover:opacity-100"
                          title="Enter Marks"
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          Enter Marks
                        </Link>
                      )}
                      
                      {/* Edit Button - Only for Admin/Staff */}
                      {isAdminOrStaff && (
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      
                      {/* Delete Button - Only for Admin */}
                      {currentUserRole === "ADMIN" && (
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingSubject ? "Edit Subject Schedule" : "Add Subject to Exam"}
      >
        <SubjectForm
          initialData={editingSubject}
          onSubmit={onSubmit}
          isLoading={isLoading}
          teachers={teachers}
        />
      </DataModal>
    </div>
  );
}
