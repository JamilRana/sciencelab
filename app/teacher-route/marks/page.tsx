"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { saveMarkAction, bulkSaveMarksAction } from "@/app/actions/marks";
import { Search, FileText, User, CheckCircle, Loader2 } from "lucide-react";

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

interface ExistingMark {
  studentId: number;
  written: number;
  objective: number;
}

interface MarkEntry {
  studentId: number;
  written: string;
  objective: string;
  isSaved: boolean;
  isDirty: boolean;
}

export default function BulkMarksEntryPage() {
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<Record<number, MarkEntry>>({});
  
  // Filters
  const [filterMonth, setFilterMonth] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  // Fetch teacher's assigned subjects on mount
  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get unique values for filters
  const uniqueMonths = useMemo(() => {
    const months = new Set(examSubjects.map((e) => e.exam.month));
    return Array.from(months);
  }, [examSubjects]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set(examSubjects.map((e) => e.exam.class));
    return Array.from(classes).sort();
  }, [examSubjects]);

  // Filter subjects
  const filteredSubjects = useMemo(() => {
    return examSubjects.filter((sub) => {
      const monthMatch = !filterMonth || sub.exam.month === filterMonth;
      const classMatch = !filterClass || sub.exam.class === filterClass;
      return monthMatch && classMatch;
    });
  }, [examSubjects, filterMonth, filterClass]);

  // When a subject is selected, fetch students and marks
  useEffect(() => {
    if (!selectedSubjectId) return;
    
    const subject = examSubjects.find((e) => e.id === selectedSubjectId);
    if (!subject || !subject.exam) return;

    const className = subject.exam.class;
    if (!className) return;

    async function fetchData() {
      setLoading(true);
      try {
        // Get students for this class
        const res = await fetch(`/api/students?class=${className}`);
        const data = await res.json();
        
        if (data.students) {
          const sortedStudents = data.students.sort((a: Student, b: Student) => a.roll - b.roll);
          setStudents(sortedStudents);
        }

        // Fetch existing marks
        const marksRes = await fetch(`/api/marks/examId/${selectedSubjectId}`);
        const marksData = await marksRes.json();
        
        const marksMap = new Map<number, ExistingMark>();
        if (Array.isArray(marksData)) {
          marksData.forEach((m: ExistingMark) => {
            marksMap.set(m.studentId, m);
          });
        }

        // Initialize entries
        const initial: Record<number, MarkEntry> = {};
        data.students?.forEach((s: Student) => {
          const existing = marksMap.get(s.id);
          initial[s.id] = {
            studentId: s.id,
            written: existing?.written?.toString() || "",
            objective: existing?.objective?.toString() || "",
            isSaved: !!existing,
            isDirty: false,
          };
        });
        setEntries(initial);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [selectedSubjectId, examSubjects]);

  const selectedSubject = examSubjects.find((e) => e.id === selectedSubjectId);

  const filteredStudents = students.filter((s) =>
    !searchQuery || 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll.toString().includes(searchQuery)
  );

  const updateEntry = useCallback((studentId: number, field: "written" | "objective", value: string) => {
    setEntries((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
        isDirty: true,
      },
    }));
  }, []);

  const saveSingle = async (studentId: number) => {
    const entry = entries[studentId];
    if (!entry || !entry.isDirty || !selectedSubjectId) return;

    const result = await saveMarkAction({
      examSubjectId: selectedSubjectId,
      studentId,
      written: entry.written ? parseFloat(entry.written) : 0,
      objective: entry.objective ? parseFloat(entry.objective) : 0,
    });

    if (result.success) {
      setEntries((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], isSaved: true, isDirty: false },
      }));
    }
  };

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
    const result = await bulkSaveMarksAction(dirtyEntries);
    setSaving(false);

    if (result.success) {
      setEntries((prev) => {
        const updated = { ...prev };
        dirtyEntries.forEach((d) => {
          if (updated[d.studentId]) {
            updated[d.studentId] = { ...updated[d.studentId], isSaved: true, isDirty: false };
          }
        });
        return updated;
      });
      toast.success(`${result.success} marks saved`);
    } else {
      toast.error(result.error || "Failed to save marks");
    }
  };

  const totalSaved = Object.values(entries).filter((e) => e.isSaved).length;
  const totalDirty = Object.values(entries).filter((e) => e.isDirty).length;

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
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Bulk Mark Entry</h1>
        <p className="text-gray-500 mt-1">Enter marks for your assigned subjects.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => { setFilterMonth(e.target.value); setSelectedSubjectId(null); }}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
              onChange={(e) => { setFilterClass(e.target.value); setSelectedSubjectId(null); }}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
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

      {/* Selected Subject Info */}
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
        </div>
      )}

      {/* Marks Entry Table */}
      {selectedSubject && !loading && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Saved: <span className="font-medium text-green-600">{totalSaved}</span>/{students.length}
              </span>
              {totalDirty > 0 && (
                <span className="text-sm text-yellow-600">
                  Pending: <span className="font-medium">{totalDirty}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {totalDirty > 0 && (
                <button
                  onClick={saveAll}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    `Save All (${totalDirty})`
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 w-16">Roll</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[200px]">Student Name</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-32">Written</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-32">Objective</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">Total</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((student) => {
                  const entry = entries[student.id] || { written: "", objective: "", isSaved: false, isDirty: false };
                  const written = parseFloat(entry.written) || 0;
                  const objective = parseFloat(entry.objective) || 0;
                  const total = written + objective;
                  const percentage = selectedSubject ? ((total / selectedSubject.totalMark) * 100).toFixed(1) : "0";

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 group">
                      <td className="px-4 py-3 font-mono text-gray-600">
                        {student.batch.code}{student.roll.toString().padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-900">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={selectedSubject.totalMark}
                          value={entry.written}
                          onChange={(e) => updateEntry(student.id, "written", e.target.value)}
                          onBlur={() => entry.isDirty && saveSingle(student.id)}
                          className="w-24 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={selectedSubject.totalMark}
                          value={entry.objective}
                          onChange={(e) => updateEntry(student.id, "objective", e.target.value)}
                          onBlur={() => entry.isDirty && saveSingle(student.id)}
                          className="w-24 px-3 py-2 border rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="font-bold text-gray-900">{total > 0 ? total : "-"}</div>
                        <div className="text-xs text-gray-500">{percentage}%</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.isDirty ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                            Unsaved
                          </span>
                        ) : entry.isSaved ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium flex items-center gap-1 justify-center">
                            <CheckCircle className="h-3 w-3" /> Saved
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Empty</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 text-sm text-gray-600">
            Tip: Enter marks and click outside the field to auto-save, or use "Save All" button.
          </div>
        </div>
      )}

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
