export function calculateResults(exam: any, isStudent: boolean, studentId: number | null) {
  if (!exam || !Array.isArray(exam.subjects) || exam.subjects.length === 0) return [];

  // Extract all unique students who appeared in ANY subject of this exam
  const studentMap = new Map<number, any>();

  exam.subjects.forEach((sub: any) => {
    if (Array.isArray(sub.marks)) {
      sub.marks.forEach((mark: any) => {
        if (mark.student && !studentMap.has(mark.studentId)) {
          if (mark.student.active === false) return;
          studentMap.set(mark.studentId, mark.student);
        }
      });
    }
  });

  let students = Array.from(studentMap.values()).filter((s: any) => s.active !== false);

  if (isStudent && studentId) {
    students = students.filter((s: any) => s.id === studentId);
  }

  const studentTotals = students.map((student: any) => {
    const subjectMarks = exam.subjects.map((sub: any) => {
      const studentMark = sub.marks?.find((sm: any) => sm.studentId === student.id);

      return {
        subject: sub.subject,
        written: studentMark?.written ?? 0,
        objective: studentMark?.objective ?? 0,
        total: (studentMark?.written ?? 0) + (studentMark?.objective ?? 0),
        totalMark: sub.totalMark || 100,
      };
    });

    const total = subjectMarks.reduce((a: number, b: any) => a + b.total, 0);
    const maxPossible = exam.subjects.reduce((a: number, b: any) => a + (b.totalMark || 100), 0);
    const percentage = maxPossible > 0 ? ((total / maxPossible) * 100).toFixed(1) : "0.0";

    return {
      student,
      total,
      maxPossible,
      percentage,
      subjectMarks,
    };
  });

  // Sort descending by total score
  const sorted = [...studentTotals].sort((a, b) => b.total - a.total);

  let position = 1;
  let previousTotal: number | null = null;

  return sorted.map((item, index) => {
    if (previousTotal !== null && item.total !== previousTotal) {
      position = index + 1;
    }

    previousTotal = item.total;

    return {
      ...item,
      position,
    };
  });
}