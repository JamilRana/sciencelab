"use client";

import { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  getProgramCurriculumAction,
  addProgramSubjectAction,
  updateProgramSubjectAction,
  deleteProgramSubjectAction,
  applyProgramCurriculumTemplateAction,
} from "@/app/actions/special-curriculum";
import { CURRICULUM_TEMPLATES } from "@/lib/curriculum-templates";
import { useRouter } from "next/navigation";

interface ManageCurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: any;
  onUpdated?: () => void;
}

export function ManageCurriculumModal({
  isOpen,
  onClose,
  program,
  onUpdated,
}: ManageCurriculumModalProps) {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for new subject
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newFullMarks, setNewFullMarks] = useState(100);
  const [newCqMax, setNewCqMax] = useState(70);
  const [newMcqMax, setNewMcqMax] = useState(30);
  const [newPracticalMax, setNewPracticalMax] = useState(0);
  const [newIsCombined, setNewIsCombined] = useState(false);
  const [newCombinedGroup, setNewCombinedGroup] = useState("");
  const [newIsOptional, setNewIsOptional] = useState(false);
  const [newHasPractical, setNewHasPractical] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const loadSubjects = async () => {
    if (!program?.id) return;
    setIsLoading(true);
    setError(null);
    const res = await getProgramCurriculumAction(program.id);
    setIsLoading(false);
    if (res.success && res.data) {
      setSubjects(res.data);
    } else {
      setError(res.error || "Failed to load subjects");
    }
  };

  useEffect(() => {
    if (isOpen && program?.id) {
      loadSubjects();
      setIsAdding(false);
      setEditingId(null);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, program?.id]);

  if (!isOpen || !program) return null;

  const handleApplyTemplate = async (templateKey: keyof typeof CURRICULUM_TEMPLATES) => {
    const tName = CURRICULUM_TEMPLATES[templateKey].name;
    if (
      !confirm(
        `Are you sure you want to load "${tName}"? This will configure standard subjects for this program.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const res = await applyProgramCurriculumTemplateAction(program.id, templateKey);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`Applied template "${tName}" successfully!`);
      loadSubjects();
      router.refresh();
      onUpdated?.();
    } else {
      setError(res.error || "Failed to apply template");
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Please provide a subject name");
      return;
    }

    const total = Number(newCqMax) + Number(newMcqMax) + Number(newPracticalMax);
    if (total !== Number(newFullMarks)) {
      if (
        !confirm(
          `CQ (${newCqMax}) + MCQ (${newMcqMax}) + Practical (${newPracticalMax}) = ${total}, which does not match Full Marks (${newFullMarks}). Proceed anyway?`
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const res = await addProgramSubjectAction({
      programId: program.id,
      name: newName.trim(),
      code: newCode.trim(),
      fullMarks: Number(newFullMarks),
      cqMax: Number(newCqMax),
      mcqMax: Number(newMcqMax),
      practicalMax: Number(newPracticalMax),
      isCombined: newIsCombined,
      combinedGroupId: newIsCombined ? newCombinedGroup.trim() : undefined,
      isOptional: newIsOptional,
      hasPractical: newHasPractical || Number(newPracticalMax) > 0,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`Added '${newName}' successfully!`);
      setNewName("");
      setNewCode("");
      setNewFullMarks(100);
      setNewCqMax(70);
      setNewMcqMax(30);
      setNewPracticalMax(0);
      setNewIsCombined(false);
      setNewCombinedGroup("");
      setNewIsOptional(false);
      setNewHasPractical(false);
      setIsAdding(false);
      loadSubjects();
      router.refresh();
      onUpdated?.();
    } else {
      setError(res.error || "Failed to add subject");
    }
  };

  const handleStartEdit = (subj: any) => {
    setEditingId(subj.id);
    setEditForm({
      name: subj.name,
      code: subj.code || "",
      fullMarks: subj.fullMarks,
      cqMax: subj.cqMax,
      mcqMax: subj.mcqMax,
      practicalMax: subj.practicalMax,
      isCombined: subj.isCombined,
      combinedGroupId: subj.combinedGroupId || "",
      isOptional: subj.isOptional,
      hasPractical: subj.hasPractical,
    });
  };

  const handleSaveEdit = async (id: number) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const res = await updateProgramSubjectAction(id, {
      name: editForm.name,
      code: editForm.code,
      fullMarks: Number(editForm.fullMarks),
      cqMax: Number(editForm.cqMax),
      mcqMax: Number(editForm.mcqMax),
      practicalMax: Number(editForm.practicalMax),
      isCombined: editForm.isCombined,
      combinedGroupId: editForm.isCombined ? editForm.combinedGroupId : "",
      isOptional: editForm.isOptional,
      hasPractical: editForm.hasPractical || Number(editForm.practicalMax) > 0,
    });

    setIsSubmitting(false);

    if (res.success) {
      setEditingId(null);
      setSuccessMsg("Subject updated successfully!");
      loadSubjects();
      router.refresh();
      onUpdated?.();
    } else {
      setError(res.error || "Failed to update subject");
    }
  };

  const handleDeleteSubject = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to remove '${name}' from this curriculum?`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const res = await deleteProgramSubjectAction(id);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`Subject '${name}' deleted successfully!`);
      loadSubjects();
      router.refresh();
      onUpdated?.();
    } else {
      setError(res.error || "Failed to delete subject");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900">
                  Manage Dynamic Curriculum
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                  {program.code}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  {program.name}
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Customize subjects, combined papers (e.g. Bangla 1st & 2nd), 4th electives, and CQ/MCQ/Practical mark distributions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar & Alerts */}
        <div className="px-6 py-3 border-b border-zinc-100 bg-white space-y-3">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="underline ml-2">
                Dismiss
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="underline ml-2">
                Dismiss
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Quick Template Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-zinc-500 mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                Presets:
              </span>
              <button
                type="button"
                onClick={() => handleApplyTemplate("SSC_SCIENCE")}
                disabled={isSubmitting}
                className="px-2.5 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors disabled:opacity-50"
              >
                SSC Science (9)
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate("SSC_COMMERCE")}
                disabled={isSubmitting}
                className="px-2.5 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors disabled:opacity-50"
              >
                SSC Commerce (9)
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate("SSC_HUMANITIES")}
                disabled={isSubmitting}
                className="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors disabled:opacity-50"
              >
                SSC Humanities (9)
              </button>
              <button
                type="button"
                onClick={() => handleApplyTemplate("JSC_GENERAL")}
                disabled={isSubmitting}
                className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
              >
                JSC General (5)
              </button>
            </div>

            {/* Add Subject Toggle */}
            <button
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAdding ? "Cancel Adding" : "+ Custom Subject"}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Add Subject Form Panel */}
          {isAdding && (
            <form
              onSubmit={handleAddSubject}
              className="p-4 bg-indigo-50/40 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in-50 duration-150"
            >
              <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                Add New Curriculum Subject
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Subject Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Higher Mathematics, ICT, Biology"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Board Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 126"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Full Marks
                  </label>
                  <input
                    type="number"
                    value={newFullMarks}
                    onChange={(e) => setNewFullMarks(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Marks breakdown */}
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    CQ Max
                  </label>
                  <input
                    type="number"
                    value={newCqMax}
                    onChange={(e) => setNewCqMax(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    MCQ Max
                  </label>
                  <input
                    type="number"
                    value={newMcqMax}
                    onChange={(e) => setNewMcqMax(Number(e.target.value))}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                    Practical Max
                  </label>
                  <input
                    type="number"
                    value={newPracticalMax}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewPracticalMax(val);
                      if (val > 0) setNewHasPractical(true);
                    }}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-zinc-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Configuration Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsOptional}
                    onChange={(e) => setNewIsOptional(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Optional (4th Subject)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newHasPractical}
                    onChange={(e) => setNewHasPractical(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Has Practical Exam</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-zinc-700 font-medium cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={newIsCombined}
                      onChange={(e) => setNewIsCombined(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Combined Paper:</span>
                  </label>
                  {newIsCombined && (
                    <input
                      type="text"
                      placeholder="e.g. BANGLA, ENGLISH"
                      value={newCombinedGroup}
                      onChange={(e) => setNewCombinedGroup(e.target.value)}
                      className="text-xs px-2 py-1 bg-white border border-zinc-200 rounded-md w-full"
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  Save Subject
                </button>
              </div>
            </form>
          )}

          {/* Subjects Table */}
          {isLoading ? (
            <div className="py-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Loading curriculum subjects...</span>
            </div>
          ) : subjects.length === 0 ? (
            <div className="py-12 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
              <BookOpen className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-zinc-700">No subjects in this curriculum yet.</p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Click a preset button above to load standard board curriculum or add custom subjects.
              </p>
            </div>
          ) : (
            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-50 text-zinc-500 font-semibold border-b border-zinc-100">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Code</th>
                    <th className="py-2.5 px-3 text-center">Marks Distribution</th>
                    <th className="py-2.5 px-3 text-center">Attributes</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {subjects.map((subj, index) => {
                    const isEditing = editingId === subj.id;

                    if (isEditing) {
                      return (
                        <tr key={subj.id} className="bg-indigo-50/30">
                          <td className="py-2.5 px-3 font-mono text-zinc-400">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                              className="w-full text-xs px-2 py-1 bg-white border border-zinc-200 rounded"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="text"
                              value={editForm.code}
                              onChange={(e) =>
                                setEditForm({ ...editForm, code: e.target.value })
                              }
                              className="w-16 text-xs px-2 py-1 bg-white border border-zinc-200 rounded text-center font-mono"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-center gap-1 text-[11px]">
                              <span>CQ:</span>
                              <input
                                type="number"
                                value={editForm.cqMax}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, cqMax: e.target.value })
                                }
                                className="w-12 text-xs px-1 py-0.5 border rounded text-center"
                              />
                              <span>MCQ:</span>
                              <input
                                type="number"
                                value={editForm.mcqMax}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, mcqMax: e.target.value })
                                }
                                className="w-12 text-xs px-1 py-0.5 border rounded text-center"
                              />
                              <span>Prac:</span>
                              <input
                                type="number"
                                value={editForm.practicalMax}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, practicalMax: e.target.value })
                                }
                                className="w-12 text-xs px-1 py-0.5 border rounded text-center"
                              />
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <label className="text-[10px] flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editForm.isOptional}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, isOptional: e.target.checked })
                                  }
                                />
                                4th
                              </label>
                              <label className="text-[10px] flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editForm.isCombined}
                                  onChange={(e) =>
                                    setEditForm({ ...editForm, isCombined: e.target.checked })
                                  }
                                />
                                Combined
                              </label>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(subj.id)}
                                disabled={isSubmitting}
                                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                title="Save Changes"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="p-1 text-zinc-400 hover:bg-zinc-100 rounded"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={subj.id} className="hover:bg-zinc-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-zinc-400">{index + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-zinc-900">
                          {subj.name}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-zinc-500">
                          {subj.code || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums">
                          <span className="font-medium text-zinc-800">{subj.fullMarks}</span>
                          <span className="text-[11px] text-zinc-400 ml-1.5">
                            (CQ {subj.cqMax} + MCQ {subj.mcqMax}
                            {subj.practicalMax > 0 && ` + Prac ${subj.practicalMax}`})
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            {subj.isCombined && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Combined: {subj.combinedGroupId}
                              </span>
                            )}
                            {subj.isOptional && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                4th Subject
                              </span>
                            )}
                            {subj.hasPractical && (
                              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600">
                                Practical
                              </span>
                            )}
                            {!subj.isCombined && !subj.isOptional && !subj.hasPractical && (
                              <span className="text-[10px] text-zinc-400">Compulsory</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(subj)}
                              className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit Subject"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubject(subj.id, subj.name)}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Subject"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50/70 flex items-center justify-between text-xs">
          <span className="text-zinc-500">
            Total Subjects: <strong className="text-zinc-800">{subjects.length}</strong> (
            {subjects.filter((s) => s.isOptional).length} optional / 4th)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
