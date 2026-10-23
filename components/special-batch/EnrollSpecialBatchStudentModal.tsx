"use client";

import { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  Search,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  School as SchoolIcon,
  Phone,
  CreditCard,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  getSpecialBatchEnrollmentInfoAction,
  searchExistingStudentsForEnrollmentAction,
  enrollExistingStudentInSpecialBatchAction,
  enrollNewStudentInSpecialBatchAction,
} from "@/app/actions/special-enrollment";

interface EnrollSpecialBatchStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId: number;
  batchName?: string;
  onEnrolled?: () => void;
}

export function EnrollSpecialBatchStudentModal({
  isOpen,
  onClose,
  batchId,
  batchName,
  onEnrolled,
}: EnrollSpecialBatchStudentModalProps) {
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Batch / Program Meta
  const [batchMeta, setBatchMeta] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [optionalSubjects, setOptionalSubjects] = useState<any[]>([]);

  // Tab 1: Existing Student State
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [existingAgreedFee, setExistingAgreedFee] = useState("");
  const [existingFeeNote, setExistingFeeNote] = useState("");
  const [existingOptionalSubjectId, setExistingOptionalSubjectId] = useState<string>("");

  // Tab 2: New Student State
  const [newName, setNewName] = useState("");
  const [newFatherName, setNewFatherName] = useState("");
  const [newMotherName, setNewMotherName] = useState("");
  const [newMobile, setNewMobile] = useState("");
  const [newHomeMobile, setNewHomeMobile] = useState("");
  const [newGender, setNewGender] = useState<"Male" | "Female">("Male");
  const [newSchoolId, setNewSchoolId] = useState<string>("");
  const [newAddress, setNewAddress] = useState("");
  const [newDob, setNewDob] = useState("");
  const [newAgreedFee, setNewAgreedFee] = useState("");
  const [newFeeNote, setNewFeeNote] = useState("");
  const [newOptionalSubjectId, setNewOptionalSubjectId] = useState<string>("");

  const [formError, setFormError] = useState("");

  // Load batch enrollment metadata when modal opens
  useEffect(() => {
    if (!isOpen || !batchId) return;

    setLoadingInfo(true);
    setFormError("");
    getSpecialBatchEnrollmentInfoAction(batchId)
      .then((res) => {
        if (res.success && res.data) {
          setBatchMeta(res.data);
          setSchools(res.data.schools || []);
          setOptionalSubjects(res.data.program?.subjects || []);
          if (res.data.schools?.length > 0) {
            setNewSchoolId(String(res.data.schools[0].id));
          }
          if (res.data.batch?.name?.toLowerCase().includes("girls")) {
            setNewGender("Female");
          } else if (res.data.batch?.name?.toLowerCase().includes("boys")) {
            setNewGender("Male");
          }
        } else {
          toast.error(res.error || "Failed to load batch info");
        }
      })
      .finally(() => setLoadingInfo(false));
  }, [isOpen, batchId]);

  // Live search debounced
  useEffect(() => {
    if (tab !== "existing" || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setSearching(true);
      searchExistingStudentsForEnrollmentAction(searchQuery, batchId)
        .then((res) => {
          if (res.success && res.data) {
            setSearchResults(res.data);
          }
        })
        .finally(() => setSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, batchId, tab]);

  if (!isOpen) return null;

  const handleEnrollExisting = async () => {
    if (!selectedStudent) {
      setFormError("Please select a student from search results");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const res = await enrollExistingStudentInSpecialBatchAction({
        studentId: selectedStudent.id,
        targetBatchId: batchId,
        agreedFee: existingAgreedFee ? parseFloat(existingAgreedFee) : undefined,
        feeNote: existingFeeNote.trim() || undefined,
        optionalSubjectId: existingOptionalSubjectId ? parseInt(existingOptionalSubjectId) : undefined,
      });

      if (res.success) {
        toast.success(res.message || "Student enrolled successfully!");
        onEnrolled?.();
        onClose();
      } else {
        setFormError(res.error || "Failed to enroll student");
        toast.error(res.error || "Enrollment failed");
      }
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnrollNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newFatherName.trim() || !newMobile.trim() || !newSchoolId) {
      setFormError("Please fill in all required fields (Name, Father's Name, Mobile, School).");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const res = await enrollNewStudentInSpecialBatchAction({
        targetBatchId: batchId,
        name: newName.trim(),
        fatherName: newFatherName.trim(),
        motherName: newMotherName.trim() || "N/A",
        mobile: newMobile.trim(),
        homeMobile: newHomeMobile.trim() || undefined,
        gender: newGender,
        schoolId: parseInt(newSchoolId),
        address: newAddress.trim() || "Trishal, Mymensingh",
        dob: newDob || undefined,
        agreedFee: newAgreedFee ? parseFloat(newAgreedFee) : undefined,
        feeNote: newFeeNote.trim() || undefined,
        optionalSubjectId: newOptionalSubjectId ? parseInt(newOptionalSubjectId) : undefined,
      });

      if (res.success) {
        toast.success(res.message || "New student enrolled successfully!");
        onEnrolled?.();
        onClose();
      } else {
        setFormError(res.error || "Failed to enroll student");
        toast.error(res.error || "Enrollment failed");
      }
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/75">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                Enroll Student in Special Batch
              </h2>
              <p className="text-xs text-zinc-500">
                {batchName || batchMeta?.batch?.name || "Special Batch"} · Next Roll:{" "}
                <span className="font-mono font-bold text-indigo-700">
                  #{batchMeta?.displayRoll || "..."}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 p-1.5 bg-zinc-100/80 mx-6 mt-4 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab("existing");
              setFormError("");
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              tab === "existing"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Enroll Existing Student</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("new");
              setFormError("");
            }}
            className={`py-2 rounded-lg flex items-center justify-center gap-2 transition ${
              tab === "new"
                ? "bg-white text-indigo-700 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Enroll New Student</span>
          </button>
        </div>

        {/* Error Feedback */}
        {formError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Body Content */}
        {loadingInfo ? (
          <div className="py-16 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Loading batch details...</span>
          </div>
        ) : tab === "existing" ? (
          /* TAB 1: Existing Student Enrollment */
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                Search Regular or Registered Students
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Type student name, roll number, or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  autoFocus
                />
                {searching && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 absolute right-3 top-3" />
                )}
              </div>
            </div>

            {/* Search Results Dropdown / List */}
            {searchResults.length > 0 && !selectedStudent && (
              <div className="max-h-56 overflow-y-auto border border-zinc-200 rounded-xl divide-y divide-zinc-100 bg-zinc-50/50">
                {searchResults.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    disabled={st.isAlreadyInTargetBatch}
                    onClick={() => {
                      setSelectedStudent(st);
                      setSearchResults([]);
                      setFormError("");
                    }}
                    className={`w-full text-left p-3 hover:bg-indigo-50/60 transition flex items-center justify-between text-xs ${
                      st.isAlreadyInTargetBatch ? "opacity-50 cursor-not-allowed bg-zinc-100/50" : ""
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900">{st.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-200 text-zinc-700 font-mono">
                          Class {st.class} · {st.batchName}
                        </span>
                        {st.isAlreadyInTargetBatch && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-semibold">
                            Already in Batch
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span>Roll: {st.displayRoll}</span>
                        <span>•</span>
                        <span>{st.mobile}</span>
                        <span>•</span>
                        <span>{st.schoolName}</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-indigo-600">Select →</span>
                  </button>
                ))}
              </div>
            )}

            {/* Selected Student Card */}
            {selectedStudent && (
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-zinc-900">
                      Selected: {selectedStudent.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedStudent(null)}
                    className="text-xs text-indigo-700 hover:underline font-semibold"
                  >
                    Change Student
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-zinc-600 bg-white p-3 rounded-lg border border-indigo-100">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Class & Batch</span>
                    <span className="font-semibold text-zinc-800">
                      Class {selectedStudent.class} ({selectedStudent.batchName})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Contact</span>
                    <span className="font-semibold text-zinc-800">
                      {selectedStudent.mobile}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">School</span>
                    <span className="font-semibold text-zinc-800 truncate block">
                      {selectedStudent.schoolName}
                    </span>
                  </div>
                </div>

                {/* Additional Special Batch Enrollment Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      Agreed Course Fee (Optional, ৳)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 5000"
                      value={existingAgreedFee}
                      onChange={(e) => setExistingAgreedFee(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">
                      4th / Optional Subject
                    </label>
                    <select
                      value={existingOptionalSubjectId}
                      onChange={(e) => setExistingOptionalSubjectId(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                    >
                      <option value="">None / Compulsory Only</option>
                      {optionalSubjects.map((sub: any) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} {sub.isOptional ? "(Optional)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">
                    Special Fee Note / Agreement Note
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Installments agreed (2500 + 2500)"
                    value={existingFeeNote}
                    onChange={(e) => setExistingFeeNote(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedStudent || submitting}
                onClick={handleEnrollExisting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Confirm Enrollment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* TAB 2: New Student Full Registration Form */
          <form onSubmit={handleEnrollNew} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MD. Tanvir Hasan"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value as "Male" | "Female")}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="Male">Male (Boy)</option>
                  <option value="Female">Female (Girl)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 017xxxxxxxx"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Home / Guardian Mobile
                </label>
                <input
                  type="tel"
                  placeholder="Optional secondary contact"
                  value={newHomeMobile}
                  onChange={(e) => setNewHomeMobile(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Father&apos;s Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Father's full name"
                  value={newFatherName}
                  onChange={(e) => setNewFatherName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Mother&apos;s Name
                </label>
                <input
                  type="text"
                  placeholder="Mother's full name"
                  value={newMotherName}
                  onChange={(e) => setNewMotherName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Feeder School <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  value={newSchoolId}
                  onChange={setNewSchoolId}
                  options={schools.map((sch) => ({
                    value: String(sch.id),
                    label: sch.name,
                  }))}
                  placeholder="Select regular school..."
                  searchPlaceholder="Search school..."
                  size="sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  4th / Optional Subject
                </label>
                <select
                  value={newOptionalSubjectId}
                  onChange={(e) => setNewOptionalSubjectId(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">None / Compulsory Only</option>
                  {optionalSubjects.map((sub: any) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} {sub.isOptional ? "(Optional)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Agreed Course Fee (৳)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 6000"
                  value={newAgreedFee}
                  onChange={(e) => setNewAgreedFee(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Fee Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid in 2 installments"
                  value={newFeeNote}
                  onChange={(e) => setNewFeeNote(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Present Address
              </label>
              <input
                type="text"
                placeholder="Village / Road, Thana / Upazila, District"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register & Enroll</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
