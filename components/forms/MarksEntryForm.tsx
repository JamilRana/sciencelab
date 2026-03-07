// components/MarksEntryForm.tsx
"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { saveMarkAction, bulkSaveMarksAction } from "@/app/actions/marks";
import { generateDisplayRoll } from "@/lib/roll";

interface Student {
  id: number;
  name: string;
  roll: number;
  class: string;
  batch: { code: number };
}

interface MarkEntry {
  studentId: number;
  written: string;
  objective: string;
  isSaved: boolean;
  isDirty: boolean;
}

interface MarksEntryFormProps {
  subject: {
    id: number;
    subject: string;
    totalMark: number;
    exam: { type: string; month: string; class: string };
    teacher?: { name: string };
    marks?: Array<{
      studentId: number;
      written: number;
      objective: number;
      student: { id: number; name: string; roll: number; batch: { code: number } };
    }>;
  };
  students: Student[];
  batchId: number;
}

export function MarksEntryForm({ subject, students, batchId }: MarksEntryFormProps) {
  const [entries, setEntries] = useState<Record<number, MarkEntry>>(() => {
    const initial: Record<number, MarkEntry> = {};
    students.forEach((s) => {
      const existing = subject.marks?.find((m) => m.studentId === s.id);
      initial[s.id] = {
        studentId: s.id,
        written: existing?.written?.toString() || "",
        objective: existing?.objective?.toString() || "",
        isSaved: !!existing,
        isDirty: false,
      };
    });
    return initial;
  });

  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  // Update single entry
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

  // Save single mark (debounced)
  const saveSingle = async (studentId: number) => {
    const entry = entries[studentId];
    if (!entry.isDirty) return;

    setSaving((prev) => new Set(prev).add(studentId));
    
    const result = await saveMarkAction({
      examSubjectId: subject.id,
      studentId,
      written: entry.written ? parseFloat(entry.written) : 0,
      objective: entry.objective ? parseFloat(entry.objective) : 0,
    });

    setSaving((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });

    if (result.success) {
      setEntries((prev) => ({
        ...prev,
        [studentId]: { ...prev[studentId], isSaved: true, isDirty: false },
      }));
      toast.success(`✓ ${subject.subject} saved for ${students.find(s => s.id === studentId)?.name}`);
    } else {
      toast.error(result.error || "Failed to save");
    }
  };

  // Save all dirty entries
  const saveAll = async () => {
    const dirtyEntries = Object.values(entries)
      .filter((e) => e.isDirty)
      .map((e) => ({
        examSubjectId: subject.id,
        studentId: e.studentId,
        written: e.written ? parseFloat(e.written) : 0,
        objective: e.objective ? parseFloat(e.objective) : 0,
      }));

    if (dirtyEntries.length === 0) {
      toast.info("No changes to save");
      return;
    }

    setBulkSaving(true);
    const result = await bulkSaveMarksAction(dirtyEntries);
    setBulkSaving(false);

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
      toast.success(`✓ ${result.success} marks saved`);
    } else {
      toast.error(result.error || "Failed to save marks");
    }
  };

  // Keyboard navigation helper
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, studentId: number, field: "written" | "objective") => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveSingle(studentId);
      // Move to next student's same field
      const studentIndex = students.findIndex((s) => s.id === studentId);
      const nextStudent = students[studentIndex + 1];
      if (nextStudent) {
        const nextInput = document.querySelector(
          `input[name="written-${nextStudent.id}"], input[name="objective-${nextStudent.id}"]`
        ) as HTMLInputElement;
        nextInput?.focus();
      }
    }
  };

  const totalSaved = Object.values(entries).filter((e) => e.isSaved).length;
  const totalDirty = Object.values(entries).filter((e) => e.isDirty).length;

  return (
    <div className="bg-white rounded-xl shadow border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">
            {subject.exam.type} {subject.exam.month} • {subject.subject}
          </h2>
          <p className="text-sm text-gray-500">
            Class {subject.exam.class} • {subject.teacher?.name} • Max: {subject.totalMark}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            Saved: <span className="font-medium text-green-600">{totalSaved}</span>/{students.length}
          </span>
          {totalDirty > 0 && (
            <button
              onClick={saveAll}
              disabled={bulkSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {bulkSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                `Save ${totalDirty} Change${totalDirty > 1 ? "s" : ""}`
              )}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 min-w-[200px] sticky left-0 bg-gray-50 z-10">
                Student (Roll)
              </th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-32">Written</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-32">Objective</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">Total</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.map((student) => {
              const entry = entries[student.id];
              const written = parseFloat(entry.written) || 0;
              const objective = parseFloat(entry.objective) || 0;
              const total = written + objective;
              const isSaving = saving.has(student.id);

              return (
                <tr key={student.id} className="hover:bg-gray-50 group">
                  <td className="px-4 py-3 sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                    <div className="font-medium text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500 font-mono">
                      Roll: {generateDisplayRoll(student.batch.code, student.roll)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      name={`written-${student.id}`}
                      min={0}
                      max={subject.totalMark}
                      value={entry.written}
                      onChange={(e) => updateEntry(student.id, "written", e.target.value)}
                      onBlur={() => entry.isDirty && saveSingle(student.id)}
                      onKeyDown={(e) => handleKeyDown(e, student.id, "written")}
                      className="w-20 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSaving}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      name={`objective-${student.id}`}
                      min={0}
                      max={subject.totalMark}
                      value={entry.objective}
                      onChange={(e) => updateEntry(student.id, "objective", e.target.value)}
                      onBlur={() => entry.isDirty && saveSingle(student.id)}
                      onKeyDown={(e) => handleKeyDown(e, student.id, "objective")}
                      className="w-20 px-2 py-1 border rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={isSaving}
                    />
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-900">
                    {total > 0 ? total : "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isSaving ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                        <span className="w-3 h-3 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                        Saving
                      </span>
                    ) : entry.isDirty ? (
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                        Unsaved
                      </span>
                    ) : entry.isSaved ? (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Saved ✓
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
      <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-600">
        <div>
          Tip: Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> to save and move to next
        </div>
        {totalDirty > 0 && (
          <button
            onClick={saveAll}
            disabled={bulkSaving}
            className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {bulkSaving ? "Saving..." : `Save All (${totalDirty})`}
          </button>
        )}
      </div>
    </div>
  );
}