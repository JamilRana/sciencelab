"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { 
  getAllClassLogsAction, 
  getAllTeachersWithStatsAction,
  createClassLogForTeacherAction,
  updateClassLogAction,
  deleteClassLogAction,
} from "@/app/actions/teacher-analytics";
import { Calendar, User, BookOpen, DollarSign, Search, Trash2, Edit, Plus, FileText, ChevronLeft, ChevronRight, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface Teacher {
  id: number;
  name: string;
  mobile: string;
  perClass: number;
}

interface ClassLog {
  id: number;
  teacherId: number;
  date: Date;  // or string if you prefer
  month: string;
  classes: number;
  notebook: number;
  other: number;
  perClass: number;
  paid: number;
  teacher: {
    id: number;
    name: string;
    mobile: string;
    perClass: number;
  };
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

interface LogFormData {
  teacherId: number;
  date: string;
  classes: number;
  notebook: number;
  other: number;
  month: string;
}

export default function AdminClassLogPage() {
  const [logs, setLogs] = useState<ClassLog[]>([]);
  const [teachers, setTeachers] = useState<TeacherStats[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filters
  const [filterMonth, setFilterMonth] = useState("All");
  const [filterTeacher, setFilterTeacher] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "table">("table");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  // Create/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ClassLog | null>(null);
  const [formData, setFormData] = useState<LogFormData>({
    teacherId: 0,
    date: new Date().toISOString().split("T")[0],
    classes: 0,
    notebook: 0,
    other: 0,
    month: MONTHS[new Date().getMonth()],
  });

  const {  data:session } = useSession();
  const userRole = session?.user?.role;
  const canSeeFinancials = userRole === "ADMIN";  // Staff cannot see amounts

  // 🔹 Fetch data with filters and pagination
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
const [logsResult, teachersData] = await Promise.all([
  getAllClassLogsAction(
    filterMonth === "All" ? undefined : filterMonth,
    filterTeacher === "All" ? undefined : parseInt(filterTeacher),  // ← Parse to number
    startDate || undefined,
    endDate || undefined,
    currentPage,
    ITEMS_PER_PAGE
  ),
        getAllTeachersWithStatsAction(
          filterMonth === "All" ? undefined : filterMonth,
          startDate || undefined,
          endDate || undefined,
          !canSeeFinancials  // Hide financials for staff
        ),
      ]);
      
      setLogs(logsResult.logs);
      setTotalPages(logsResult.pages);
      setTeachers(teachersData);
      
      // Also fetch all teachers for the create form dropdown
      const allTeachersData = await getAllTeachersWithStatsAction(undefined, undefined, undefined, false);
      setAllTeachers(allTeachersData.map(t => ({
        id: t.id,
        name: t.name,
        mobile: t.mobile,
        perClass: t.perClass,
      })));
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterTeacher, startDate, endDate, currentPage, canSeeFinancials]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth, filterTeacher, startDate, endDate]);

  // 🔹 Filter logs client-side for search
  const filteredLogs = useMemo(() => {
    if (!searchQuery) return logs;
    return logs.filter((log) =>
      log.teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
      new Date(log.date).toLocaleDateString().includes(searchQuery)
    );
  }, [logs, searchQuery]);

  // 🔹 Stats (only calculate if admin can see financials)
  const totalClasses = filteredLogs.reduce((sum, log) => sum + log.classes + log.notebook + log.other, 0);
  const totalExpected = canSeeFinancials 
    ? teachers.reduce((sum, t) => sum + (t.totalClasses * t.perClass), 0)
    : 0;
  const totalPaid = canSeeFinancials 
    ? teachers.reduce((sum, t) => sum + t.totalPaid, 0)
    : 0;

  // 🔹 Form handlers
  const openCreateModal = () => {
    setEditingLog(null);
    setFormData({
      teacherId: 0,
      date: new Date().toISOString().split("T")[0],
      classes: 0,
      notebook: 0,
      other: 0,
      month: MONTHS[new Date().getMonth()],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (log: ClassLog) => {
    setEditingLog(log);
    setFormData({
      teacherId: log.teacher.id,
      date: new Date(log.date).toISOString().split("T")[0],
      classes: log.classes,
      notebook: log.notebook,
      other: log.other,
      month: log.month,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (editingLog) {
        await updateClassLogAction(editingLog.id, formData);
        toast.success("✓ Log updated successfully");
      } else {
        await createClassLogForTeacherAction(formData.teacherId, formData);
        toast.success("✓ Log created successfully");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error("✗ Failed to save log");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (userRole !== "ADMIN") {
      toast.error("Only admins can delete logs");
      return;
    }
    
    if (!confirm("Are you sure you want to delete this log?")) return;
    
    try {
      await deleteClassLogAction(id);
      toast.success("✓ Log deleted");
      fetchData();
    } catch {
      toast.error("✗ Failed to delete log");
    }
  };

  // 🔹 Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 🔹 Loading state
  if (loading && teachers.length === 0) {
    return (
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* 🔹 Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Teacher Class Logs</h1>
          <p className="text-gray-500 mt-1">Monitor teacher class attendance and payment status.</p>
        </div>
        {(userRole === "ADMIN" || userRole === "STAFF") && (
          <Button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Class Log
          </Button>
        )}
      </div>

      {/* 🔹 Stats Summary - Hide financials for staff */}
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

        {/* Show financial stats only for admin */}
        {canSeeFinancials ? (
          <>
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
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border p-6 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Financial Data</p>
                <p className="text-lg font-medium text-amber-700">Hidden for staff role</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🔹 Filters */}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teacher, month, or date..."
                className="pl-10 pr-4"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Table
            </Button>
          </div>
          {(startDate || endDate || filterMonth !== "All" || filterTeacher !== "All") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterMonth("All");
                setFilterTeacher("All");
                setStartDate("");
                setEndDate("");
                setSearchQuery("");
              }}
              className="text-gray-500"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* 🔹 Teacher Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
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
                {canSeeFinancials && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Rate</p>
                    <p className="text-xl font-bold text-gray-900">৳{teacher.perClass}</p>
                  </div>
                )}
                {canSeeFinancials && (
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600">Paid</p>
                    <p className="text-xl font-bold text-green-700">৳{teacher.totalPaid.toLocaleString()}</p>
                  </div>
                )}
                {canSeeFinancials && (
                  <div className="bg-red-50 rounded-lg p-3">
                    <p className="text-xs text-red-600">Due</p>
                    <p className="text-xl font-bold text-red-700">৳{teacher.due.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {teachers.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl shadow-sm border p-12 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No teachers found for selected filters</p>
            </div>
          )}
        </div>
      )}

      {/* 🔹 Table View with Pagination */}
      {viewMode === "table" && (
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Teacher</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Month</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Classes</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Notebook</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Other</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Total</th>
                  {canSeeFinancials && (
                    <th className="px-4 py-3 text-center font-medium text-gray-600">Amount</th>
                  )}
                  {(userRole === "ADMIN" || userRole === "STAFF") && (
                    <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredLogs.map((log) => {
                  const activityTotal = log.classes + log.notebook + log.other;
                  const amount = activityTotal * log.teacher.perClass;
                  
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(log.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
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
                      <td className="px-4 py-3 text-center font-bold">{activityTotal}</td>
                      {canSeeFinancials && (
                        <td className="px-4 py-3 text-center font-bold text-green-600">
                          ৳{amount}
                        </td>
                      )}
                      {(userRole === "ADMIN" || userRole === "STAFF") && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(log)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {userRole === "ADMIN" && (
                              <button
                                onClick={() => handleDelete(log.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {filteredLogs.length > 0 && canSeeFinancials && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={6} className="px-4 py-3 font-medium text-gray-700">Total</td>
                    <td className="px-4 py-3 text-center font-bold">{filteredLogs.reduce((s, l) => s + l.classes + l.notebook + l.other, 0)}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-600">
                      ৳{filteredLogs.reduce((s, l) => s + (l.classes + l.notebook + l.other) * l.teacher.perClass, 0)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
              <p className="text-sm text-gray-600">
                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                <span className="ml-2 text-gray-400">({filteredLogs.length} of {logs.length} results)</span>
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
          
          {filteredLogs.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No class logs found for selected filters</p>
              {(userRole === "ADMIN" || userRole === "STAFF") && (
                <Button variant="outline" size="sm" onClick={openCreateModal} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Log
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 🔹 Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLog ? "Edit Class Log" : "Add New Class Log"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Teacher Select (only for create, not edit) */}
              {!editingLog && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Teacher</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value={0}>-- Select Teacher --</option>
                    {allTeachers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.mobile})</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Month</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Classes</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.classes}
                    onChange={(e) => setFormData({ ...formData, classes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notebook</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.notebook}
                    onChange={(e) => setFormData({ ...formData, notebook: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Other</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.other}
                    onChange={(e) => setFormData({ ...formData, other: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              {/* Amount Preview (Admin only) */}
              {canSeeFinancials && (
                <div className="bg-blue-50 px-4 py-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Estimated Amount:</strong> ৳{
                      (formData.classes + formData.notebook + formData.other) * 
                      (allTeachers.find(t => t.id === formData.teacherId)?.perClass || 0)
                    }
                  </p>
                </div>
              )}
              
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving || (!editingLog && formData.teacherId === 0)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingLog ? "Update Log" : "Create Log"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}