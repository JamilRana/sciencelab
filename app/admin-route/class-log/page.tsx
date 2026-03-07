"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { getAllClassLogsAction, getAllTeachersWithStatsAction } from "@/app/actions/teacher-analytics";
import { Calendar, User, BookOpen, DollarSign, Search, Trash2, Edit, Plus, FileText } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Teacher {
  id: number;
  name: string;
  mobile: string;
  perClass: number;
}

interface ClassLog {
  id: number;
  date: Date;
  classes: number;
  notebook: number;
  other: number;
  month: string;
  teacher: Teacher;
}

interface TeacherStats {
  id: number;
  name: string;
  mobile: string;
  perClass: number;
  totalClasses: number;
  totalPaid: number;
  due: number;
}

export default function AdminClassLogPage() {
  const [logs, setLogs] = useState<ClassLog[]>([]);
  const [teachers, setTeachers] = useState<TeacherStats[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterTeacher, setFilterTeacher] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  useEffect(() => {
    fetchData();
  }, [filterMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsData, teachersData] = await Promise.all([
        getAllClassLogsAction(filterMonth === "All" ? undefined : filterMonth),
        getAllTeachersWithStatsAction(filterMonth === "All" ? undefined : filterMonth),
      ]);
      setLogs(logsData as ClassLog[]);
      setTeachers(teachersData as TeacherStats[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const teacherMatch = filterTeacher === "All" || log.teacher.id.toString() === filterTeacher;
    const searchMatch = !searchQuery || 
      log.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.month.toLowerCase().includes(searchQuery.toLowerCase());
    return teacherMatch && searchMatch;
  });

  const filteredTeachers = teachers.filter((t) => {
    const searchMatch = !searchQuery || 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mobile.includes(searchQuery);
    return searchMatch;
  });

  const totalClasses = filteredLogs.reduce((sum, log) => sum + log.classes + log.notebook + log.other, 0);
  const totalExpected = filteredTeachers.reduce((sum, t) => sum + (t.totalClasses * t.perClass), 0);
  const totalPaid = filteredTeachers.reduce((sum, t) => sum + t.totalPaid, 0);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Teacher Class Logs</h1>
        <p className="text-gray-500 mt-1">Monitor teacher class attendance and payment status.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Classes</p>
              <p className="text-2xl font-black text-gray-900">{totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Teachers</p>
              <p className="text-2xl font-black text-gray-900">{teachers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-green-50 text-green-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-black text-gray-900">৳{totalPaid.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-50 text-red-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Due</p>
              <p className="text-2xl font-black text-gray-900">৳{(totalExpected - totalPaid).toLocaleString()}</p>
            </div>
          </div>
        </div>
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
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
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
                placeholder="Search teacher or month..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("cards")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === "cards" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                viewMode === "table" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Teacher Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="bg-white rounded-2xl shadow-sm border p-6 hover:border-blue-200 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{teacher.name}</h3>
                    <p className="text-sm text-gray-500">{teacher.mobile}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Classes</p>
                  <p className="text-xl font-bold text-gray-900">{teacher.totalClasses}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Rate</p>
                  <p className="text-xl font-bold text-gray-900">৳{teacher.perClass}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600">Paid</p>
                  <p className="text-xl font-bold text-green-700">৳{teacher.totalPaid.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xs text-red-600">Due</p>
                  <p className="text-xl font-bold text-red-700">৳{teacher.due.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          
          {filteredTeachers.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl shadow-sm border p-12 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No teachers found</p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Teacher</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Month</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Classes</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Notebook</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Other</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(log.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{log.teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        {log.month}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{log.classes}</td>
                    <td className="px-4 py-3 text-center">{log.notebook}</td>
                    <td className="px-4 py-3 text-center">{log.other}</td>
                    <td className="px-4 py-3 text-center font-bold">{log.classes + log.notebook + log.other}</td>
                  </tr>
                ))}
              </tbody>
              {filteredLogs.length > 0 && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-medium text-gray-700">Total</td>
                    <td className="px-4 py-3 text-center font-bold">{filteredLogs.reduce((s, l) => s + l.classes, 0)}</td>
                    <td className="px-4 py-3 text-center font-bold">{filteredLogs.reduce((s, l) => s + l.notebook, 0)}</td>
                    <td className="px-4 py-3 text-center font-bold">{filteredLogs.reduce((s, l) => s + l.other, 0)}</td>
                    <td className="px-4 py-3 text-center font-bold">{totalClasses}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No class logs found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
