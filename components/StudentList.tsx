// components/StudentList.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Edit, Trash2, Plus, User, Phone, GraduationCap, Download, Eye, Printer } from "lucide-react";
import { DataModal } from "@/components/ui/data-modal";
import { DataTable, Column } from "@/components/ui/data-table";
import { StudentForm, StudentFormValues } from "@/components/forms/StudentForm";
import { createStudentAction, updateStudentAction, deleteStudentAction } from "@/app/actions/students";
import { createUserAndProfileAction } from "@/app/actions/registration";
import { StudentDrawer } from "@/components/students/StudentDrawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";
import type { Student, School, Batch } from "@/types";
import { generateDisplayRoll } from "@/lib/roll";
import { exportToCSV, ExportHeader } from "@/lib/export";

interface StudentListProps {
  initialStudents: Student[];
  schools: School[];
  batches: Batch[];
  role?: string;
}

export function StudentList({ initialStudents, schools, batches, role = "STAFF" }: StudentListProps) {
  const isAdmin = role === "ADMIN" || role === "STAFF";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudentForDrawer, setSelectedStudentForDrawer] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Read URL search & filter params
  const urlSearch = searchParams.get("search") || searchParams.get("q") || "";
  const rawBatch = searchParams.get("batchId") || searchParams.get("batch") || "";
  const matchedBatch = batches.find(
    (b) => String(b.id) === rawBatch || b.name.toLowerCase() === rawBatch.toLowerCase()
  );
  const urlClass = searchParams.get("class") || "";

  const initialFilters: Record<string, string> = {
    ...(urlClass ? { class: urlClass } : {}),
    ...(matchedBatch ? { batchId: String(matchedBatch.id) } : {}),
  };

  // Auto-open admission modal when query param action=create or action=admission is present
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create" || action === "admission") {
      setIsModalOpen(true);
      setEditingStudent(null);
    }
  }, [searchParams]);

  const columns: Column<Student>[] = [
    {
      key: "roll",
      header: "Roll",
      sortable: true,
      width: "100px",
      searchValue: (student) => {
        const batchCode = student.batch?.code?.toString() || "";
        const roll = student.roll?.toString() || "";
        return `${batchCode}${roll} ${roll}`;
      },
      render: (student) => (
        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded tabular-nums">
          {student.batch?.code
            ? generateDisplayRoll(student.batch.code, student.roll)
            : student.roll}
        </span>
      ),
    },
    {
      key: "name",
      header: "Student",
      sortable: true,
      fuzzyWeight: 1.2,
      render: (student) => (
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 font-semibold text-xs shrink-0">
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900 truncate">{student.name}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <span>{student.gender}</span>
              {student.school && (
                <>
                  <span>·</span>
                  <span className="truncate max-w-[140px]">{student.school.name}</span>
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      width: "100px",
      render: (student) => (
        <span className="text-xs font-medium text-zinc-700">Class {student.class}</span>
      ),
    },
    {
      key: "batch",
      header: "Batch",
      sortable: true,
      width: "120px",
      searchValue: (student) => student.batch?.name || "",
      render: (student) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded w-fit">
            {student.batch?.name || "Unassigned"}
          </span>
          {student.batch?.programId && (
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded w-fit">
              Special Batch
            </span>
          )}
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Contact",
      render: (student) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-xs text-zinc-700 tabular-nums">
            <Phone className="h-3 w-3 text-zinc-400" />
            {student.mobile}
          </div>
          {student.homeMobile && (
            <p className="text-[10px] text-zinc-400 pl-4 tabular-nums">Home: {student.homeMobile}</p>
          )}
        </div>
      ),
    },
    {
      key: "active",
      header: "Status",
      sortable: true,
      width: "90px",
      render: (student) => (
        <StatusBadge status={student.active ? "Active" : "Inactive"} />
      ),
    },
  ];

  const filterOptions = [
    {
      key: "class",
      label: "All Classes",
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
      label: "All Batches",
      options: batches.map((b) => ({
        value: String(b.id),
        label: (b as any).programId ? `${b.name} (Special Batch)` : b.name,
      })),
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
    if (searchParams.get("action")) {
      router.replace("/admin-route/students");
    }
  };

  const onSubmit = async (data: StudentFormValues) => {
    setIsLoading(true);
    try {
      let result;
      if (editingStudent) {
        result = await updateStudentAction(editingStudent.id, data);
      } else {
        result = await createUserAndProfileAction({
          ...data,
          role: "STUDENT",
        } as any);
      }

      if (result.success) {
        if (!editingStudent && result.data?.temporaryPassword) {
          toast.success(
            `Student registered! Login: ${result.data.username} | Password: ${result.data.temporaryPassword}`,
            { duration: 15000 }
          );
        } else {
          toast.success(editingStudent ? "Student updated successfully" : "Student registered with login credentials");
        }
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
    if (!confirm("Are you sure you want to delete this student profile?")) return;

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

  // Custom search covering name, roll, mobile, batch, school, address, and guardians
  const customStudentSearch = (student: Student, query: string): boolean => {
    const q = query.toLowerCase().trim();
    if (!q) return true;

    if (student.name?.toLowerCase().includes(q)) return true;
    if (student.mobile?.includes(query)) return true;

    const batchCode = student.batch?.code?.toString() || "";
    const fullRoll = `${batchCode}${student.roll?.toString().padStart(2, "0")}`;
    if (fullRoll.includes(query) || student.roll?.toString().includes(query)) return true;

    // Batch name & batch code search
    if (student.batch?.name?.toLowerCase().includes(q)) return true;
    if (batchCode && batchCode.includes(q)) return true;

    // School name search
    if (student.school?.name?.toLowerCase().includes(q)) return true;

    // Class & gender search
    if (student.class?.toLowerCase().includes(q)) return true;
    if (student.gender?.toLowerCase() === q) return true;

    if (student.email?.toLowerCase().includes(q)) return true;
    if (student.fatherName?.toLowerCase().includes(q)) return true;
    if (student.motherName?.toLowerCase().includes(q)) return true;
    if (student.address?.toLowerCase().includes(q)) return true;

    // Multi-word matching (e.g. "Junior-2026 Girls" or "Eight Girls")
    const words = q.split(/[\s-]+/).filter(Boolean);
    if (words.length > 1) {
      const studentSearchText = [
        student.name,
        student.mobile,
        fullRoll,
        student.roll?.toString(),
        student.batch?.name,
        batchCode,
        student.school?.name,
        student.class,
        student.gender,
        student.fatherName,
        student.motherName,
        student.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const allWordsMatch = words.every((word) => studentSearchText.includes(word));
      if (allWordsMatch) return true;
    }

    return false;
  };

  const handleExportStudents = (
    dataToExport: Student[],
    activeFilters: Record<string, string> = {},
    searchQuery: string = ""
  ) => {
    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No student records to export");
      return;
    }

    // Build intelligent descriptive filename based on active filters
    const nameParts: string[] = ["students_roster"];
    if (activeFilters.class) {
      nameParts.push(`Class_${activeFilters.class}`);
    }
    if (activeFilters.batchId) {
      const b = batches.find((item) => String(item.id) === activeFilters.batchId);
      if (b) {
        nameParts.push(b.name.replace(/[^a-zA-Z0-9_-]/g, "_"));
      }
    }
    if (searchQuery.trim()) {
      nameParts.push("filtered");
    }
    nameParts.push(new Date().toISOString().split("T")[0]);
    const filename = nameParts.join("_");

    const exportHeaders: ExportHeader[] = [
      {
        key: "displayRoll",
        label: "Display Roll",
        format: (_, student: Student) =>
          student.batch?.code
            ? generateDisplayRoll(student.batch.code, student.roll)
            : String(student.roll),
      },
      {
        key: "roll",
        label: "Raw Roll",
        format: (val) => String(val),
      },
      {
        key: "name",
        label: "Student Name",
      },
      {
        key: "gender",
        label: "Gender",
      },
      {
        key: "class",
        label: "Class",
        format: (c) => `Class ${c}`,
      },
      {
        key: "batch.name",
        label: "Batch",
        format: (_, student: Student) => student.batch?.name || "Unassigned",
      },
      {
        key: "batch.code",
        label: "Batch Code",
        format: (_, student: Student) =>
          student.batch?.code ? String(student.batch.code) : "",
      },
      {
        key: "batchType",
        label: "Batch Type",
        format: (_, student: Student) =>
          student.batch?.programId ? "Special Batch" : "Regular Batch",
      },
      {
        key: "school.name",
        label: "School",
        format: (_, student: Student) => student.school?.name || "",
      },
      {
        key: "mobile",
        label: "Student Mobile",
        format: (m) => m || "",
      },
      {
        key: "homeMobile",
        label: "Guardian Mobile",
        format: (hm) => hm || "",
      },
      {
        key: "fatherName",
        label: "Father Name",
        format: (fn) => fn || "",
      },
      {
        key: "motherName",
        label: "Mother Name",
        format: (mn) => mn || "",
      },
      {
        key: "address",
        label: "Address",
        format: (addr) => addr || "",
      },
      {
        key: "email",
        label: "Email",
        format: (e) => e || "",
      },
      {
        key: "dob",
        label: "Date of Birth",
        format: (dob) => (dob ? new Date(dob).toISOString().split("T")[0] : ""),
      },
      {
        key: "active",
        label: "Status",
        format: (act) => (act ? "Active" : "Inactive"),
      },
    ];

    exportToCSV(dataToExport, filename, exportHeaders);
    toast.success(`Exported ${dataToExport.length} student records`);
  };

  return (
    <div className="space-y-4">
      <DataTable<Student>
        data={initialStudents}
        columns={columns}
        searchFields={["name", "mobile", "roll"]}
        placeholder="Search students by name, roll (e.g. 6101), batch, school, or mobile..."
        pageSize={15}
        initialSearch={urlSearch}
        initialFilters={initialFilters}
        onRowClick={(student) => setSelectedStudentForDrawer(student)}
        onEdit={isAdmin ? handleOpenEdit : undefined}
        onDelete={isAdmin ? handleDelete : undefined}
        renderActions={(student) => (
          <button
            onClick={() => setSelectedStudentForDrawer(student)}
            className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus-ring"
            title="View Details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}
        onAdd={isAdmin ? handleOpenCreate : undefined}
        addLabel="+ Add Student"
        filterOptions={filterOptions}
        emptyTitle="No students found"
        emptyMessage="Try adjusting your class or batch filters, or enroll a new student."
        customSearchFn={customStudentSearch}
        onExport={handleExportStudents}
        extraToolbarActions={(_, activeFilters) => {
          const printQuery = new URLSearchParams();
          if (activeFilters.class) printQuery.set("class", activeFilters.class);
          if (activeFilters.batchId) printQuery.set("batch", activeFilters.batchId);
          const printHref = `/admin-route/students/print${
            printQuery.toString() ? `?${printQuery.toString()}` : ""
          }`;

          return (
            <Link
              href={printHref}
              target="_blank"
              className="p-1.5 px-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors flex items-center gap-1.5 focus-ring"
              title="Print Filtered Roster"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print Roster</span>
            </Link>
          );
        }}
        exportFileName="students_roster"
        fuzzySearch={{
          enabled: true,
          threshold: 0.35,
          minQueryLength: 2,
        }}
        searchDebounceMs={250}
        defaultSort={(a, b) => {
          const aBatch = a.batch?.code ?? 0;
          const bBatch = b.batch?.code ?? 0;
          if (aBatch !== bBatch) return aBatch - bBatch;
          return a.roll - b.roll;
        }}
      />

      {/* Right-side Student Profile Drawer */}
      <StudentDrawer
        student={selectedStudentForDrawer}
        isOpen={!!selectedStudentForDrawer}
        onClose={() => setSelectedStudentForDrawer(null)}
        onEdit={(student) => handleOpenEdit(student)}
      />

      {/* Add / Edit Student Modal with 3-Step Wizard */}
      <DataModal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingStudent ? "Edit Student Profile" : "New Student Admission Wizard"}
        className="sm:max-w-2xl max-w-2xl"
      >
        <StudentForm
          initialData={editingStudent}
          onSubmit={onSubmit}
          isLoading={isLoading}
          schools={schools}
          batches={batches}
          onCancel={handleClose}
        />
      </DataModal>
    </div>
  );
}