"use client";

import React, { useMemo } from "react";
import { ALL_SUBJECTS, SUBJECT_CATEGORIES, getMergedSubjectList } from "@/lib/subjects";
import { SearchableSelect, SearchableSelectGroup } from "@/components/ui/searchable-select";
import { BookOpen } from "lucide-react";

export interface SubjectSelectProps {
  value: string;
  onChange: (val: string) => void;
  programSubjects?: string[];
  extraSubjects?: string[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  name?: string;
  size?: "sm" | "md";
}

export function SubjectSelect({
  value,
  onChange,
  programSubjects = [],
  extraSubjects = [],
  placeholder = "Select or search subject...",
  className = "",
  required = false,
  disabled = false,
  id,
  name,
  size = "md",
}: SubjectSelectProps) {
  // Construct grouped options for SearchableSelect
  const groups = useMemo<SearchableSelectGroup[]>(() => {
    const result: SearchableSelectGroup[] = [];
    const addedSubjects = new Set<string>();

    // 1. Program Specific Curriculum Subjects (Priority)
    if (programSubjects && programSubjects.length > 0) {
      const progClean = programSubjects.filter(Boolean).map((s) => s.trim());
      if (progClean.length > 0) {
        result.push({
          label: "Program Curriculum Subjects",
          options: progClean.map((sub) => {
            addedSubjects.add(sub);
            return {
              value: sub,
              label: sub,
              badge: "Curriculum",
              icon: <BookOpen className="w-3.5 h-3.5 text-indigo-500" />,
            };
          }),
        });
      }
    }

    // 2. Standard NCTB Subject Categories
    SUBJECT_CATEGORIES.forEach((cat) => {
      const availableInCat = cat.subjects.filter((sub) => !addedSubjects.has(sub));
      if (availableInCat.length > 0) {
        result.push({
          label: cat.category,
          options: availableInCat.map((sub) => {
            addedSubjects.add(sub);
            return {
              value: sub,
              label: sub,
              group: cat.category,
            };
          }),
        });
      }
    });

    // 3. Dynamic / Extra Database Subjects
    const dynamicExtras = (extraSubjects || []).filter(
      (s) => s && s.trim() && !addedSubjects.has(s.trim()) && !s.includes("+") && s !== "Attendence"
    );
    if (dynamicExtras.length > 0) {
      result.push({
        label: "Additional Subjects",
        options: dynamicExtras.map((sub) => ({
          value: sub.trim(),
          label: sub.trim(),
          group: "Additional Subjects",
        })),
      });
    }

    return result;
  }, [programSubjects, extraSubjects]);

  return (
    <SearchableSelect
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      groups={groups}
      placeholder={placeholder}
      searchPlaceholder="Search subject or type custom topic..."
      emptyMessage="No matching subjects found"
      size={size}
      required={required}
      disabled={disabled}
      creatable={true}
      creatableText={(q) => `Use custom: "${q}"`}
      className={className}
    />
  );
}
