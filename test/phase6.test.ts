import { prisma } from "../lib/prisma";
import {
  runDayCloseJob,
  getNeedsAmountDuties,
  markSessionNotHeld,
  adjustCountedSessionTeacher,
  adjustClassLogRow,
} from "../lib/day-close";
import {
  earnedAmount,
  calculateTeacherEarningsSummary,
} from "../lib/teacher-earnings";
import {
  todayDhaka,
  addDaysDhaka,
  toDhakaDbDate,
  toDhakaDateString,
  getDhakaMonthAbbr,
} from "../lib/dhaka-time";
import { setDutyAmount, SessionActor, isTeacherMonthLocked } from "../lib/sessions";

async function runTests() {
  console.log("=================================================");
  console.log("  PHASE 6 TEST SUITE: DAY CLOSE & DUTY PAY AUTO  ");
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

  const adminActor: SessionActor = {
    id: 1,
    username: "admin",
    name: "Admin User",
    role: "ADMIN",
  };

  const staffActor: SessionActor = {
    id: 2,
    username: "staff",
    name: "Staff User",
    role: "STAFF",
  };

  // Find existing teacher and batch
  const teacher = await prisma.teacher.findFirst();
  const batch = await prisma.batch.findFirst();

  if (!teacher || !batch) {
    throw new Error("Seed teacher or batch missing");
  }

  // -------------------------------------------------------------------
  // Test 1: Earnings Formula Single Source of Truth
  // -------------------------------------------------------------------
  console.log("Test 1: Single Source of Truth earnings formula (Spec Section 6)...");
  {
    // Case A: Standard class log with no duty pay
    const logA = { classes: 4, notebook: 2, other: 1, perClass: 500, dutyAmount: 0 };
    const earnedA = earnedAmount(logA, 500);
    // (4 + 2 + 1) * 500 = 3500
    assert(earnedA === 3500, `Log A earned should be 3500, got ${earnedA}`);

    // Case B: Log with exam invigilation duty pay
    const logB = { classes: 3, notebook: 0, other: 0, perClass: 600, dutyAmount: 850 };
    const earnedB = earnedAmount(logB, 600);
    // (3 * 600) + 850 = 1800 + 850 = 2650
    assert(earnedB === 2650, `Log B earned should be 2650, got ${earnedB}`);

    // Case C: Legacy log with perClass === 0 falling back to teacher profile rate
    const logC = { classes: 2, notebook: 1, other: 0, perClass: 0, dutyAmount: 400 };
    const earnedC = earnedAmount(logC, 700);
    // (3 * 700) + 400 = 2100 + 400 = 2500
    assert(earnedC === 2500, `Log C fallback rate earned should be 2500, got ${earnedC}`);

    // Aggregated financial summary
    const summary = calculateTeacherEarningsSummary([logA, logB, logC], [{ amount: 4000 }], 700);
    const expectedTotal = earnedA + earnedB + earnedC; // 3500 + 2650 + 2500 = 8650
    assert(summary.totalEarned === expectedTotal, `Total earned should be ${expectedTotal}, got ${summary.totalEarned}`);
    assert(summary.totalDutyAmount === 1250, `Total duty amount should be 1250, got ${summary.totalDutyAmount}`);
    assert(summary.dueAmount === expectedTotal - 4000, `Due amount should be ${expectedTotal - 4000}, got ${summary.dueAmount}`);
  }

  // -------------------------------------------------------------------
  // Test 2: Auto Day-Close Engine & Idempotency
  // -------------------------------------------------------------------
  console.log("\nTest 2: Auto Day-Close counting, catch-up, and idempotency...");
  {
    const yesterday = addDaysDhaka(todayDhaka(), -1);
    const yesterdayDb = toDhakaDbDate(yesterday);

    // Create a batch of test sessions for yesterday:
    // 1. Regular class
    const s1 = await prisma.classSession.create({
      data: {
        kind: "CLASS",
        subjectName: "Phase 6 Math",
        teacherId: teacher.id,
        batchId: batch.id,
        date: yesterdayDb,
        startTime: "10:00",
        status: "SCHEDULED",
      },
    });

    // 2. Extra class
    const s2 = await prisma.classSession.create({
      data: {
        kind: "EXTRA",
        subjectName: "Phase 6 Math Extra",
        teacherId: teacher.id,
        batchId: batch.id,
        date: yesterdayDb,
        startTime: "12:00",
        status: "SCHEDULED",
      },
    });

    // 3. Exam duty with pay amount set
    const s3 = await prisma.classSession.create({
      data: {
        kind: "EXAM_DUTY",
        teacherId: teacher.id,
        date: yesterdayDb,
        startTime: "14:00",
        payAmount: 750,
        status: "SCHEDULED",
      },
    });

    // 4. Exam duty with NO pay amount (should be held back from count)
    const s4 = await prisma.classSession.create({
      data: {
        kind: "EXAM_DUTY",
        teacherId: teacher.id,
        date: yesterdayDb,
        startTime: "16:00",
        payAmount: null,
        status: "SCHEDULED",
      },
    });

    // 5. Cancelled session (should NOT be counted)
    const s5 = await prisma.classSession.create({
      data: {
        kind: "CLASS",
        subjectName: "Cancelled Math",
        teacherId: teacher.id,
        batchId: batch.id,
        date: yesterdayDb,
        startTime: "18:00",
        status: "CANCELLED",
        changeReason: "Rain cancelled",
      },
    });

    // 6. Rescheduled session (should NOT be counted)
    const s6 = await prisma.classSession.create({
      data: {
        kind: "CLASS",
        subjectName: "Rescheduled Math",
        teacherId: teacher.id,
        batchId: batch.id,
        date: yesterdayDb,
        startTime: "19:00",
        status: "RESCHEDULED",
        changeReason: "Moved to Sunday",
      },
    });

    // Execute first Day-Close Run
    const run1 = await runDayCloseJob({ cutoffDate: yesterday, actor: adminActor });
    assert(run1.success, "Day close execution should succeed");
    assert(run1.totalCountedSessions >= 3, `Counted at least 3 sessions (got ${run1.totalCountedSessions})`);
    assert(run1.needsAmountCount >= 1, `Reported duty needing amount (got ${run1.needsAmountCount})`);

    // Verify session states after counting
    const updatedS1 = await prisma.classSession.findUnique({ where: { id: s1.id } });
    const updatedS2 = await prisma.classSession.findUnique({ where: { id: s2.id } });
    const updatedS3 = await prisma.classSession.findUnique({ where: { id: s3.id } });
    const updatedS4 = await prisma.classSession.findUnique({ where: { id: s4.id } });
    const updatedS5 = await prisma.classSession.findUnique({ where: { id: s5.id } });
    const updatedS6 = await prisma.classSession.findUnique({ where: { id: s6.id } });

    assert(updatedS1?.status === "CONDUCTED" && updatedS1.countedLogId !== null, "s1 conducted and counted");
    assert(updatedS2?.status === "CONDUCTED" && updatedS2.countedLogId !== null, "s2 conducted and counted");
    assert(updatedS3?.status === "CONDUCTED" && updatedS3.countedLogId !== null, "s3 conducted and counted");
    assert(updatedS4?.status === "SCHEDULED" && updatedS4.countedLogId === null, "s4 without amount NOT counted");
    assert(updatedS5?.status === "CANCELLED" && updatedS5.countedLogId === null, "s5 cancelled NOT counted");
    assert(updatedS6?.status === "RESCHEDULED" && updatedS6.countedLogId === null, "s6 rescheduled NOT counted");

    // Verify the auto TeacherClassLog row created
    const autoLog = await prisma.teacherClassLog.findUnique({
      where: { id: updatedS1!.countedLogId! },
    });
    assert(autoLog !== null, "Auto TeacherClassLog row exists");
    assert(autoLog?.source === "AUTO", `Source should be AUTO, got ${autoLog?.source}`);
    assert((autoLog?.classes || 0) >= 2, `Classes count should include regular + extra, got ${autoLog?.classes}`);
    assert((autoLog?.dutyAmount || 0) >= 750, `dutyAmount should include 750, got ${autoLog?.dutyAmount}`);

    // IDEMPOTENCY TEST: Run day-close a second time
    const run2 = await runDayCloseJob({ cutoffDate: yesterday, actor: adminActor });
    assert(run2.success, "Second day close run should succeed");
    assert(run2.totalCountedSessions === 0, `Second run should count 0 sessions, got ${run2.totalCountedSessions}`);

    // Verify auto row totals remained unchanged after run 2
    const autoLogAfterRun2 = await prisma.teacherClassLog.findUnique({
      where: { id: autoLog!.id },
    });
    assert(autoLogAfterRun2?.classes === autoLog?.classes, "Classes count unchanged after second run");
    assert(autoLogAfterRun2?.dutyAmount === autoLog?.dutyAmount, "dutyAmount unchanged after second run");

    // -------------------------------------------------------------------
    // Test 3: Needs-Amount Resolution & Subsequent Catch-up
    // -------------------------------------------------------------------
    console.log("\nTest 3: Needs-Amount resolution and subsequent catch-up...");
    {
      const needsList = await getNeedsAmountDuties();
      const pendingS4 = needsList.find((d) => d.id === s4.id);
      assert(pendingS4 !== undefined, "s4 appears in getNeedsAmountDuties list");

      // Staff sets pay amount for s4
      await setDutyAmount(s4.id, 900, adminActor, "Pay set via needs amount list");

      // Run day-close again; s4 should now be processed!
      const run3 = await runDayCloseJob({ cutoffDate: yesterday, actor: adminActor });
      assert(run3.totalCountedSessions >= 1, `Run 3 should process newly configured duty (got ${run3.totalCountedSessions})`);

      const updatedS4After = await prisma.classSession.findUnique({ where: { id: s4.id } });
      assert(updatedS4After?.status === "CONDUCTED", "s4 is now CONDUCTED");
      assert(updatedS4After?.countedLogId !== null, "s4 is now counted in class log");

      const autoLogAfterDuty = await prisma.teacherClassLog.findUnique({
        where: { id: autoLog!.id },
      });
      assert(
        (autoLogAfterDuty?.dutyAmount || 0) === (autoLog?.dutyAmount || 0) + 900,
        `dutyAmount incremented by 900, got ${autoLogAfterDuty?.dutyAmount}`
      );
    }

    // -------------------------------------------------------------------
    // Test 4: Adjustment Workflows (Mark Not Held & Move Credit)
    // -------------------------------------------------------------------
    console.log("\nTest 4: Adjustment workflows (Mark Not Held & Move Credit)...");
    {
      const countBeforeNotHeld = (await prisma.teacherClassLog.findUnique({ where: { id: autoLog!.id } }))?.classes || 0;

      // Mark s1 as Not Held
      await markSessionNotHeld(s1.id, adminActor, "Teacher fell ill, class not conducted");

      const s1AfterNotHeld = await prisma.classSession.findUnique({ where: { id: s1.id } });
      assert(s1AfterNotHeld?.status === "CANCELLED", "s1 marked as CANCELLED");

      const countAfterNotHeld = (await prisma.teacherClassLog.findUnique({ where: { id: autoLog!.id } }))?.classes || 0;
      assert(
        countAfterNotHeld === countBeforeNotHeld - 1,
        `Reversal: Class count decremented from ${countBeforeNotHeld} to ${countAfterNotHeld}`
      );

      // Verify audit log created
      const adjustLog = await prisma.sessionChangeLog.findFirst({
        where: { sessionId: s1.id, action: "ADJUST" },
      });
      assert(adjustLog !== null, "ADJUST change log recorded for mark not held");

      // Move credit for s2 to a substitute teacher
      const substituteTeacher = await prisma.teacher.findFirst({
        where: { id: { not: teacher.id } },
      });

      if (substituteTeacher) {
        await adjustCountedSessionTeacher(
          s2.id,
          substituteTeacher.id,
          adminActor,
          "Session was actually taken by substitute teacher"
        );

        const s2AfterMove = await prisma.classSession.findUnique({ where: { id: s2.id } });
        assert(s2AfterMove?.teacherId === substituteTeacher.id, "s2 teacherId moved to substitute");

        // Old teacher's log decremented
        const oldTeacherLog = await prisma.teacherClassLog.findUnique({ where: { id: autoLog!.id } });
        assert(oldTeacherLog?.classes === countAfterNotHeld - 1, "Old teacher log decremented by 1");

        // Substitute teacher's auto log created or incremented
        const subLog = await prisma.teacherClassLog.findUnique({
          where: { id: s2AfterMove!.countedLogId! },
        });
        assert(subLog?.teacherId === substituteTeacher.id, "Substitute log created with substitute teacherId");
        assert(subLog?.source === "AUTO", "Substitute log is AUTO source");
      }
    }

    // -------------------------------------------------------------------
    // Test 5: Month Lock Enforcement
    // -------------------------------------------------------------------
    console.log("\nTest 5: Month Lock enforcement for Staff vs Admin...");
    {
      const targetMonth = getDhakaMonthAbbr(yesterday);

      // Create a test TeacherPayment locking this teacher-month
      const testPayment = await prisma.teacherPayment.create({
        data: {
          teacherId: teacher.id,
          month: targetMonth,
          amount: 5000,
          date: yesterdayDb,
        },
      });

      const lockCheck = await isTeacherMonthLocked(teacher.id, yesterdayDb);
      assert(lockCheck.isLocked === true, `Month ${targetMonth} is locked by payment`);

      // Staff attempt to edit an auto log row in locked month should FAIL
      let staffBlocked = false;
      try {
        await adjustClassLogRow(autoLog!.id, { classes: 99 }, staffActor, "Staff unauthorized override");
      } catch (err: any) {
        staffBlocked = true;
        assert(err.message.includes("already been processed"), "Staff error explains payment month lock");
      }
      assert(staffBlocked === true, "Staff is strictly blocked from editing locked month logs");

      // Admin attempt to adjust log in locked month should SUCCEED
      let adminAllowed = false;
      try {
        await adjustClassLogRow(autoLog!.id, { classes: 5 }, adminActor, "Admin authorized correction");
        adminAllowed = true;
      } catch (err: any) {
        adminAllowed = false;
      }
      assert(adminAllowed === true, "Admin is allowed to adjust logs in locked months");

      // Clean up test payment
      await prisma.teacherPayment.delete({ where: { id: testPayment.id } });
    }

    // Clean up created test sessions and logs
    await prisma.sessionChangeLog.deleteMany({
      where: { sessionId: { in: [s1.id, s2.id, s3.id, s4.id, s5.id, s6.id] } },
    });
    await prisma.classSession.deleteMany({
      where: { id: { in: [s1.id, s2.id, s3.id, s4.id, s5.id, s6.id] } },
    });
    await prisma.teacherClassLog.deleteMany({
      where: { autoKey: { contains: `:${yesterday}:` } },
    });
    await prisma.jobRun.deleteMany({
      where: { job: "DAY_CLOSE", forDate: yesterday },
    });
  }

  console.log("\n-------------------------------------------------");
  console.log(`Phase 6 Test Results: ${passed} passed, ${failed} failed`);
  console.log("-------------------------------------------------");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((e) => {
    console.error("Unhandled test exception:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
