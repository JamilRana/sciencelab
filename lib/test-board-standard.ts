import {
  calculateBoardStandardResults,
  StudentRosterItem,
  SubjectMarkEntry,
} from "./special-batch-results";

console.log("=== Testing Bangladesh Education Board Standard Result Engine ===\n");

const sampleSubjects = [
  { id: 1, name: "Bangla 1st", combinedGroup: "Bangla", maxMark: 100 },
  { id: 2, name: "Bangla 2nd", combinedGroup: "Bangla", maxMark: 100 },
  { id: 3, name: "English 1st", combinedGroup: "English", maxMark: 100 },
  { id: 4, name: "English 2nd", combinedGroup: "English", maxMark: 100 },
  { id: 5, name: "Mathematics", maxMark: 100 },
  { id: 6, name: "Physics", maxMark: 100 },
  { id: 7, name: "Chemistry", maxMark: 100 },
  { id: 8, name: "Biology", maxMark: 100 },
  { id: 9, name: "Higher Mathematics", maxMark: 100 }, // Optional for student 1 & 2
];

const roster: StudentRosterItem[] = [
  { id: 1, name: "Nahian Asad", roll: 6, displayRoll: "262006", class: "Ten", optionalSubjectId: 9 },
  { id: 2, name: "Tayeb Nur", roll: 7, displayRoll: "262007", class: "Ten", optionalSubjectId: 9 },
  { id: 3, name: "Jasmin Akter", roll: 1, displayRoll: "261001", class: "Ten", optionalSubjectId: null },
  { id: 4, name: "Absent Student", roll: 2, displayRoll: "261002", class: "Ten", optionalSubjectId: null },
];

const marksMap: Record<number, Record<number, SubjectMarkEntry>> = {
  // Student 1: High scorer, all A+ (80+), Optional = 85 (GP 5.0).
  // Optional bonus = 5.0 - 2.0 = 3.0.
  // Compulsory GP sum = 6 * 5.0 = 30.
  // GPA = (30 + 3.0) / 6 = 5.5 -> capped at 5.00
  1: {
    1: { subjectId: 1, subjectName: "Bangla 1st", combinedGroup: "Bangla", isOptional: false, maxMark: 100, written: 60, objective: 25, absent: false },
    2: { subjectId: 2, subjectName: "Bangla 2nd", combinedGroup: "Bangla", isOptional: false, maxMark: 100, written: 60, objective: 25, absent: false },
    3: { subjectId: 3, subjectName: "English 1st", combinedGroup: "English", isOptional: false, maxMark: 100, written: 85, objective: 0, absent: false },
    4: { subjectId: 4, subjectName: "English 2nd", combinedGroup: "English", isOptional: false, maxMark: 100, written: 85, objective: 0, absent: false },
    5: { subjectId: 5, subjectName: "Mathematics", isOptional: false, maxMark: 100, written: 60, objective: 30, absent: false },
    6: { subjectId: 6, subjectName: "Physics", isOptional: false, maxMark: 100, written: 55, objective: 25, absent: false },
    7: { subjectId: 7, subjectName: "Chemistry", isOptional: false, maxMark: 100, written: 55, objective: 25, absent: false },
    8: { subjectId: 8, subjectName: "Biology", isOptional: false, maxMark: 100, written: 55, objective: 25, absent: false },
    9: { subjectId: 9, subjectName: "Higher Mathematics", isOptional: true, maxMark: 100, written: 60, objective: 25, absent: false }, // 85 (A+, GP 5)
  },

  // Student 2: Fails in Optional 4th subject (Higher Math = 20), but passes all compulsory with 75% (A, GP 4.0)
  // Optional fail should NOT fail the student!
  2: {
    1: { subjectId: 1, subjectName: "Bangla 1st", combinedGroup: "Bangla", isOptional: false, maxMark: 100, written: 50, objective: 25, absent: false },
    2: { subjectId: 2, subjectName: "Bangla 2nd", combinedGroup: "Bangla", isOptional: false, maxMark: 100, written: 50, objective: 25, absent: false },
    3: { subjectId: 3, subjectName: "English 1st", combinedGroup: "English", isOptional: false, maxMark: 100, written: 75, objective: 0, absent: false },
    4: { subjectId: 4, subjectName: "English 2nd", combinedGroup: "English", isOptional: false, maxMark: 100, written: 75, objective: 0, absent: false },
    5: { subjectId: 5, subjectName: "Mathematics", isOptional: false, maxMark: 100, written: 50, objective: 25, absent: false },
    6: { subjectId: 6, subjectName: "Physics", isOptional: false, maxMark: 100, written: 50, objective: 25, absent: false },
    7: { subjectId: 7, subjectName: "Chemistry", isOptional: false, maxMark: 100, written: 50, objective: 25, absent: false },
    8: { subjectId: 8, subjectName: "Biology", isOptional: false, maxMark: 100, written: 50, objective: 25, absent: false },
    9: { subjectId: 9, subjectName: "Higher Mathematics", isOptional: true, maxMark: 100, written: 15, objective: 5, absent: false }, // 20 (F, GP 0)
  },

  // Student 3: Fails one COMPULSORY subject (Mathematics = 25 marks, F, GP 0).
  // Must fail overall (GPA 0.00).
  3: {
    1: { subjectId: 1, subjectName: "Bangla 1st", combinedGroup: "Bangla", isOptional: false, maxMark: 100, written: 60, objective: 25, absent: false },
    2: { subjectId: 2, subjectName: "Bangla 2nd", combinedGroup: "Bangla", isOptional: false, maxMark: 100, written: 60, objective: 25, absent: false },
    3: { subjectId: 3, subjectName: "English 1st", combinedGroup: "English", isOptional: false, maxMark: 100, written: 80, objective: 0, absent: false },
    4: { subjectId: 4, subjectName: "English 2nd", combinedGroup: "English", isOptional: false, maxMark: 100, written: 80, objective: 0, absent: false },
    5: { subjectId: 5, subjectName: "Mathematics", isOptional: false, maxMark: 100, written: 15, objective: 10, absent: false }, // FAIL in compulsory
    6: { subjectId: 6, subjectName: "Physics", isOptional: false, maxMark: 100, written: 60, objective: 25, absent: false },
    7: { subjectId: 7, subjectName: "Chemistry", isOptional: false, maxMark: 100, written: 60, objective: 25, absent: false },
    8: { subjectId: 8, subjectName: "Biology", isOptional: false, maxMark: 100, written: 60, objective: 25, absent: false },
  },

  // Student 4: Absent in all
  4: {},
};

