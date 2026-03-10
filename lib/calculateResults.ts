export function calculateResults(exam: any, isStudent: boolean, studentId: number | null) {
  if (!exam || exam.subjects.length === 0) return [];

  let marks = exam.subjects[0].marks;

  if (isStudent && studentId) {
    marks = marks.filter((m: any) => m.studentId === studentId);
  }

  const studentTotals = marks.map((mark: any) => {
    const student = mark.student;

    const subjectMarks = exam.subjects.map((sub: any) => {
      const studentMark = sub.marks.find((sm: any) => sm.studentId === student.id);

      return {
        subject: sub.subject,
        written: studentMark?.written ?? 0,
        objective: studentMark?.objective ?? 0,
        total: (studentMark?.written ?? 0) + (studentMark?.objective ?? 0),
      };
    });

    const total = subjectMarks.reduce((a: number, b: any) => a + b.total, 0);

    return {
      student,
      total,
      subjectMarks,
    };
  });

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