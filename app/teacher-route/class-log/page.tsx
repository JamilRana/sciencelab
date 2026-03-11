"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { 
  createTeacherClassLogAction, 
  updateTeacherClassLogAction, 
  getTeacherClassLogsAction,
  getTeacherWithPerClassAction,
  TeacherClassLogInput 
} from "@/app/actions/teacher-analytics";
import { Calendar, Plus, Pencil, Save, X, BookOpen, Clock, FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ClassLog {
  id: number;
  date: Date;
  classes: number;
  notebook: number;
  other: number;
  month: string;
  perClass: number;
}

interface PaginatedLogs {
  logs: ClassLog[];
  total: number;
  pages: number;
  currentPage: number;
}

export default function TeacherClassLogPage() {
  const [logs, setLogs] = useState<ClassLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("All");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Edit mode
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<TeacherClassLogInput>({
    date: new Date().toISOString().split("T")[0],
    classes: 0,
    notebook: 0,
    other: 0,
    month: MONTHS[new Date().getMonth()],
  });

  // Teacher info
  const [perClass, setPerClass] = useState(0);
  const { data: session } = useSession();
  const teacherId = session?.user?.teacherId;

  // Fetch teacher's perClass rate
  useEffect(() => {
    if (teacherId) {
      getTeacherWithPerClassAction(teacherId).then((teacher) => {
        if (teacher) setPerClass(teacher.perClass);
      });
    }
  }, [teacherId]);

  // Fetch logs with pagination
  const fetchLogs = useCallback(async () => {
    if (!teacherId) return;
    
    setLoading(true);
    try {
      const result = await getTeacherClassLogsAction(
        teacherId, 
        filterMonth, 
        currentPage, 
        ITEMS_PER_PAGE
      );
      setLogs(result.logs);
      setTotalPages(result.pages);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast.error("Failed to load class logs");
    } finally {
      setLoading(false);
    }
  }, [teacherId, filterMonth, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;
    
    setIsSubmitting(true);

    try {
      if (editingId) {
        // Update existing log
        await updateTeacherClassLogAction(editingId, formData);
        toast.success("✓ Entry updated successfully");
        setEditingId(null);
      } else {
        // Create new log
        await createTeacherClassLogAction(formData);
        toast.success("✓ Entry added successfully");
      }
      
      // Reset form
      setFormData({
        date: new Date().toISOString().split("T")[0],
        classes: 0,
        notebook: 0,
        other: 0,
        month: MONTHS[new Date().getMonth()],
      });
      
      // Refresh logs
      fetchLogs();
    } catch (error) {
      toast.error("✗ Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (log: ClassLog) => {
    setEditingId(log.id);
    setFormData({
      date: new Date(log.date).toISOString().split("T")[0],
      classes: log.classes,
      notebook: log.notebook,
      other: log.other,
      month: log.month,
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split("T")[0],
      classes: 0,
      notebook: 0,
      other: 0,
      month: MONTHS[new Date().getMonth()],
    });
  };

  const calculateAmount = (classes: number, notebook: number, other: number) => {
    return (classes + notebook + other) * perClass;
  };

  const totalAmount = logs.reduce((sum, log) => 
    sum + calculateAmount(log.classes, log.notebook, log.other), 0
  );

  const totalActivities = logs.reduce((sum, log) => 
    sum + log.classes + log.notebook + log.other, 0
  );

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Class Log Entry</h1>
        <p className="text-gray-500 mt-1">Log your daily teaching activities • Rate: ৳{perClass}/activity</p>
      </div>

      {/* Entry Form */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          {editingId ? <Pencil className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5" />}
          {editingId ? "Edit Entry" : "Add New Entry"}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <BookOpen className="h-4 w-4 inline mr-1" />
                Classes
              </label>
              <input
                type="number"
                min="0"
                value={formData.classes}
                onChange={(e) => setFormData({ ...formData, classes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="Regular classes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText className="h-4 w-4 inline mr-1" />
                Notebook
              </label>
              <input
                type="number"
                min="0"
                value={formData.notebook}
                onChange={(e) => setFormData({ ...formData, notebook: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="Notebook checks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Other
              </label>
              <input
                type="number"
                min="0"
                value={formData.other}
                onChange={(e) => setFormData({ ...formData, other: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                placeholder="Other activities"
              />
            </div>
          </div>

          {/* Amount Preview */}
          <div className="bg-purple-50 px-4 py-3 rounded-lg">
            <p className="text-sm text-purple-700">
              <strong>Estimated Amount:</strong> ৳{calculateAmount(formData.classes, formData.notebook, formData.other)} 
              <span className="text-purple-500 ml-2">
                ({formData.classes + formData.notebook + formData.other} activities × ৳{perClass})
              </span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editingId ? "Update Entry" : "Save Entry"}
                </>
              )}
            </button>
            
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Filter & Stats */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            >
              <option value="All">All Months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto flex gap-4">
            <div className="bg-purple-50 px-4 py-2 rounded-lg text-center">
              <span className="text-xs text-purple-600 block">Total Activities</span>
              <span className="text-lg font-bold text-purple-700">{totalActivities}</span>
            </div>
            <div className="bg-green-50 px-4 py-2 rounded-lg text-center">
              <span className="text-xs text-green-600 block">Total Amount</span>
              <span className="text-lg font-bold text-green-700">৳{totalAmount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Log List with Pagination */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="h-8 w-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading entries...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No entries found for {filterMonth === "All" ? "all months" : filterMonth}</p>
            <p className="text-sm mt-1">Add your first entry above</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Classes</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Notebook</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Other</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.map((log) => {
                    const activityTotal = log.classes + log.notebook + log.other;
                    const amount = calculateAmount(log.classes, log.notebook, log.other);
                    
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(log.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">{log.month}</td>
                        <td className="px-4 py-3 text-center text-sm">{log.classes}</td>
                        <td className="px-4 py-3 text-center text-sm">{log.notebook}</td>
                        <td className="px-4 py-3 text-center text-sm">{log.other}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold">{activityTotal}</td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-green-600">
                          ৳{amount}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleEdit(log)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit entry"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                <p className="text-sm text-gray-600">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border rounded-lg text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}