"use client";

import React from "react";
import { Drawer } from "@/components/ui/drawer";
import { StatusBadge } from "@/components/ui/status-badge";
import { generateDisplayRoll } from "@/lib/roll";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  GraduationCap,
  School as SchoolIcon,
  CreditCard,
  Award,
  Edit,
  Printer,
  Shield,
  History,
} from "lucide-react";
import type { Student, School, Batch } from "@/types";
import Link from "next/link";
import { getStudentAcademicHistoriesAction } from "@/app/actions/archiving";

interface StudentDrawerProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (student: Student) => void;
}

export function StudentDrawer({
  student,
  isOpen,
  onClose,
  onEdit,
}: StudentDrawerProps) {
  const [histories, setHistories] = React.useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && student?.id) {
      setLoadingHistory(true);
      getStudentAcademicHistoriesAction(student.id)
        .then((res) => {
          if (res.success && res.data) {
            setHistories(res.data);
          }
        })
        .finally(() => setLoadingHistory(false));
    } else {
      setHistories([]);
    }
  }, [isOpen, student?.id]);

  if (!student) return null;

  const displayRoll = student.batch?.code
    ? generateDisplayRoll(student.batch.code, student.roll)
    : student.roll;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      width="md"
      title="Student Details"
      description={`System ID: #${student.id} · Enrolled Student Profile`}
      footer={
        <div className="flex items-center justify-between w-full">
          <Link
            href={`/admin-route/students/print?class=${encodeURIComponent(student.class)}&batch=${student.batchId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Roll Sheet</span>
          </Link>

          <button
            onClick={() => {
              onClose();
              onEdit(student);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Edit Profile</span>
          </button>
        </div>
      }
    >
      {/* Student Identity Card */}
      <div className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 to-zinc-50 border border-indigo-100/80">
        <div className="h-14 w-14 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
          {student.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-zinc-900 truncate">
              {student.name}
            </h3>
            <StatusBadge status={student.active ? "Active" : "Inactive"} />
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-600">
            <span className="font-semibold text-indigo-700 tabular-nums">
              Roll #{displayRoll}
            </span>
            <span className="text-zinc-300">·</span>
            <span>Class {student.class}</span>
            <span className="text-zinc-300">·</span>
            <span>Batch {student.batch?.name || "N/A"}</span>
          </div>

          <div className="mt-2 text-[11px] text-zinc-500 flex items-center gap-1.5">
            <SchoolIcon className="h-3 w-3 text-zinc-400" />
            <span className="truncate">{student.school?.name || "Not specified"}</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <Link
          href={`/admin-route/fees?search=${encodeURIComponent(student.name)}`}
          className="p-3 rounded-lg border border-zinc-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-200 transition-all flex items-center gap-2.5"
        >
          <div className="p-2 rounded-md bg-emerald-50 text-emerald-600 shrink-0">
            <CreditCard className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900">Tuition Fees</p>
            <p className="text-[10px] text-zinc-400">View payment history</p>
          </div>
        </Link>

        <Link
          href={`/admin-route/marks?search=${encodeURIComponent(student.name)}`}
          className="p-3 rounded-lg border border-zinc-200 bg-white hover:bg-indigo-50/50 hover:border-indigo-200 transition-all flex items-center gap-2.5"
        >
          <div className="p-2 rounded-md bg-indigo-50 text-indigo-600 shrink-0">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900">Exam Results</p>
            <p className="text-[10px] text-zinc-400">View marks & ranking</p>
          </div>
        </Link>
      </div>

      {/* Guardian & Family Information */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-zinc-400" />
          Guardian & Personal Details
        </h4>

        <div className="bg-zinc-50/80 rounded-xl border border-zinc-200/80 divide-y divide-zinc-100 text-xs">
          <div className="flex items-center justify-between p-3">
            <span className="text-zinc-500">Father's Name</span>
            <span className="font-semibold text-zinc-800">{student.fatherName || "—"}</span>
          </div>

          <div className="flex items-center justify-between p-3">
            <span className="text-zinc-500">Mother's Name</span>
            <span className="font-semibold text-zinc-800">{student.motherName || "—"}</span>
          </div>

          <div className="flex items-center justify-between p-3">
            <span className="text-zinc-500">Gender</span>
            <span className="font-medium text-zinc-800">{student.gender || "—"}</span>
          </div>

          <div className="flex items-center justify-between p-3">
            <span className="text-zinc-500">Date of Birth</span>
            <span className="font-medium text-zinc-800 tabular-nums">
              {student.dob ? new Date(student.dob).toLocaleDateString() : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Contact & Address */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-zinc-400" />
          Contact & Address
        </h4>

        <div className="bg-zinc-50/80 rounded-xl border border-zinc-200/80 divide-y divide-zinc-100 text-xs">
          <div className="flex items-center justify-between p-3">
            <span className="text-zinc-500">Student Mobile</span>
            <span className="font-semibold text-zinc-900 tabular-nums">{student.mobile}</span>
          </div>

          {student.homeMobile && (
            <div className="flex items-center justify-between p-3">
              <span className="text-zinc-500">Emergency / Home</span>
              <span className="font-medium text-zinc-800 tabular-nums">{student.homeMobile}</span>
            </div>
          )}

          {student.email && (
            <div className="flex items-center justify-between p-3">
              <span className="text-zinc-500">Email Address</span>
              <span className="font-medium text-zinc-800 truncate max-w-[200px]">{student.email}</span>
            </div>
          )}

          <div className="p-3">
            <span className="text-zinc-500 block mb-1">Residential Address</span>
            <p className="font-medium text-zinc-800 leading-relaxed">{student.address || "No address entered"}</p>
          </div>
        </div>
      </div>

      {/* Academic Progression History */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-indigo-500" />
          Academic Session History
        </h4>

        {loadingHistory ? (
          <div className="p-3 text-center text-xs text-zinc-400">Loading academic history...</div>
        ) : histories.length === 0 ? (
          <div className="p-3 text-center text-xs text-zinc-400 bg-zinc-50 rounded-xl border border-zinc-200">
            No previous academic session records.
          </div>
        ) : (
          <div className="space-y-2">
            {histories.map((h) => (
              <div
                key={h.id}
                className="bg-indigo-50/40 p-2.5 rounded-xl border border-indigo-100 text-xs flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-zinc-900">
                    Session {h.year}: Class {h.class}
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    {h.batch?.name || "Regular Batch"}
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-indigo-200 text-xs">
                    Roll #{h.roll}
                  </span>
                  {h.note && (
                    <div className="text-[10px] text-zinc-400 mt-0.5 max-w-[120px] truncate">
                      {h.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  );
}
