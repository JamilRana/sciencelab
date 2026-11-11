"use client";

import React, { useState } from "react";
import {
  FormType,
  FillMode,
  ColorTheme,
  AdmissionFormData,
  ProgramOption,
  BatchOption,
  SchoolOption,
  DEFAULT_SPECIAL_FORM,
  DEFAULT_REGULAR_FORM,
} from "./types";
import { PrintStyles } from "./PrintStyles";
import { FormControls } from "./FormControls";
import { SpecialBatchForm } from "./SpecialBatchForm";
import { RegularAdmissionForm } from "./RegularAdmissionForm";
import { StudentSearchDialog } from "./StudentSearchDialog";
import { ArrowLeft, Printer, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface AdmissionFormManagerProps {
  programs: ProgramOption[];
  batches: BatchOption[];
  schools: SchoolOption[];
}

export function AdmissionFormManager({
  programs,
  batches,
  schools,
}: AdmissionFormManagerProps) {
  const searchParams = useSearchParams();
  const initialType = searchParams?.get("type") === "regular" ? "regular" : "special";

  const [formType, setFormType] = useState<FormType>(initialType);
  const [fillMode, setFillMode] = useState<FillMode>("blank"); // Default to blank ready for print/distribution!
  const [colorTheme, setColorTheme] = useState<ColorTheme>("emerald");
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [showDigitalSeal, setShowDigitalSeal] = useState<boolean>(true);
  const [showDigitalSignature, setShowDigitalSignature] = useState<boolean>(true);

  // Form State
  const [formData, setFormData] = useState<AdmissionFormData>(
    initialType === "regular" ? DEFAULT_REGULAR_FORM : DEFAULT_SPECIAL_FORM
  );

  // Search Dialog State
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Handle student selection from DB
  function handleSelectStudent(student: any) {
    setFillMode("filled");
    setFormData((prev) => ({
      ...prev,
      studentNameBangla: student.name || prev.studentNameBangla,
      studentNameEnglish: student.name || prev.studentNameEnglish,
      fatherName: student.fatherName || prev.fatherName,
      motherName: student.motherName || prev.motherName,
      schoolName: student.school?.name || prev.schoolName,
      guardianMobile: student.mobile || student.homeMobile || prev.guardianMobile,
      studentMobile: student.mobile || prev.studentMobile,
      rollNo: student.roll ? String(student.roll) : prev.rollNo,
      batchName: student.batch?.name || prev.batchName,
      photoUrl: student.image || prev.photoUrl,
      targetClass: student.batch?.classId
        ? `${student.batch.classId} শ্রেণি`
        : prev.targetClass,
      registrationNo: student.batch?.code
        ? `SL-${student.batch.code}-${String(student.roll || "01").padStart(3, "0")}`
        : prev.registrationNo,
    }));
  }

  return (
    <div className="min-h-screen bg-zinc-100/70 pb-16">
      <PrintStyles />

      {/* Screen Page Header (Hidden during print) */}
      <div className="no-print bg-white border-b border-zinc-200/80 px-4 sm:px-6 py-4 mb-6 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin-route/dashboard"
              className="p-2 text-zinc-500 hover:text-zinc-800 rounded-lg hover:bg-zinc-100 transition"
              title="ড্যাশবোর্ডে ফিরে যান"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h1 className="text-lg font-bold text-zinc-900">
                  ভর্তি ও প্রবেশপত্র ফরম জেনারেটর (Admission & Admit Cards)
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  A4 Print Ready
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                বিশেষ ব্যাচ ও নিয়মিত শ্রেণির জন্য অফিশিয়াল প্রিন্টযোগ্য এবং ডাইনামিক বাংলা ফরম
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Printer className="h-4 w-4" />
              <span>এক ক্লিকে প্রিন্ট / PDF সংরক্ষণ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Controls & Form Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Interactive Controls (Tabs, Blank/Fill mode, Color theme, live editor) */}
        <FormControls
          formType={formType}
          setFormType={setFormType}
          fillMode={fillMode}
          setFillMode={setFillMode}
          colorTheme={colorTheme}
          setColorTheme={setColorTheme}
          showWatermark={showWatermark}
          setShowWatermark={setShowWatermark}
          showDigitalSeal={showDigitalSeal}
          setShowDigitalSeal={setShowDigitalSeal}
          showDigitalSignature={showDigitalSignature}
          setShowDigitalSignature={setShowDigitalSignature}
          formData={formData}
          setFormData={setFormData}
          programs={programs}
          batches={batches}
          schools={schools}
          onOpenStudentSearch={() => setIsSearchOpen(true)}
        />

        {/* Live Printable A4 Preview Container */}
        <div className="flex flex-col items-center justify-center">
          
          {/* Paper View Indicator (Screen only) */}
          <div className="no-print mb-2 text-xs text-zinc-500 flex items-center gap-2 font-medium">
            <span>A4 ফরম প্রিভিউ:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 font-bold text-[11px]">
              {formType === "special" ? "বিশেষ ব্যাচ (স্পেশাল ব্যাচ / বৃত্তি পরীক্ষা)" : "নিয়মিত শ্রেণি ভর্তি (৬ষ্ঠ - ১০ম শ্রেণি)"}
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold">
              {fillMode === "blank" ? "ফাঁকা ফরম (হাতে লেখার জন্য)" : "তথ্য পূরণকৃত ফরম"}
            </span>
          </div>

          {/* Form Component Rendering */}
          {formType === "special" ? (
            <SpecialBatchForm
              data={formData}
              fillMode={fillMode}
              theme={colorTheme}
              showWatermark={showWatermark}
              showDigitalSeal={showDigitalSeal}
              showDigitalSignature={showDigitalSignature}
            />
          ) : (
            <RegularAdmissionForm
              data={formData}
              fillMode={fillMode}
              theme={colorTheme}
              showWatermark={showWatermark}
              showDigitalSeal={showDigitalSeal}
              showDigitalSignature={showDigitalSignature}
            />
          )}

          {/* Screen Print Tip */}
          <div className="no-print mt-4 max-w-[794px] w-full bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">প্রিন্ট ও PDF সংরক্ষণের টিপস:</p>
              <p className="text-emerald-700 mt-0.5">
                উপরে <strong>&ldquo;এক ক্লিকে প্রিন্ট / PDF সংরক্ষণ&rdquo;</strong> বাটনে চাপ দিন অথবা কিবোর্ডে <strong>Ctrl + P</strong> চাপুন।
                ব্রাউজারের প্রিন্ট ডায়ালগে <strong>Destination</strong> হিসেবে <em>Save as PDF</em> নির্বাচন করলে সাথে সাথে PDF ডাউনলোড হবে।
                ফরমটি নিখুঁতভাবে ১টি A4 পেপারে ফিট করার জন্য অপ্টিমাইজ করা আছে।
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Database Student Search Modal */}
      <StudentSearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStudent={handleSelectStudent}
      />
    </div>
  );
}
