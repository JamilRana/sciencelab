import assert from "assert";
import { prisma } from "../lib/prisma";
import {
  createSession,
  rescheduleSession,
  cancelSession,
  setDutyAmount,
  SessionActor,
} from "../lib/sessions";
import {
  getTeacherAgendaAction,
  getBatchRoutineAction,
  getStudentScheduleAction,
  getPrintableRoutineAction,
} from "../app/actions/routine";
import { todayDhaka, tomorrowDhaka, addDaysDhaka, toDhakaDateString } from "../lib/dhaka-time";

console.log("=== RUNNING PHASE 4 TESTS (Visibility, Role-Based Shaping & Print) ===\n");

async function runPhase4Tests() {
  let testTeacherA: any;
  let testTeacherB: any;
  let testBatch: any;
  let testStudent: any;
  let adminActor: SessionActor;
  const createdSessionIds: number[] = [];

  try {
    testTeacherA = await prisma.teacher.findFirst();
    assert(testTeacherA, "Requires test teacher A");

    const otherTeachers = await prisma.teacher.findMany({
      where: { id: { not: testTeacherA.id } },
      take: 1,
    });
    testTeacherB = otherTeachers[0] || testTeacherA;

    testBatch = await prisma.batch.findFirst();
    assert(testBatch, "Requires test batch");

    testStudent = await prisma.student.findFirst({
      where: { batchId: testBatch.id },
    });

    adminActor = {
      id: 9999,
      username: "admin_tester",
      name: "Admin Tester",
      role: "ADMIN",
    };

    (globalThis as any).__TEST_SESSION_USER__ = {
      id: "9999",
      username: "admin_tester",
      name: "Admin Tester",
      role: "ADMIN",
    };

    const todayStr = todayDhaka();
    const tomorrowStr = tomorrowDhaka();

    // 1. Create a set of test sessions
    console.log("-> Test 1: Setup test sessions (Regular Class, Exam Duty, Rescheduled Class)");
    const regularClass = await createSession(
      {
        kind: "CLASS",
        batchId: testBatch.id,
        subjectName: "Physics Visibility Test",
        teacherId: testTeacherA.id,
        date: todayStr,
        startTime: "10:00",
        endTime: "11:00",
        room: "Room 101",
      },
      adminActor
    );
    createdSessionIds.push(regularClass.session.id);

    const examDuty = await createSession(
      {
        kind: "EXAM_DUTY",
        subjectName: "Math Terminal Duty",
        teacherId: testTeacherA.id,
        date: tomorrowStr,
        startTime: "09:00",
        endTime: "12:00",
        payAmount: 600,
      },
      adminActor
    );
    createdSessionIds.push(examDuty.session.id);

    const toReschedule = await createSession(
      {
        kind: "CLASS",
        batchId: testBatch.id,
        subjectName: "Chemistry Reschedule Notice Test",
        teacherId: testTeacherB.id,
        date: todayStr,
        startTime: "16:00",
        endTime: "17:00",
      },
      adminActor
    );
    createdSessionIds.push(toReschedule.session.id);

    const rescheduledRes = await rescheduleSession(
      toReschedule.session.id,
      {
        newDate: tomorrowStr,
        newStartTime: "17:00",
        newEndTime: "18:00",
        room: "Room 202",
      },
      adminActor,
      "Shifted to tomorrow 5pm"
    );
    createdSessionIds.push(rescheduledRes.newSession.id);
    console.log("   ✓ Sessions successfully created for visibility testing");

    // 2. Teacher Agenda Action
    console.log("\n-> Test 2: Teacher agenda action (Own sessions, status labels, duty pay)");
    const teacherAgendaRes = await getTeacherAgendaAction("week", todayStr, testTeacherA.id);
    assert.strictEqual(teacherAgendaRes.success, true, "Teacher agenda action should succeed");
    const agendaSessions = teacherAgendaRes.data?.sessions || [];
    assert(agendaSessions.length >= 2, "Teacher A should see at least 2 sessions");

    const foundClass = agendaSessions.find((s: any) => s.id === regularClass.session.id);
    assert(foundClass, "Regular class must appear in Teacher A's agenda");
    assert.strictEqual(foundClass.status, "SCHEDULED");

    const foundDuty = agendaSessions.find((s: any) => s.id === examDuty.session.id);
    assert(foundDuty, "Exam duty must appear in Teacher A's agenda");
    assert.strictEqual(foundDuty.kind, "EXAM_DUTY");
    assert.strictEqual(foundDuty.payAmount, 600, "Teacher must see their own duty pay amount");
    console.log("   ✓ Teacher agenda accurately returned sessions with proper status and remuneration");

    // 3. Batch Routine View & Data Shaping
    console.log("\n-> Test 3: Batch Routine View & Data Shaping (Teacher contact & pay stripped)");
    const batchRoutineRes = await getBatchRoutineAction(testBatch.id, "week", todayStr);
    assert.strictEqual(batchRoutineRes.success, true, "Batch routine action should succeed");
    const routineSessions = batchRoutineRes.data?.sessions || [];
    assert(routineSessions.length >= 2, "Batch routine should return batch sessions");

    for (const session of routineSessions) {
      assert(session.teacher?.name, "Teacher name must be present on batch routine");
      // DATA SHAPING CHECKS: No mobile, email, or payAmount
      assert.strictEqual((session.teacher as any).mobile, undefined, "Teacher mobile MUST NOT be exposed on batch routine");
      assert.strictEqual((session.teacher as any).email, undefined, "Teacher email MUST NOT be exposed on batch routine");
      assert.strictEqual((session as any).payAmount, undefined, "Pay amount MUST NOT be exposed on batch routine");
    }
    console.log("   ✓ Batch routine correctly shapes data: teacher names shown, sensitive contact and pay stripped");

    // 4. Student Schedule & Reschedule Successor Callout
    console.log("\n-> Test 4: Student Schedule (Duty excluded, Rescheduled class linked to new time)");
    const studentScheduleRes = await getStudentScheduleAction("week", todayStr);
    assert.strictEqual(studentScheduleRes.success, true, "Student schedule should succeed");

    const studentSessions = studentScheduleRes.data?.sessions || [];

    // Check: Exam duty is NOT in student schedule
    const dutyFoundInStudent = studentSessions.some((s: any) => s.id === examDuty.session.id);
    assert.strictEqual(dutyFoundInStudent, false, "Internal faculty EXAM_DUTY must never appear in student schedule");

    // Check: Rescheduled session contains rescheduledTo successor data
    const origRescheduledInStudent = studentSessions.find((s: any) => s.id === toReschedule.session.id);
    if (origRescheduledInStudent) {
      assert.strictEqual(origRescheduledInStudent.status, "RESCHEDULED");
      assert(origRescheduledInStudent.rescheduledTo, "Must include successor session information");
      assert.strictEqual(origRescheduledInStudent.rescheduledTo.startTime, "17:00");
      assert.strictEqual(origRescheduledInStudent.rescheduledTo.date, tomorrowStr);
    }

    // Check: Strictly sanitized teacher info
    for (const s of studentSessions) {
      assert.strictEqual((s.teacher as any)?.mobile, undefined, "Teacher mobile MUST NOT be sent to student");
      assert.strictEqual((s.teacher as any)?.email, undefined, "Teacher email MUST NOT be sent to student");
      assert.strictEqual((s as any).payAmount, undefined, "Pay amount MUST NOT be sent to student");
    }
    console.log("   ✓ Student schedule verified: duties hidden, successor notice present, strict data sanitization");

    // 5. Printable Routine Data Provider
    console.log("\n-> Test 5: Printable Routine Action (A4 daily sheet & weekly batch timetable)");
    const dailyPrintRes = await getPrintableRoutineAction({
      view: "day",
      date: todayStr,
    });
    assert.strictEqual(dailyPrintRes.success, true, "Daily print action should succeed");
    const dailySessions = (dailyPrintRes.data as any)?.sessions || [];
    assert(dailySessions.length >= 1, "Daily print should return sessions for the day");

    const batchWeekPrintRes = await getPrintableRoutineAction({
      view: "batch_week",
      batchId: testBatch.id,
    });
    assert.strictEqual(batchWeekPrintRes.success, true, "Batch week print action should succeed");
    assert(batchWeekPrintRes.data?.batch?.id === testBatch.id, "Batch week print must match requested batch");
    console.log("   ✓ Printable routine data structures verified for A4 print output");

  } finally {
    // Cleanup created test sessions
    if (createdSessionIds.length > 0) {
      await prisma.sessionChangeLog.deleteMany({
        where: { sessionId: { in: createdSessionIds } },
      });
      await prisma.classSession.deleteMany({
        where: { id: { in: createdSessionIds } },
      });
      console.log("\n-> Cleaned up all test sessions.");
    }
  }

  console.log("\n=== ALL PHASE 4 TESTS PASSED SUCCESSFULLY! ===");
}

runPhase4Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  });
