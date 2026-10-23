"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogHeader } from "@/components/ui/dialog";
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";
import { Globe, Printer } from "lucide-react";
import {
  ResultLanguage,
  tTerm,
  localizeSubjectName,
  localizeClassName,
  localizeMonthName,
  formatResultNumber,
} from "@/lib/results-i18n";

interface ResultSheetModalProps {
  data: any;
  onClose: () => void;
  onBack: () => void;
}

export function ResultSheetModal({ data, onClose, onBack }: ResultSheetModalProps) {
  const [language, setLanguage] = useState<ResultLanguage>("en");

  if (!data) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-base font-bold text-zinc-900">
              📄 {localizeMonthName(data.exam.month, language)} {data.exam.type} {tTerm("meritListTitle", language)}
            </span>
            <div className="flex items-center gap-2 no-print">
              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 text-xs">
                <div className="flex items-center gap-1 px-1.5 text-[11px] font-semibold text-zinc-500">
                  <Globe className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Lang:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                    language === "en"
                      ? "bg-white text-zinc-900 font-bold shadow-xs border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("bn")}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                    language === "bn"
                      ? "bg-white text-zinc-900 font-bold shadow-xs border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  বাংলা
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("bilingual")}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-all ${
                    language === "bilingual"
                      ? "bg-white text-zinc-900 font-bold shadow-xs border border-zinc-200"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  Dual / উভয়
                </button>
              </div>

              <Button variant="ghost" size="sm" onClick={onBack}>
                ← Back
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* 🔹 Print Header (Hidden on Screen) */}
        <div className="hidden print:block text-center border-b pb-4 mb-4">
          <div className="flex items-center justify-center gap-2.5 mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo2.png" alt="Science Lab" className="h-9 w-auto object-contain" />
            <h1 className="text-xl font-bold uppercase tracking-wide">
              {tTerm("instituteName", language)}
            </h1>
          </div>
          <p className="text-xs uppercase font-semibold text-zinc-600">
            {tTerm("officialTranscript", language)}
          </p>
          <p className="text-xs text-zinc-500 mt-0.5">
            {data.exam.type} Examination • {localizeMonthName(data.exam.month, language)} • {tTerm("class", language)} {localizeClassName(data.exam.class, language)}
          </p>
        </div>

        {/* 🔹 Student Info */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4 print:bg-transparent print:p-0 print:mb-2 border border-zinc-200">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">{tTerm("studentName", language)}: </span>
              <strong>{data.student.name}</strong>
            </div>
            <div>
              <span className="text-muted-foreground">{tTerm("class", language)}: </span>
              {localizeClassName(data.student.class, language)}
            </div>
            <div>
              <span className="text-muted-foreground">{tTerm("batch", language)}: </span>
              {data.student.batch?.name || "Regular"}
            </div>
            <div>
              <span className="text-muted-foreground">{tTerm("roll", language)}: </span>
              <strong>{formatResultNumber(data.student.roll, language)}</strong>
            </div>
          </div>
        </div>

        {/* 🔹 Marks Table */}
        <div className="border rounded-lg overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">{tTerm("subject", language)}</th>
                <th className="px-4 py-2.5 text-center font-semibold">{tTerm("written", language)}</th>
                <th className="px-4 py-2.5 text-center font-semibold">{tTerm("objective", language)}</th>
                <th className="px-4 py-2.5 text-center font-semibold">{tTerm("totalShort", language)}</th>
                <th className="px-4 py-2.5 text-center font-semibold">{tTerm("maxMarks", language)}</th>
                <th className="px-4 py-2.5 text-center font-semibold">{tTerm("position", language)}</th>
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((sub: any) => (
                <tr key={sub.id} className="border-t">
                  <td className="px-4 py-2.5 font-medium">{localizeSubjectName(sub.subject, language)}</td>
                  <td className="px-4 py-2.5 text-center">{formatResultNumber(sub.written, language)}</td>
                  <td className="px-4 py-2.5 text-center">{formatResultNumber(sub.objective, language)}</td>
                  <td className="px-4 py-2.5 text-center font-bold">{formatResultNumber(sub.total, language)}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{formatResultNumber(sub.totalMark, language)}</td>
                  <td className="px-4 py-2.5 text-center text-sm">
                    {sub.position ? `${formatResultNumber(sub.position, language)} / ${formatResultNumber(sub.totalStudents, language)}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🔹 Summary */}
        <div className="bg-primary/5 rounded-lg p-4 print:bg-transparent print:p-0 border border-indigo-100">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-xs uppercase font-semibold text-muted-foreground">
                {language === "bn" ? "সর্বমোট ফলাফল" : language === "bilingual" ? "Overall Result / সামগ্রিক ফলাফল" : "Overall Result"}
              </p>
              <p className="text-2xl font-black text-indigo-700">
                {formatResultNumber(data.overallPercentage, language)}% 
                <span className="text-base font-semibold text-zinc-600 ml-2">
                  ({formatResultNumber(data.overallTotal, language)} / {formatResultNumber(data.overallMax, language)})
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* 🔹 Print Footer */}
        <div className="hidden print:flex justify-between mt-8 pt-6 border-t text-xs text-muted-foreground">
          <div>
            <p>{tTerm("generatedOn", language)}: {new Date().toLocaleDateString(language === "bn" ? "bn-BD" : "en-GB")}</p>
            <p>Roll: {formatResultNumber(data.student.roll, language)}</p>
          </div>
          <div className="text-center">
            <p className="border-b border-black w-32 mb-1" />
            <p>{tTerm("teacherSignature", language)}</p>
          </div>
          <div className="text-center">
            <p className="border-b border-black w-32 mb-1" />
            <p>{tTerm("headSignature", language)}</p>
          </div>
        </div>

        {/* 🔹 Actions (Hidden on Print) */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t no-print">
          <Button variant="outline" onClick={onBack}>Close</Button>
          <Button onClick={() => window.print()} className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5">
            <Printer className="h-4 w-4" />
            <span>
              {language === "bn"
                ? "প্রিন্ট রেজাল্ট"
                : language === "bilingual"
                ? "Print / প্রিন্ট"
                : "Print Result"}
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
