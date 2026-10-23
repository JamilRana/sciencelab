"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SubjectSelect } from "@/components/ui/SubjectSelect";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  CalendarDays,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  User,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getRoutineSlotsAction,
  createRoutineSlotAction,
  deleteRoutineSlotAction,
  generateSessionsFromSlotsAction,
} from "@/app/actions/routine";
import { formatTime12h, todayDhaka } from "@/lib/dhaka-time";

const WEEKDAYS = [
  { index: 6, label: "Saturday" },
  { index: 0, label: "Sunday" },
  { index: 1, label: "Monday" },
  { index: 2, label: "Tuesday" },
  { index: 3, label: "Wednesday" },
  { index: 4, label: "Thursday" },
  { index: 5, label: "Friday" },
];

interface RoutineTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  metadata: {
    teachers: Array<{ id: number; name: string }>;
    batches: Array<{ id: number; name: string; classId: string }>;
  };
  onSessionsGenerated: () => void;
}

export function RoutineTemplateManager({
  isOpen,
  onClose,
  metadata,
  onSessionsGenerated,
}: RoutineTemplateManagerProps) {
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // New slot form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [batchId, setBatchId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [weekday, setWeekday] = useState("6"); // Saturday
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [room, setRoom] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadSlots = async () => {
    setIsLoading(true);
    try {
      const res = await getRoutineSlotsAction();
      if (res.success && res.data) {
        setSlots(res.data);
      }
    } catch {
      toast.error("Failed to load routine slots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSlots();
    }
  }, [isOpen]);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !teacherId || !subjectName.trim() || !startTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSaving(true);
    try {
      const res = await createRoutineSlotAction({
        batchId: parseInt(batchId, 10),
        teacherId: parseInt(teacherId, 10),
        subjectName: subjectName.trim(),
        weekday: parseInt(weekday, 10),
        startTime,
        endTime: endTime.trim() || null,
        room: room.trim() || null,
        validFrom: todayDhaka(),
      });

      if (res.success) {
        toast.success("Weekly routine slot added");
        setShowAddForm(false);
        setSubjectName("");
        setRoom("");
        await loadSlots();
      } else {
        toast.error(res.error || "Failed to create slot");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create slot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSlot = async (id: number) => {
    if (!confirm("Are you sure you want to remove this recurring slot?")) return;
    try {
      const res = await deleteRoutineSlotAction(id);
      if (res.success) {
        setSlots((prev) => prev.filter((s) => s.id !== id));
        toast.success("Recurring slot removed");
      } else {
        toast.error(res.error || "Failed to delete slot");
      }
    } catch {
      toast.error("Failed to delete slot");
    }
  };

  const handleGenerateNext14Days = async () => {
    setIsGenerating(true);
    try {
      const res = await generateSessionsFromSlotsAction(14);
      if (res.success && res.data) {
        toast.success(
          `Generated ${res.data.generatedCount} sessions for the next 14 days (${res.data.skippedCount} existing dates preserved).`
        );
        onSessionsGenerated();
      } else {
        toast.error(res.error || "Failed to generate sessions");
      }
    } catch (err: any) {
      toast.error(err.message || "Error generating sessions");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
            <div>
              <DialogTitle className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-indigo-600" />
                Weekly Repeat Routine Templates
              </DialogTitle>
              <p className="text-xs text-zinc-500 mt-0.5">
                Configure baseline weekly repeating class slots and generate dated sessions automatically.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
                className="text-xs"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {showAddForm ? "Close Form" : "Add Repeat Slot"}
              </Button>
              <Button
                size="sm"
                onClick={handleGenerateNext14Days}
                disabled={isGenerating || slots.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs shadow-xs"
              >
                <Sparkles className={`h-3.5 w-3.5 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "Generating..." : "Generate Next 14 Days"}
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Add Slot Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateSlot}
            className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-3"
          >
            <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Add New Weekly Recurring Slot
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Day of Week <span className="text-rose-500">*</span>
                </label>
                <select
                  value={weekday}
                  onChange={(e) => setWeekday(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-zinc-300 rounded-lg bg-white"
                >
                  {WEEKDAYS.map((w) => (
                    <option key={w.index} value={w.index}>
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Batch <span className="text-rose-500">*</span>
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
                  searchPlaceholder="Search batch..."
                  size="sm"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Teacher <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  value={teacherId}
                  onChange={setTeacherId}
                  options={metadata.teachers.map((t) => ({
                    value: String(t.id),
                    label: t.name,
                  }))}
                  placeholder="-- Select Teacher --"
                  searchPlaceholder="Search teacher..."
                  size="sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Subject / Topic <span className="text-rose-500">*</span>
                </label>
                <SubjectSelect
                  value={subjectName}
                  onChange={setSubjectName}
                  placeholder="-- Select Subject --"
                  size="sm"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">
                  Start Time <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-xs h-8"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-zinc-600 block mb-1">End Time</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="w-48">
                <Input
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="Room (e.g. 101)"
                  className="text-xs h-8"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs h-8"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSaving}
                  className="bg-indigo-600 text-white text-xs h-8"
                >
                  {isSaving ? "Saving..." : "Save Template Slot"}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* Slots List by Weekday */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading recurring slots...
          </div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            No recurring weekly slots configured yet. Click &ldquo;Add Repeat Slot&rdquo; to build your baseline routine.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {WEEKDAYS.map((w) => {
              const daySlots = slots.filter((s) => s.weekday === w.index);
              if (daySlots.length === 0) return null;

              return (
                <div key={w.index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-800 bg-zinc-100 px-2.5 py-0.5 rounded-md">
                      {w.label}
                    </span>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {daySlots.length} slot{daySlots.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-3 rounded-lg border border-zinc-200 bg-white flex items-center justify-between text-xs hover:border-zinc-300 transition-colors"
                      >
                        <div className="space-y-1 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-zinc-900 truncate">
                              {slot.subjectName}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {slot.batch?.name}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-zinc-500 text-[11px]">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime12h(slot.startTime)}
                              {slot.endTime ? ` - ${formatTime12h(slot.endTime)}` : ""}
                            </span>
                            <span>•</span>
                            <span className="truncate">{slot.teacher?.name}</span>
                            {slot.room && (
                              <>
                                <span>•</span>
                                <span>{slot.room}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="text-zinc-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors shrink-0"
                          title="Delete slot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
