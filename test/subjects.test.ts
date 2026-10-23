import { prisma } from "../lib/prisma";
import { ALL_SUBJECTS, SUBJECT_CATEGORIES, getMergedSubjectList } from "../lib/subjects";
import { getPlannerMetadataAction } from "../app/actions/routine";

async function runTests() {
  console.log("=================================================");
  console.log("  SUBJECTS & DROPDOWN INTEGRATION TEST SUITE    ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Initial Database Record Snapshot for Zero Data Loss
  const [initialTeachers, initialStudents, initialBatches, initialUsers, initialLogs] =
    await Promise.all([
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.batch.count(),
      prisma.user.count(),
      prisma.teacherClassLog.count(),
    ]);

  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "STAFF"] } },
  });
  if (!adminUser) throw new Error("Requires ADMIN/STAFF user");

  // Mock session for TSX testing
  (globalThis as any).__TEST_SESSION_USER__ = {
    id: String(adminUser.id),
    username: adminUser.username,
    role: adminUser.role,
    name: adminUser.name || "Admin",
  };

  try {
    console.log("--- Section 1: Subject Master List & Categories ---");
    assert(ALL_SUBJECTS.length >= 20, `ALL_SUBJECTS contains comprehensive list (got ${ALL_SUBJECTS.length})`);
    assert(ALL_SUBJECTS.includes("Physics"), "Includes Physics");
    assert(ALL_SUBJECTS.includes("Chemistry"), "Includes Chemistry");
    assert(ALL_SUBJECTS.includes("Biology"), "Includes Biology");
    assert(ALL_SUBJECTS.includes("Higher Math"), "Includes Higher Math");
    assert(ALL_SUBJECTS.includes("General Math"), "Includes General Math");
    assert(ALL_SUBJECTS.includes("Bangla 1st"), "Includes Bangla 1st");
    assert(ALL_SUBJECTS.includes("English 1st"), "Includes English 1st");
    assert(ALL_SUBJECTS.includes("ICT"), "Includes ICT");
    assert(ALL_SUBJECTS.includes("Accounting"), "Includes Accounting");

    const categories = SUBJECT_CATEGORIES.map((c) => c.category);
    assert(categories.includes("Science"), "Category Science exists");
    assert(categories.includes("Mathematics"), "Category Mathematics exists");
    assert(categories.includes("Languages (Bangla & English)"), "Category Languages exists");
    assert(categories.includes("Commerce / Business Studies"), "Category Commerce exists");

    console.log("\n--- Section 2: Subject Merging & Deduplication ---");
    const merged = getMergedSubjectList(["Physics", "Astronomy", "Chemistry", ""]);
    assert(merged.includes("Astronomy"), "Includes dynamically provided extra subject");
    assert(merged.filter((s) => s === "Physics").length === 1, "Deduplicates existing subjects");
    assert(!merged.includes(""), "Filters out blank subjects");

    console.log("\n--- Section 3: Planner Metadata Server Action ---");
    const metaRes = await getPlannerMetadataAction();
    assert(metaRes.success === true, "getPlannerMetadataAction succeeds");
    assert(Array.isArray((metaRes.data as any).subjects), "Returns subjects array");
    assert((metaRes.data as any).subjects.length >= ALL_SUBJECTS.length, "Metadata subjects includes all standard subjects");
    assert((metaRes.data as any).subjects.includes("Physics"), "Metadata subjects contains Physics");

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP & ZERO DATA LOSS VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n--- Checking Zero Data Loss Guarantee ---");

    const [finalTeachers, finalStudents, finalBatches, finalUsers, finalLogs] =
      await Promise.all([
        prisma.teacher.count(),
        prisma.student.count(),
        prisma.batch.count(),
        prisma.user.count(),
        prisma.teacherClassLog.count(),
      ]);

    assert(finalTeachers === initialTeachers, "Zero data loss: Teacher count identical");
    assert(finalStudents === initialStudents, "Zero data loss: Student count identical");
    assert(finalBatches === initialBatches, "Zero data loss: Batch count identical");
    assert(finalUsers === initialUsers, "Zero data loss: User count identical");
    assert(finalLogs === initialLogs, "Zero data loss: TeacherClassLog count identical");
  }

  console.log("\n=================================================");
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) process.exit(1);
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
