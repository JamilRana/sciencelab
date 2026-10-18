"use client";

import { useState } from "react";
import { X, Sparkles, Plus, Loader2 } from "lucide-react";
import { createSpecialProgramAction } from "@/app/actions/course-fees";
import { useRouter } from "next/navigation";

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProgramModal({ isOpen, onClose }: CreateProgramModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState<"SSC" | "JSC">("SSC");
  const [year, setYear] = useState(new Date().getFullYear());
  const [classLevel, setClassLevel] = useState("Ten");
  const [batchBoys, setBatchBoys] = useState("Boys");
  const [batchGirls, setBatchGirls] = useState("Girls");
  const [batchBoysCode, setBatchBoysCode] = useState("");
  const [batchGirlsCode, setBatchGirlsCode] = useState("");
  const [curriculumTemplate, setCurriculumTemplate] = useState<any>("SSC_SCIENCE");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError("Please provide program name and code");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const bNames = [batchBoys.trim() || "Boys", batchGirls.trim() || "Girls"];
    const bCodes = [
      batchBoysCode ? parseInt(batchBoysCode) : 2620,
      batchGirlsCode ? parseInt(batchGirlsCode) : 2610,
    ];

    const res = await createSpecialProgramAction({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      category,
      year: Number(year),
      classLevel,
      batchNames: bNames,
      batchCodes: bCodes,
      curriculumTemplate,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || "Failed to create program");
      return;
    }

    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">Create Special Program</h2>
              <p className="text-xs text-zinc-500">Add an academic board program and associated batches</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Program Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. SSC Special Batch 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">
                Program Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. SSC-2026"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as "SSC" | "JSC";
                  setCategory(cat);
                  setClassLevel(cat === "SSC" ? "Ten" : "Eight");
                  setCurriculumTemplate(cat === "SSC" ? "SSC_SCIENCE" : "JSC_GENERAL");
                }}
                className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="SSC">SSC (Secondary)</option>
                <option value="JSC">JSC (Junior)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Class Level</label>
              <select
                value={classLevel}
                onChange={(e) => setClassLevel(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Ten">Class Ten</option>
                <option value="Nine">Class Nine</option>
                <option value="Eight">Class Eight</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Exam Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">
              Dynamic Curriculum Template <span className="text-zinc-400 font-normal">(can be customized anytime)</span>
            </label>
            <select
              value={curriculumTemplate}
              onChange={(e) => setCurriculumTemplate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {category === "SSC" ? (
                <>
                  <option value="SSC_SCIENCE">SSC Science (9 subjects: Bangla 1/2, Eng 1/2, Math, Phys, Chem, Bio, H.Math)</option>
                  <option value="SSC_COMMERCE">SSC Business Studies / Commerce (9 subjects: Acc, Bus. Ent, Fin & Bank, etc.)</option>
                  <option value="SSC_HUMANITIES">SSC Humanities / Arts (9 subjects: Geo, History, Civics, Econ, etc.)</option>
                  <option value="NONE">Blank / Custom (Add subjects manually)</option>
                </>
              ) : (
                <>
                  <option value="JSC_GENERAL">JSC Standard (5 subjects: Bangla, English, Math, Science, BGS)</option>
                  <option value="NONE">Blank / Custom (Add subjects manually)</option>
                </>
              )}
            </select>
          </div>

          <div className="pt-2 border-t border-zinc-100">
            <h3 className="text-xs font-semibold text-zinc-800 mb-2">Initial Section Batches</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Section 1 Name (e.g. Boys)"
                  value={batchBoys}
                  onChange={(e) => setBatchBoys(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-zinc-200 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Batch Code (e.g. 2620)"
                  value={batchBoysCode}
                  onChange={(e) => setBatchBoysCode(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-zinc-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Section 2 Name (e.g. Girls)"
                  value={batchGirls}
                  onChange={(e) => setBatchGirls(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-zinc-200 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Batch Code (e.g. 2610)"
                  value={batchGirlsCode}
                  onChange={(e) => setBatchGirlsCode(e.target.value)}
                  className="w-full text-xs px-3 py-1.5 border border-zinc-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Create Program
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
