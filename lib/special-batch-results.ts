// lib/special-batch-results.ts
/**
 * Official Bangladesh Education Board Standard Result & Merit Engine
 * Compatible with SSC & Junior School examination standards
 */

export interface GradeStep {
  minPercent: number;
  gradePoint: number;
  letter: string;
}

export const BOARD_STANDARD_GRADE_STEPS: GradeStep[] = [
  { minPercent: 80, gradePoint: 5.0, letter: "A+" },
  { minPercent: 70, gradePoint: 4.0, letter: "A" },
  { minPercent: 60, gradePoint: 3.5, letter: "A-" },
  { minPercent: 50, gradePoint: 3.0, letter: "B" },
  { minPercent: 40, gradePoint: 2.0, letter: "C" },
  { minPercent: 33, gradePoint: 1.0, letter: "D" },
  { minPercent: 0, gradePoint: 0.0, letter: "F" },
];

export interface ResultRuleConfig {
  failGpa: number; // 0.00
  optionalBonusValue: number; // 2.0 (Board standard: GP - 2)
  gpaCap: number; // 5.00
  decimals: number; // 2
  requireEachPaperPass: boolean; // false (Board evaluates combined papers together)
  tieBreaker: "TOTAL_MARKS" | "COMPULSORY_MARKS";
}

export const BOARD_STANDARD_RESULT_RULE: ResultRuleConfig = {
  failGpa: 0.0,
  optionalBonusValue: 2.0,
  gpaCap: 5.0,
  decimals: 2,
  requireEachPaperPass: false,
  tieBreaker: "TOTAL_MARKS",
};

export interface SubjectMarkEntry {
  subjectId: number;
  subjectName: string;
  code?: string;
  combinedGroup?: string | null; // e.g. "Bangla", "English"
  isOptional: boolean;
  isCompulsory?: boolean; // Defined by test creator (defaults to true)
  maxMark: number;
  written: number;
  objective: number;
  single?: number;
  absent: boolean;
}

export interface StudentRosterItem {
  id: number;
  name: string;
  roll: number;
  displayRoll: string | number;
  class: string;
  batchName?: string;
  section?: "BOYS" | "GIRLS" | "MIXED";
  schoolName?: string;
  optionalSubjectId?: number | null;
}

export interface ProcessedSubjectResult {
  subjectId: number;
  subjectName: string;
  combinedGroup?: string | null;
  isOptional: boolean;
  written: number;
  objective: number;
  total: number;
  maxMark: number;
  percentage: number;
  gradePoint: number;
  letter: string;
  isPassed: boolean;
  absent: boolean;
}

export interface ProcessedStudentExamResult {
  id: number;
  student: StudentRosterItem;
  subjects: ProcessedSubjectResult[];
  compulsorySubjectsCount: number;
  totalMarksObtained: number;
  totalMarksPossible: number;
  overallPercentage: number;
  compulsoryGradePointsSum: number;
  optionalSubjectResult?: ProcessedSubjectResult | null;
  optionalBonusPoints: number;
  gpa: number;
  finalGradeLetter: string;
  isPassed: boolean;
  failedSubjectNames: string[];
  rank: number;
}

/**
 * Determine Grade Point and Letter Grade based on percentage
 */
export function getGradeStepForPercentage(
  percent: number,
  gradeSteps: GradeStep[] = BOARD_STANDARD_GRADE_STEPS
): GradeStep {
  for (const step of gradeSteps) {
    if (percent >= step.minPercent) {
      return step;
    }
  }
  return gradeSteps[gradeSteps.length - 1];
}

/**
 * Convert GPA to Board Letter Grade
 */
export function getLetterForGpa(gpa: number, isPassed: boolean): string {
  if (!isPassed || gpa <= 0) return "F";
  if (gpa >= 5.0) return "A+";
  if (gpa >= 4.0) return "A";
  if (gpa >= 3.5) return "A-";
  if (gpa >= 3.0) return "B";
  if (gpa >= 2.0) return "C";
  if (gpa >= 1.0) return "D";
  return "F";
}

/**
 * Process student exam marks according to Bangladesh Education Board Standard
 * Compulsory subjects are defined by the test creator (isCompulsory: true/false),
 * along with student-specific optional 4th subject designations.
 */
