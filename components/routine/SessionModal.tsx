"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SubjectSelect } from "@/components/ui/SubjectSelect";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  AlertTriangle,
  Clock,
  User,
  GraduationCap,
  DoorOpen,
  DollarSign,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  createSessionAction,
  updateSessionAction,
  checkSessionConflictsAction,
} from "@/app/actions/routine";
import { ConflictWarning } from "@/lib/sessions";

interface SessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialDate: string; // YYYY-MM-DD
  mode?: "create" | "edit";
  sessionData?: any;
  metadata: {
    teachers: Array<{ id: number; name: string; mobile: string; perClass: number }>;
    batches: Array<{ id: number; name: string; code: number; classId: string; programId?: number | null }>;
    programs: Array<{ id: number; name: string; code: string; subjects: Array<{ id: number; name: string; code?: string | null }> }>;
    exams: Array<{ id: number; class: string; type: string; month: string }>;
    specialExams: Array<{ id: number; title: string; kind: string; batchId?: number | null; programId?: number | null }>;
  };
}

export function SessionModal({
  isOpen,
  onClose,
  onSuccess,
  initialDate,
  mode = "create",
  sessionData,
  metadata,
}: SessionModalProps) {
  const [kind, setKind] = useState<"CLASS" | "EXAM_DUTY" | "EXTRA">("CLASS");
  const [teacherId, setTeacherId] = useState<string>("");
  const [batchId, setBatchId] = useState<string>("");
  const [subjectName, setSubjectName] = useState<string>("");
  const [lectureLabel, setLectureLabel] = useState<string>("");
  const [date, setDate] = useState<string>(initialDate);
  const [startTime, setStartTime] = useState<string>("16:00");
  const [endTime, setEndTime] = useState<string>("17:00");
  const [room, setRoom] = useState<string>("");
  const [examId, setExamId] = useState<string>("");
  const [specialExamId, setSpecialExamId] = useState<string>("");
  const [payAmount, setPayAmount] = useState<string>("");
  const [changeReason, setChangeReason] = useState<string>("");

  const [warnings, setWarnings] = useState<ConflictWarning[]>([]);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentBatch = metadata.batches.find((b) => String(b.id) === batchId);
  const currentProgram = currentBatch?.programId
    ? metadata.programs.find((p) => p.id === currentBatch.programId)
    : null;
  const programSubjects = currentProgram?.subjects?.map((s) => s.name) || [];

  useEffect(() => {
    if (sessionData && mode === "edit") {
      setKind(sessionData.kind || "CLASS");
      setTeacherId(String(sessionData.teacherId || ""));
      setBatchId(sessionData.batchId ? String(sessionData.batchId) : "");
      setSubjectName(sessionData.subjectName || "");
      setLectureLabel(sessionData.lectureLabel || "");
      setDate(
        typeof sessionData.date === "string"
          ? sessionData.date.slice(0, 10)
          : initialDate
      );
      setStartTime(sessionData.startTime || "16:00");
      setEndTime(sessionData.endTime || "");
      setRoom(sessionData.room || "");
      setExamId(sessionData.examId ? String(sessionData.examId) : "");
      setSpecialExamId(sessionData.specialExamId ? String(sessionData.specialExamId) : "");
      setPayAmount(sessionData.payAmount ? String(sessionData.payAmount) : "");
      setChangeReason("");
    } else {
      setKind("CLASS");
      setTeacherId(metadata.teachers[0]?.id ? String(metadata.teachers[0].id) : "");
      setBatchId(metadata.batches[0]?.id ? String(metadata.batches[0].id) : "");
      setSubjectName("");
      setLectureLabel("");
      setDate(initialDate);
      setStartTime("16:00");
      setEndTime("17:00");
      setRoom("");
      setExamId("");
      setSpecialExamId("");
      setPayAmount("");
      setChangeReason("");
    }
    setWarnings([]);
  }, [isOpen, sessionData, mode, initialDate, metadata]);

  // Live conflict checking when schedule parameters change
  useEffect(() => {
    if (!teacherId || !startTime || !date) {
      setWarnings([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCheckingConflicts(true);
      try {
        const res = await checkSessionConflictsAction({
          teacherId: parseInt(teacherId, 10),
          batchId: batchId ? parseInt(batchId, 10) : null,
          room: room.trim() || null,
          date,
          startTime,
          endTime: endTime.trim() || null,
          excludeSessionId: mode === "edit" && sessionData?.id ? sessionData.id : undefined,
        });

        if (res.success && res.data) {
          setWarnings(res.data.warnings);
        }
      } catch (err) {
        console.warn("Failed conflict check:", err);
      } finally {
        setIsCheckingConflicts(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [teacherId, batchId, room, date, startTime, endTime, mode, sessionData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherId) {
      toast.error("Please select a teacher");
      return;
    }
    if (kind !== "EXAM_DUTY" && !batchId) {
      toast.error("Please select a batch for this class");
      return;
    }
    if (kind !== "EXAM_DUTY" && !subjectName.trim()) {
      toast.error("Please provide a subject name");
      return;
    }
    if (!startTime) {
      toast.error("Please provide a start time");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "create") {
        const res = await createSessionAction({
          kind,
          teacherId: parseInt(teacherId, 10),
          batchId: batchId ? parseInt(batchId, 10) : null,
          subjectName: kind === "EXAM_DUTY" ? (subjectName || "Exam Invigilation") : subjectName.trim(),
          lectureLabel: lectureLabel.trim() || null,
          date,
          startTime,
          endTime: endTime.trim() || null,
          room: room.trim() || null,
          examId: examId ? parseInt(examId, 10) : null,
          specialExamId: specialExamId ? parseInt(specialExamId, 10) : null,
          payAmount: payAmount ? parseFloat(payAmount) : null,
        });

        if (res.success) {
          toast.success("Session scheduled successfully");
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || "Failed to schedule session");
        }
      } else {
        // Edit mode
        const res = await updateSessionAction(
          sessionData.id,
          {
            kind,
            teacherId: parseInt(teacherId, 10),
            batchId: batchId ? parseInt(batchId, 10) : null,
            subjectName: subjectName.trim(),
            lectureLabel: lectureLabel.trim() || null,
            date,
            startTime,
            endTime: endTime.trim() || null,
            room: room.trim() || null,
            examId: examId ? parseInt(examId, 10) : null,
            specialExamId: specialExamId ? parseInt(specialExamId, 10) : null,
            payAmount: payAmount ? parseFloat(payAmount) : null,
          },
          changeReason.trim() || undefined
        );

        if (res.success) {
          toast.success("Session updated successfully");
          onSuccess();
          onClose();
        } else {
          toast.error(res.error || "Failed to update session");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              {mode === "create" ? "Schedule New Session" : "Edit Class Session"}
            </DialogTitle>
            <Badge variant="outline" className="text-xs font-mono">
              {date}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Kind Selector Tabs */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1.5">Session Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setKind("CLASS")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  kind === "CLASS"
                    ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                Regular Class
              </button>
              <button
                type="button"
                onClick={() => setKind("EXTRA")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  kind === "EXTRA"
                    ? "bg-purple-50 border-purple-500 text-purple-700 shadow-xs"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                Extra Class
              </button>
              <button
                type="button"
                onClick={() => setKind("EXAM_DUTY")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                  kind === "EXAM_DUTY"
                    ? "bg-amber-50 border-amber-500 text-amber-700 shadow-xs"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                Exam Duty
              </button>
            </div>
          </div>

          {/* Teacher Selection */}
          <div>
            <label className="text-xs font-semibold text-zinc-700 block mb-1">
              Assigned Faculty / Teacher <span className="text-rose-500">*</span>
            </label>
            <SearchableSelect
              value={teacherId}
              onChange={setTeacherId}
              options={metadata.teachers.map((t) => ({
                value: String(t.id),
                label: t.name,
                subtitle: t.mobile ? `Mobile: ${t.mobile}` : undefined,
                badge: t.perClass > 0 ? `৳${t.perClass}/class` : undefined,
              }))}
              placeholder="-- Select Teacher --"
              searchPlaceholder="Search teacher by name or mobile..."
              required
            />
          </div>

          {/* Batch & Subject for Classes */}
          {kind !== "EXAM_DUTY" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Target Batch <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  value={batchId}
                  onChange={setBatchId}
                  options={metadata.batches.map((b) => ({
                    value: String(b.id),
                    label: b.name,
                    badge: b.classId,
                  }))}
                  placeholder="-- Select Batch --"
                  searchPlaceholder="Search batch by name or class..."
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">
                  Subject / Topic <span className="text-rose-500">*</span>
                </label>
                <SubjectSelect
                  value={subjectName}
                  onChange={setSubjectName}
                  programSubjects={programSubjects}
                  extraSubjects={(metadata as any).subjects || []}
                  placeholder="-- Select Subject --"
                  required
                />
              </div>
            </div>
          )}

          {/* Exam Duty Specific Fields */}
          {kind === "EXAM_DUTY" && (
            <div className="space-y-3 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Exam Duty Configuration
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 block mb-1">
                    Linked Exam / Assessment (Optional)
                  </label>
                  <select
                    value={specialExamId || (examId ? `reg_${examId}` : "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith("reg_")) {
                        setExamId(val.replace("reg_", ""));
                        setSpecialExamId("");
                      } else {
                        setSpecialExamId(val);
                        setExamId("");
                      }
                    }}
                    className="w-full px-3 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                  >
                    <option value="">-- General Duty / Unlinked --</option>
                    <optgroup label="Special Batch Exams">
                      {metadata.specialExams.map((se) => (
                        <option key={se.id} value={String(se.id)}>
                          {se.title} ({se.kind})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Regular Assessments">
                      {metadata.exams.map((re) => (
                        <option key={re.id} value={`reg_${re.id}`}>
                          Class {re.class} - {re.month} {re.type}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 block mb-1">
                    Duty Pay Amount (BDT)
                  </label>
                  <div className="relative">
                    <DollarSign className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="number"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="Custom amount (e.g. 500)"
                      className="pl-8 text-xs"
                      min="0"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 mt-0.5 block">
                    Paid at its own rate, independent of lecture rate.
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 block mb-1">Duty Description / Subject</label>
                <SubjectSelect
                  value={subjectName}
                  onChange={setSubjectName}
                  placeholder="-- Select Subject or Custom Duty --"
                  extraSubjects={["Model Test", "Pre-Model Test", "Class Test", "Board Exam Invigilation"]}
                  size="sm"
                />
              </div>
            </div>
          )}

          {/* Date & Time Window */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">End Time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Room & Lecture Label */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Classroom / Hall</label>
              <div className="relative">
                <DoorOpen className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g. Room 101, Lab A"
                  className="pl-8 text-xs"
                />
              </div>
            </div>

            {kind !== "EXAM_DUTY" && (
              <div>
                <label className="text-xs font-semibold text-zinc-700 block mb-1">Lecture Label</label>
                <Input
                  value={lectureLabel}
                  onChange={(e) => setLectureLabel(e.target.value)}
                  placeholder="e.g. L-12, Ch-04"
                  className="text-xs"
                />
              </div>
            )}
          </div>

          {/* Reason for Edit Mode */}
          {mode === "edit" && (
            <div>
              <label className="text-xs font-semibold text-zinc-700 block mb-1">Reason for Change</label>
              <Input
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder="e.g. Rescheduled teacher request, topic changed"
                className="text-xs"
              />
            </div>
          )}

          {/* LIVE CONFLICT WARNINGS */}
          {isCheckingConflicts && (
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-500" />
              <span>Checking schedule conflicts...</span>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Schedule Conflict Warning:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w.message}</li>
                ))}
              </ul>
              <p className="text-[11px] text-amber-600 italic">
                Note: You may still save this session if this overlapping assignment is intentional.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Save Session"
              ) : (
                "Update Session"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
