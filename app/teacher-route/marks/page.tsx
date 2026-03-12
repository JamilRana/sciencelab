// app/teacher-route/marks/bulk-entry/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { saveMarkAction, bulkSaveMarksAction } from "@/app/actions/marks";
import { Search, FileText, User, CheckCircle, Loader2, Edit2, Save, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useSession } from "next-auth/react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Student {
  id: number;
  name: string;
  roll: number;
  class: string;
  batch: { id: number; code: number; name: string };
}

interface ExamSubject {
  id: number;
  subject: string;
  totalMark: number;
  teacherId: number;
  exam: {
    id: number;
    type: string;
    month: string;
    class: string;
  };
}

interface MarkEntry {
  studentId: number;
  written: string;
  objective: string;
  hasExistingMark: boolean;
  isDirty: boolean;
  isEditing: boolean;
  isSaved: boolean;
}

export default function TeacherBulkMarksEntryPage() {
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<Record<number, MarkEntry>>({});
  const [editMode, setEditMode] = useState(false);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  
  const {  data:session } = useSession();
  const teacherId = session?.user?.teacherId;

  // 🔹 Fetch teacher's assigned subjects on mount
  useEffect(() => {
    if (!teacherId) return;
    
    async function fetchData() {
      try {
        const res = await fetch("/api/teacher/results");
        const data = await res.json();
        
        const subjects: ExamSubject[] = [];
        data.forEach((item: any) => {
          if (item.exam && item.subject) {
            subjects.push({
              id: item.id,
              subject: item.subject,
              totalMark: item.totalMark,
              teacherId: item.teacherId,
              exam: item.exam
            });
          }
        });
        setExamSubjects(subjects);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Failed to load assigned subjects");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [teacherId]);

  // 🔹 Get unique values for filters
  const uniqueMonths = useMemo(() => {
    const months = new Set(examSubjects.map((e) => e.exam.month));
    return Array.from(months);
  }, [examSubjects]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set(examSubjects.map((e) => e.exam.class));
    return Array.from(classes).sort();
  }, [examSubjects]);

  // 🔹 Filter subjects
  const filteredSubjects = useMemo(() => {
    return examSubjects.filter((sub) => {
      const monthMatch = !filterMonth || sub.exam.month === filterMonth;
      const classMatch = !filterClass || sub.exam.class === filterClass;
      return monthMatch && classMatch;
    });
  }, [examSubjects, filterMonth, filterClass]);

  // 🔹 When a subject is selected, fetch students and marks
  useEffect(() => {
    if (!selectedSubjectId) {
      setStudents([]);
      setEntries({});
      setEditMode(false);
      return;
    }

    const subject = examSubjects.find((e) => e.id === selectedSubjectId);
    if (!subject || !subject.exam) return;

    async function fetchData() {
      setLoading(true);
      try {
        // 🔹 Fetch students and marks from fixed API endpoint
        const res = await fetch(`/api/marks/exam-subject/${selectedSubjectId}`);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch data");
        }

        setStudents(data.students || []);

        // 🔹 Initialize entries with existing marks
        const initial: Record<number, MarkEntry> = {};
        (data.students || []).forEach((s: Student) => {
          const existingMark = data.marksMap?.[s.id];
          initial[s.id] = {
            studentId: s.id,
            written: existingMark ? existingMark.written.toString() : "",
            objective: existingMark ? existingMark.objective.toString() : "",
            hasExistingMark: !!existingMark,
            isDirty: false,
            isEditing: false,
            isSaved: !!existingMark, 
          };
        });
        setEntries(initial);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load marks data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedSubjectId, examSubjects]);

  const selectedSubject = examSubjects.find((e) => e.id === selectedSubjectId);
  
  const filteredStudents = useMemo(() => {
    return students.filter((s) =>
      !searchQuery ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll.toString().includes(searchQuery) ||
      s.batch.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  // 🔹 Update entry with validation
  const updateEntry = useCallback((studentId: number, field: "written" | "objective", value: string) => {
    const entry = entries[studentId];
    if (!entry || !selectedSubject) return;

    const otherField = field === "written" ? entry.objective : entry.written;
    const otherValue = parseFloat(otherField) || 0;
    const newValue = parseFloat(value) || 0;

    if (newValue + otherValue > selectedSubject.totalMark) {
      toast.error(`Total cannot exceed ${selectedSubject.totalMark} marks`);
      return;
    }

    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
        isDirty: true,
      },
    }));
  }, [entries, selectedSubject]);

  // 🔹 Toggle edit mode for single student
  const toggleEdit = (studentId: number) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isEditing: !prev[studentId].isEditing,
      },
    }));
  };


  // 🔹 Save single mark
  const saveSingle = async (studentId: number) => {
    const entry = entries[studentId];
    if (!entry?.isDirty || !selectedSubjectId) return;

    try {
      const result = await saveMarkAction({
        examSubjectId: selectedSubjectId,
        studentId,
        written: entry.written ? parseFloat(entry.written) : 0,
        objective: entry.objective ? parseFloat(entry.objective) : 0,
      });

      if (result.success) {
        setEntries((prev) => ({
          ...prev,
          [studentId]: {
            ...prev[studentId],
            isSaved: true,
            isDirty: false,
            isEditing: false,
            hasExistingMark: true,
          },
        }));
        toast.success(`✓ Marks saved for ${students.find((s) => s.id === studentId)?.name}`);
      } else {
        toast.error(`✗ ${result.error || "Failed to save marks"}`);
      }
    } catch {
      toast.error("✗ Failed to save marks");
    }
  };

  // 🔹 Save all marks
  const saveAll = async () => {
    const dirtyEntries = Object.values(entries)
      .filter((e) => e.isDirty)
      .map((e) => ({
        examSubjectId: selectedSubjectId!,
        studentId: e.studentId,
        written: e.written ? parseFloat(e.written) : 0,
        objective: e.objective ? parseFloat(e.objective) : 0,
      }));

    if (dirtyEntries.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setSaving(true);
    try {
      const result = await bulkSaveMarksAction(dirtyEntries);
      
      if (result.success) {
        setEntries((prev) => {
          const updated = { ...prev };
          dirtyEntries.forEach((d) => {
            if (updated[d.studentId]) {
              updated[d.studentId] = {
                ...updated[d.studentId],
                isSaved: true,
                isDirty: false,
                isEditing: false,
                hasExistingMark: true,
              };
            }
          });
          return updated;
        });
        toast.success(`✓ ${result.count || dirtyEntries.length} marks saved successfully`);
        setEditMode(false);
      } else {
        toast.error(`✗ ${result.error || "Failed to save marks"}`);
      }
    } catch {
      toast.error("✗ Failed to save marks");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Enable edit mode for all
  const enableAllEdit = () => {
    setEntries((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[parseInt(key)] = { ...updated[parseInt(key)], isEditing: true };
      });
      return updated;
    });
    setEditMode(true);
  };

  // 🔹 Cancel all edits
  const cancelAllEdits = () => {
    setEntries((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        updated[parseInt(key)] = {
          ...updated[parseInt(key)],
          isDirty: false,
          isEditing: false,
        };
      });
      return updated;
    });
    setEditMode(false);
  };

  // 🔹 Stats
  const totalSaved = Object.values(entries).filter((e) => e.hasExistingMark && !e.isDirty).length;
  const totalDirty = Object.values(entries).filter((e) => e.isDirty).length;
  const totalStudents = students.length;
  const progressPercentage = totalStudents > 0 ? Math.round((totalSaved / totalStudents) * 100) : 0;

  // 🔹 Loading state
  if (loading && examSubjects.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* 🔹 Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bulk Mark Entry</h1>
        <p className="text-gray-500 mt-1">Enter and manage marks for your assigned subjects.</p>
      </div>

      {/* 🔹 Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => {
                setFilterMonth(e.target.value);
                setSelectedSubjectId(null);
              }}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">All Months</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setSelectedSubjectId(null);
              }}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
            <select
              value={selectedSubjectId || ""}
              onChange={(e) => setSelectedSubjectId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">-- Select Subject --</option>
              {filteredSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.exam.type} - {sub.exam.month} - Class {sub.exam.class} - {sub.subject} (Max: {sub.totalMark})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 🔹 Selected Subject Info */}
      {selectedSubject && (
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{selectedSubject.subject}</h2>
                <p className="text-sm text-gray-500">
                  {selectedSubject.exam.type} - {selectedSubject.exam.month} - Class {selectedSubject.exam.class}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-blue-600">{selectedSubject.totalMark}</div>
              <div className="text-xs text-gray-400 font-bold uppercase">Max Marks</div>
            </div>
          </div>
          
          {/* 🔹 Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">
                Marks Entered: <span className="font-bold text-green-600">{totalSaved}</span> / {totalStudents}
              </span>
              <span className="text-gray-600">{progressPercentage}% Complete</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 🔹 Marks Entry Table */}
      {selectedSubject && !loading && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Saved: <span className="font-medium text-green-600">{totalSaved}</span>/{totalStudents}
              </span>
              {totalDirty > 0 && (
                <span className="text-sm text-yellow-600">
                  Unsaved: <span className="font-medium">{totalDirty}</span>
                </span>
              )}
              {totalStudents - totalSaved - totalDirty > 0 && (
                <span className="text-sm text-gray-500">
                  Pending: <span className="font-medium">{totalStudents - totalSaved - totalDirty}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64"
                />
              </div>
              {!editMode && totalSaved < totalStudents && (
                <Button variant="outline" size="sm" onClick={enableAllEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit All
                </Button>
              )}
              {editMode && (
                <Button variant="outline" size="sm" onClick={cancelAllEdits}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
              {totalDirty > 0 && (
                <Button onClick={saveAll} disabled={saving} size="sm" className="bg-blue-600 hover:bg-blue-700">
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save All ({totalDirty})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 w-20">Roll</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[200px]">Student Name</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-32">Written</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-32">Objective</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">Total</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">Status</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => {
                  const entry = entries[student.id] || {
                    written: "",
                    objective: "",
                    hasExistingMark: false,
                    isDirty: false,
                    isEditing: false,
                    isSaved: false,
                  };
                  const written = parseFloat(entry.written) || 0;
                  const objective = parseFloat(entry.objective) || 0;
                  const total = written + objective;
                  const percentage = selectedSubject
                    ? ((total / selectedSubject.totalMark) * 100).toFixed(1)
                    : "0";
                  const isOverLimit = selectedSubject && total > selectedSubject.totalMark;

                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        entry.isEditing ? "bg-blue-50" : entry.hasExistingMark ? "bg-green-50/30" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-gray-600">
                        {student.batch.code}
                        {student.roll.toString().padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.isEditing || !entry.hasExistingMark ? (
                          <Input
                            type="number"
                            min={0}
                            max={selectedSubject?.totalMark}
                            value={entry.written}
                            onChange={(e) => updateEntry(student.id, "written", e.target.value)}
                            className={`w-24 px-3 py-2 text-center mx-auto ${
                              isOverLimit ? "border-red-500 bg-red-50" : ""
                            }`}
                            placeholder="0"
                          />
                        ) : (
                          <div className="font-medium text-gray-900">{entry.written || "-"}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.isEditing || !entry.hasExistingMark ? (
                          <Input
                            type="number"
                            min={0}
                            max={selectedSubject?.totalMark}
                            value={entry.objective}
                            onChange={(e) => updateEntry(student.id, "objective", e.target.value)}
                            className={`w-24 px-3 py-2 text-center mx-auto ${
                              isOverLimit ? "border-red-500 bg-red-50" : ""
                            }`}
                            placeholder="0"
                          />
                        ) : (
                          <div className="font-medium text-gray-900">{entry.objective || "-"}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className={`font-bold ${isOverLimit ? "text-red-600" : "text-gray-900"}`}>
                          {total > 0 ? total : "-"}
                        </div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.isDirty ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium flex items-center gap-1 justify-center">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Unsaved
                          </span>
                        ) : entry.hasExistingMark ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1 justify-center">
                            <CheckCircle className="h-3 w-3" />
                            Saved
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Empty</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {entry.hasExistingMark && !entry.isEditing ? (
                            <button
                              onClick={() => toggleEdit(student.id)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          ) : entry.isEditing ? (
                            <>
                              <button
                                onClick={() => saveSingle(student.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                title="Save"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => toggleEdit(student.id)}
                                className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                                title="Cancel"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => toggleEdit(student.id)}
                              className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition"
                              title="Enter Marks"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 text-sm text-gray-600 flex items-center justify-between">
            <div>
              <span className="font-medium">Tip:</span> Click "Edit All" to modify all marks, or edit individually. Changes auto-validate against max marks.
            </div>
            {Object.values(entries).some((e) => {
              const total = (parseFloat(e.written) || 0) + (parseFloat(e.objective) || 0);
              return selectedSubject && total > selectedSubject.totalMark;
            }) && (
              <div className="text-red-600 font-medium flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Some marks exceed the maximum limit
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty States */}
      {!selectedSubject && examSubjects.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a subject from the filters above to enter marks.</p>
        </div>
      )}
      {examSubjects.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No assigned subjects found. Contact admin to assign subjects.</p>
        </div>
      )}
    </div>
  );
}