"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Edit3, Search, Loader2, Download } from "lucide-react";
import { exportToCSV } from "@/lib/export";

interface AdminTableRow {
  id: string | number;
  [key: string]: any;
}

interface AdminTableColumn {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: AdminTableRow) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface AdminTableProps {
  data: AdminTableRow[];
  columns: AdminTableColumn[];
  onEdit?: (row: AdminTableRow) => void;
  onDelete?: (row: AdminTableRow) => void;
  onAdd?: () => void;
  onExport?: () => void;
  title?: string;
  searchPlaceholder?: string;
  loading?: boolean;
  noDataText?: string;
  className?: string;
}

export function AdminTable({
  data = [],
  columns,
  onEdit,
  onDelete,
  onAdd,
  onExport,
  title,
  searchPlaceholder = 'Search...',
  loading = false,
  noDataText = 'No records found',
  className = '',
}: AdminTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Use useMemo to filter data so it updates automatically when 'data' prop changes
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();
    
    return data.filter((row) => {
      return columns.some((column) => {
        const value = row[column.key];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, columns]);

  const handleDelete = async (row: AdminTableRow) => {
    if (!confirm(`Are you sure you want to delete this ${title?.toLowerCase() || 'record'}?`)) return;
    
    if (onDelete) {
      onDelete(row);
      toast.success(`${title || 'Record'} deleted successfully`);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default export
      const exportData = data.map(row => {
        const obj: Record<string, any> = {};
        visibleColumns.forEach(col => {
          const value = row[col.key];
          obj[col.header] = value;
        });
        return obj;
      });
      exportToCSV(exportData, title?.replace(/\s+/g, '_').toLowerCase() || 'export');
    }
  };

  const visibleColumns = columns.filter((col) => !col.key.startsWith('__'));

  return (
    <div className={`w-full ${className}`}>
      {/* Header Section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           {title && <h2 className="text-2xl font-bold text-gray-800">{title}</h2>}
           <p className="text-sm text-gray-500">Manage your {title?.toLowerCase() || 'records'} efficiently.</p>
        </div>
        <div className="flex gap-2">
          {onExport && (
            <button
              onClick={onExport}
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-all shadow-sm active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span className="font-medium">Export</span>
            </button>
          )}
          {onAdd && (
            <button
              onClick={onAdd}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-sm active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span className="font-medium">Add New</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center text-gray-500 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="animate-pulse">Loading data...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center justify-center">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Search className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">{noDataText}</p>
              <button onClick={() => setSearchTerm('')} className="text-blue-600 text-sm mt-2 hover:underline">Clear search</button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      style={{ width: column.width }}
                      className="px-6 py-4"
                    >
                      {column.header}
                    </th>
                  ))}
                  {(onEdit || onDelete) && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition-colors group">
                    {visibleColumns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-6 py-4 whitespace-nowrap text-gray-700 ${
                          column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                    {(onEdit || onDelete) && (
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(row)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => handleDelete(row)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}