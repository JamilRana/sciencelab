"use client";

import React, { useState, useEffect } from "react";
import { Search, User, X, Check, Loader2, School, Phone, Layers } from "lucide-react";
import { AdmissionFormData } from "./types";

interface StudentSearchResult {
  id: number;
  name: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  homeMobile: string;
  image: string;
  roll: number;
  gender?: string;
  bloodGroup?: string;
  batch?: { id: number; name: string; code: number; classId?: string };
  school?: { id: number; name: string };
}

interface StudentSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (student: StudentSearchResult) => void;
}

export function StudentSearchDialog({
  isOpen,
  onClose,
  onSelectStudent,
}: StudentSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setStudents([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!isOpen) return;

    const delay = setTimeout(async () => {
      if (!searchTerm.trim()) {
        // Fetch top recent students by default
        fetchStudents("");
      } else {
        fetchStudents(searchTerm);
      }
    }, 300);

    return () => clearTimeout(delay);
  }, [searchTerm, isOpen]);

  async function fetchStudents(term: string) {
    setLoading(true);
    setHasSearched(true);
    try {
      const url = term ? `/api/students?search=${encodeURIComponent(term)}` : `/api/students`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setStudents((json.students || []).slice(0, 15));
      }
    } catch (err) {
      console.error("Error searching students:", err);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
          <div>
            <h3 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              ডাটাবেস থেকে শিক্ষার্থী নির্বাচন করুন
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              শিক্ষার্থীর নাম, রোল বা মোবাইল নম্বর দিয়ে খুঁজুন
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-200/60 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-zinc-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="শিক্ষার্থীর নাম, রোল বা মোবাইল লিখুন..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 text-emerald-600 animate-spin" />
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-zinc-100">
          {students.length > 0 ? (
            students.map((student) => (
              <div
                key={student.id}
                onClick={() => {
                  onSelectStudent(student);
                  onClose();
                }}
                className="py-2.5 px-3 hover:bg-emerald-50/70 rounded-lg cursor-pointer transition flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 border border-emerald-200">
                    {student.image ? (
                      <img
                        src={student.image}
                        alt={student.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{student.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 group-hover:text-emerald-700 truncate">
                      {student.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 mt-0.5">
                      {student.batch?.name && (
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3 text-zinc-400" />
                          ব্যাচ: <strong className="text-zinc-700">{student.batch.name}</strong>
                        </span>
                      )}
                      <span>রোল: <strong className="text-zinc-700">{student.roll}</strong></span>
                      {student.school?.name && (
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <School className="h-3 w-3 text-zinc-400 shrink-0" />
                          {student.school.name}
                        </span>
                      )}
                      {student.mobile && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="h-3 w-3 text-zinc-400" />
                          {student.mobile}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1 bg-white group-hover:bg-emerald-600 group-hover:text-white text-zinc-700 border border-zinc-200 group-hover:border-emerald-600 text-xs font-semibold rounded-lg shadow-2xs transition shrink-0 ml-3 flex items-center gap-1"
                >
                  <Check className="h-3 w-3" />
                  বাছাই করুন
                </button>
              </div>
            ))
          ) : !loading && hasSearched ? (
            <div className="py-12 text-center text-zinc-400">
              <User className="h-10 w-10 mx-auto text-zinc-300 mb-2" />
              <p className="text-sm font-medium">কোনো শিক্ষার্থী পাওয়া যায়নি</p>
              <p className="text-xs text-zinc-400 mt-1">
                ভিন্ন কোনো নাম, রোল বা মোবাইল নম্বর দিয়ে চেষ্টা করুন
              </p>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400">
              <Loader2 className="h-6 w-6 mx-auto animate-spin text-emerald-600 mb-2" />
              <p className="text-xs">ডাটা লোড হচ্ছে...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>মোট {students.length} জন শিক্ষার্থী প্রদর্শিত</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-zinc-700 hover:bg-zinc-200/70 rounded-lg transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
}
