import "dotenv/config";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Helper to convert Bengali digits to English
function normalizeDigits(str: string): string {
  const bnToEn: Record<string, string> = {
    "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
    "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  };
  return str.replace(/[০-৯]/g, (d) => bnToEn[d] || d);
}

// Helper to parse date string like "16/9/26" or "২০/৯/২৬"
function parsePaymentDate(rawDate: any): Date {
  if (!rawDate) return new Date("2026-09-15T00:00:00Z");
  if (rawDate instanceof Date) return rawDate;

  const str = normalizeDigits(String(rawDate).trim());
  const parts = str.split(/[\/\-]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, month, day, 12, 0, 0));
  }
  return new Date("2026-09-15T00:00:00Z");
}

async function run() {
  console.log("=== Starting JSC 2026 Data Import ===");

  const jsonPath = path.resolve(process.cwd(), "Junior School-2026.json");
  console.log("Loading data from:", jsonPath);
  const rawJson = fs.readFileSync(jsonPath, "utf-8");
  const workbook = JSON.parse(rawJson);

  // 1. Ensure or Create Feeder Schools
  console.log("\n[1/6] Resolving Feeder Schools...");
  const dbSchools = await prisma.school.findMany();
  const schoolMap = new Map<string, number>();

  for (const s of dbSchools) {
    schoolMap.set(s.name.trim().toLowerCase(), s.id);
  }

  // Pre-mapped known variants
  const schoolAliases: Record<string, string> = {
    "govt. nazrul academy": "govt.nazrul  academy",
    "govt.nazrul academy": "govt.nazrul  academy",
    "trishal nazrul girl's high school": "trishal nazrul girls high school",
    "trishal nazrul girls high school": "trishal nazrul girls high school",
    "islami academy": "islami academy  school and college",
    "islami academy ": "islami academy  school and college",
    "shuktara biddiyaniketon": "suktara biddaniketon",
    "shuktara bidya niketon": "suktara biddaniketon",
    "amirabari gujiam high school": "gujiam amirabari high school",
    "ali akbar bhuiya girl's high school": "ali akber boiya girls high school",
  };

  async function getOrCreateSchool(rawName: string | null): Promise<number> {
    if (!rawName) return dbSchools[0].id;
    const clean = rawName.trim();
    const cleanLower = clean.toLowerCase();

    // Check alias
    if (schoolAliases[cleanLower]) {
      const targetName = schoolAliases[cleanLower];
      for (const [name, id] of schoolMap.entries()) {
        if (name.includes(targetName) || targetName.includes(name)) {
          return id;
        }
      }
    }

    // Direct / fuzzy match
    for (const [name, id] of schoolMap.entries()) {
      if (cleanLower.includes(name) || name.includes(cleanLower)) {
        return id;
      }
    }

    // If not found, create new School
    console.log(`  -> Creating new Feeder School: "${clean}"`);
    const created = await prisma.school.create({
      data: { name: clean },
    });
    schoolMap.set(cleanLower, created.id);
    return created.id;
  }

  // 2. Ensure or Create Program: JSC-2026
  console.log("\n[2/6] Ensuring Program JSC-2026...");
  let program = await prisma.program.findUnique({
    where: { code: "JSC-2026" },
    include: { batches: true, subjects: true },
  });

  if (!program) {
    console.log("  -> Creating Program JSC-2026");
    program = await prisma.program.create({
      data: {
        code: "JSC-2026",
        name: "Junior School Special Batch 2026",
        category: "JSC",
        year: 2026,
        active: true,
      },
      include: { batches: true, subjects: true },
    });
  }
  console.log(`  Program ready: ID ${program.id} (${program.name})`);

  // 3. Ensure Program Subjects for JSC
  console.log("\n[3/6] Ensuring JSC Curriculum Subjects...");
  const standardSubjects = [
    { name: "Bangla 1st", code: "101", isCombined: true, combinedGroupId: "BANGLA", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, sortOrder: 1 },
    { name: "Bangla 2nd", code: "102", isCombined: true, combinedGroupId: "BANGLA", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, sortOrder: 2 },
    { name: "English 1st", code: "107", isCombined: true, combinedGroupId: "ENGLISH", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, sortOrder: 3 },
    { name: "English 2nd", code: "108", isCombined: true, combinedGroupId: "ENGLISH", isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 100, mcqMax: 0, sortOrder: 4 },
    { name: "Mathematics", code: "109", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, sortOrder: 5 },
    { name: "General Science", code: "127", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, sortOrder: 6 },
    { name: "Bangladesh and Global Studies", code: "150", isCombined: false, combinedGroupId: null, isOptional: false, hasPractical: false, fullMarks: 100, cqMax: 70, mcqMax: 30, sortOrder: 7 },
  ];

  for (const s of standardSubjects) {
    const exists = program.subjects.find((ps) => ps.name.toLowerCase() === s.name.toLowerCase());
    if (!exists) {
      await prisma.programSubject.create({
        data: {
          programId: program.id,
          ...s,
        },
      });
      console.log(`  -> Added Subject: ${s.name}`);
    }
  }

  // Refresh subjects
  const updatedSubjects = await prisma.programSubject.findMany({
    where: { programId: program.id },
  });

  // 4. Ensure Batches: Junior-2026 Girls (2681) & Junior-2026 Boys (2682)
  console.log("\n[4/6] Ensuring Special Batches...");
  let girlsBatch = await prisma.batch.findFirst({
    where: { code: 2681 },
  });
  if (!girlsBatch) {
    console.log("  -> Creating Batch: Junior-2026 Girls (Code: 2681)");
    girlsBatch = await prisma.batch.create({
      data: {
        classId: "Eight",
        name: "Junior-2026 Girls",
        code: 2681,
        programId: program.id,
      },
    });
  } else if (!girlsBatch.programId) {
    girlsBatch = await prisma.batch.update({
      where: { id: girlsBatch.id },
      data: { programId: program.id },
    });
  }

  let boysBatch = await prisma.batch.findFirst({
    where: { code: 2682 },
  });
  if (!boysBatch) {
    console.log("  -> Creating Batch: Junior-2026 Boys (Code: 2682)");
    boysBatch = await prisma.batch.create({
      data: {
        classId: "Eight",
        name: "Junior-2026 Boys",
        code: 2682,
        programId: program.id,
      },
    });
  } else if (!boysBatch.programId) {
    boysBatch = await prisma.batch.update({
      where: { id: boysBatch.id },
      data: { programId: program.id },
    });
  }
  console.log(`  Girls Batch: ID ${girlsBatch.id} (${girlsBatch.name}, Code ${girlsBatch.code})`);
  console.log(`  Boys Batch: ID ${boysBatch.id} (${boysBatch.name}, Code ${boysBatch.code})`);

  // Cache existing students to borrow parent/address info if available
  const existingStudents = await prisma.student.findMany({
    select: { id: true, name: true, mobile: true, fatherName: true, motherName: true, address: true, dob: true },
  });
  const studentByMobile = new Map<string, typeof existingStudents[0]>();
  for (const st of existingStudents) {
    const cleanMobile = st.mobile.replace(/\D/g, "");
    if (cleanMobile.length >= 10) {
      studentByMobile.set(cleanMobile, st);
    }
  }

  // 5. Import Students & Course Fees
  console.log("\n[5/6] Importing Students and Course Fees...");

  const importedStudentsMap = new Map<number, any>(); // displayRoll -> student

  async function importStudentSheet(
    sheetName: string,
    batch: typeof girlsBatch,
    gender: "Male" | "Female",
    rollBase: number
  ) {
    const rows = (workbook[sheetName] || []) as any[][];
    console.log(`\n  Processing ${sheetName}: ${rows.length} rows...`);

    let importedCount = 0;

    // Start from index 1 (skipping header at index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || (!row[0] && !row[1])) continue;

      const rawRoll = row[0];
      const displayRoll = typeof rawRoll === "number" ? Math.round(rawRoll) : parseInt(String(rawRoll).replace(/\D/g, ""), 10);
      if (isNaN(displayRoll) || displayRoll < rollBase) continue;

      const rollInBatch = displayRoll - rollBase;
      const name = String(row[1] || "").trim();
      if (!name) continue;

      const rawMobile = row[2] ? String(row[2]).trim() : "";
      const rawSchool = row[3] ? String(row[3]).trim() : "";
      const rawAmount = row[4];
      const rawDue = row[5];
      const rawDate = row[6];
      const extraNote = row[7] ? String(row[7]).trim() : "";

      const schoolId = await getOrCreateSchool(rawSchool);

      if (!batch) continue;

      // Check if student exists in this batch with this roll
      let student = await prisma.student.findFirst({
        where: { batchId: batch.id, roll: rollInBatch },
      });

      // Try borrowing parent info
      const cleanMobile = rawMobile.replace(/\D/g, "");
      const match = studentByMobile.get(cleanMobile);

      const studentData = {
        name,
        mobile: rawMobile,
        gender,
        class: "Eight",
        schoolId,
        batchId: batch.id,
        roll: rollInBatch,
        fatherName: match?.fatherName || "",
        motherName: match?.motherName || "",
        address: match?.address || "Trishal, Mymensingh",
        dob: match?.dob || null,
        active: true,
      };

      if (!student) {
        student = await prisma.student.create({ data: studentData });
      } else {
        student = await prisma.student.update({
          where: { id: student.id },
          data: studentData,
        });
      }

      importedStudentsMap.set(displayRoll, student);
      importedCount++;

      // Process Course Fee & Initial Payment
      let numAmount = 0;
      let numDue = 0;
      let isClearedWaiver = false;
      let customNote = extraNote || "";

      if (typeof rawAmount === "number") {
        numAmount = rawAmount;
      } else if (String(rawAmount).trim().toUpperCase() === "OK") {
        isClearedWaiver = true;
        numAmount = 5000;
        customNote = customNote ? `${customNote} - Cleared (OK)` : "Cleared (OK)";
      } else if (String(rawAmount).trim().toLowerCase() === "sufal") {
        customNote = customNote ? `${customNote} - Sufal` : "Sufal / Special";
      }

      if (typeof rawDue === "number") {
        numDue = rawDue;
      }

      const agreedFee = numAmount + numDue > 0 ? numAmount + numDue : 5000;

      // Upsert StudentCourseFee
      const courseFee = await prisma.studentCourseFee.upsert({
        where: {
          studentId_programId: {
            studentId: student.id,
            programId: program!.id,
          },
        },
        create: {
          studentId: student.id,
          programId: program!.id,
          agreedFee,
          notes: customNote,
        },
        update: {
          agreedFee,
          notes: customNote,
        },
      });

      // Record Course Payment if numAmount > 0
      if (numAmount > 0) {
        const paymentDate = parsePaymentDate(rawDate);
        const receiptNo = `RCP-JSC-${displayRoll}`;

        const existingPayment = await prisma.coursePayment.findFirst({
          where: { studentCourseFeeId: courseFee.id },
        });

        if (!existingPayment) {
          await prisma.coursePayment.create({
            data: {
              studentCourseFeeId: courseFee.id,
              amount: numAmount,
              paymentDate,
              receiptNo,
              paymentMethod: "CASH",
              note: isClearedWaiver ? "Full clearance / OK" : "Initial Course Payment",
            },
          });
        } else {
          await prisma.coursePayment.update({
            where: { id: existingPayment.id },
            data: {
              amount: numAmount,
              paymentDate,
              receiptNo,
            },
          });
        }
      }
    }

    console.log(`  Imported ${importedCount} students for ${sheetName}`);
  }

  await importStudentSheet("Info_boy", boysBatch, "Male", 268200);
  await importStudentSheet("Info_girl", girlsBatch, "Female", 268100);

  // 6. Import Class Test Exams and Marks
  console.log("\n[6/6] Importing Class Tests & Marks from Mark_boy and Mark_girl...");

  async function importMarksSheet(sheetName: string) {
    const rows = (workbook[sheetName] || []) as any[][];
    if (rows.length < 3) return;

    const headerRow = rows[1] as any[]; // Row 2 (0-indexed 1)
    const testCols: { colIndex: number; title: string; subjName: string }[] = [];

    for (let c = 2; c < headerRow.length; c++) {
      const colTitle = headerRow[c];
      if (!colTitle) continue;
      const titleStr = String(colTitle).trim();

      // Map to subject
      let subjName = "General Science";
      if (titleStr.toLowerCase().includes("bangla 1st")) subjName = "Bangla 1st";
      else if (titleStr.toLowerCase().includes("bangla 2nd")) subjName = "Bangla 2nd";
      else if (titleStr.toLowerCase().includes("english 1st")) subjName = "English 1st";
      else if (titleStr.toLowerCase().includes("english 2nd")) subjName = "English 2nd";
      else if (titleStr.toLowerCase().includes("math")) subjName = "Mathematics";
      else if (titleStr.toLowerCase().includes("science")) subjName = "General Science";
      else if (titleStr.toLowerCase().includes("bgs")) subjName = "Bangladesh and Global Studies";

      testCols.push({ colIndex: c, title: `Class Test - ${titleStr}`, subjName });
    }

    console.log(`  Found ${testCols.length} tests in ${sheetName}`);

    for (const test of testCols) {
      // Find or create SpecialExam for this test
      let specialExam = await prisma.specialExam.findFirst({
        where: {
          programId: program!.id,
          title: test.title,
        },
        include: { subjects: true },
      });

      if (!specialExam) {
        specialExam = await prisma.specialExam.create({
          data: {
            programId: program!.id,
            title: test.title,
            kind: "CLASS_TEST",
            examDate: new Date("2026-09-20T10:00:00Z"),
            status: "COMPLETED",
          },
          include: { subjects: true },
        });
      }

      // Find program subject
      const progSubj = updatedSubjects.find((s) => s.name.toLowerCase() === test.subjName.toLowerCase()) || updatedSubjects[0];

      let examSubj = specialExam.subjects.find((s) => s.programSubjectId === progSubj.id);
      if (!examSubj) {
        examSubj = await prisma.specialExamSubject.create({
          data: {
            examId: specialExam.id,
            programSubjectId: progSubj.id,
            totalMax: 25,
            cqMax: 25,
          },
        });
      }

      // Record Marks
      let markCount = 0;
      for (let r = 2; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !row[0]) continue;
        const displayRoll = typeof row[0] === "number" ? Math.round(row[0]) : parseInt(String(row[0]).replace(/\D/g, ""), 10);
        const student = importedStudentsMap.get(displayRoll);
        if (!student) continue;

        const val = row[test.colIndex];
        if (val !== undefined && val !== null && !isNaN(Number(val))) {
          const score = Number(val);
          await prisma.specialMark.upsert({
            where: {
              specialExamSubjectId_studentId: {
                specialExamSubjectId: examSubj.id,
                studentId: student.id,
              },
            },
            create: {
              specialExamSubjectId: examSubj.id,
              studentId: student.id,
              cq: score,
              total: score,
              isAbsent: false,
            },
            update: {
              cq: score,
              total: score,
              isAbsent: false,
            },
          });
          markCount++;
        }
      }
    }
  }

  await importMarksSheet("Mark_boy");
  await importMarksSheet("Mark_girl");

  console.log("\n=== JSC 2026 Import Completed Successfully! ===");
}

run()
  .catch((err) => {
    console.error("Import failed with error:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
    process.exit(0);
  });
