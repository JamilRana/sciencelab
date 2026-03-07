"use client";

import { useState, useEffect, useMemo } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, Calendar, User, ClipboardList, Search } from "lucide-react";

interface ExamSubject {
  id: number;
  subject: string;
  totalMark: number;
  examDate: Date;
  exam: {
    id: number;
    type: string;
    month: string;
    class: string;
  };
}

export default function TeacherExamsPage() {
  const [examSubjects, setExamSubjects] = useState<ExamSubject[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterClass, setFilterClass] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/teacher/results");
        const data = await res.json();
        
        // Transform data to get unique exam subjects
        const subjectMap = new Map<number, ExamSubject>();
        data.forEach((item: any) => {
          if (!subjectMap.has(item.id)) {
            subjectMap.set(item.id, item);
          }
        });
        setExamSubjects(Array.from(subjectMap.values()));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Get unique values for filters
  const uniqueMonths = useMemo(() => {
    const months = new Set(examSubjects.map((sub) => sub.exam.month));
    return Array.from(months);
  }, [examSubjects]);

  const uniqueClasses = useMemo(() => {
    const classes = new Set(examSubjects.map((sub) => sub.exam.class));
    return Array.from(classes);
  }, [examSubjects]);

  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(examSubjects.map((sub) => sub.subject));
    return Array.from(subjects);
  }, [examSubjects]);

  // Filter exam subjects
  const filteredSubjects = examSubjects.filter((sub) => {
    const monthMatch = filterMonth === "All" || sub.exam.month === filterMonth;
    const classMatch = filterClass === "All" || sub.exam.class === filterClass;
    const subjectMatch = filterSubject === "All" || sub.subject === filterSubject;
    const searchMatch = !searchQuery || 
      sub.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.exam.type.toLowerCase().includes(searchQuery.toLowerCase());
    return monthMatch && classMatch && subjectMatch && searchMatch;
  });

  const clearFilters = () => {
    setFilterMonth("All");
    setFilterClass("All");
    setFilterSubject("All");
    setSearchQuery("");
  };

  const hasFilters = filterMonth !== "All" || filterClass !== "All" || filterSubject !== "All" || searchQuery;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Exams</h1>
        <p className="text-gray-500 mt-1">View your assigned exam subjects and enter marks.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Months</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Classes</option>
              {uniqueClasses.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Subject or exam type..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <p className="text-gray-500">No assigned exams found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubjects.map((sub) => (
            <div key={sub.id} className="bg-white p-6 rounded-2xl shadow-sm border group hover:border-blue-200 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {sub.exam.type} - {sub.exam.month}
                    </h3>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        <span>Class {sub.exam.class}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(sub.examDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                        {sub.subject}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                        Max: {sub.totalMark}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Link
                  href={`/teacher-route/exams/${sub.exam.id}/subjects/${sub.id}/marks`}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <ClipboardList className="h-4 w-4" />
                  Enter Marks
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
