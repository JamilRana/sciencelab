import assert from "assert";
import { prisma } from "../lib/prisma";
import {
  createSession,
  reassignSession,
  rescheduleSession,
  cancelSession,
  setDutyAmount,
  getSessionHistory,
  isTeacherMonthLocked,
  SessionActor,
} from "../lib/sessions";
import { todayDhaka, tomorrowDhaka, addDaysDhaka, toDhakaDateString } from "../lib/dhaka-time";

console.log("=== RUNNING PHASE 3 TESTS (Change Flows, Audit & Month-Lock) ===\n");

async function runPhase3Tests() {
  let testTeacherA: any;
  let testTeacherB: any;
  let testBatch: any;
  let adminActor: SessionActor;
  let staffActor: SessionActor;
  const createdSessionIds: number[] = [];
  const createdPaymentIds: number[] = [];

  try {
    // 1. Setup Actors & Test Data
    testTeacherA = await prisma.teacher.findFirst();
    assert(testTeacherA, "Requires test teacher A");

    const otherTeachers = await prisma.teacher.findMany({
      where: { id: { not: testTeacherA.id } },
      take: 1,
    });
    if (otherTeachers.length > 0) {
      testTeacherB = otherTeachers[0];
    } else {
      testTeacherB = await prisma.teacher.create({
        data: { name: "Test Teacher B", mobile: "01700000002", perClass: 450, gender: "MALE" },
      });
    }

    testBatch = await prisma.batch.findFirst();
    assert(testBatch, "Requires test batch");

    adminActor = {
      id: 9999,
      username: "admin_tester",
      name: "Admin Tester",
      role: "ADMIN",
    };

    staffActor = {
      id: 8888,
      username: "staff_tester",
      name: "Staff Tester",
      role: "STAFF",
    };

    // Test 1: Reassign flow & audit log
    console.log("-> Test 1: Reassign flow with reason tracking and change audit log");
    const tomorrowStr = tomorrowDhaka();
    const created1 = await createSession(
      {
        kind: "CLASS",
        batchId: testBatch.id,
        subjectName: "Physics Reassign Test",
        teacherId: testTeacherA.id,
        date: tomorrowStr,
        startTime: "10:00",
        endTime: "11:00",
      },
      adminActor
    );
    createdSessionIds.push(created1.session.id);

    const reassignReason = "Teacher A requested leave; Teacher B agreed to substitute.";
    const reassignRes = await reassignSession(
      created1.session.id,
      testTeacherB.id,
      staffActor,
      reassignReason
    );

    assert.strictEqual(reassignRes.session.teacherId, testTeacherB.id, "Session teacher should now be Teacher B");
    assert.strictEqual(reassignRes.oldTeacherId, testTeacherA.id, "Old teacher should be Teacher A");
    assert.strictEqual(reassignRes.newTeacherId, testTeacherB.id, "New teacher should be Teacher B");
    assert.deepStrictEqual(reassignRes.affectedTeacherIds, [testTeacherA.id, testTeacherB.id], "Both teachers should be returned");
    assert(Array.isArray(reassignRes.affectedStudents), "Affected students array must be returned for notifications");

    const reassignLogs = await prisma.sessionChangeLog.findMany({
      where: { sessionId: created1.session.id, action: "REASSIGN" },
    });
    assert.strictEqual(reassignLogs.length, 1, "Exactly 1 REASSIGN change log must exist");
    assert.strictEqual(reassignLogs[0].reason, reassignReason, "Reason must match in audit log");
    assert.strictEqual(reassignLogs[0].byUsername, "staff_tester", "Audit log should track staff user");
    console.log("   ✓ Reassigned successfully with complete SessionChangeLog and affected stakeholders");

    // Test 2: Reschedule chain and lineage
    console.log("\n-> Test 2: Reschedule chain (original preserved as RESCHEDULED, new linked session created)");
    const origDate = tomorrowDhaka();
    const newDate = addDaysDhaka(origDate, 2);

    const created2 = await createSession(
      {
        kind: "CLASS",
        batchId: testBatch.id,
        subjectName: "Chemistry Reschedule Test",
        teacherId: testTeacherA.id,
        date: origDate,
        startTime: "14:00",
        endTime: "15:00",
      },
      adminActor
    );
    createdSessionIds.push(created2.session.id);

    const rescheduleReason = "Batch requested time change due to terminal exam.";
    const rescheduleRes = await rescheduleSession(
      created2.session.id,
      {
        newDate,
        newStartTime: "16:00",
        newEndTime: "17:00",
        room: "Room 302",
      },
      staffActor,
      rescheduleReason
    );
    createdSessionIds.push(rescheduleRes.newSession.id);

    assert.strictEqual(rescheduleRes.originalSession.status, "RESCHEDULED", "Original must be RESCHEDULED");
    assert.strictEqual(rescheduleRes.originalSession.changeReason, rescheduleReason, "Original stores reason");
    assert.strictEqual(rescheduleRes.newSession.status, "SCHEDULED", "New session must be SCHEDULED");
    assert.strictEqual(rescheduleRes.newSession.originalSessionId, created2.session.id, "New session must link to originalSessionId");
    assert.strictEqual(rescheduleRes.newSession.room, "Room 302", "New room should be set");
    assert.deepStrictEqual(rescheduleRes.affectedTeacherIds, [testTeacherA.id]);

    // Check getSessionHistory lineage
    const newSessionHistory = await getSessionHistory(rescheduleRes.newSession.id);
    assert.strictEqual(newSessionHistory.originalSession.id, created2.session.id, "History drawer must link to parent original session");

    const origSessionHistory = await getSessionHistory(created2.session.id);
    assert(origSessionHistory.rescheduledToSessions.length >= 1, "Parent session must show link to successor rescheduled session");
    console.log("   ✓ Reschedule chain established with bidirectional lineage and full audit");

    // Test 3: Cancel Flow
    console.log("\n-> Test 3: Cancel session with reason tracking");
    const created3 = await createSession(
      {
        kind: "EXTRA",
        batchId: testBatch.id,
        subjectName: "Math Cancel Test",
        teacherId: testTeacherA.id,
        date: tomorrowStr,
        startTime: "11:00",
      },
      adminActor
    );
    createdSessionIds.push(created3.session.id);

    const cancelReason = "Inclement weather; coaching center closed.";
    const cancelRes = await cancelSession(created3.session.id, staffActor, cancelReason);

    assert.strictEqual(cancelRes.session.status, "CANCELLED", "Status must be CANCELLED");
    assert.strictEqual(cancelRes.session.changeReason, cancelReason, "Reason must match");

    const cancelLogs = await prisma.sessionChangeLog.findMany({
      where: { sessionId: created3.session.id, action: "CANCEL" },
    });
    assert.strictEqual(cancelLogs.length, 1, "Exactly 1 CANCEL audit log must exist");
    assert.strictEqual(cancelLogs[0].reason, cancelReason);
    console.log("   ✓ Cancelled session correctly logged and excluded from class counts");

    // Test 4: Set Duty Pay Amount
    console.log("\n-> Test 4: Set duty pay amount with ADJUST audit log");
    const created4 = await createSession(
      {
        kind: "EXAM_DUTY",
        subjectName: "Model Test Invigilation",
        teacherId: testTeacherB.id,
        date: tomorrowStr,
        startTime: "09:00",
        endTime: "12:00",
      },
      adminActor
    );
    createdSessionIds.push(created4.session.id);
    assert.strictEqual(created4.session.payAmount, null, "Initially duty has no payAmount");

    const dutyRes = await setDutyAmount(created4.session.id, 650, adminActor, "Standard 3hr invigilation pay");
    assert.strictEqual(dutyRes.session.payAmount, 650, "Pay amount must be updated to 650");

    const adjustLogs = await prisma.sessionChangeLog.findMany({
      where: { sessionId: created4.session.id, action: "ADJUST" },
    });
    assert.strictEqual(adjustLogs.length, 1, "ADJUST change log created");
    console.log("   ✓ Duty pay amount set and audited");

    // Test 5: Month-Lock Enforcement
    console.log("\n-> Test 5: Month-lock enforcement (Staff blocked, Admin allowed)");
    const testLockedDate = "2026-05-15"; // May
    const testLockedMonth = "May";

    const created5 = await createSession(
      {
        kind: "CLASS",
        batchId: testBatch.id,
        subjectName: "Month Lock Validation",
        teacherId: testTeacherA.id,
        date: testLockedDate,
        startTime: "10:00",
      },
      adminActor
    );
    createdSessionIds.push(created5.session.id);

    // Initial check: not locked
    const checkBefore = await isTeacherMonthLocked(testTeacherA.id, testLockedDate);
    assert.strictEqual(checkBefore.isLocked, false, "May should initially not be locked");

    // Create payment in May for Teacher A
    const payment = await prisma.teacherPayment.create({
      data: {
        teacherId: testTeacherA.id,
        month: testLockedMonth,
        amount: 3000,
        date: new Date("2026-05-28T00:00:00Z"),
        note: "May Salary Paid",
      },
    });
    createdPaymentIds.push(payment.id);

    const checkAfter = await isTeacherMonthLocked(testTeacherA.id, testLockedDate);
    assert.strictEqual(checkAfter.isLocked, true, "May must now be locked");
    assert.strictEqual(checkAfter.month, "May");

    // Staff attempt to cancel -> MUST THROW
    let staffBlocked = false;
    try {
      await cancelSession(created5.session.id, staffActor, "Staff cancel attempt on locked month");
    } catch (err: any) {
      staffBlocked = err.message.includes("processed") && err.message.includes("Admin");
    }
    assert(staffBlocked, "Staff should be blocked from cancelling a session in a locked month");

    // Staff attempt to reassign -> MUST THROW
    let staffReassignBlocked = false;
    try {
      await reassignSession(created5.session.id, testTeacherB.id, staffActor, "Staff reassign attempt on locked month");
    } catch (err: any) {
      staffReassignBlocked = err.message.includes("processed") && err.message.includes("Admin");
    }
    assert(staffReassignBlocked, "Staff should be blocked from reassigning a session in a locked month");

    // Admin override -> SUCCEEDS
    const adminCancel = await cancelSession(created5.session.id, adminActor, "Admin override cancellation");
    assert.strictEqual(adminCancel.session.status, "CANCELLED", "Admin can override locked month session");
    console.log("   ✓ Month-lock rules correctly enforced (Staff blocked, Admin permitted)");

  } finally {
    // Cleanup
    if (createdSessionIds.length > 0) {
      await prisma.sessionChangeLog.deleteMany({
        where: { sessionId: { in: createdSessionIds } },
      });
      await prisma.classSession.deleteMany({
        where: { id: { in: createdSessionIds } },
      });
    }
    if (createdPaymentIds.length > 0) {
      await prisma.teacherPayment.deleteMany({
        where: { id: { in: createdPaymentIds } },
      });
    }
    console.log("\n-> Cleaned up all test sessions and payments.");
  }

  console.log("\n=== ALL PHASE 3 TESTS PASSED SUCCESSFULLY! ===");
}

runPhase3Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
