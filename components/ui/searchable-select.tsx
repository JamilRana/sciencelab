"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useId,
} from "react";
import { Search, ChevronDown, Check, X, Plus } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  subtitle?: string;
  badge?: string;
  group?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SearchableSelectGroup {
  label: string;
  options: SearchableSelectOption[];
}

export interface SearchableSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options?: SearchableSelectOption[];
  groups?: SearchableSelectGroup[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  creatable?: boolean;
  creatableText?: (query: string) => string;
  size?: "sm" | "md" | "lg";
  className?: string;
  triggerClassName?: string;
  popoverClassName?: string;
  error?: boolean | string;
  id?: string;
  name?: string;
}

export function SearchableSelect({
  value,
  onChange,
  options = [],
  groups,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  emptyMessage = "No options found",
  disabled = false,
  required = false,
  clearable = true,
  creatable = false,
  creatableText = (q) => `Use custom: "${q}"`,
  size = "md",
  className = "",
  triggerClassName = "",
  popoverClassName = "",
  error,
  id,
  name,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Flatten all incoming options whether from groups or options prop
  const allOptions = useMemo<SearchableSelectOption[]>(() => {
    if (groups && groups.length > 0) {
      return groups.flatMap((g) =>
        g.options.map((opt) => ({
          ...opt,
          group: opt.group || g.label,
        }))
      );
    }
    return options;
  }, [groups, options]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === "") return null;
    return allOptions.find((opt) => opt.value === value) || {
      value,
      label: value,
    };
  }, [value, allOptions]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchValue = opt.value.toLowerCase().includes(q);
      const matchSubtitle = opt.subtitle?.toLowerCase().includes(q) ?? false;
      const matchGroup = opt.group?.toLowerCase().includes(q) ?? false;
      return matchLabel || matchValue || matchSubtitle || matchGroup;
    });
  }, [allOptions, searchQuery]);

  // Determine if search query is a new custom item
  const showCreatable = useMemo(() => {
    if (!creatable || !searchQuery.trim()) return false;
    const q = searchQuery.trim().toLowerCase();
    const exactMatch = allOptions.some(
      (opt) => opt.label.toLowerCase() === q || opt.value.toLowerCase() === q
    );
    return !exactMatch;
  }, [creatable, searchQuery, allOptions]);

  // Group filtered options for rendering
  const renderedGroups = useMemo(() => {
    const map = new Map<string, SearchableSelectOption[]>();
    const ungrouped: SearchableSelectOption[] = [];

    for (const opt of filteredOptions) {
      if (opt.group) {
        const arr = map.get(opt.group) || [];
        arr.push(opt);
        map.set(opt.group, arr);
      } else {
        ungrouped.push(opt);
      }
    }

    const result: { group?: string; options: SearchableSelectOption[] }[] = [];
    if (ungrouped.length > 0) {
      result.push({ options: ungrouped });
    }
    for (const [group, opts] of map.entries()) {
      result.push({ group, options: opts });
    }
    return result;
  }, [filteredOptions]);

  // List of navigable items (flattened selectable options + creatable item if present)
  const navigableItems = useMemo(() => {
    const items: { type: "option" | "creatable"; data?: SearchableSelectOption; query?: string }[] = [];
    for (const opt of filteredOptions) {
      if (!opt.disabled) {
        items.push({ type: "option", data: opt });
      }
    }
    if (showCreatable) {
      items.push({ type: "creatable", query: searchQuery.trim() });
    }
    return items;
  }, [filteredOptions, showCreatable, searchQuery]);

  // Determine popover position on open
  useEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 260 && spaceAbove > spaceBelow) {
      setPlacement("top");
    } else {
      setPlacement("bottom");
    }

    // Auto focus search input
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 20);
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isOpen]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-nav-index="${highlightedIndex}"]`
    );
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Select an item
  const handleSelect = useCallback(
    (val: string) => {
      onChange(val);
      setIsOpen(false);
      setSearchQuery("");
      setHighlightedIndex(-1);
      triggerRef.current?.focus();
    },
    [onChange]
  );

  // Clear selection
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange("");
      setSearchQuery("");
    },
    [onChange]
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery("");
      triggerRef.current?.focus();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < navigableItems.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : navigableItems.length - 1
      );
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < navigableItems.length) {
        const item = navigableItems[highlightedIndex];
        if (item.type === "option" && item.data) {
          handleSelect(item.data.value);
        } else if (item.type === "creatable" && item.query) {
          handleSelect(item.query);
        }
      } else if (showCreatable) {
        handleSelect(searchQuery.trim());
      } else if (navigableItems.length > 0) {
        const first = navigableItems[0];
        if (first.type === "option" && first.data) {
          handleSelect(first.data.value);
        }
      }
    }
  };

  // Size variations
  const sizeClasses = {
    sm: "h-8 text-xs px-2.5 py-1",
    md: "h-9 text-sm px-3 py-1.5",
    lg: "h-11 text-base px-3.5 py-2",
  };

  const isSelected = Boolean(selectedOption && selectedOption.value !== "");

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for HTML form submissions */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value || ""}
          required={required}
        />
      )}

      {/* Main Dropdown Trigger */}
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setHighlightedIndex(-1);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`group relative w-full flex items-center justify-between gap-2 text-left rounded-lg border transition-all duration-150 ${
          sizeClasses[size]
        } ${
          disabled
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
            : error
            ? "bg-white dark:bg-zinc-900 border-rose-300 dark:border-rose-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            : isOpen
            ? "bg-white dark:bg-zinc-900 border-indigo-500 ring-2 ring-indigo-500/20"
            : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="shrink-0 text-zinc-500">{selectedOption.icon}</span>
          )}
          {isSelected ? (
            <div className="flex items-center gap-2 min-w-0 truncate">
              <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                {selectedOption?.label}
              </span>
              {selectedOption?.badge && (
                <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500 truncate">
              {placeholder}
            </span>
          )}
        </div>

        {/* Action icons: Clear button & Chevron */}
        <div className="flex items-center gap-1 shrink-0 text-zinc-400">
          {clearable && isSelected && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              title="Clear selection"
              className="p-0.5 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            >
              <X className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
            </span>
          )}
          <ChevronDown
            className={`transition-transform duration-200 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 ${
              size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
            } ${isOpen ? "rotate-180 text-indigo-600 dark:text-indigo-400" : ""}`}
          />
        </div>
      </button>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 w-full min-w-[220px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 ${
            placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
          } ${popoverClassName}`}
        >
          {/* Pinned Search Input */}
          <div className="p-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightedIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1 divide-y divide-zinc-50 dark:divide-zinc-800/60 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700"
          >
            {/* Quick Creatable option at top if typed query */}
            {showCreatable && (
              <div className="p-1">
                <button
                  type="button"
                  data-nav-index={navigableItems.findIndex(
                    (i) => i.type === "creatable"
                  )}
                  onClick={() => handleSelect(searchQuery.trim())}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-xs rounded-lg transition-colors font-medium ${
                    highlightedIndex ===
                    navigableItems.findIndex((i) => i.type === "creatable")
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {creatableText(searchQuery.trim())}
                  </span>
                </button>
              </div>
            )}

            {/* Empty state */}
            {filteredOptions.length === 0 && !showCreatable && (
              <div className="py-6 px-4 text-center">
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {emptyMessage}
                </p>
                {searchQuery && (
                  <p className="text-[11px] text-zinc-400 mt-1">
                    No results for &ldquo;{searchQuery}&rdquo;
                  </p>
                )}
              </div>
            )}

            {/* Render Groups and Options */}
            {renderedGroups.map((grp, grpIdx) => (
              <div key={grp.group || `ungrouped-${grpIdx}`} className="py-1">
                {grp.group && (
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {grp.group}
                  </div>
                )}
                <div className="space-y-0.5">
                  {grp.options.map((opt) => {
                    const navIdx = navigableItems.findIndex(
                      (i) => i.type === "option" && i.data?.value === opt.value
                    );
                    const isItemHighlighted = highlightedIndex === navIdx;
                    const isItemActive = value === opt.value;

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={opt.disabled}
                        data-nav-index={navIdx}
                        onClick={() => handleSelect(opt.value)}
                        onMouseEnter={() => setHighlightedIndex(navIdx)}
                        role="option"
                        aria-selected={isItemActive}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-left text-xs rounded-lg transition-colors ${
                          opt.disabled
                            ? "opacity-40 cursor-not-allowed"
                            : isItemActive
                            ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-200 font-semibold"
                            : isItemHighlighted
                            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {opt.icon && (
                            <span className="shrink-0 text-zinc-400">
                              {opt.icon}
                            </span>
                          )}
                          <div className="min-w-0 truncate">
                            <span className="block truncate">{opt.label}</span>
                            {opt.subtitle && (
                              <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 truncate font-normal">
                                {opt.subtitle}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {opt.badge && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                              {opt.badge}
                            </span>
                          )}
                          {isItemActive && (
                            <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Popover Footer summary */}
          <div className="px-2.5 py-1.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 flex items-center justify-between text-[11px] text-zinc-400">
            <span>
              {filteredOptions.length}{" "}
              {filteredOptions.length === 1 ? "option" : "options"}
            </span>
            <span className="text-[10px] text-zinc-400">
              Press <kbd className="px-1 py-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded text-[9px]">↵</kbd> to select
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
