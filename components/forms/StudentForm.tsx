"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  User, 
  Users, 
  GraduationCap, 
  Layers, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Sparkles, 
  KeyRound, 
  AlertCircle,
  Building,
  Hash,
  School as SchoolIcon
} from "lucide-react";
import { getNextRollForBatchAction } from "@/app/actions/students";
import { generateDisplayRoll } from "@/lib/roll";

const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  fatherName: z.string().min(2, "Father's name is required"),
  motherName: z.string().min(2, "Mother's name is required"),
  mobile: z.string().min(11, "Mobile number must be at least 11 digits"),
  homeMobile: z.string().optional(),
  address: z.string().min(3, "Address is required"),
  gender: z.string().min(1, "Please select gender"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  dob: z.string().optional(),
  class: z.string().min(1, "Please select class"),
  schoolId: z.string().min(1, "Please select school"),
  batchId: z.string().min(1, "Please select batch"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  initialData?: any;
  onSubmit: (data: StudentFormValues) => void;
  isLoading?: boolean;
  schools: { id: number; name: string }[];
  batches: { id: number; name: string; code?: number; classId?: string }[];
  onCancel?: () => void;
}

const STEPS = [
  { id: 1, name: "Student Details", description: "Personal & contact", icon: User },
  { id: 2, name: "Guardian & School", description: "Parents & feeder", icon: Users },
  { id: 3, name: "Batch Assignment", description: "Batch & display roll", icon: Layers },
];

export function StudentForm({
  initialData,
  onSubmit,
  isLoading = false,
  schools,
  batches,
  onCancel,
}: StudentFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [nextRollInfo, setNextRollInfo] = useState<{
    nextRoll: number;
    batchCode: number;
    displayRoll: number;
    batchName: string;
  } | null>(null);
  const [isRollLoading, setIsRollLoading] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      fatherName: "",
      motherName: "",
      mobile: "",
      homeMobile: "",
      address: "",
      gender: "Male",
      email: "",
      class: "Six",
      ...initialData,
      schoolId: initialData?.schoolId?.toString() || "",
      batchId: initialData?.batchId?.toString() || "",
      dob: initialData?.dob ? new Date(initialData.dob).toISOString().split("T")[0] : "",
    },
  });

  const selectedClass = watch("class");
  const selectedBatchId = watch("batchId");
  const studentName = watch("name");
  const studentMobile = watch("mobile");
  const studentFather = watch("fatherName");
  const selectedSchoolId = watch("schoolId");

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        schoolId: initialData.schoolId?.toString() || "",
        batchId: initialData.batchId?.toString() || "",
        dob: initialData.dob ? new Date(initialData.dob).toISOString().split("T")[0] : "",
      });
    }
  }, [initialData, reset]);

  // Live fetch next roll when batchId changes
  useEffect(() => {
    if (!selectedBatchId) {
      setNextRollInfo(null);
      return;
    }

    const batchIdNum = parseInt(selectedBatchId);
    if (isNaN(batchIdNum)) return;

    // If editing existing student and same batch, use existing roll
    if (initialData?.batchId === batchIdNum && initialData?.roll) {
      const matchBatch = batches.find((b) => b.id === batchIdNum);
      const bCode = matchBatch?.code || 0;
      setNextRollInfo({
        nextRoll: initialData.roll,
        batchCode: bCode,
        displayRoll: bCode * 100 + initialData.roll,
        batchName: matchBatch?.name || "",
      });
      return;
    }

    let isMounted = true;
    setIsRollLoading(true);

    getNextRollForBatchAction(batchIdNum)
      .then((res) => {
        if (isMounted && res.success && res.nextRoll !== undefined) {
          setNextRollInfo({
            nextRoll: res.nextRoll,
            batchCode: res.batchCode ?? 0,
            displayRoll: res.displayRoll ?? 0,
            batchName: res.batchName ?? "",
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch roll preview:", err);
      })
      .finally(() => {
        if (isMounted) setIsRollLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatchId, initialData, batches]);

  // Filter batches by class if matching class exists
  const filteredBatches = batches.filter((b) => {
    if (!selectedClass) return true;
    if (!b.classId) return true;
    return b.classId.toLowerCase() === selectedClass.toLowerCase();
  });

  const displayBatches = filteredBatches.length > 0 ? filteredBatches : batches;

  // Step 1 validation
  const validateStep1 = async (): Promise<boolean> => {
    return await trigger(["name", "gender", "mobile", "address", "dob", "email"]);
  };

  // Step 2 validation
  const validateStep2 = async (): Promise<boolean> => {
    return await trigger(["fatherName", "motherName", "schoolId", "class", "homeMobile"]);
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      const valid = await validateStep1();
      if (valid) setCurrentStep(2);
    } else if (currentStep === 2) {
      const valid = await validateStep2();
      if (valid) setCurrentStep(3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const selectedSchoolObj = schools.find((s) => s.id.toString() === selectedSchoolId);

  return (
    <div className="space-y-6">
      {/* 3-Step Wizard Navigation Bar */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isActive = currentStep === step.id;

            return (
              <button
                type="button"
                key={step.id}
                onClick={async () => {
                  if (step.id < currentStep) {
                    setCurrentStep(step.id);
                  } else if (step.id === 2 && currentStep === 1) {
                    if (await validateStep1()) setCurrentStep(2);
                  } else if (step.id === 3 && currentStep === 2) {
                    if (await validateStep2()) setCurrentStep(3);
                  }
                }}
                className={`relative flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                  isActive
                    ? "bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-500/20"
                    : isCompleted
                    ? "bg-zinc-50 border-zinc-200 hover:bg-zinc-100/70"
                    : "bg-white border-zinc-100 opacity-60"
                }`}
              >
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-200 text-zinc-600"
                  }`}
                >
                  {isCompleted ? <Check className="h-4 w-4 stroke-[3]" /> : step.id}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p
                    className={`text-xs font-semibold truncate ${
                      isActive ? "text-indigo-950" : "text-zinc-700"
                    }`}
                  >
                    {step.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">{step.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* STEP 1: Student Details */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div className="border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">Step 1: Student Personal Information</h3>
              <p className="text-xs text-zinc-500">Provide official name, contact, and residential address.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-zinc-700 flex items-center justify-between">
                  <span>Student Full Name *</span>
                  <span className="text-[11px] text-zinc-400">As per school certificate</span>
                </label>
                <input
                  {...register("name")}
                  className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="e.g. Tanvir Hasan"
                />
                {errors.name && <p className="text-[11px] text-rose-500">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Gender *</label>
                <select
                  {...register("gender")}
                  className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-[11px] text-rose-500">{errors.gender.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Date of Birth</label>
                <input
                  type="date"
                  {...register("dob")}
                  className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Student Mobile *</label>
                <input
                  {...register("mobile")}
                  className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none tabular-nums transition-all"
                  placeholder="017XXXXXXXX"
                />
                {errors.mobile && <p className="text-[11px] text-rose-500">{errors.mobile.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Email Address (Optional)</label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="student@example.com"
                />
                {errors.email && <p className="text-[11px] text-rose-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-zinc-700">Residential Address *</label>
                <textarea
                  {...register("address")}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none resize-none transition-all"
                  placeholder="House, Road, Area, Thana/District"
                />
                {errors.address && <p className="text-[11px] text-rose-500">{errors.address.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Guardian & School */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div className="border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">Step 2: Guardian & Feeder School</h3>
              <p className="text-xs text-zinc-500">Record parents' names, secondary contact, and academic background.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Father's Name *</label>
                <input
                  {...register("fatherName")}
                  className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="Father's full name"
                />
                {errors.fatherName && <p className="text-[11px] text-rose-500">{errors.fatherName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Mother's Name *</label>
                <input
                  {...register("motherName")}
                  className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                  placeholder="Mother's full name"
                />
                {errors.motherName && <p className="text-[11px] text-rose-500">{errors.motherName.message}</p>}
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-zinc-700">Home / Guardian Mobile (Optional)</label>
                <input
                  {...register("homeMobile")}
                  className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none tabular-nums transition-all"
                  placeholder="Emergency or parent contact"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Academic Class *</label>
                <select
                  {...register("class")}
                  className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                >
                  <option value="Six">Class Six</option>
                  <option value="Seven">Class Seven</option>
                  <option value="Eight">Class Eight</option>
                  <option value="Nine">Class Nine</option>
                  <option value="Ten">Class Ten</option>
                  <option value="SSC">SSC Candidate</option>
                </select>
                {errors.class && <p className="text-[11px] text-rose-500">{errors.class.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700">Feeder School *</label>
                <select
                  {...register("schoolId")}
                  className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
                >
                  <option value="">Select regular school...</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                {errors.schoolId && <p className="text-[11px] text-rose-500">{errors.schoolId.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Batch Assignment & Live Display-Roll Preview */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in-50 duration-150">
            <div className="border-b border-zinc-100 pb-2">
              <h3 className="text-sm font-semibold text-zinc-900">Step 3: Batch Assignment & Credentials</h3>
              <p className="text-xs text-zinc-500">Assign the batch and verify the auto-generated display roll and login.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 flex items-center justify-between">
                <span>Select Target Batch *</span>
                <span className="text-[11px] text-zinc-400">
                  Showing batches for {selectedClass || "All Classes"}
                </span>
              </label>
              <select
                {...register("batchId")}
                className="w-full h-9 px-3 bg-zinc-50/50 border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all"
              >
                <option value="">Select a batch...</option>
                {displayBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} {batch.code ? `(Code: ${batch.code})` : ""}
                  </option>
                ))}
              </select>
              {errors.batchId && <p className="text-[11px] text-rose-500">{errors.batchId.message}</p>}
            </div>

            {/* LIVE DISPLAY-ROLL PREVIEW CARD */}
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-zinc-50/50 p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900">Live Display-Roll Preview</h4>
                    <p className="text-[11px] text-zinc-500">Calculated formula: Batch Code × 100 + Roll</p>
                  </div>
                </div>
                {isRollLoading && (
                  <span className="text-[11px] text-indigo-600 animate-pulse font-medium">
                    Calculating next roll...
                  </span>
                )}
              </div>

              {nextRollInfo ? (
                <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-lg border border-indigo-100/80">
                  <div className="text-center border-r border-zinc-100 pr-2">
                    <p className="text-[10px] uppercase font-semibold text-zinc-400">Batch Code</p>
                    <p className="text-sm font-bold text-zinc-800 tabular-nums">{nextRollInfo.batchCode || "--"}</p>
                  </div>
                  <div className="text-center border-r border-zinc-100 pr-2">
                    <p className="text-[10px] uppercase font-semibold text-zinc-400">Roll Serial</p>
                    <p className="text-sm font-bold text-zinc-800 tabular-nums">
                      {String(nextRollInfo.nextRoll).padStart(2, "0")}
                    </p>
                  </div>
                  <div className="text-center bg-indigo-50/60 rounded-md py-0.5">
                    <p className="text-[10px] uppercase font-bold text-indigo-700">Display Roll</p>
                    <p className="text-lg font-black text-indigo-600 tabular-nums tracking-tight">
                      {nextRollInfo.displayRoll}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-zinc-50 border border-dashed border-zinc-200 rounded-lg text-center text-xs text-zinc-400">
                  Select a batch above to generate and preview the student display roll
                </div>
              )}

              {/* Login Credentials Preview */}
              <div className="mt-3.5 pt-3 border-t border-indigo-50/80 flex items-start gap-2 text-xs">
                <KeyRound className="h-4 w-4 text-zinc-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-zinc-600 space-y-0.5">
                  <p className="font-medium text-zinc-800">Automatic Login Credentials:</p>
                  <p className="text-zinc-500">
                    Username: <span className="font-mono text-indigo-700 font-semibold">stu{studentName ? studentName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) : "name"}###</span>
                    {" "}· Default password: <span className="font-mono text-zinc-700 font-semibold">Sl@bcc2015</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Admission Summary Strip */}
            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1.5">
              <p className="font-semibold text-zinc-800 text-[11px] uppercase tracking-wider">Admission Summary Review</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-zinc-600 text-[11px]">
                <div><span className="text-zinc-400">Name:</span> <span className="font-medium text-zinc-900">{studentName || "--"}</span></div>
                <div><span className="text-zinc-400">Mobile:</span> <span className="font-medium tabular-nums text-zinc-900">{studentMobile || "--"}</span></div>
                <div><span className="text-zinc-400">Father:</span> <span className="font-medium text-zinc-900">{studentFather || "--"}</span></div>
                <div><span className="text-zinc-400">Class:</span> <span className="font-medium text-zinc-900">{selectedClass || "--"}</span></div>
                <div className="col-span-2 truncate"><span className="text-zinc-400">Feeder School:</span> <span className="font-medium text-zinc-900">{selectedSchoolObj?.name || "--"}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls Footer */}
        <div className="pt-4 border-t border-zinc-200 flex items-center justify-between gap-3">
          <div>
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors focus-ring"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>
            ) : onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
              >
                Cancel
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors focus-ring"
              >
                <span>Continue to {currentStep === 1 ? "Guardian Info" : "Batch Assignment"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isLoading || isRollLoading}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 rounded-lg shadow-sm transition-all focus-ring"
              >
                {isLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Admission...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 stroke-[2.5]" />
                    <span>{initialData ? "Save Changes" : "Confirm & Admit Student"}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
