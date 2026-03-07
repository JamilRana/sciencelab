"use client";

import { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchFields?: (keyof T)[];
  placeholder?: string;
  pageSize?: number;
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
  renderActions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  filterOptions?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
}

export function DataTable<T extends { id: number }>({
  data,
  columns,
  searchFields = [],
  placeholder = "Search...",
  pageSize = 10,
  onEdit,
  onDelete,
  renderActions,
  emptyMessage = "No data found",
  filterOptions = [],
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchQuery && searchFields.length > 0) {
      result = result.filter((item) =>
        searchFields.some((field) => {
          const value = item[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchQuery.toLowerCase());
          }
          if (typeof value === "number") {
            return value.toString().includes(searchQuery);
          }
          return false;
        })
      );
    }

    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((item) => {
          const itemValue = (item as Record<string, unknown>)[key];
          return String(itemValue) === value;
        });
      }
    });

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey];
        const bVal = (b as Record<string, unknown>)[sortKey];
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, searchFields, sortKey, sortDirection, activeFilters]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(activeFilters).some((v) => v) || searchQuery;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="relative w-full sm:max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-10 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          {filterOptions.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 h-11 rounded-xl border transition-all",
                showFilters || Object.values(activeFilters).some(v => v)
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          )}
          
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 h-11 text-sm text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {showFilters && filterOptions.length > 0 && (
        <div className="flex flex-wrap gap-3 p-4 bg-white rounded-xl border">
          {filterOptions.map((filter) => (
            <select
              key={filter.key}
              value={activeFilters[filter.key] || ""}
              onChange={(e) => handleFilterChange(filter.key, e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "p-4 font-semibold text-gray-600 text-sm",
                      column.sortable && "cursor-pointer hover:bg-gray-100 transition-colors",
                      column.className
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && sortKey === column.key && (
                        <span className="text-blue-500">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete || renderActions) && (
                  <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {columns.map((column) => (
                      <td key={column.key} className={cn("p-4", column.className)}>
                        {column.render
                          ? column.render(item)
                          : String((item as Record<string, unknown>)[column.key] ?? "")}
                      </td>
                    ))}
                    {(onEdit || onDelete || renderActions) && (
                      <td className="p-4 text-right">
                        {renderActions ? (
                          renderActions(item)
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(item)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                            )}
                            {onDelete && (
                              <button
                                onClick={() => onDelete(item.id)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (onEdit || onDelete || renderActions ? 1 : 0)} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredData.length > pageSize && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredData.length)} of{" "}
              {filteredData.length} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={cn(
                        "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-gray-100"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
