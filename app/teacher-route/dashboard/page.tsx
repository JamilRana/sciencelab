"use client";

import { useState, useEffect } from "react";
import { getTeacherAnalyticsAction, TeacherAnalytics } from "@/app/actions/teacher-analytics";
import Link from "next/link";
import { FileText, ClipboardList, DollarSign, Calendar, BookOpen, CheckCircle, TrendingUp } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function TeacherDashboard() {
  const [analytics, setAnalytics] = useState<TeacherAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(MONTHS[new Date().getMonth()]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [teacherName, setTeacherName] = useState("");

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getTeacherAnalyticsAction(filterMonth, filterYear);
        setAnalytics(data);
        
        // Get teacher name from session
        const session = await fetch("/api/auth/session").then(r => r.json());
        if (session?.user?.name) {
          setTeacherName(session.user.name);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [filterMonth, filterYear]);

  const handleFilterChange = (month: string, year: number) => {
    setFilterMonth(month);
    setFilterYear(year);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Teacher Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back, {teacherName || "Teacher"}!</p>
      </div>

      {/* Month/Year Filter */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={filterMonth}
              onChange={(e) => handleFilterChange(e.target.value, filterYear)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={filterYear}
              onChange={(e) => handleFilterChange(filterMonth, parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Exam Assigned</p>
              <p className="text-2xl font-black text-gray-900">{analytics?.totalExamAssigned || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mark Submitted</p>
              <p className="text-2xl font-black text-gray-900">{analytics?.markSubmitted || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Classes Taken</p>
              <p className="text-2xl font-black text-gray-900">{analytics?.classesTaken || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-black text-gray-900">৳{(analytics?.totalPaid || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Due</p>
              <p className="text-2xl font-black text-gray-900">৳{(analytics?.currentDue || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/teacher-route/exams"
          className="bg-white rounded-2xl shadow-sm border p-6 hover:border-blue-300 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-100">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Enter Marks</h3>
              <p className="text-sm text-gray-500">Mark entry for exams</p>
            </div>
          </div>
        </Link>

        <Link
          href="/teacher-route/results"
          className="bg-white rounded-2xl shadow-sm border p-6 hover:border-purple-300 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Exam Results</h3>
              <p className="text-sm text-gray-500">View results & ranking</p>
            </div>
          </div>
        </Link>

        <Link
          href="/teacher-route/class-log"
          className="bg-white rounded-2xl shadow-sm border p-6 hover:border-green-300 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-50 text-green-600 group-hover:bg-green-100">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Class Log</h3>
              <p className="text-sm text-gray-500">Daily class entry</p>
            </div>
          </div>
        </Link>

        <Link
          href="/teacher-route/payments"
          className="bg-white rounded-2xl shadow-sm border p-6 hover:border-orange-300 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-100">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Payment History</h3>
              <p className="text-sm text-gray-500">View payment ledger</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
