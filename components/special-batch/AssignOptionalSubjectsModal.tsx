"use client";

import { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Save,
  CheckCircle2,
  AlertCircle,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";
import {
  getProgramStudentsWithSubjectsAction,
  batchAssignStudentOptionalSubjectsAction,
} from "@/app/actions/student-subjects";
import { generateDisplayRoll } from "@/lib/roll";

interface AssignOptionalSubjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  programId: number;
  programName?: string;
  onAssigned?: () => void;
}

export function AssignOptionalSubjectsModal({
  isOpen,
  onClose,
  programId,
  programName,
  onAssigned,
}: AssignOptionalSubjectsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<{ [studentId: number]: number | null }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<"ALL" | "BOYS" | "GIRLS">("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  useEffect(() => {
    if (!isOpen || !programId) return;

    let isMounted = true;
    setLoading(true);
    setFeedback(null);

    getProgramStudentsWithSubjectsAction(programId)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setStudents(res.data.students);
          setSubjects(res.data.subjects);

          // Populate initial assignments map
          const initialMap: { [studentId: number]: number | null } = {};
          res.data.students.forEach((stu: any) => {
            const optionalSubject = stu.studentSubjects?.[0]?.subjectId || null;
            initialMap[stu.id] = optionalSubject;
          });
          setAssignments(initialMap);
        } else {
          setFeedback({ type: "error", message: res.error || "Failed to load students" });
        }
      })
      .catch((err) => {
        if (isMounted) {
          setFeedback({ type: "error", message: "Network error loading students" });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, programId]);

  if (!isOpen) return null;

  // Filter students based on search query and section
  const filteredStudents = students.filter((stu) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      stu.name.toLowerCase().includes(q) ||
      String(stu.roll).includes(q) ||
      (stu.school?.name && stu.school.name.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (sectionFilter === "ALL") return true;
    const isBoy =
      stu.gender?.toLowerCase() === "male" ||
      stu.batch?.name?.toLowerCase().includes("boy");
    if (sectionFilter === "BOYS") return isBoy;
    if (sectionFilter === "GIRLS") return !isBoy;

    return true;
  });

  const handleSelectSubject = (studentId: number, subjectId: number | null) => {
    setAssignments((prev) => ({
      ...prev,
      [studentId]: subjectId,
    }));
  };

  const handleBulkAssign = (subjectId: number | null) => {
    const updated = { ...assignments };
    filteredStudents.forEach((stu) => {
      updated[stu.id] = subjectId;
    });
    setAssignments(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const payload = Object.entries(assignments).map(([sId, subId]) => ({
        studentId: Number(sId),
        subjectId: subId,
      }));

      const res = await batchAssignStudentOptionalSubjectsAction(payload, programId);

      if (res.success) {
        setFeedback({
          type: "success",
          message: "Optional 4th subjects successfully updated!",
        });
        if (onAssigned) onAssigned();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback({
          type: "error",
          message: res.error || "Failed to save assignments",
        });
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  // Optional candidate subjects: filter subjects that can serve as optional / 4th subject
  const electiveCandidates = subjects.filter((s) => s.isOptional) || subjects;
  const selectableSubjects = electiveCandidates.length > 0 ? electiveCandidates : subjects;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-4xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-lg">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Assign 4th / Optional Subjects
              </h3>
              <p className="text-xs text-zinc-400">
                {programName || "Special Program"} · SSC & Junior Academic Modules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search by student name or roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Section tabs */}
            <div className="flex bg-zinc-200/80 p-0.5 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setSectionFilter("ALL")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sectionFilter === "ALL"
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSectionFilter("BOYS")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sectionFilter === "BOYS"
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Boys
              </button>
              <button
                type="button"
                onClick={() => setSectionFilter("GIRLS")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sectionFilter === "GIRLS"
                    ? "bg-white text-zinc-900 shadow-xs font-semibold"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Girls
              </button>
            </div>
          </div>

          {/* Quick Bulk Assign Action */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-medium">Set all shown to:</span>
            <select
              onChange={(e) => {
                const val = e.target.value;
                if (val === "none") handleBulkAssign(null);
                else if (val) handleBulkAssign(Number(val));
              }}
              defaultValue=""
              className="bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-xs text-zinc-800 font-medium focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Select Subject...
              </option>
              <option value="none">No 4th Subject</option>
              {selectableSubjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} {sub.code ? `(${sub.code})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div
            className={`px-4 py-2.5 text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                : "bg-rose-50 text-rose-800 border-b border-rose-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Students Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              Loading student roster and subjects...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs">
              No students found matching your criteria.
            </div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100 text-zinc-700 font-semibold border-b border-zinc-200 text-left">
                  <th className="py-2.5 px-3 w-12 text-center">Roll</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Section / Batch</th>
                  <th className="py-2.5 px-3">Feeder School</th>
                  <th className="py-2.5 px-3 w-56 text-right">Assigned 4th Subject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredStudents.map((stu) => {
                  const displayRoll = stu.batch?.code
                    ? generateDisplayRoll(stu.batch.code, stu.roll)
                    : stu.roll;
                  const currentSubId = assignments[stu.id] || "";

                  return (
                    <tr key={stu.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-bold font-mono text-zinc-900">
                        {displayRoll}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-900">
                        {stu.name}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-600">
                        {stu.batch?.name || "General Batch"}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 truncate max-w-[160px]">
                        {stu.school?.name || "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <select
                          value={currentSubId}
                          onChange={(e) =>
                            handleSelectSubject(
                              stu.id,
                              e.target.value ? Number(e.target.value) : null
                            )
                          }
                          className="w-48 bg-white border border-zinc-300 rounded-lg px-2.5 py-1 text-xs text-zinc-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">None (No Optional Subject)</option>
                          {selectableSubjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name} {sub.code ? `(${sub.code})` : ""}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-200 flex items-center justify-between text-xs">
          <span className="text-zinc-500 font-medium">
            Total Candidates: {filteredStudents.length} · Assigned:{" "}
            {
              filteredStudents.filter(
                (stu) => assignments[stu.id] !== null && assignments[stu.id] !== undefined
              ).length
            }
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 font-semibold rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving..." : "Save Subject Assignments"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
