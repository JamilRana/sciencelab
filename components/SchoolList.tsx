"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Building2,
  Users,
  ArrowRight,
  School as SchoolIcon,
  Sparkles,
} from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { SchoolForm } from "@/components/forms/SchoolForm";
import { createSchoolAction, updateSchoolAction, deleteSchoolAction } from "@/app/actions/schools";
import { toast } from "sonner";
import type { School } from "@/types";

interface SchoolListProps {
  initialSchools: School[];
}

export function SchoolList({ initialSchools }: SchoolListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const totalStudents = initialSchools.reduce(
    (acc, s) => acc + (s._count?.students || 0),
    0
  );
  const activeSchools = initialSchools.filter(
    (s) => (s._count?.students || 0) > 0
  ).length;

  const filteredSchools = initialSchools.filter((school) =>
    school.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingSchool(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (school: School) => {
    setEditingSchool(school);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingSchool(null);
  };

  const onSubmit = async (data: { name: string }) => {
    setIsLoading(true);
    try {
      const result = editingSchool
        ? await updateSchoolAction(editingSchool.id, data)
        : await createSchoolAction(data);

      if (result.success) {
        toast.success(editingSchool ? "School updated" : "School added");
        handleClose();
        router.refresh();
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this school?")) return;

    try {
      const result = await deleteSchoolAction(id);
      if (result.success) {
        toast.success("School deleted");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete school");
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Feeder Schools
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <SchoolIcon className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">
            {initialSchools.length}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Registered feeder schools</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{totalStudents}</p>
          <p className="text-xs text-zinc-400 mt-1">Across all feeder institutions</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Active Institutions
            </span>
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-zinc-900 mt-2">{activeSchools}</p>
          <p className="text-xs text-zinc-400 mt-1">
            Schools with active student admissions
          </p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-xs border border-zinc-200/80">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search feeder schools..."
            className="w-full pl-9 pr-4 h-10 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-zinc-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          onClick={handleOpenCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors active:scale-98"
        >
          <Plus className="h-4 w-4" />
          <span>Add School</span>
        </button>
      </div>

      {/* Feeder School Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchools.map((school) => {
          const studentCount = school._count?.students || 0;
          return (
            <div
              key={school.id}
              className="bg-white rounded-xl shadow-xs border border-zinc-200/80 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {school.name}
                      </h3>
                      <p className="text-[11px] font-mono text-zinc-400">
                        ID: #{school.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(school)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Edit school"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(school.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete school"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                    <Users className="h-3.5 w-3.5 text-zinc-400" />
                    <span>
                      <strong className="text-zinc-900 font-bold">
                        {studentCount}
                      </strong>{" "}
                      {studentCount === 1 ? "student" : "students"} enrolled
                    </span>
                  </div>

                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      studentCount > 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {studentCount > 0 ? "Active" : "No enrollments"}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs">
                <Link
                  href={`/admin-route/students?search=${encodeURIComponent(
                    school.name
                  )}`}
                  className="font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                >
                  <span>View enrolled students</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {filteredSchools.length === 0 && (
        <div className="bg-white rounded-xl shadow-xs border border-zinc-200/80 p-12 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 mb-3">
            <Building2 className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-700">No schools found</p>
          <p className="text-xs text-zinc-400 mt-1">
            {searchQuery
              ? `No school matches "${searchQuery}"`
              : "Get started by adding your first feeder school."}
          </p>
        </div>
      )}

      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingSchool ? "Edit Feeder School" : "Add Feeder School"}
      >
        <SchoolForm
          initialData={editingSchool || undefined}
          onSubmit={onSubmit}
          isLoading={isLoading}
        />
      </DataModal>
    </div>
  );
}
