// components/ui/data-table.tsx
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  Sparkles,
  Download,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fuzzyMatch, normalize } from "@/lib/fuzzy-search";
import { exportToCSV } from "@/lib/export";
import { SkeletonTable } from "./skeleton-loaders";
import { EmptyState } from "./empty-state";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  searchValue?: (item: T) => string;
  fuzzyWeight?: number;
  width?: string;
  align?: "left" | "center" | "right";
  visible?: boolean;
}

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchFields?: (keyof T)[];
  placeholder?: string;
  pageSize?: number;
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
  onRowClick?: (item: T) => void;
  renderActions?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  emptyTitle?: string;
  filterOptions?: FilterOption[];
  customSearchFn?: (item: T, query: string) => boolean;
  fuzzySearch?: {
    enabled?: boolean;
    threshold?: number;
    minQueryLength?: number;
  };
  searchDebounceMs?: number;
  defaultSort?: (a: T, b: T) => number;
  loading?: boolean;
  onAdd?: () => void;
  addLabel?: string;
  onExport?: (filteredData: T[], activeFilters: Record<string, string>, searchQuery: string) => void;
  exportFileName?: string;
  extraToolbarActions?: (filteredData: T[], activeFilters: Record<string, string>, searchQuery: string) => React.ReactNode;
  initialSearch?: string;
  initialFilters?: Record<string, string>;
}

