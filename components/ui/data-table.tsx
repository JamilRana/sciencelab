// components/ui/data-table.tsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, Filter, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { fuzzyMatch, normalize } from "@/lib/fuzzy-search";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
  searchValue?: (item: T) => string; // Custom search extractor
  fuzzyWeight?: number; // Weight for fuzzy matching (default: 1.0)
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
  customSearchFn?: (item: T, query: string) => boolean;
  // 🔹 New: Fuzzy search settings
  fuzzySearch?: {
    enabled?: boolean;
    threshold?: number; // 0.0 to 1.0, default 0.4
    minQueryLength?: number; // Only fuzzy match if query >= this length
  };
  // 🔹 New: Debounce settings
  searchDebounceMs?: number; // Default: 300ms
  // 🔹 New: Default sort function for complex sorting (e.g., nested properties)
  defaultSort?: (a: T, b: T) => number;
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
  customSearchFn,
  fuzzySearch = { enabled: true, threshold: 0.4, minQueryLength: 2 },
  searchDebounceMs = 300,
  defaultSort,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isFuzzyActive, setIsFuzzyActive] = useState(false);

  // 🔹 Debounced search query
  const debouncedQuery = useDebouncedValue(searchQuery, searchDebounceMs);

  // 🔹 Helper: Extract searchable value from item
  const getSearchableValue = useCallback((item: T, field: keyof T): string => {
    const value = item[field];
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return normalize(value);
    if (typeof value === "number") return value.toString();
    if (typeof value === "object" && value !== null) {
      return normalize(JSON.stringify(value));
    }
    return String(value);
  }, []);

  // 🔹 Helper: Check if item matches query (substring OR fuzzy)
  const itemMatchesQuery = useCallback((item: T, query: string): boolean => {
    if (!query) return true;
    
    const normalizedQuery = normalize(query);
    
    // 🔹 Custom search function takes priority
    if (customSearchFn) {
      return customSearchFn(item, query);
    }

    // 🔹 Check each search field
    return searchFields.some((field) => {
      const column = columns.find((c) => c.key === field);
      const searchValue = column?.searchValue 
        ? normalize(column.searchValue(item))
        : getSearchableValue(item, field);
      
      if (!searchValue) return false;
      
      // 🔹 First try exact/substring match (fast path)
      if (searchValue.includes(normalizedQuery)) {
        return true;
      }
      
      // 🔹 Fuzzy match if enabled and query is long enough
      if (
        fuzzySearch.enabled !== false &&
        normalizedQuery.length >= (fuzzySearch.minQueryLength || 2)
      ) {
        const weight = column?.fuzzyWeight ?? 1.0;
        const threshold = (fuzzySearch.threshold ?? 0.4) * (2 - weight); // Adjust threshold by weight
        const score = fuzzyMatch(normalizedQuery, searchValue, threshold);
        
        if (score) {
          setIsFuzzyActive(true);
          return true;
        }
      }
      
      return false;
    });
  }, [searchFields, columns, customSearchFn, fuzzySearch, getSearchableValue]);

  // 🔹 Main filtering, sorting, pagination logic
  const { filteredData, resultInfo } = useMemo(() => {
    let result = [...data];
    let fuzzyMatches = 0;
    let exactMatches = 0;

    // 🔹 Apply search
    if (debouncedQuery && searchFields.length > 0) {
      result = result.filter((item) => {
        const matches = itemMatchesQuery(item, debouncedQuery);
        if (matches) {
          // Track match type for info display
          const normalizedQuery = normalize(debouncedQuery);
          const hasExact = searchFields.some((field) => {
            const column = columns.find((c) => c.key === field);
            const value = column?.searchValue 
              ? normalize(column.searchValue(item))
              : getSearchableValue(item, field);
            return value.includes(normalizedQuery);
          });
          if (hasExact) exactMatches++;
          else fuzzyMatches++;
        }
        return matches;
      });
    }

    // 🔹 Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((item) => {
          const itemValue = (item as Record<string, unknown>)[key];
          return String(itemValue) === value;
        });
      }
    });

    // 🔹 Apply sorting
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[sortKey];
        const bVal = (b as Record<string, unknown>)[sortKey];
        
        if (aVal === bVal) return 0;
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === "string" && typeof bVal === "string") {
          const comparison = aVal.localeCompare(bVal);
          return sortDirection === "asc" ? comparison : -comparison;
        }
        
        const comparison = aVal < bVal ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    } else if (defaultSort) {
      // Use default sort function when no explicit sort is set
      result.sort(defaultSort);
    }

    return {
      filteredData: result,
      resultInfo: { exactMatches, fuzzyMatches, total: result.length },
    };
  }, [
    data,
    debouncedQuery,
    searchFields,
    activeFilters,
    sortKey,
    sortDirection,
    itemMatchesQuery,
    columns,
    getSearchableValue,
  ]);

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, activeFilters, sortKey]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    setCurrentPage(1);
    setIsFuzzyActive(false);
  };

  const hasActiveFilters = Object.values(activeFilters).some((v) => v) || searchQuery;

  return (
    <div className="space-y-4">
      {/* 🔹 Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border">
        <div className="relative w-full sm:max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={placeholder}
            className="w-full pl-10 pr-10 h-11 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {/* 🔹 Fuzzy search indicator */}
          {isFuzzyActive && debouncedQuery && fuzzySearch.enabled !== false && (
            <div className="absolute -bottom-6 left-0 flex items-center gap-1 text-xs text-amber-600">
              <Sparkles className="h-3 w-3" />
              <span>Showing fuzzy matches</span>
            </div>
          )}
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

      {/* 🔹 Search Result Info */}
      {debouncedQuery && (
        <div className="flex items-center justify-between text-sm text-gray-500 px-2">
          <p>
            Found <span className="font-medium text-gray-700">{resultInfo.total}</span> result
            {resultInfo.total !== 1 ? "s" : ""}
            {resultInfo.fuzzyMatches > 0 && (
              <span className="ml-1 text-amber-600">
                ({resultInfo.exactMatches} exact, {resultInfo.fuzzyMatches} fuzzy)
              </span>
            )}
            for "{debouncedQuery}"
          </p>
          {fuzzySearch.enabled !== false && (
            <button
              onClick={() => setSearchQuery(debouncedQuery)} // Force re-evaluate with current query
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Refine search
            </button>
          )}
        </div>
      )}

      {/* 🔹 Filter Dropdowns */}
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

      {/* 🔹 Table */}
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
                                aria-label="Edit"
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
                                aria-label="Delete"
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
                  <td 
                    colSpan={columns.length + (onEdit || onDelete || renderActions ? 1 : 0)} 
                    className="p-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-14 w-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search className="h-7 w-7 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-gray-700 font-medium">{emptyMessage}</p>
                        {debouncedQuery && (
                          <p className="text-sm text-gray-500 mt-1">
                            No results for "{debouncedQuery}"
                          </p>
                        )}
                      </div>
                      {hasActiveFilters && (
                        <button 
                          onClick={clearFilters}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 🔹 Pagination */}
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
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) pageNum = i + 1;
                  else if (currentPage <= 3) pageNum = i + 1;
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                  else pageNum = currentPage - 2 + i;
                  
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
                      aria-label={`Page ${pageNum}`}
                      aria-current={currentPage === pageNum ? "page" : undefined}
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
                aria-label="Next page"
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