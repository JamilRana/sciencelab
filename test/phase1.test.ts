import assert from "assert";
import { prisma } from "../lib/prisma";
import {
  earnedAmount,
  calculateTeacherEarningsSummary,
} from "../lib/teacher-earnings";
import {
  createSession,
  updateSession,
  reassignSession,
  rescheduleSession,
  cancelSession,
  detectSessionConflicts,
} from "../lib/sessions";
import { toDhakaDbDate } from "../lib/dhaka-time";

console.log("=== RUNNING PHASE 1 TESTS ===\n");

async function runTests() {
  // -------------------------------------------------------------
  // TEST 1: Teacher Earnings Calculations (Legacy vs Modern vs Duty)
  // -------------------------------------------------------------
  console.log("-> Test 1: Teacher Earnings Calculations");

  // A. Legacy log with perClass = 0 (must use fallback teacher rate)
  const legacyLog = {
    classes: 2,
    notebook: 1,
    other: 0,
    perClass: 0, // Legacy
    dutyAmount: 0,
  };
  const earnedLegacy = earnedAmount(legacyLog, 400); // Teacher rate is 400
  assert.strictEqual(earnedLegacy, 1200, "Legacy log should evaluate (2+1+0) * 400 = 1200");
  console.log("   ✓ Legacy log calculation with fallback rate verified");

  // B. Modern log with snapshot perClass = 500
  const modernLog = {
    classes: 3,
    notebook: 0,
    other: 1,
    perClass: 500, // Snapshot
    dutyAmount: 0,
  };
  const earnedModern = earnedAmount(modernLog, 300); // Should ignore fallback rate 300
  assert.strictEqual(earnedModern, 2000, "Modern log should evaluate (3+0+1) * 500 = 2000");
  console.log("   ✓ Modern log with snapshot rate verified");

  // C. Log with exam invigilation duty pay
  const dutyLog = {
    classes: 1,
    notebook: 0,
    other: 0,
    perClass: 400,
    dutyAmount: 750, // Exam duty
  };
  const earnedDuty = earnedAmount(dutyLog, 400);
  assert.strictEqual(earnedDuty, 1150, "Log with duty should evaluate (1 * 400) + 750 = 1150");
  console.log("   ✓ Exam invigilation duty pay addition verified");

  // D. Summary aggregation across logs and payments
  const summary = calculateTeacherEarningsSummary(
    [legacyLog, modernLog, dutyLog],
    [{ amount: 1500 }, { amount: 1000 }],
    400
  );
  assert.strictEqual(summary.totalClasses, 6);
  assert.strictEqual(summary.totalNotebooks, 1);
  assert.strictEqual(summary.totalOthers, 1);
  assert.strictEqual(summary.totalCountedSessions, 8);
  assert.strictEqual(summary.totalDutyAmount, 750);
  assert.strictEqual(summary.totalEarned, 4350); // 1200 + 2000 + 1150
  assert.strictEqual(summary.totalPaid, 2500);
  assert.strictEqual(summary.dueAmount, 1850); // 4350 - 2500
  console.log("   ✓ Aggregated earnings summary and due calculation verified");

  // -------------------------------------------------------------
  // TEST 2: Session Service Core (CRUD, Reassign, Reschedule, Cancel, Audit)
  // -------------------------------------------------------------
  console.log("\n-> Test 2: Session Core and Change Audits");

  // Fetch an existing teacher and batch to use in test
  const testTeacher1 = await prisma.teacher.findFirst();
  const testTeacher2 = await prisma.teacher.findFirst({
    where: { id: { not: testTeacher1!.id } },
  });
  const testBatch = await prisma.batch.findFirst();

  assert(testTeacher1, "Test requires at least one teacher");
  assert(testTeacher2, "Test requires a second teacher");
  assert(testBatch, "Test requires at least one batch");

  const actor = {
    id: 1,
    username: "admin_tester",
    name: "Admin Tester",
    role: "ADMIN",
  };

  const testDate = "2026-11-15";

  // Step A: Create session
  const created = await createSession(
    {
      kind: "CLASS",
      batchId: testBatch.id,
      teacherId: testTeacher1.id,
      subjectName: "Physics Test",
      date: testDate,
      startTime: "16:00",
      endTime: "17:00",
      room: "Room 101",
    },
    actor
  );

  const sessionId = created.session.id;
  assert.strictEqual(created.session.status, "SCHEDULED");
  assert.strictEqual(created.session.subjectName, "Physics Test");

  // Verify change log
  const createLog = await prisma.sessionChangeLog.findFirst({
    where: { sessionId, action: "CREATE" },
  });
  assert(createLog, "SessionChangeLog for CREATE should exist");
  assert.strictEqual(createLog.byUsername, "admin_tester");
  console.log("   ✓ Session created and audit log written");

  // Step B: Conflict Detection
  // B1. Overlapping teacher
  const conflict1 = await detectSessionConflicts({
    teacherId: testTeacher1.id,
    batchId: null,
    date: testDate,
    startTime: "16:30",
    endTime: "17:30",
  });
  assert.strictEqual(conflict1.hasConflicts, true);
  assert(conflict1.warnings.some((w) => w.type === "TEACHER_OVERLAP"));

  // B2. Overlapping batch
  const conflict2 = await detectSessionConflicts({
    teacherId: testTeacher2.id,
    batchId: testBatch.id,
    date: testDate,
    startTime: "16:15",
    endTime: "16:45",
  });
  assert.strictEqual(conflict2.hasConflicts, true);
  assert(conflict2.warnings.some((w) => w.type === "BATCH_OVERLAP"));

  // B3. Overlapping room
  const conflict3 = await detectSessionConflicts({
    teacherId: testTeacher2.id,
    batchId: null,
    room: "Room 101",
    date: testDate,
    startTime: "16:00",
    endTime: "17:00",
  });
  assert.strictEqual(conflict3.hasConflicts, true);
  assert(conflict3.warnings.some((w) => w.type === "ROOM_OVERLAP"));

  // B4. Non-overlapping time window
  const noConflict = await detectSessionConflicts({
    teacherId: testTeacher1.id,
    batchId: testBatch.id,
    room: "Room 101",
    date: testDate,
    startTime: "18:00",
    endTime: "19:00",
  });
  assert.strictEqual(noConflict.hasConflicts, false);
  console.log("   ✓ Conflict detection verified (teacher, batch, room overlap + clean non-overlapping)");

  // Step C: Update Session
  const updated = await updateSession(
    sessionId,
    { subjectName: "Physics Advanced", room: "Room 102" },
    actor,
    "Updated subject name and room"
  );
  assert.strictEqual(updated.session.subjectName, "Physics Advanced");
  assert.strictEqual(updated.session.room, "Room 102");

  const updateLog = await prisma.sessionChangeLog.findFirst({
    where: { sessionId, action: "UPDATE" },
  });
  assert(updateLog, "SessionChangeLog for UPDATE should exist");
  assert.strictEqual(updateLog.reason, "Updated subject name and room");
  console.log("   ✓ Session update and audit log verified");

  // Step D: Reassign Session
  const reassigned = await reassignSession(
    sessionId,
    testTeacher2.id,
    actor,
    "Teacher 1 had an emergency"
  );
  assert.strictEqual(reassigned.session.teacherId, testTeacher2.id);
  assert.strictEqual(reassigned.oldTeacherId, testTeacher1.id);
  assert.strictEqual(reassigned.newTeacherId, testTeacher2.id);

  const reassignLog = await prisma.sessionChangeLog.findFirst({
    where: { sessionId, action: "REASSIGN" },
  });
  assert(reassignLog, "SessionChangeLog for REASSIGN should exist");
  console.log("   ✓ Session reassignment verified with affected teacher tracking");

  // Step E: Reschedule Session
  const rescheduled = await rescheduleSession(
    sessionId,
    {
      newDate: "2026-11-16",
      newStartTime: "10:00",
      newEndTime: "11:00",
      room: "Room 105",
    },
    actor,
    "Rain delay"
  );
  assert.strictEqual(rescheduled.originalSession.status, "RESCHEDULED");
  assert.strictEqual(rescheduled.newSession.status, "SCHEDULED");
  assert.strictEqual(rescheduled.newSession.originalSessionId, sessionId);
  assert.strictEqual(rescheduled.newSession.startTime, "10:00");

  const rescheduleLog = await prisma.sessionChangeLog.findFirst({
    where: { sessionId, action: "RESCHEDULE" },
  });
  assert(rescheduleLog, "SessionChangeLog for RESCHEDULE should exist on original");
  console.log("   ✓ Session reschedule chain verified (original -> RESCHEDULED, new -> SCHEDULED)");

  // Step F: Cancel Session
  const newSessionId = rescheduled.newSession.id;
  const cancelled = await cancelSession(newSessionId, actor, "Holiday declared");
  assert.strictEqual(cancelled.session.status, "CANCELLED");

  const cancelLog = await prisma.sessionChangeLog.findFirst({
    where: { sessionId: newSessionId, action: "CANCEL" },
  });
  assert(cancelLog, "SessionChangeLog for CANCEL should exist");
  console.log("   ✓ Session cancellation and reason audit verified");

  // -------------------------------------------------------------
  // Cleanup Test Records
  // -------------------------------------------------------------
  await prisma.sessionChangeLog.deleteMany({
    where: { sessionId: { in: [sessionId, newSessionId] } },
  });
  await prisma.classSession.deleteMany({
    where: { id: { in: [sessionId, newSessionId] } },
  });
  console.log("   ✓ Test data cleaned up safely");

  console.log("\n=== ALL PHASE 1 TESTS PASSED SUCCESSFULLY! ===");
}

runTests()
  .catch((err) => {
    console.error("Test failure:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
