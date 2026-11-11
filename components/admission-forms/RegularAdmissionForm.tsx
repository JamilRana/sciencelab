"use client";

import React from "react";
import { AdmissionFormData, FillMode, ColorTheme } from "./types";
import { Scissors, Award, BookOpen, CheckCircle } from "lucide-react";

interface RegularAdmissionFormProps {
  data: AdmissionFormData;
  fillMode: FillMode;
  theme?: ColorTheme;
  showWatermark?: boolean;
  showDigitalSeal?: boolean;
  showDigitalSignature?: boolean;
}

export function RegularAdmissionForm({
  data,
  fillMode,
  theme = "emerald",
  showWatermark = true,
  showDigitalSeal = true,
  showDigitalSignature = true,
}: RegularAdmissionFormProps) {
  const isBlank = fillMode === "blank";

  // Dynamic theme palette classes
  const themeStyles = {
    emerald: {
      outerBorder: "border-emerald-600",
      innerBorder: "border-emerald-600",
      dashedBorder: "border-emerald-500",
      headerText: "text-emerald-700",
      subtitleText: "text-emerald-800",
      badgeBg: "bg-emerald-100 text-emerald-900 border-emerald-400",
      accentBg: "bg-emerald-50/60",
      sealBorder: "border-emerald-600 text-emerald-700",
      labelColor: "text-emerald-950",
    },
    blue: {
      outerBorder: "border-sky-700",
      innerBorder: "border-sky-700",
      dashedBorder: "border-sky-500",
      headerText: "text-sky-800",
      subtitleText: "text-sky-900",
      badgeBg: "bg-sky-100 text-sky-900 border-sky-400",
      accentBg: "bg-sky-50/60",
      sealBorder: "border-sky-700 text-sky-800",
      labelColor: "text-sky-950",
    },
    monochrome: {
      outerBorder: "border-zinc-800",
      innerBorder: "border-zinc-800",
      dashedBorder: "border-zinc-600",
      headerText: "text-zinc-900",
      subtitleText: "text-zinc-900",
      badgeBg: "bg-zinc-200 text-zinc-950 border-zinc-500",
      accentBg: "bg-zinc-50",
      sealBorder: "border-zinc-800 text-zinc-900",
      labelColor: "text-zinc-950",
    },
  }[theme];

  return (
    <div
      className={`admission-form-print-sheet relative mx-auto bg-white text-zinc-900 font-bengali p-3.5 sm:p-5 w-full max-w-[794px] border border-zinc-300 rounded-lg shadow-md print:shadow-none print:border-none print:p-0 print:max-w-none print:rounded-none select-none`}
      style={{ boxSizing: "border-box" }}
    >
      {/* Background Watermark */}
      {showWatermark && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 opacity-[0.04] print:opacity-[0.035]">
          <div className="flex flex-col items-center select-none rotate-[-15deg]">
            <img src="/logo2.png" alt="watermark" className="w-80 h-auto object-contain" />
            <span className="text-6xl font-black text-emerald-900 tracking-wider mt-4">
              Science Lab
            </span>
            <span className="text-2xl font-bold text-emerald-900 mt-1">
              নিয়মিত শ্রেণি ভর্তি
            </span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between" style={{ minHeight: "278mm" }}>
        
        {/* ============================================================== */}
        {/* TOP HALF: নিয়মিত শ্রেণি ভর্তি ফরম (REGULAR ADMISSION FORM)        */}
        {/* ============================================================== */}
        <section className={`border-[1.5px] ${themeStyles.outerBorder} rounded-lg p-3 bg-white relative flex flex-col justify-between`}>
          
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 border-b pb-2 mb-2 border-zinc-200">
            {/* Left: Circuit Emblem */}
            <div className="w-20 pt-1 shrink-0 flex flex-col items-center justify-center">
              <img
                src="/circuit_emblem.png"
                alt="Emblem"
                className="h-10 w-auto object-contain"
              />
              <span className="text-[9px] font-semibold text-zinc-500 tracking-tighter mt-0.5">
                EST. 2018
              </span>
            </div>

            {/* Center: Logo & Title */}
            <div className="flex-1 flex flex-col items-center text-center px-1">
              <div className="flex items-center justify-center gap-2">
                <img
                  src="/logo2.png"
                  alt="Science Lab Logo"
                  className="h-9 w-auto object-contain"
                />
                <h1 className={`text-2xl font-extrabold tracking-tight ${themeStyles.headerText}`}>
                  Science Lab
                </h1>
              </div>

              {/* Form Title & Subtitle */}
              <h2 className={`text-base font-bold mt-0.5 tracking-wide ${themeStyles.subtitleText}`}>
                {data.formTitle || "নিয়মিত শ্রেণি ভর্তি ফরম (৬ষ্ঠ - ১০ম শ্রেণি)"}
              </h2>

              <p className="text-[10px] text-zinc-500 font-medium">
                {data.campusAddress} • হটলাইন: {data.hotline}
              </p>
            </div>

            {/* Right: Passport Photo Frame */}
            <div className="w-20 shrink-0 flex flex-col items-center">
              <div className="w-[74px] h-[86px] border border-dashed border-zinc-400 rounded bg-zinc-50/70 flex flex-col items-center justify-center p-1 text-center overflow-hidden">
                {!isBlank && data.photoUrl ? (
                  <img
                    src={data.photoUrl}
                    alt="Student Photo"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <>
                    <svg
                      className="w-8 h-8 text-zinc-300 mb-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <span className="text-[8px] font-semibold text-zinc-500 leading-tight">
                      পাসপোর্ট সাইজের ছবি
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields Box */}
          <div className={`border ${themeStyles.innerBorder} rounded-md p-2.5 sm:p-3 bg-white space-y-2`}>
            
            {/* Row 1: ভর্তিচ্ছু শ্রেণি & শিক্ষাবর্ষ */}
            <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm">
              <div className={`col-span-8 border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1 flex items-center gap-2`}>
                <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                  ভর্তিচ্ছু শ্রেণি:
                </span>
                <span className="font-extrabold text-zinc-900">
                  {!isBlank ? data.targetClass : ""}
                </span>
                <span className="text-zinc-400 text-xs ml-auto">
                  (৬ষ্ঠ / ৭ম / ৮ম / ৯ম / ১০ম)
                </span>
              </div>

              <div className={`col-span-4 border border-dashed ${themeStyles.dashedBorder} rounded px-2 py-1 flex items-center justify-between`}>
                <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                  শিক্ষাবর্ষ:
                </span>
                <span className="font-bold text-zinc-800">
                  ২০২৬
                </span>
              </div>
            </div>

            {/* Field: ছাত্র/ছাত্রীর নাম */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span className={`font-bold whitespace-nowrap min-w-[105px] ${themeStyles.labelColor}`}>
                ছাত্র/ছাত্রীর নাম:
              </span>
              <div className={`flex-1 border-b border-dashed ${themeStyles.dashedBorder} px-2 py-0.5 min-h-[26px] flex items-center font-bold text-zinc-900`}>
                {!isBlank && (
                  <span>
                    {data.studentNameBangla}
                    {data.studentNameEnglish && (
                      <span className="text-zinc-600 font-normal ml-2">
                        ({data.studentNameEnglish})
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Row: পিতার নাম & মাতার নাম */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1 flex items-center gap-1.5`}>
                <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                  পিতার নাম:
                </span>
                <span className="font-medium text-zinc-800 truncate">
                  {!isBlank ? data.fatherName : ""}
                </span>
              </div>

              <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1 flex items-center gap-1.5`}>
                <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                  মাতার নাম:
                </span>
                <span className="font-medium text-zinc-800 truncate">
                  {!isBlank ? data.motherName : ""}
                </span>
              </div>
            </div>

            {/* Row: বর্তমান/পূর্ববর্তী স্কুল & বিগত শ্রেণির রোল/GPA */}
            <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm">
              <div className={`col-span-8 border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1 flex items-center gap-1.5`}>
                <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                  বিদ্যালয়:
                </span>
                <span className="font-medium text-zinc-800 truncate">
                  {!isBlank ? data.schoolName : ""}
                </span>
              </div>

              <div className={`col-span-4 border border-dashed ${themeStyles.dashedBorder} rounded px-2 py-1 flex items-center justify-between text-xs`}>
                <span className="font-semibold text-zinc-600">রোল/GPA:</span>
                <span className="font-bold text-zinc-800">
                  {!isBlank ? `${data.schoolRoll || "—"} / ${data.previousGpa || "—"}` : ""}
                </span>
              </div>
            </div>

            {/* Field: ঠিকানা */}
            <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1 flex items-center gap-2 text-xs sm:text-sm`}>
              <span className={`font-bold whitespace-nowrap min-w-[55px] ${themeStyles.labelColor}`}>
                ঠিকানা:
              </span>
              <div className="flex-1 font-medium text-zinc-800 truncate">
                {!isBlank ? data.address : ""}
              </div>
            </div>

            {/* Row: জন্ম তারিখ & ব্যাচ (অফিস কর্তৃক পূরণীয়) */}
            <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm">
              <div className={`col-span-7 border border-dashed ${themeStyles.dashedBorder} rounded px-2 py-1 flex items-center gap-1.5`}>
                <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                  জন্ম তারিখ:
                </span>
                <span className="font-medium text-zinc-800">
                  {!isBlank ? data.dateOfBirth : ""}
                </span>
                {!isBlank && data.bloodGroup && (
                  <span className="ml-auto text-[11px] font-semibold text-zinc-600 bg-zinc-100 px-1.5 py-0.2 rounded">
                    রক্ত: {data.bloodGroup}
                  </span>
                )}
              </div>

              {/* ব্যাচ (অফিস কর্তৃক পূরণীয়) - RED DASHED BOX */}
              <div className="col-span-5 border-2 border-dashed border-red-500 rounded px-2 py-0.5 bg-red-50/40 flex flex-col justify-center">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-red-600 text-xs sm:text-sm">
                    নির্ধারিত ব্যাচ:-
                  </span>
                  <span className="text-[8px] font-bold text-red-500 tracking-tight">
                    [ অফিস পূরণীয় ]
                  </span>
                </div>
                <div className="font-bold text-red-700 text-center text-xs tracking-wider">
                  {!isBlank ? data.batchName : ""}
                </div>
              </div>
            </div>

            {/* Row: অভিভাবকের ফোন & ছাত্র/ছাত্রীর ফোন */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2 py-1 flex items-center gap-1`}>
                <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                  অভিভাবকের ফোন:
                </span>
                <span className="font-medium text-zinc-800 font-mono text-xs">
                  {!isBlank ? data.guardianMobile : ""}
                </span>
              </div>

              <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2 py-1 flex items-center gap-1`}>
                <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                  ছাত্র/ছাত্রীর ফোন:
                </span>
                <span className="font-medium text-zinc-800 font-mono text-xs">
                  {!isBlank ? data.studentMobile : ""}
                </span>
              </div>
            </div>

          </div>

          {/* Form Bottom: Signatures */}
          <div className="mt-4 pt-4 flex items-end justify-between px-3 text-xs text-zinc-700">
            <div className="flex flex-col items-center">
              <div className="w-36 border-b border-zinc-400 border-dashed mb-1" />
              <span className="font-bold text-zinc-800">অভিভাবকের স্বাক্ষর</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-36 border-b border-zinc-400 border-dashed mb-1" />
              <span className="font-bold text-zinc-800">ভর্তি কর্মকর্তার স্বাক্ষর ও তারিখ</span>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* MIDDLE: SCISSORS CUT LINE                                      */}
        {/* ============================================================== */}
        <div className="relative py-2.5 my-1 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-zinc-400" />
          </div>
          <div className="relative bg-white px-3 py-0.5 text-[11px] font-semibold text-zinc-600 flex items-center gap-1.5 border border-zinc-300 rounded-full shadow-2xs">
            <Scissors className="h-3.5 w-3.5 text-zinc-600 -rotate-90" />
            <span>কাটার দাগ (প্রবেশপত্র / শিক্ষার্থী কপি অংশটি কেটে শিক্ষার্থীকে দিন)</span>
            <Scissors className="h-3.5 w-3.5 text-zinc-600 rotate-90" />
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOTTOM HALF: প্রবেশপত্র / শিক্ষার্থী কপি (STUDENT COUNTERFOIL)   */}
        {/* ============================================================== */}
        <section className={`border-[1.5px] ${themeStyles.outerBorder} rounded-lg p-3 bg-white relative flex flex-col justify-between`}>
          
          {/* Centered Top Pill Badge */}
          <div className="flex justify-center -mt-5 mb-1">
            <span className={`px-5 py-0.5 rounded-full text-xs sm:text-sm font-black tracking-wider uppercase border shadow-2xs ${themeStyles.badgeBg}`}>
              প্রবেশপত্র ও শিক্ষার্থী কপি
            </span>
          </div>

          {/* Header Row */}
          <div className="flex items-start justify-between gap-2 border-b pb-2 mb-2 border-zinc-200">
            {/* Left: Circuit Emblem */}
            <div className="w-20 pt-1 shrink-0 flex flex-col items-center justify-center">
              <img
                src="/circuit_emblem.png"
                alt="Emblem"
                className="h-9 w-auto object-contain"
              />
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter mt-0.5">
                STUDENT COPY
              </span>
            </div>

            {/* Center: Logo & Title */}
            <div className="flex-1 flex flex-col items-center text-center px-1">
              <div className="flex items-center justify-center gap-2">
                <img
                  src="/logo2.png"
                  alt="Science Lab Logo"
                  className="h-8 w-auto object-contain"
                />
                <h2 className={`text-xl font-extrabold tracking-tight ${themeStyles.headerText}`}>
                  Science Lab
                </h2>
              </div>
              <h3 className={`text-sm font-bold mt-0.5 ${themeStyles.subtitleText}`}>
                {data.examTitle || "নিয়মিত শ্রেণি ভর্তি কার্যক্রম - ২০২৬"}
              </h3>
              <p className="text-[10px] text-zinc-500 font-medium">
                {data.campusAddress}
              </p>
            </div>

            {/* Right: Candidate Photo Box */}
            <div className="w-20 shrink-0 flex flex-col items-center">
              <div className="w-[74px] h-[82px] border border-dashed border-zinc-400 rounded bg-zinc-50/70 flex flex-col items-center justify-center p-1 text-center overflow-hidden">
                {!isBlank && data.photoUrl ? (
                  <img
                    src={data.photoUrl}
                    alt="Admit Card Photo"
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <>
                    <svg
                      className="w-7 h-7 text-zinc-300 mb-0.5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <span className="text-[8px] font-semibold text-zinc-500 leading-tight">
                      পাসপোর্ট সাইজ
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Admit Card Fields Box */}
          <div className={`border ${themeStyles.innerBorder} rounded-md p-2.5 sm:p-3 bg-white space-y-2`}>
            
            {/* Field: ছাত্র/ছাত্রীর নাম */}
            <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1 flex items-center gap-2 text-xs sm:text-sm`}>
              <span className={`font-bold whitespace-nowrap min-w-[105px] ${themeStyles.labelColor}`}>
                ছাত্র/ছাত্রীর নাম:
              </span>
              <div className="flex-1 font-bold text-zinc-900">
                {!isBlank ? data.studentNameBangla : ""}
              </div>
            </div>

            {/* Row: শ্রেণি ও বিদ্যালয় */}
            <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm">
              <div className={`col-span-4 border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1 flex items-center gap-1.5`}>
                <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                  শ্রেণি:
                </span>
                <span className="font-extrabold text-zinc-900">
                  {!isBlank ? data.targetClass : ""}
                </span>
              </div>

              <div className={`col-span-8 border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1 flex items-center gap-1.5`}>
                <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                  বিদ্যালয়:
                </span>
                <span className="font-medium text-zinc-800 truncate">
                  {!isBlank ? data.schoolName : ""}
                </span>
              </div>
            </div>

            {/* Row: ভর্তি রোল নং & রেজিঃ/আইডি নং (BOTH IN RED DASHED BOXES) */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
              <div className="border-2 border-dashed border-red-500 rounded px-2.5 py-1 bg-red-50/40 flex flex-col justify-center">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-red-600 text-xs sm:text-sm">
                    ভর্তি রোল নং:-
                  </span>
                  <span className="text-[8px] font-bold text-red-500 tracking-tight">
                    [ অফিস পূরণীয় ]
                  </span>
                </div>
                <div className="font-extrabold text-red-700 text-base tracking-wider text-center pt-0.5">
                  {!isBlank ? data.rollNo : ""}
                </div>
              </div>

              <div className="border-2 border-dashed border-red-500 rounded px-2.5 py-1 bg-red-50/40 flex flex-col justify-center">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-red-600 text-xs sm:text-sm">
                    রেজিঃ / আইডি নং:-
                  </span>
                  <span className="text-[8px] font-bold text-red-500 tracking-tight">
                    [ অফিস পূরণীয় ]
                  </span>
                </div>
                <div className="font-extrabold text-red-700 text-base tracking-wider text-center pt-0.5">
                  {!isBlank ? data.registrationNo : ""}
                </div>
              </div>
            </div>

            {/* Instructions / Notice Row */}
            <div className="bg-zinc-50 border border-zinc-200 rounded px-2.5 py-1 text-[11px] text-zinc-700 space-y-0.5">
              <div className="flex items-center justify-between">
                <span><span className="font-bold text-zinc-900">ক্লাস শুরুর সময় ও রুটিন: </span>অফিস নোটিশ বোর্ড বা এসএমএস অনুযায়ী</span>
                <span><span className="font-bold text-zinc-900">স্থান: </span>{data.examVenue}</span>
              </div>
            </div>

          </div>

          {/* Footer: Seals & Signatures */}
          <div className="mt-3 pt-2 flex items-end justify-between px-3 text-xs text-zinc-700">
            {/* Seal Box */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full border border-dashed border-zinc-400 flex flex-col items-center justify-center p-1 text-center text-zinc-400 bg-zinc-50/50">
                {showDigitalSeal ? (
                  <div className={`w-14 h-14 rounded-full border-2 border-emerald-600/70 flex flex-col items-center justify-center text-emerald-700 rotate-[-12deg]`}>
                    <Award className="h-3.5 w-3.5 text-emerald-600 mb-0.5" />
                    <span className="text-[7px] font-extrabold tracking-tighter leading-none">
                      SCIENCE LAB
                    </span>
                    <span className="text-[6px] font-bold uppercase text-emerald-800">
                      OFFICIAL
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] font-bold text-zinc-400 leading-tight">
                    অফিস সিল
                  </span>
                )}
              </div>
              <div className="text-[10px] text-zinc-500 hidden sm:block">
                <p>হটলাইন: {data.hotline}</p>
                <p>www.sciencelab.edu.bd</p>
              </div>
            </div>

            {/* Controller / Director Signature */}
            <div className="flex flex-col items-center">
              {showDigitalSignature ? (
                <div className="mb-0.5 flex flex-col items-center">
                  <span className="font-serif italic font-bold text-indigo-900 text-sm tracking-widest rotate-[-5deg]">
                    Director, SL
                  </span>
                  <div className="w-36 border-b border-zinc-400 mb-1" />
                </div>
              ) : (
                <div className="w-36 border-b border-zinc-400 border-dashed mb-1" />
              )}
              <span className="font-bold text-zinc-800">
                ভর্তি কর্মকর্তা / পরিচালক
              </span>
            </div>
          </div>

          {/* Quick Notice */}
          <div className="mt-2 text-[9px] text-zinc-500 border-t border-zinc-200 pt-1 flex items-center justify-between">
            <span>* এই শিক্ষার্থী কপিটি সংরক্ষণ করুন এবং পরবর্তীতে যেকোনো প্রয়োজনে অফিসে প্রদর্শন করুন।</span>
            <span className="font-semibold text-zinc-600">Science Lab Academic System</span>
          </div>

        </section>

      </div>
    </div>
  );
}
