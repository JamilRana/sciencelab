"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Plus, Search, Building2 } from "lucide-react";
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
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to delete school");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search schools..."
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
          Add School
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSchools.map((school) => (
          <div
            key={school.id}
            className="bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{school.name}</h3>
                  <p className="text-sm text-gray-500">ID: {school.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleOpenEdit(school)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                >
                  <Edit className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(school.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSchools.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border p-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
            <Building2 className="h-8 w-8" />
          </div>
          <p className="text-gray-500 font-medium">No schools found</p>
        </div>
      )}

      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingSchool ? "Edit School" : "Add New School"}
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
