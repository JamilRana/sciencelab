"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, Search, BookOpen, Calendar, ChevronRight, Printer, Award, FileText } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { ExamForm, ExamFormValues } from "@/components/forms/ExamForm";
import { createExamAction, updateExamAction, deleteExamAction } from "@/app/actions/exams";
import { toast } from "sonner";
import Link from "next/link";
import type { Exam } from "@/types";

interface ExamListProps {
  initialExams: Exam[];
  role?: string;
  teacherId?: number;
  studentClass?: string;
  studentId?: number;
}

export function ExamList({ initialExams, role = "STAFF", teacherId, studentClass, studentId }: ExamListProps) {
  const router = useRouter();
  const isAdmin = role === "ADMIN" || role === "STAFF";
  const isStudent = role === "STUDENT";
  const isTeacher = role === "TEACHER";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterClass, setFilterClass] = useState("");

  let filteredExams = initialExams;

  if (isStudent && studentClass) {
    filteredExams = filteredExams.filter((exam) => exam.class === studentClass);
  }

  if (filterMonth) {
    filteredExams = filteredExams.filter((exam) => exam.month === filterMonth);
  }

  if ((isAdmin || isTeacher) && filterClass) {
    filteredExams = filteredExams.filter((exam) => exam.class === filterClass);
  }

  if (searchQuery) {
    filteredExams = filteredExams.filter((exam) =>
      exam.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.class.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const handleOpenCreate = () => {
    setEditingExam(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setEditingExam(null);
    setIsModalOpen(false);
  };

  const onSubmit = async (data: ExamFormValues) => {
    setIsLoading(true);
    try {
      const result = editingExam
        ? await updateExamAction(editingExam.id, data)
        : await createExamAction(data);

      if (result.success) {
        toast.success(editingExam ? "Exam updated" : "Exam created");
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
    if (!confirm("Are you sure? This will delete all associated marks and subjects.")) return;
    try {
      const result = await deleteExamAction(id);
      if (result.success) {
        toast.success("Exam deleted");
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
        <div className="flex flex-wrap gap-3">
          {/* Month Filter */}
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
          >
            <option value="">All Months</option>
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Class Filter - Only for Admin/Teacher */}
          {(isAdmin || isTeacher) && (
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="">All Classes</option>
              {["6","7","8","9","10","11","12"].map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search exams..."
              className="w-full sm:w-64 pl-10 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            Create Exam
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredExams.map((exam) => (
          <div key={exam.id} className="bg-white p-6 rounded-2xl shadow-sm border group hover:border-blue-200 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg leading-tight">{exam.type} Exam</h3>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                    <Calendar className="h-3 w-3" />
                    {exam.month} - Class {exam.class}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/admin-route/exams/${exam.id}/results?role=${role}${studentId ? `&studentId=${studentId}` : ''}`}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                  title="View Results"
                >
                  <Award className="h-4 w-4" />
                </Link>
                {(isAdmin || isTeacher) && (
                  <Link
                    href={`/admin-route/exams/attendance?exam=${exam.id}`}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                    title={isTeacher ? "Enter Marks" : "Attendance/Marks Sheet"}
                  >
                    <FileText className="h-4 w-4" />
                  </Link>
                )}
                {isAdmin && (
                  <>
                    <Link
                      href={`/admin-route/exams/${exam.id}/print`}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Printer className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => handleOpenEdit(exam)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 mb-4">
               <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Scheduled Subjects</p>
               <div className="flex flex-wrap gap-1.5">
                 {exam.subjects && exam.subjects.length > 0 ? (
                   exam.subjects.map((s) => (
                     <span key={s.id} className="px-2 py-0.5 bg-white border rounded-md text-[10px] font-bold text-gray-600">
                       {s.subject}
                     </span>
                   ))
                 ) : (
                   <span className="text-[10px] text-gray-400 italic">No subjects added yet</span>
                 )}
               </div>
            </div>

            {isAdmin && (
              <Link
                href={`/admin-route/exams/${exam.id}/subjects`}
                className="w-full h-10 bg-gray-900 hover:bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                Manage Subjects
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        ))}

        {filteredExams.length === 0 && (
          <div className="col-span-full p-16 text-center bg-white rounded-2xl border-2 border-dashed">
            <p className="text-gray-400 font-medium">No exams matched your search.</p>
          </div>
        )}
      </div>

      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingExam ? "Edit Exam Settings" : "Configure New Exam"}
      >
        <ExamForm
          initialData={editingExam}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </DataModal>
    </div>
  );
}
