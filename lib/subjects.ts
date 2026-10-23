/**
 * Comprehensive Subject Master List for ScienceLab
 *
 * Covers NCTB curriculum subjects (Secondary / Higher Secondary / Coaching programs),
 * legacy database subjects, and curriculum templates.
 */

export interface SubjectCategoryGroup {
  category: string;
  subjects: string[];
}

export const SUBJECT_CATEGORIES: SubjectCategoryGroup[] = [
  {
    category: "Science",
    subjects: [
      "Physics",
      "Chemistry",
      "Biology",
      "Higher Math",
      "General Science",
      "Science",
    ],
  },
  {
    category: "Mathematics",
    subjects: [
      "Mathematics",
      "General Math",
      "Higher Mathematics",
    ],
  },
  {
    category: "Languages (Bangla & English)",
    subjects: [
      "Bangla",
      "Bangla 1st",
      "Bangla 2nd",
      "Bangla 1st Paper",
      "Bangla 2nd Paper",
      "English",
      "English 1st",
      "English 2nd",
      "English 1st Paper",
      "English 2nd Paper",
    ],
  },
  {
    category: "Social Studies & Technology",
    subjects: [
      "Bangladesh & Global Studies (BGS)",
      "BGS",
      "ICT",
    ],
  },
  {
    category: "Religious & Moral Studies",
    subjects: [
      "Islam & Moral Education",
      "Islam Shikkha",
      "Hindu Religious Studies",
    ],
  },
  {
    category: "Commerce / Business Studies",
    subjects: [
      "Accounting",
      "Finance & Banking",
      "Business Entrepreneurship",
    ],
  },
  {
    category: "Humanities / Arts",
    subjects: [
      "Geography & Environment",
      "History of Bangladesh",
      "Civics & Citizenship",
      "Economics",
    ],
  },
];

/**
 * Flat, unique, alphabetically sorted list of all standard subjects.
 */
export const ALL_SUBJECTS: string[] = Array.from(
  new Set(SUBJECT_CATEGORIES.flatMap((g) => g.subjects))
).sort((a, b) => a.localeCompare(b));

/**
 * Combines standard subjects with any dynamic subjects defined in programs or exam tables.
 */
export function getMergedSubjectList(extraSubjects: string[] = []): string[] {
  const set = new Set<string>(ALL_SUBJECTS);
  for (const s of extraSubjects) {
    if (s && s.trim() && !s.includes("+") && s !== "Attendence") {
      set.add(s.trim());
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
