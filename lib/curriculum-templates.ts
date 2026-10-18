export interface TemplateSubject {
  name: string;
  code: string;
  isCombined: boolean;
  combinedGroupId: string | null;
  isOptional: boolean;
  hasPractical: boolean;
  fullMarks: number;
  cqMax: number;
  mcqMax: number;
  practicalMax: number;
  sortOrder: number;
}

export interface CurriculumTemplate {
  name: string;
  category: "SSC" | "JSC";
  subjects: TemplateSubject[];
}

export const CURRICULUM_TEMPLATES: Record<string, CurriculumTemplate> = {
  SSC_SCIENCE: {
    name: "SSC Science (9 Subjects)",
    category: "SSC",
    subjects: [
      { name: "Bangla 1st", code: "101", isCombined: true, combinedGroupId: "BANGLA", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 1 },
      { name: "Bangla 2nd", code: "102", isCombined: true, combinedGroupId: "BANGLA", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 2 },
      { name: "English 1st", code: "107", isCombined: true, combinedGroupId: "ENGLISH", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, practicalMax: 0, sortOrder: 3 },
      { name: "English 2nd", code: "108", isCombined: true, combinedGroupId: "ENGLISH", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, practicalMax: 0, sortOrder: 4 },
      { name: "General Math", code: "109", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 5 },
      { name: "Physics", code: "136", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: true, fullMarks: 100, cqMax: 50, mcqMax: 25, practicalMax: 25, sortOrder: 6 },
      { name: "Chemistry", code: "137", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: true, fullMarks: 100, cqMax: 50, mcqMax: 25, practicalMax: 25, sortOrder: 7 },
      { name: "Biology", code: "138", isCombined: false, combinedGroupId: null, isOptional: true, hasPractical: true, fullMarks: 100, cqMax: 50, mcqMax: 25, practicalMax: 25, sortOrder: 8 },
      { name: "Higher Math", code: "126", isCombined: false, combinedGroupId: null, isOptional: true, hasPractical: true, fullMarks: 100, cqMax: 50, mcqMax: 25, practicalMax: 25, sortOrder: 9 },
    ],
  },
  SSC_COMMERCE: {
    name: "SSC Business Studies / Commerce (9 Subjects)",
    category: "SSC",
    subjects: [
      { name: "Bangla 1st", code: "101", isCombined: true, combinedGroupId: "BANGLA", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 1 },
      { name: "Bangla 2nd", code: "102", isCombined: true, combinedGroupId: "BANGLA", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 2 },
      { name: "English 1st", code: "107", isCombined: true, combinedGroupId: "ENGLISH", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, practicalMax: 0, sortOrder: 3 },
      { name: "English 2nd", code: "108", isCombined: true, combinedGroupId: "ENGLISH", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, practicalMax: 0, sortOrder: 4 },
      { name: "General Math", code: "109", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 5 },
      { name: "Accounting", code: "146", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 6 },
      { name: "Business Entrepreneurship", code: "143", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 7 },
      { name: "Finance & Banking", code: "152", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 8 },
      { name: "General Science", code: "127", isCombined: false, combinedGroupId: null, isOptional: true, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 9 },
    ],
  },
  SSC_HUMANITIES: {
    name: "SSC Humanities / Arts (9 Subjects)",
    category: "SSC",
    subjects: [
      { name: "Bangla 1st", code: "101", isCombined: true, combinedGroupId: "BANGLA", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 1 },
      { name: "Bangla 2nd", code: "102", isCombined: true, combinedGroupId: "BANGLA", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 2 },
      { name: "English 1st", code: "107", isCombined: true, combinedGroupId: "ENGLISH", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, practicalMax: 0, sortOrder: 3 },
      { name: "English 2nd", code: "108", isCombined: true, combinedGroupId: "ENGLISH", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, practicalMax: 0, sortOrder: 4 },
      { name: "General Math", code: "109", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 5 },
      { name: "Geography & Environment", code: "110", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: true, fullMarks: 100, cqMax: 50, mcqMax: 25, practicalMax: 25, sortOrder: 6 },
      { name: "History of Bangladesh", code: "153", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 7 },
      { name: "Civics & Citizenship", code: "140", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 8 },
      { name: "Economics", code: "141", isCombined: false, combinedGroupId: null, isOptional: true, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 9 },
    ],
  },
  JSC_GENERAL: {
    name: "Junior School Certificate (5 Subjects)",
    category: "JSC",
    subjects: [
      { name: "Bangla", code: "101", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 1 },
      { name: "English", code: "107", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, practicalMax: 0, sortOrder: 2 },
      { name: "Mathematics", code: "109", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 3 },
      { name: "General Science", code: "127", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 4 },
      { name: "BGS (Social Science)", code: "150", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, practicalMax: 0, sortOrder: 5 },
    ],
  },
};