export function calculateBoardStandardResults(
  roster: StudentRosterItem[],
  marksMap: Record<number, Record<number, SubjectMarkEntry>>, // [studentId][subjectId]
  subjectsConfig: Array<{
    id: number;
    name: string;
    code?: string;
    combinedGroup?: string | null;
    isCompulsory?: boolean; // Defined by test creator (default true)
    maxMark: number;
    sortOrder?: number;
  }>,
  gradeSteps: GradeStep[] = BOARD_STANDARD_GRADE_STEPS,
  rule: ResultRuleConfig = BOARD_STANDARD_RESULT_RULE
): ProcessedStudentExamResult[] {
  if (!roster || roster.length === 0) return [];

  // Group subjects by combinedGroup (e.g. "Bangla" -> [Bangla 1st, Bangla 2nd])
  const combinedGroups = new Set<string>();
  subjectsConfig.forEach((s) => {
    if (s.combinedGroup) combinedGroups.add(s.combinedGroup);
  });

  const studentResults: ProcessedStudentExamResult[] = roster.map((student) => {
    const studentMarks = marksMap[student.id] || {};
    const processedSubjects: ProcessedSubjectResult[] = [];
    const failedSubjectNames: string[] = [];

    let totalMarksObtained = 0;
    let totalMarksPossible = 0;

    // Process individual and combined papers
    // 1. Process stand-alone subjects
    subjectsConfig.forEach((sub) => {
      const markEntry = studentMarks[sub.id];
      // Compulsory subject defined by test creator; if marked not compulsory or if it matches student's 4th subject:
      const isCreatorOptional = sub.isCompulsory === false;
      const isStudentOptional = student.optionalSubjectId === sub.id;
      const isOptional = isCreatorOptional || isStudentOptional;

      const written = markEntry ? markEntry.written : 0;
      const objective = markEntry ? markEntry.objective : 0;
      const single = markEntry?.single !== undefined ? markEntry.single : written + objective;
      const absent = markEntry ? markEntry.absent : true;

      const subjectTotal = absent ? 0 : single;
      const percentage = sub.maxMark > 0 ? (subjectTotal / sub.maxMark) * 100 : 0;
      const step = getGradeStepForPercentage(percentage, gradeSteps);
      const isPassed = !absent && step.gradePoint >= 1.0;

      totalMarksObtained += subjectTotal;
      totalMarksPossible += sub.maxMark;

      processedSubjects.push({
        subjectId: sub.id,
        subjectName: sub.name,
        combinedGroup: sub.combinedGroup,
        isOptional,
        written,
        objective,
        total: subjectTotal,
        maxMark: sub.maxMark,
        percentage: parseFloat(percentage.toFixed(2)),
        gradePoint: step.gradePoint,
        letter: step.letter,
        isPassed,
        absent,
      });
    });

    // Handle combined groups (e.g. Bangla 1st + 2nd)
    // Board rule: Combined total / combined maxMark determines the group grade
    const evaluatedCompulsorySubjects: Array<{ name: string; gradePoint: number; isPassed: boolean }> = [];

    // Handle groups
    const processedGroupNames = new Set<string>();

    processedSubjects.forEach((ps) => {
      if (ps.isOptional) return;

      if (ps.combinedGroup) {
        if (!processedGroupNames.has(ps.combinedGroup)) {
          processedGroupNames.add(ps.combinedGroup);
          const groupPapers = processedSubjects.filter((s) => s.combinedGroup === ps.combinedGroup && !s.isOptional);
          const groupTotal = groupPapers.reduce((sum, p) => sum + p.total, 0);
          const groupMax = groupPapers.reduce((sum, p) => sum + p.maxMark, 0);
          const groupPercent = groupMax > 0 ? (groupTotal / groupMax) * 100 : 0;
          const groupStep = getGradeStepForPercentage(groupPercent, gradeSteps);

          let groupPassed = groupStep.gradePoint >= 1.0;
          if (rule.requireEachPaperPass) {
            const anyPaperFailed = groupPapers.some((p) => !p.isPassed);
            if (anyPaperFailed) groupPassed = false;
          }

          if (!groupPassed) {
            failedSubjectNames.push(ps.combinedGroup);
          }

          evaluatedCompulsorySubjects.push({
            name: ps.combinedGroup,
            gradePoint: groupPassed ? groupStep.gradePoint : 0,
            isPassed: groupPassed,
          });
        }
      } else {
        if (!ps.isPassed) {
          failedSubjectNames.push(ps.subjectName);
        }
        evaluatedCompulsorySubjects.push({
          name: ps.subjectName,
          gradePoint: ps.isPassed ? ps.gradePoint : 0,
          isPassed: ps.isPassed,
        });
      }
    });

    // Check overall pass/fail condition
    const isPassed = failedSubjectNames.length === 0;

    // Calculate Optional 4th Subject Bonus (Board rule: max(0, GP - 2))
    const optionalSubjectResult: ProcessedSubjectResult | null =
      processedSubjects.find((s) => s.isOptional) || null;

    let optionalBonusPoints = 0;
    if (optionalSubjectResult && optionalSubjectResult.gradePoint > rule.optionalBonusValue) {
      optionalBonusPoints = optionalSubjectResult.gradePoint - rule.optionalBonusValue;
    }

    // Calculate GPA
    const compulsoryCount = Math.max(1, evaluatedCompulsorySubjects.length);
    const compulsoryGradePointsSum = evaluatedCompulsorySubjects.reduce((sum, s) => sum + s.gradePoint, 0);

    let gpa = rule.failGpa;
    if (isPassed) {
      const calculatedGpa = (compulsoryGradePointsSum + optionalBonusPoints) / compulsoryCount;
      gpa = Math.min(rule.gpaCap, parseFloat(calculatedGpa.toFixed(rule.decimals)));
    }

    const finalGradeLetter = getLetterForGpa(gpa, isPassed);
    const overallPercentage = totalMarksPossible > 0
      ? parseFloat(((totalMarksObtained / totalMarksPossible) * 100).toFixed(2))
      : 0;

    return {
      id: student.id,
      student,
      subjects: processedSubjects,
      compulsorySubjectsCount: compulsoryCount,
      totalMarksObtained,
      totalMarksPossible,
      overallPercentage,
      compulsoryGradePointsSum,
      optionalSubjectResult,
      optionalBonusPoints,
      gpa,
      finalGradeLetter,
      isPassed,
      failedSubjectNames,
      rank: 0, // Assigned in next step
    };
  });

  // Sort and assign ranks:
  // 1. Passed students first, then failed students
  // 2. High GPA first, then High Total Marks
  const sorted = [...studentResults].sort((a, b) => {
    // Pass status
    if (a.isPassed !== b.isPassed) {
      return a.isPassed ? -1 : 1;
    }
    // GPA (descending)
    if (b.gpa !== a.gpa) {
      return b.gpa - a.gpa;
    }
    // Total Marks (descending)
    return b.totalMarksObtained - a.totalMarksObtained;
  });

  // Assign Competition Ranks (1, 1, 3...)
  let currentRank = 1;
  let prevGpa: number | null = null;
  let prevTotal: number | null = null;

  return sorted.map((res, index) => {
    if (index > 0) {
      const isTie = res.gpa === prevGpa && res.totalMarksObtained === prevTotal;
      if (!isTie) {
        currentRank = index + 1;
      }
    }

    prevGpa = res.gpa;
    prevTotal = res.totalMarksObtained;

    return {
      ...res,
      rank: currentRank,
    };
  });
}

