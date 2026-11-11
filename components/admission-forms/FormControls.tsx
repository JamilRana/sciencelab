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
import {
  Printer,
  Edit3,
  Search,
  Sparkles,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Check,
  ShieldCheck,
  Droplet,
  Layers,
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User,
} from "lucide-react";

interface FormControlsProps {
  formType: FormType;
  setFormType: (type: FormType) => void;
  fillMode: FillMode;
  setFillMode: (mode: FillMode) => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  showWatermark: boolean;
  setShowWatermark: (val: boolean) => void;
  showDigitalSeal: boolean;
  setShowDigitalSeal: (val: boolean) => void;
  showDigitalSignature: boolean;
  setShowDigitalSignature: (val: boolean) => void;
  formData: AdmissionFormData;
  setFormData: React.Dispatch<React.SetStateAction<AdmissionFormData>>;
  programs: ProgramOption[];
  batches: BatchOption[];
  schools: SchoolOption[];
  onOpenStudentSearch: () => void;
}

export function FormControls({
  formType,
  setFormType,
  fillMode,
  setFillMode,
  colorTheme,
  setColorTheme,
  showWatermark,
  setShowWatermark,
  showDigitalSeal,
  setShowDigitalSeal,
  showDigitalSignature,
  setShowDigitalSignature,
  formData,
  setFormData,
  programs,
  batches,
  schools,
  onOpenStudentSearch,
}: FormControlsProps) {
  const [isEditorExpanded, setIsEditorExpanded] = useState(false);

  const isBlank = fillMode === "blank";

  function updateField<K extends keyof AdmissionFormData>(key: K, value: AdmissionFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        updateField("photoUrl", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleResetBlank() {
    setFillMode("blank");
  }

  function handleFillSample() {
    setFillMode("filled");
    if (formType === "special") {
      setFormData(DEFAULT_SPECIAL_FORM);
    } else {
      setFormData(DEFAULT_REGULAR_FORM);
    }
  }

  return (
    <div className="no-print space-y-4 mb-6">
      
      {/* ============================================================== */}
      {/* MAIN TOP BAR: Form Switcher & Instant Actions                  */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Left: Form Type Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider mr-1 hidden sm:inline">
              ফরম প্রকার:
            </span>
            <div className="bg-zinc-100 p-1 rounded-xl flex items-center gap-1 border border-zinc-200/70">
              <button
                type="button"
                onClick={() => {
                  setFormType("special");
                  if (fillMode === "filled") setFormData(DEFAULT_SPECIAL_FORM);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  formType === "special"
                    ? "bg-white text-emerald-800 shadow-2xs border border-emerald-200"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                বিশেষ ব্যাচ / বৃত্তি পরীক্ষা
              </button>

              <button
                type="button"
                onClick={() => {
                  setFormType("regular");
                  if (fillMode === "filled") setFormData(DEFAULT_REGULAR_FORM);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  formType === "regular"
                    ? "bg-white text-emerald-800 shadow-2xs border border-emerald-200"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
                নিয়মিত শ্রেণি ভর্তি (৬ষ্ঠ - ১০ম)
              </button>
            </div>
          </div>

          {/* Center: Fill Mode Tabs */}
          <div className="flex items-center gap-1.5 self-start lg:self-center">
            <div className="bg-zinc-100 p-1 rounded-xl flex items-center gap-1 border border-zinc-200/70">
              <button
                type="button"
                onClick={() => setFillMode("blank")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isBlank
                    ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                ফাঁকা ফরম (Blank Print)
              </button>

              <button
                type="button"
                onClick={() => setFillMode("filled")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  !isBlank
                    ? "bg-white text-zinc-900 shadow-2xs border border-zinc-200"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                তথ্য পূরণ করুন (Fill Data)
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenStudentSearch}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition"
              title="ডাটাবেসে সংরক্ষিত শিক্ষার্থী থেকে তথ্য আনুন"
            >
              <Search className="h-3.5 w-3.5" />
              <span>ডাটাবেস থেকে আনুন</span>
            </button>
          </div>

          {/* Right: Print / Download PDF Button */}
          <div className="flex items-center gap-2 self-end lg:self-center">
            <button
              type="button"
              onClick={() => setIsEditorExpanded((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition ${
                isEditorExpanded
                  ? "bg-zinc-800 text-white border-zinc-800"
                  : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>ফরম এডিটর ও সেটিংস</span>
              {isEditorExpanded ? (
                <ChevronUp className="h-3.5 w-3.5 ml-0.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
            >
              <Printer className="h-4 w-4" />
              <span>প্রিন্ট / PDF ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Quick Style Options Bar */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Color Themes */}
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-500">কালার থিম:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setColorTheme("emerald")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                  colorTheme === "emerald"
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-zinc-50 text-emerald-800 border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                এমারেল্ড গ্রিন
              </button>

              <button
                type="button"
                onClick={() => setColorTheme("blue")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                  colorTheme === "blue"
                    ? "bg-sky-700 text-white border-sky-700 shadow-2xs"
                    : "bg-zinc-50 text-sky-800 border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                রয়্যাল ব্লু
              </button>

              <button
                type="button"
                onClick={() => setColorTheme("monochrome")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                  colorTheme === "monochrome"
                    ? "bg-zinc-800 text-white border-zinc-800 shadow-2xs"
                    : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                }`}
              >
                ব্ল্যাক অ্যান্ড হোয়াইট (Ink Saver)
              </button>
            </div>
          </div>

          {/* Watermark & Seal Toggles */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-zinc-700 select-none">
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>জলছাপ (Watermark)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-zinc-700 select-none">
              <input
                type="checkbox"
                checked={showDigitalSeal}
                onChange={(e) => setShowDigitalSeal(e.target.checked)}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>অফিস সিল স্ট্যাম্প</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-zinc-700 select-none">
              <input
                type="checkbox"
                checked={showDigitalSignature}
                onChange={(e) => setShowDigitalSignature(e.target.checked)}
                className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>ডিজিটাল স্বাক্ষর</span>
            </label>
          </div>

          {/* Quick presets */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillSample}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline"
            >
              নমুনা তথ্য লোড
            </button>
            <span className="text-zinc-300">|</span>
            <button
              type="button"
              onClick={handleResetBlank}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-800"
            >
              ফাঁকা ফরম রিসেট
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* COLLAPSIBLE FORM EDITOR DRAWER                                 */}
      {/* ============================================================== */}
      {isEditorExpanded && (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200/80 p-5 animate-in slide-in-from-top-2 duration-150 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Edit3 className="h-4 w-4 text-emerald-600" />
              লাইভ ফরম এডিটর (যেকোনো তথ্য সরাসরি পরিবর্তন করুন)
            </h4>
            <span className="text-xs text-zinc-500">
              এখানে পরিবর্তন করলে প্রিভিউ এবং প্রিন্টে সরাসরি আপডেট হবে
            </span>
          </div>

          {/* Row 1: Exam/Form Title & Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                পরীক্ষা / ব্যাচের শিরোনাম
              </label>
              <input
                type="text"
                value={formData.examTitle}
                onChange={(e) => updateField("examTitle", e.target.value)}
                placeholder="যেমন: জুনিয়র বৃত্তি পরীক্ষা ২০২৬"
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {/* Presets */}
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  type="button"
                  onClick={() => updateField("examTitle", "জুনিয়র বৃত্তি পরীক্ষা ২০২৬")}
                  className="text-[10px] text-emerald-700 hover:underline"
                >
                  জুনিয়র বৃত্তি
                </button>
                <span className="text-zinc-300 text-[10px]">•</span>
                <button
                  type="button"
                  onClick={() => updateField("examTitle", "এসএসসি স্পেশাল ব্যাচ ২০২৭")}
                  className="text-[10px] text-emerald-700 hover:underline"
                >
                  এসএসসি স্পেশাল
                </button>
                <span className="text-zinc-300 text-[10px]">•</span>
                <button
                  type="button"
                  onClick={() => updateField("examTitle", "ভর্তি পরীক্ষা ও প্রবেশপত্র ২০২৬")}
                  className="text-[10px] text-emerald-700 hover:underline"
                >
                  ভর্তি পরীক্ষা
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                প্রতিষ্ঠানের ঠিকানা ও ক্যাম্পাস
              </label>
              <input
                type="text"
                value={formData.campusAddress}
                onChange={(e) => updateField("campusAddress", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                অফিসিয়াল হটলাইন
              </label>
              <input
                type="text"
                value={formData.hotline}
                onChange={(e) => updateField("hotline", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 2: Candidate Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-100">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                ছাত্র/ছাত্রীর নাম (বাংলা)
              </label>
              <input
                type="text"
                value={formData.studentNameBangla}
                onChange={(e) => updateField("studentNameBangla", e.target.value)}
                placeholder="যেমন: আব্দুল্লাহ আল নোমান"
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                ছাত্র/ছাত্রীর নাম (English)
              </label>
              <input
                type="text"
                value={formData.studentNameEnglish}
                onChange={(e) => updateField("studentNameEnglish", e.target.value)}
                placeholder="e.g. Abdullah Al Noman"
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                পিতার নাম
              </label>
              <input
                type="text"
                value={formData.fatherName}
                onChange={(e) => updateField("fatherName", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                মাতার নাম
              </label>
              <input
                type="text"
                value={formData.motherName}
                onChange={(e) => updateField("motherName", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 3: School, Class & Address */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                বিদ্যালয়ের নাম
              </label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => updateField("schoolName", e.target.value)}
                list="schools-datalist"
                placeholder="বিদ্যালয়ের নাম লিখুন..."
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <datalist id="schools-datalist">
                {schools.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                ভর্তিচ্ছু / বর্তমান শ্রেণি
              </label>
              <select
                value={formData.targetClass}
                onChange={(e) => updateField("targetClass", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="৬ষ্ঠ শ্রেণি">৬ষ্ঠ শ্রেণি (Class 6)</option>
                <option value="৭ম শ্রেণি">৭ম শ্রেণি (Class 7)</option>
                <option value="৮ম শ্রেণি">৮ম শ্রেণি (Class 8)</option>
                <option value="৯ম শ্রেণি">৯ম শ্রেণি (Class 9)</option>
                <option value="১০ম শ্রেণি">১০ম শ্রেণি (Class 10)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                রক্তের গ্রুপ
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => updateField("bloodGroup", e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="">নির্বাচন করুন</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          {/* Row 4: Phones, DOB, Address */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                অভিভাবকের ফোন
              </label>
              <input
                type="text"
                value={formData.guardianMobile}
                onChange={(e) => updateField("guardianMobile", e.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                ছাত্র/ছাত্রীর ফোন
              </label>
              <input
                type="text"
                value={formData.studentMobile}
                onChange={(e) => updateField("studentMobile", e.target.value)}
                placeholder="019xxxxxxxx"
                className="w-full px-3 py-1.5 text-xs font-mono border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                জন্ম তারিখ
              </label>
              <input
                type="text"
                value={formData.dateOfBirth}
                onChange={(e) => updateField("dateOfBirth", e.target.value)}
                placeholder="১২/০৫/২০১২"
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                ঠিকানা
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="গ্রাম/রোড, থানা, জেলা"
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Row 5: Office Section (ব্যাচ, রোল, রেজি নং, ছবি) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-100">
            <div>
              <label className="block text-xs font-bold text-red-600 mb-1">
                ব্যাচ (অফিস কর্তৃক পূরণীয়)
              </label>
              <input
                type="text"
                value={formData.batchName}
                onChange={(e) => updateField("batchName", e.target.value)}
                list="batches-datalist"
                placeholder="e.g. JSC-2026 / 8A"
                className="w-full px-3 py-1.5 text-xs font-bold text-red-700 border border-red-300 bg-red-50/30 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <datalist id="batches-datalist">
                {programs.map((p) => (
                  <option key={`p-${p.id}`} value={p.code} />
                ))}
                {batches.map((b) => (
                  <option key={`b-${b.id}`} value={b.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-xs font-bold text-red-600 mb-1">
                রোল নং (অফিস পূরণীয়)
              </label>
              <input
                type="text"
                value={formData.rollNo}
                onChange={(e) => updateField("rollNo", e.target.value)}
                placeholder="যেমন: ৮১০১"
                className="w-full px-3 py-1.5 text-xs font-bold text-red-700 border border-red-300 bg-red-50/30 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-red-600 mb-1">
                রেজিঃ নং (অফিস পূরণীয়)
              </label>
              <input
                type="text"
                value={formData.registrationNo}
                onChange={(e) => updateField("registrationNo", e.target.value)}
                placeholder="SL-2026-8015"
                className="w-full px-3 py-1.5 text-xs font-bold text-red-700 border border-red-300 bg-red-50/30 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                শিক্ষার্থীর ছবি আপলোড
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg text-xs font-medium text-zinc-700 transition">
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>{formData.photoUrl ? "ছবি পরিবর্তন" : "ছবি নির্বাচন"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {formData.photoUrl && (
                  <button
                    type="button"
                    onClick={() => updateField("photoUrl", "")}
                    className="text-[10px] text-red-600 hover:underline"
                  >
                    ছবি মুছুন
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Row 6: Exam Schedule Details (For Admit Card) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-zinc-100">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                পরীক্ষার তারিখ
              </label>
              <input
                type="text"
                value={formData.examDate}
                onChange={(e) => updateField("examDate", e.target.value)}
                placeholder="যেমন: ২৫ ডিসেম্বর ২০২৬ (শুক্রবার)"
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                পরীক্ষার সময়
              </label>
              <input
                type="text"
                value={formData.examTime}
                onChange={(e) => updateField("examTime", e.target.value)}
                placeholder="সকাল ১০:০০ টা - ১১:৩০ টা"
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">
                পরীক্ষার স্থান / কেন্দ্র
              </label>
              <input
                type="text"
                value={formData.examVenue}
                onChange={(e) => updateField("examVenue", e.target.value)}
                placeholder="সায়েন্স ল্যাব প্রধান ভবন"
                className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