const results = calculateBoardStandardResults(roster, marksMap, sampleSubjects);

results.forEach((r) => {
  console.log(`Rank #${r.rank} | ${r.student.name} (Roll ${r.student.displayRoll})`);
  console.log(`  Passed: ${r.isPassed ? "YES" : "NO"} | GPA: ${r.gpa.toFixed(2)} (${r.finalGradeLetter})`);
  console.log(`  Total Marks: ${r.totalMarksObtained} / ${r.totalMarksPossible}`);
  console.log(`  Optional Bonus: +${r.optionalBonusPoints} GP`);
  if (!r.isPassed) {
    console.log(`  Failed in: ${r.failedSubjectNames.join(", ")}`);
  }
  console.log("");
});

// Assertions
console.log("=== Verification Assertions ===");
const s1 = results.find((r) => r.student.id === 1)!;
const s2 = results.find((r) => r.student.id === 2)!;
const s3 = results.find((r) => r.student.id === 3)!;
const s4 = results.find((r) => r.student.id === 4)!;

console.assert(s1.isPassed === true, "Student 1 should pass");
console.assert(s1.gpa === 5.0, `Student 1 GPA should be 5.00, got ${s1.gpa}`);
console.assert(s1.rank === 1, `Student 1 Rank should be 1, got ${s1.rank}`);

console.assert(s2.isPassed === true, "Student 2 should pass even though optional subject failed");
console.assert(s2.gpa === 4.0, `Student 2 GPA should be 4.00, got ${s2.gpa}`);
console.assert(s2.optionalBonusPoints === 0, "Student 2 optional bonus should be 0");

console.assert(s3.isPassed === false, "Student 3 should fail due to compulsory failure");
console.assert(s3.gpa === 0.0, `Student 3 GPA should be 0.00, got ${s3.gpa}`);
console.assert(s3.failedSubjectNames.includes("Mathematics"), "Student 3 should list Mathematics as failed");

console.assert(s4.isPassed === false, "Student 4 (absent) should fail");
console.assert(s4.totalMarksObtained === 0, "Student 4 total marks should be 0");

console.log("All Board Standard verification assertions passed successfully!\n");