// -------------------------------------------------------------
// COMPILED MARKSHEET AGGREGATION ENGINE (UNGRADED BUNDLE)
// -------------------------------------------------------------

export interface CompiledMarksheetExamItem {
  id: number;
  title: string;
  lectureNo?: number | null;
  lectureLabel?: string | null;
  maxMark: number;
  sortOrder?: number;
}

export interface StudentExamMarkDetail {
  mark: number;
  isAbsent: boolean;
  isUnmarked: boolean;
}

export interface ProcessedCompiledStudentRow {
  studentId: number;
  student: StudentRosterItem;
  examMarks: Record<number, StudentExamMarkDetail>; // [examId] -> detail
  totalMarksObtained: number;
  totalMarksPossible: number;
  overallPercentage: number;
  rank: number;
}

export interface ProcessedCompiledMarksheet {
  exams: CompiledMarksheetExamItem[];
  totalPossibleMarks: number;
  rows: ProcessedCompiledStudentRow[];
}

/**
 * Compile marks across an arbitrary list of exams (e.g. Lectures 1 to 10).
 * Ungraded: adds up student's marks and assigns standard competition ranks (1, 1, 3...).
 * Absent or unmarked students are never dropped from the roster.
 */
export function calculateCompiledMarksheetResults(
  roster: StudentRosterItem[],
  exams: CompiledMarksheetExamItem[],
  marksMatrix: Record<number, Record<number, StudentExamMarkDetail>> // [studentId][examId]
): ProcessedCompiledMarksheet {
  if (!roster || roster.length === 0) {
    return { exams, totalPossibleMarks: 0, rows: [] };
  }

  const totalPossibleMarks = exams.reduce((sum, e) => sum + (e.maxMark || 0), 0);

  const studentRows: ProcessedCompiledStudentRow[] = roster.map((student) => {
    const studentMarks = marksMatrix[student.id] || {};
    let totalMarksObtained = 0;
    const examMarks: Record<number, StudentExamMarkDetail> = {};

    exams.forEach((exam) => {
      const entry = studentMarks[exam.id];
      const isAbsent = entry ? entry.isAbsent : false;
      const isUnmarked = !entry;
      const mark = entry && !isAbsent ? entry.mark : 0;

      examMarks[exam.id] = {
        mark,
        isAbsent,
        isUnmarked,
      };

      totalMarksObtained += mark;
    });

    const overallPercentage = totalPossibleMarks > 0
      ? parseFloat(((totalMarksObtained / totalPossibleMarks) * 100).toFixed(2))
      : 0;

    return {
      studentId: student.id,
      student,
      examMarks,
      totalMarksObtained,
      totalMarksPossible: totalPossibleMarks,
      overallPercentage,
      rank: 0,
    };
  });

  // Sort descending by total marks. Secondary sort by roll serial
  const sorted = [...studentRows].sort((a, b) => {
    if (b.totalMarksObtained !== a.totalMarksObtained) {
      return b.totalMarksObtained - a.totalMarksObtained;
    }
    return a.student.roll - b.student.roll;
  });

  // Assign standard competition ranks (1, 1, 3...)
  let currentRank = 1;
  let prevTotal: number | null = null;

  const rankedRows = sorted.map((row, index) => {
    if (index > 0) {
      if (row.totalMarksObtained !== prevTotal) {
        currentRank = index + 1;
      }
    }
    prevTotal = row.totalMarksObtained;
    return {
      ...row,
      rank: currentRank,
    };
  });

  return {
    exams,
    totalPossibleMarks,
    rows: rankedRows,
  };
}

