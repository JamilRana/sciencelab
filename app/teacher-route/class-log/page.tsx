"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { createTeacherClassLogAction, deleteTeacherClassLogAction, getTeacherClassLogsAction, TeacherClassLogInput } from "@/app/actions/teacher-analytics";
import { Calendar, Plus, Trash2, BookOpen, Clock, FileText } from "lucide-react";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface ClassLog {
  id: number;
  date: Date;
  classes: number;
  notebook: number;
  other: number;
  month: string;
}

export default function TeacherClassLogPage() {
  const [logs, setLogs] = useState<ClassLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("All");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<TeacherClassLogInput>({
    date: new Date().toISOString().split("T")[0],
    classes: 0,
    notebook: 0,
    other: 0,
    month: MONTHS[new Date().getMonth()],
  });

  useEffect(() => {
    fetchLogs();
  }, [filterMonth]);

  const fetchLogs = async () => {
    try {
      const data = await getTeacherClassLogsAction(0, filterMonth); // teacherId will be fetched from session in action
      setLogs(data as ClassLog[]);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createTeacherClassLogAction(formData);
      if (result) {
        toast.success("Class log added successfully");
        setFormData({
          date: new Date().toISOString().split("T")[0],
          classes: 0,
          notebook: 0,
          other: 0,
          month: MONTHS[new Date().getMonth()],
        });
        fetchLogs();
      }
    } catch (error) {
      toast.error("Failed to add class log");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    
    try {
      await deleteTeacherClassLogAction(id);
      toast.success("Entry deleted");
      fetchLogs();
    } catch (error) {
      toast.error("Failed to delete entry");
    }
  };

  const totalClasses = logs.reduce((sum, log) => sum + log.classes + log.notebook + log.other, 0);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Class Log Entry</h1>
        <p className="text-gray-500 mt-1">Log your daily teaching activities.</p>
      </div>

      {/* Entry Form */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Entry
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Classes</label>
              <input
                type="number"
                min="0"
                value={formData.classes}
                onChange={(e) => setFormData({ ...formData, classes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                placeholder="Regular classes"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notebook</label>
              <input
                type="number"
                min="0"
                value={formData.notebook}
                onChange={(e) => setFormData({ ...formData, notebook: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                placeholder="Notebook check"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Other</label>
              <input
                type="number"
                min="0"
                value={formData.other}
                onChange={(e) => setFormData({ ...formData, other: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                placeholder="Other activities"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save Entry"}
          </button>
        </form>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Month</label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Months</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="ml-auto bg-purple-50 px-4 py-2 rounded-lg">
            <span className="text-sm text-purple-600">Total: </span>
            <span className="text-lg font-bold text-purple-700">{totalClasses}</span>
          </div>
        </div>
      </div>

      {/* Log List */}
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No entries found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Classes</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Notebook</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Other</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {new Date(log.date).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{log.month}</td>
                  <td className="px-4 py-3 text-center text-sm">{log.classes}</td>
                  <td className="px-4 py-3 text-center text-sm">{log.notebook}</td>
                  <td className="px-4 py-3 text-center text-sm">{log.other}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold">{log.classes + log.notebook + log.other}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