export function DataTable<T extends { id: number | string }>({
  data,
  columns,
  searchFields = [],
  placeholder = "Search records...",
  pageSize = 10,
  onEdit,
  onDelete,
  onRowClick,
  renderActions,
  emptyTitle = "No records found",
  emptyMessage = "There are no records matching your search or filters.",
  filterOptions = [],
  customSearchFn,
  fuzzySearch = { enabled: true, threshold: 0.4, minQueryLength: 2 },
  searchDebounceMs = 250,
  defaultSort,
  loading = false,
  onAdd,
  addLabel = "+ Add New",
  onExport,
  exportFileName = "export",
  extraToolbarActions,
  initialSearch = "",
  initialFilters = {},
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(pageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(initialFilters);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() =>
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible !== false }), {})
  );
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const columnToggleRef = useRef<HTMLDivElement>(null);

  // Sync external search changes if prop changes
  useEffect(() => {
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
      setCurrentPage(1);
    }
  }, [initialSearch]);

  // Sync external filter changes if prop changes
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setActiveFilters((prev) => ({ ...prev, ...initialFilters }));
      setCurrentPage(1);
    }
  }, [JSON.stringify(initialFilters)]);

  const debouncedQuery = useDebouncedValue(searchQuery, searchDebounceMs);

  // Close column toggle menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnToggleRef.current && !columnToggleRef.current.contains(e.target as Node)) {
        setShowColumnToggle(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter column toggle
  const toggleColumnVisibility = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Helper: check search match
  const itemMatchesQuery = useCallback(
    (item: T, query: string): boolean => {
      if (!query) return true;

      if (customSearchFn) {
        return customSearchFn(item, query);
      }

      const normalizedQuery = normalize(query);

      // Search specified search fields or all columns
      const fieldsToSearch = searchFields.length > 0
        ? searchFields
        : (columns.map((c) => c.key as keyof T));

      return fieldsToSearch.some((field) => {
        const column = columns.find((c) => c.key === field);

        if (column?.searchValue) {
          const value = column.searchValue(item);
          const normalizedValue = normalize(value);
          if (normalizedValue.includes(normalizedQuery)) return true;
          if (fuzzySearch.enabled && query.length >= (fuzzySearch.minQueryLength || 2)) {
            return fuzzyMatch(query, value, (column.fuzzyWeight || 1.0) * (fuzzySearch.threshold || 0.4));
          }
          return false;
        }

        const rawValue = (item as any)[field];
        if (rawValue === null || rawValue === undefined) return false;
        const stringValue = typeof rawValue === "object" ? JSON.stringify(rawValue) : String(rawValue);
        const normalizedValue = normalize(stringValue);

        if (normalizedValue.includes(normalizedQuery)) return true;
        if (fuzzySearch.enabled && query.length >= (fuzzySearch.minQueryLength || 2)) {
          return fuzzyMatch(query, stringValue, fuzzySearch.threshold || 0.4);
        }
        return false;
      });
    },
    [columns, searchFields, customSearchFn, fuzzySearch]
  );

  // Filter data by search & active dropdown filters
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Search query check
      if (debouncedQuery && !itemMatchesQuery(item, debouncedQuery)) {
        return false;
      }

      // Filter options check
      for (const [key, value] of Object.entries(activeFilters)) {
        if (!value) continue;
        const itemVal = (item as any)[key];
        if (itemVal === undefined || itemVal === null) return false;
        if (String(itemVal) !== String(value)) return false;
      }

      return true;
    });
  }, [data, debouncedQuery, activeFilters, itemMatchesQuery]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey) {
      if (defaultSort) return [...filteredData].sort(defaultSort);
      return filteredData;
    }

    return [...filteredData].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = typeof aVal === "number" && typeof bVal === "number"
        ? aVal - bVal
        : String(aVal).localeCompare(String(bVal));

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortDirection, defaultSort]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedData.length / perPage));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedData = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * perPage;
    return sortedData.slice(startIndex, startIndex + perPage);
  }, [sortedData, validCurrentPage, perPage]);

  // Handle sort click
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") setSortDirection("desc");
      else {
        setSortKey(null);
        setSortDirection("asc");
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (onExport) {
      onExport(sortedData, activeFilters, searchQuery);
      return;
    }
    const exportHeaders = columns.map((col) => ({
      key: col.key,
      label: col.header,
    }));
    exportToCSV(sortedData, exportFileName, exportHeaders);
  };

  const activeFilterEntries = Object.entries(activeFilters).filter(([_, val]) => Boolean(val));

  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    setCurrentPage(1);
  };

  if (loading) {
    return <SkeletonTable rows={pageSize} cols={columns.length + 1} />;
  }

  return (
    <div className="space-y-3 w-full">
      {/* Table Toolbar: Search, Filters, Column Toggle, Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-zinc-200/80 shadow-xs">
        {/* Left: Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-zinc-50 hover:bg-zinc-100/70 focus:bg-white rounded-lg border border-zinc-200 outline-none text-zinc-900 transition-colors focus-ring"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-zinc-400 hover:text-zinc-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Right: Filter dropdowns, Column toggle & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Dropdown Filters */}
          {filterOptions.map((filter) => (
            <select
              key={filter.key}
              value={activeFilters[filter.key] || ""}
              onChange={(e) => {
                setActiveFilters((prev) => ({
                  ...prev,
                  [filter.key]: e.target.value,
                }));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg text-zinc-700 outline-none focus-ring"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}

          {/* Column Toggle Menu */}
          <div className="relative" ref={columnToggleRef}>
            <button
              onClick={() => setShowColumnToggle(!showColumnToggle)}
              className="p-1.5 px-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors flex items-center gap-1.5 focus-ring"
              title="Toggle Columns"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Columns</span>
            </button>

            {showColumnToggle && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-30 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-3 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-1">
                  Visible Columns
                </div>
                <div className="max-h-48 overflow-y-auto px-1">
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key] !== false}
                        onChange={() => toggleColumnVisibility(col.key)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                      />
                      <span className="truncate">{col.header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 px-2.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors flex items-center gap-1.5 focus-ring"
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Extra Toolbar Actions (e.g. Print, custom actions) */}
          {extraToolbarActions &&
            extraToolbarActions(sortedData, activeFilters, searchQuery)}

          {/* Add CTA */}
          {onAdd && (
            <button
              onClick={onAdd}
              className="p-1.5 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors focus-ring"
            >
              {addLabel}
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {(activeFilterEntries.length > 0 || debouncedQuery) && (
        <div className="flex items-center gap-2 flex-wrap px-1">
          <span className="text-[11px] font-medium text-zinc-400">Filters:</span>

          {debouncedQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
              Search: "{debouncedQuery}"
              <button onClick={() => setSearchQuery("")} className="hover:text-indigo-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {activeFilterEntries.map(([key, val]) => {
            const filterDef = filterOptions.find((f) => f.key === key);
            const optDef = filterDef?.options.find((o) => o.value === val);
            const label = optDef?.label || val;

            return (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200"
              >
                {filterDef?.label || key}: {label}
                <button
                  onClick={() =>
                    setActiveFilters((prev) => {
                      const copy = { ...prev };
                      delete copy[key];
                      return copy;
                    })
                  }
                  className="hover:text-zinc-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}

          <button
            onClick={clearAllFilters}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline ml-1"
          >
            Reset all
          </button>
        </div>
      )}

      {/* Main Table Container with Sticky Header */}
      <div className="w-full bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[640px]">
          <table className="w-full border-collapse text-left text-[13px]">
            {/* Sticky Header */}
            <thead className="sticky top-0 bg-zinc-50 border-b border-zinc-200 z-10 select-none">
              <tr>
                {columns
                  .filter((col) => visibleColumns[col.key] !== false)
                  .map((col) => (
                    <th
                      key={col.key}
                      onClick={() => col.sortable && handleSort(col.key)}
                      style={{ width: col.width }}
                      className={cn(
                        "py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider",
                        col.sortable ? "cursor-pointer hover:bg-zinc-100/80 transition-colors" : "",
                        col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left",
                        col.headerClassName
                      )}
                    >
                      <div
                        className={cn(
                          "inline-flex items-center gap-1.5",
                          col.align === "center" ? "justify-center" : col.align === "right" ? "justify-end" : "justify-start"
                        )}
                      >
                        <span>{col.header}</span>
                        {col.sortable && (
                          <span className="text-zinc-400">
                            {sortKey === col.key ? (
                              sortDirection === "asc" ? (
                                <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-60" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}

                {(onEdit || onDelete || renderActions) && (
                  <th className="py-3 px-4 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider text-right w-24">
                    Actions
                  </th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.filter((c) => visibleColumns[c.key] !== false).length + 1}
                    className="p-8 text-center"
                  >
                    <EmptyState
                      title={emptyTitle}
                      description={emptyMessage}
                      action={onAdd ? { label: addLabel, onClick: onAdd } : undefined}
                    />
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIndex) => (
                  <tr
                    key={String(item.id)}
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "hover:bg-zinc-50/80 transition-colors",
                      onRowClick ? "cursor-pointer" : ""
                    )}
                  >
                    {columns
                      .filter((col) => visibleColumns[col.key] !== false)
                      .map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            "py-3 px-4 text-zinc-700 align-middle",
                            col.align === "center" ? "text-center" : col.align === "right" ? "text-right tabular-nums" : "text-left",
                            col.className
                          )}
                        >
                          {col.render ? col.render(item) : String((item as any)[col.key] ?? "")}
                        </td>
                      ))}

                    {/* Actions Column */}
                    {(onEdit || onDelete || renderActions) && (
                      <td
                        className="py-3 px-4 text-right align-middle shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {renderActions && renderActions(item)}

                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus-ring"
                              title="Edit item"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {onDelete && (
                            <button
                              onClick={() => onDelete(Number(item.id))}
                              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors focus-ring"
                              title="Delete item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-200 bg-zinc-50/50 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span>
              Showing <span className="font-semibold text-zinc-800 tabular-nums">{sortedData.length > 0 ? (validCurrentPage - 1) * perPage + 1 : 0}</span> to{" "}
              <span className="font-semibold text-zinc-800 tabular-nums">
                {Math.min(validCurrentPage * perPage, sortedData.length)}
              </span>{" "}
              of <span className="font-semibold text-zinc-800 tabular-nums">{sortedData.length}</span> records
            </span>

            <span className="text-zinc-300">|</span>

            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 border border-zinc-200 rounded bg-white text-zinc-700 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="px-2 py-1 text-xs font-medium text-zinc-700 tabular-nums">
              Page {validCurrentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}