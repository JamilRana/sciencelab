"use client";

import { useState, useMemo } from "react";
import { X, MessageSquare, Copy, Download, Check, Sparkles } from "lucide-react";
import { ProcessedStudentExamResult } from "@/lib/special-batch-results";

interface GuardianMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: any;
  meritList: ProcessedStudentExamResult[];
}

export function GuardianMessageModal({
  isOpen,
  onClose,
  exam,
  meritList,
}: GuardianMessageModalProps) {
  const isModelTest = exam.kind === "MODEL_TEST";

  const defaultTemplate = isModelTest
    ? "Dear Guardian, {{name}} (Roll: {{roll}}) scored {{marks}} marks in {{exam}}. GPA: {{gpa}} (Grade: {{grade}}), Rank: {{rank}}. Status: {{status}}. - Science Lab"
    : "Dear Guardian, {{name}} (Roll: {{roll}}) scored {{marks}} marks in {{exam}}. Merit Rank: {{rank}}. - Science Lab";

  const [template, setTemplate] = useState(defaultTemplate);
  const [copied, setCopied] = useState(false);

  const populatedMessages = useMemo(() => {
    return meritList.map((r) => {
      let msg = template
        .replace(/{{name}}/g, r.student.name)
        .replace(/{{roll}}/g, String(r.student.displayRoll || r.student.roll))
        .replace(/{{exam}}/g, exam.title)
        .replace(/{{marks}}/g, String(r.totalMarksObtained))
        .replace(/{{totalMax}}/g, String(r.totalMarksPossible))
        .replace(/{{percentage}}/g, `${r.overallPercentage}%`)
        .replace(/{{gpa}}/g, r.gpa.toFixed(2))
        .replace(/{{grade}}/g, r.finalGradeLetter)
        .replace(/{{rank}}/g, `#${r.rank}`)
        .replace(/{{status}}/g, r.isPassed ? "PASSED" : "FAILED");

      return {
        student: r.student,
        rank: r.rank,
        message: msg,
      };
    });
  }, [template, meritList, exam.title]);

  if (!isOpen) return null;

  const handleCopyAll = () => {
    const textToCopy = populatedMessages.map((m) => m.message).join("\n\n");
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleExportCSV = () => {
    const headers = ["Rank", "Roll", "Student Name", "Feeder School", "Guardian Message"];
    const rows = populatedMessages.map((m) => [
      m.rank,
      m.student.displayRoll,
      `"${m.student.name.replace(/"/g, '""')}"`,
      `"${(m.student.schoolName || "Science Lab").replace(/"/g, '""')}"`,
      `"${m.message.replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Guardian_Result_Messages_${exam.title.replace(/[^a-zA-Z0-9_-]/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-900">
                Guardian Result Messages (SMS / Bulk Copy / CSV)
              </h2>
              <p className="text-xs text-zinc-500">
                Customize message template with placeholders and export copyable text or CSV for guardians
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Template Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-800">
                Editable Message Template
              </label>
              <button
                type="button"
                onClick={() => setTemplate(defaultTemplate)}
                className="text-[11px] text-indigo-600 hover:underline font-medium"
              >
                Reset to Default
              </button>
            </div>

            <textarea
              rows={3}
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
            />

            {/* Placeholders chip bar */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[11px] text-zinc-400">Available Placeholders:</span>
              {["{{name}}", "{{roll}}", "{{exam}}", "{{marks}}", "{{percentage}}", "{{gpa}}", "{{grade}}", "{{rank}}", "{{status}}"].map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => setTemplate((prev) => prev + " " + ph)}
                  className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors border border-zinc-200"
                >
                  {ph}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Preview List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-800">
                Live Sample Output ({populatedMessages.length} Messages Generated)
              </span>
              <span className="text-[11px] text-zinc-400">Showing first 3 students</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
              {populatedMessages.slice(0, 3).map((item) => (
                <div
                  key={item.student.id}
                  className="bg-white p-2.5 rounded-lg border border-zinc-200 text-xs shadow-2xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold border-b border-zinc-100 pb-1">
                    <span className="text-zinc-900 font-bold">{item.student.name} (Roll #{item.student.displayRoll})</span>
                    <span className="text-indigo-600 font-bold">Rank #{item.rank}</span>
                  </div>
                  <p className="text-zinc-700 font-mono text-[11px] leading-relaxed pt-0.5">
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
            <span className="text-xs text-zinc-500">
              Ready for copy or bulk SMS sender upload
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-lg shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied All Messages!" : `Copy All (${populatedMessages.length})`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
