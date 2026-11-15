"use client";

import React from "react";
import { AdmissionFormData, FillMode, ColorTheme } from "./types";

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

  const cleanMobileNumber = data.hotline.replace(/হটলাইন[:\s]*/gi, "").trim();

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
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between" style={{ minHeight: "278mm" }}>
        
        {/* ============================================================== */}
        {/* FULL PAGE: নিয়মিত শ্রেণি ভর্তি ফরম (REGULAR ADMISSION FORM)        */}
        {/* ============================================================== */}
        <section className={`border-[1.5px] ${themeStyles.outerBorder} rounded-lg p-4 bg-white relative flex flex-col justify-between flex-1`}>
          
          {/* Header Row */}
          <div>
            <div className="flex items-start justify-between gap-2 border-b pb-2 mb-3 border-zinc-200">
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

                {cleanMobileNumber && (
                  <p className="text-sm font-extrabold text-zinc-950 tracking-wider font-mono mt-0.5">
                    {cleanMobileNumber}
                  </p>
                )}
              </div>

              {/* Right: Passport Photo Frame */}
              <div className="w-20 shrink-0 flex flex-col items-center">
                <div className="w-[78px] h-[92px] border border-dashed border-zinc-400 rounded bg-zinc-50/70 flex flex-col items-center justify-center p-1 text-center overflow-hidden">
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
            <div className={`border ${themeStyles.innerBorder} rounded-md p-3 sm:p-3.5 bg-white space-y-2`}>
              
              {/* Row 1: ভর্তিচ্ছু শ্রেণি & শিক্ষাবর্ষ */}
              <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm">
                <div className={`col-span-8 border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1.5 flex items-center gap-2`}>
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

                <div className={`col-span-4 border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1.5 flex items-center justify-between`}>
                  <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                    শিক্ষাবর্ষ:
                  </span>
                  <span className="font-bold text-zinc-800">
                    ২০২৬
                  </span>
                </div>
              </div>

              {/* Field: ছাত্র/ছাত্রীর নাম (বাংলা) */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                <span className={`font-bold whitespace-nowrap min-w-[150px] ${themeStyles.labelColor}`}>
                  ছাত্র/ছাত্রীর নাম (বাংলা):
                </span>
                <div className={`flex-1 border-b border-dashed ${themeStyles.dashedBorder} px-2 py-0.5 min-h-[24px] flex items-center font-bold text-zinc-900`}>
                  {!isBlank ? data.studentNameBangla : ""}
                </div>
              </div>

              {/* Field: ছাত্র/ছাত্রীর নাম (English) */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                <span className={`font-bold whitespace-nowrap min-w-[150px] ${themeStyles.labelColor}`}>
                  Name (English / Block):
                </span>
                <div className={`flex-1 border-b border-dashed ${themeStyles.dashedBorder} px-2 py-0.5 min-h-[24px] flex items-center font-bold tracking-wider text-zinc-900 uppercase`}>
                  {!isBlank ? data.studentNameEnglish : ""}
                </div>
              </div>

              {/* Field: পিতার নাম */}
              <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1.5 flex items-center gap-2 text-xs sm:text-sm`}>
                <span className={`font-bold whitespace-nowrap min-w-[70px] ${themeStyles.labelColor}`}>
                  পিতার নাম:
                </span>
                <span className="font-medium text-zinc-800 truncate">
                  {!isBlank ? data.fatherName : ""}
                </span>
              </div>

              {/* Field: মাতার নাম */}
              <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1.5 flex items-center gap-2 text-xs sm:text-sm`}>
                <span className={`font-bold whitespace-nowrap min-w-[70px] ${themeStyles.labelColor}`}>
                  মাতার নাম:
                </span>
                <span className="font-medium text-zinc-800 truncate">
                  {!isBlank ? data.motherName : ""}
                </span>
              </div>

              {/* Field: বিদ্যালয়ের নাম */}
              <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1.5 flex items-center gap-2 text-xs sm:text-sm`}>
                <span className={`font-bold whitespace-nowrap min-w-[105px] ${themeStyles.labelColor}`}>
                  বিদ্যালয়ের নাম:
                </span>
                <span className="font-medium text-zinc-800 truncate">
                  {!isBlank ? data.schoolName : ""}
                </span>
              </div>

              {/* Field: ঠিকানা (২ লাইন) */}
              <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1.5 space-y-1.5 text-xs sm:text-sm`}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold whitespace-nowrap min-w-[45px] ${themeStyles.labelColor}`}>
                    ঠিকানা:
                  </span>
                  <div className={`flex-1 border-b border-dashed ${themeStyles.dashedBorder} pb-0.5 min-h-[20px] font-medium text-zinc-800`}>
                    {!isBlank ? data.address : ""}
                  </div>
                </div>
                <div className={`w-full border-b border-dashed ${themeStyles.dashedBorder} min-h-[16px]`} />
              </div>

              {/* Row: জন্ম তারিখ, রক্ত & ব্যাচ (অফিস কর্তৃক পূরণীয়) */}
              <div className="grid grid-cols-12 gap-2 text-xs sm:text-sm">
                <div className={`col-span-7 border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1.5 flex items-center gap-1.5`}>
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
                <div className="col-span-5 border-2 border-dashed border-red-500 rounded px-2.5 py-1 bg-red-50/40 flex flex-col justify-center">
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
                <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1.5 flex items-center gap-2`}>
                  <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                    অভিভাবকের ফোন:
                  </span>
                  <span className="font-extrabold text-zinc-950 font-mono text-sm tracking-wider">
                    {!isBlank ? data.guardianMobile : ""}
                  </span>
                </div>

                <div className={`border border-dashed ${themeStyles.dashedBorder} rounded px-2.5 py-1.5 flex items-center gap-2`}>
                  <span className={`font-bold whitespace-nowrap ${themeStyles.labelColor}`}>
                    ছাত্র/ছাত্রীর ফোন:
                  </span>
                  <span className="font-extrabold text-zinc-950 font-mono text-sm tracking-wider">
                    {!isBlank ? data.studentMobile : ""}
                  </span>
                </div>
              </div>

              {/* Office Registration Details */}
              <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm pt-1">
                <div className="border-2 border-dashed border-red-500 rounded px-2.5 py-1 bg-red-50/30 flex flex-col justify-center">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-red-600 text-xs">ভর্তি রোল নং:-</span>
                    <span className="text-[8px] font-bold text-red-500">[অফিস]</span>
                  </div>
                  <div className="font-extrabold text-red-700 text-center text-sm tracking-wider pt-0.5">
                    {!isBlank ? data.rollNo : ""}
                  </div>
                </div>

                <div className="border-2 border-dashed border-red-500 rounded px-2.5 py-1 bg-red-50/30 flex flex-col justify-center">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-red-600 text-xs">রেজিস্ট্রেশন নং:-</span>
                    <span className="text-[8px] font-bold text-red-500">[অফিস]</span>
                  </div>
                  <div className="font-extrabold text-red-700 text-center text-sm tracking-wider pt-0.5">
                    {!isBlank ? data.registrationNo : ""}
                  </div>
                </div>

                <div className="border-2 border-dashed border-red-500 rounded px-2.5 py-1 bg-red-50/30 flex flex-col justify-center">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-red-600 text-xs">ভর্তির তারিখ:-</span>
                    <span className="text-[8px] font-bold text-red-500">[অফিস]</span>
                  </div>
                  <div className="font-bold text-red-700 text-center text-xs tracking-wider pt-0.5">
                    {!isBlank ? new Date().toLocaleDateString("bn-BD") : ""}
                  </div>
                </div>
              </div>

            </div>

            {/* ভর্তির নিয়মাবলী ও অঙ্গীকারনামা */}
            <div className={`mt-3 border border-dashed ${themeStyles.dashedBorder} rounded-md p-2.5 bg-zinc-50/60 text-[11px] text-zinc-700 space-y-1`}>
              <span className="font-bold text-zinc-900 block border-b border-zinc-200 pb-0.5">
                ভর্তির সাধারণ নিয়মাবলী ও শিক্ষার্থীর অঙ্গীকারনামা:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-600">
                <li>ক্লাসে নিয়মিত উপস্থিতি ও কোচিং সেন্টারের সকল নিয়ম-শৃঙ্খলা কঠোরভাবে মেনে চলতে হবে।</li>
                <li>প্রতি মাসের ১০ তারিখের মধ্যে চলতি মাসের নির্ধারিত বেতন পরিশোধ করতে হবে।</li>
                <li>যেকোনো ধরনের অশালীন আচরণ বা শৃঙ্খলা ভঙ্গ প্রতিষ্ঠানের নিয়ম অনুযায়ী শাস্তিযোগ্য অপরাধ।</li>
                <li>আমি অঙ্গীকার করছি যে, উপরে প্রদত্ত সকল তথ্য সত্য ও সঠিক।</li>
              </ul>
            </div>
          </div>

          {/* Form Bottom: Signatures */}
          <div className="mt-6 pt-4 border-t border-zinc-200 flex items-end justify-between px-3 text-xs text-zinc-700">
            <div className="flex flex-col items-center">
              <div className="w-36 border-b border-zinc-400 border-dashed mb-1" />
              <span className="font-bold text-zinc-800">শিক্ষার্থীর স্বাক্ষর</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-36 border-b border-zinc-400 border-dashed mb-1" />
              <span className="font-bold text-zinc-800">অভিভাবকের স্বাক্ষর</span>
            </div>

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
              <span className="font-bold text-zinc-800">ভর্তি কর্মকর্তা / পরিচালক</span>
            </div>
          </div>

        </section>

      </div>
    </div>
  );
}
