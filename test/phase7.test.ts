import { prisma } from "../lib/prisma";
import {
  getDhakaMonthRange,
  todayDhaka,
  toDhakaDbDate,
  fromDhakaDbDate,
} from "../lib/dhaka-time";
import {
  isWhatsAppCloudConfigured,
  sendWhatsAppCloudMessage,
} from "../lib/whatsapp-cloud";
import {
  getRoutineAnalyticsAction,
} from "../app/actions/routine-analytics";

async function runTests() {
  console.log("=================================================");
  console.log("  PHASE 7 TEST SUITE: ROUTINE REPORTS & EXTENSIONS ");
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

  // 1. Snapshot initial database records for zero data loss check
  const [initialTeachers, initialStudents, initialBatches, initialUsers, initialLogs] =
    await Promise.all([
      prisma.teacher.count(),
      prisma.student.count(),
      prisma.batch.count(),
      prisma.user.count(),
      prisma.teacherClassLog.count(),
    ]);

  console.log(`Initial DB State: ${initialTeachers} teachers, ${initialStudents} students, ${initialBatches} batches, ${initialUsers} users, ${initialLogs} logs`);

  const createdSessionIds: number[] = [];
  const createdNotificationIds: number[] = [];
  const createdNotificationLogIds: number[] = [];

  const existingTeachers = await prisma.teacher.findMany({ take: 2, orderBy: { id: "asc" } });
  if (existingTeachers.length < 2) {
    throw new Error("Expected at least 2 teachers in DB for testing");
  }
  const testTeacherA = existingTeachers[0];
  const testTeacherB = existingTeachers[1];

  const existingBatches = await prisma.batch.findMany({ take: 2, orderBy: { id: "asc" } });
  if (existingBatches.length < 2) {
    throw new Error("Expected at least 2 batches in DB for testing");
  }
  const testBatch1 = existingBatches[0];
  const testBatch2 = existingBatches[1];

  const adminUser = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "STAFF"] } },
  });
  if (!adminUser) {
    throw new Error("Expected at least 1 ADMIN or STAFF user");
  }

  // Set mock session for testing server actions in tsx
  (globalThis as any).__TEST_SESSION_USER__ = {
    id: String(adminUser.id),
    username: adminUser.username,
    role: adminUser.role,
    name: adminUser.name || "Test Admin",
  };

  const TEST_DATE = "2026-10-15"; // Mid-October 2026

  try {
    // -------------------------------------------------------------------------
    // TEST SECTION 1: Dhaka Month Range Helpers
    // -------------------------------------------------------------------------
    console.log("\n--- Section 1: Dhaka Month Range Helpers ---");

    const octRange = getDhakaMonthRange("2026-10-15");
    assert(octRange.startDate === "2026-10-01", "October start date is 2026-10-01");
    assert(octRange.endDate === "2026-10-31", "October end date is 2026-10-31");

    const aprRange = getDhakaMonthRange("2026-04-10");
    assert(aprRange.startDate === "2026-04-01", "April start date is 2026-04-01");
    assert(aprRange.endDate === "2026-04-30", "April end date is 2026-04-30");

    const leapFeb = getDhakaMonthRange("2024-02-14");
    assert(leapFeb.startDate === "2024-02-01", "Leap year Feb start date is 2024-02-01");
    assert(leapFeb.endDate === "2024-02-29", "Leap year Feb end date is 2024-02-29");

    const nonLeapFeb = getDhakaMonthRange("2025-02-05");
    assert(nonLeapFeb.startDate === "2025-02-01", "Non-leap year Feb start date is 2025-02-01");
    assert(nonLeapFeb.endDate === "2025-02-28", "Non-leap year Feb end date is 2025-02-28");

    // -------------------------------------------------------------------------
    // TEST SECTION 2: WhatsApp Cloud API Driver
    // -------------------------------------------------------------------------
    console.log("\n--- Section 2: WhatsApp Cloud API Driver ---");

    const origToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const origPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    delete process.env.WHATSAPP_CLOUD_API_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;

    assert(!isWhatsAppCloudConfigured(), "isWhatsAppCloudConfigured returns false when env unset");

    const unconfRes = await sendWhatsAppCloudMessage({
      to: "01712345678",
      text: "Test digest",
    });
    assert(!unconfRes.success, "sendWhatsAppCloudMessage fails when unconfigured");
    assert(unconfRes.notConfigured === true, "returns notConfigured: true flag gracefully");

    process.env.WHATSAPP_CLOUD_API_TOKEN = "dummy_token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";

    const badPhoneRes = await sendWhatsAppCloudMessage({
      to: "invalid-phone",
      text: "Hello",
    });
    assert(!badPhoneRes.success, "Rejects invalid phone before network call");
    assert(badPhoneRes.error?.includes("Invalid recipient") === true, "Proper phone error message");

    // Mock fetch for Cloud API success
    const originalFetch = global.fetch;
    let capturedUrl = "";
    let capturedBody: any = null;

    global.fetch = (async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: "whatsapp",
          contacts: [{ input: "8801712345678", wa_id: "8801712345678" }],
          messages: [{ id: "wamid.HBgLMTEyMjMzNDQ1NQ==" }],
        }),
      } as any;
    }) as any;

    try {
      const dedupeKey = `test:cloud:teacher:${testTeacherA.id}:${TEST_DATE}`;
      const cloudSuccess = await sendWhatsAppCloudMessage({
        to: "01712345678",
        text: "Sci-Lab schedule test",
        teacherId: testTeacherA.id,
        forDate: TEST_DATE,
        kind: "DAILY_DIGEST",
        dedupeKey,
      });

      assert(cloudSuccess.success === true, "Cloud API mock call succeeds");
      assert(cloudSuccess.messageId === "wamid.HBgLMTEyMjMzNDQ1NQ==", "Captures providerMessageId");
      assert(capturedUrl.includes("123456789/messages"), "Calls Meta v18.0 endpoint with phone number ID");
      assert(capturedBody.to === "8801712345678", "Formats BD recipient phone digits for Meta");

      const cloudLog = await prisma.notificationLog.findUnique({
        where: { dedupeKey },
      });

      assert(cloudLog !== null, "NotificationLog record created for WHATSAPP_CLOUD");
      assert(cloudLog?.channel === "WHATSAPP_CLOUD", "Channel is WHATSAPP_CLOUD");
      assert(cloudLog?.status === "SENT", "Status is SENT");
      assert(cloudLog?.providerMessageId === "wamid.HBgLMTEyMjMzNDQ1NQ==", "Stored message ID matches");

      if (cloudLog) createdNotificationLogIds.push(cloudLog.id);
    } finally {
      global.fetch = originalFetch;
      if (origToken) process.env.WHATSAPP_CLOUD_API_TOKEN = origToken;
      else delete process.env.WHATSAPP_CLOUD_API_TOKEN;
      if (origPhoneId) process.env.WHATSAPP_PHONE_NUMBER_ID = origPhoneId;
      else delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    }

    // -------------------------------------------------------------------------
    // TEST SECTION 3: Teacher Notice Confirmation ('Seen')
    // -------------------------------------------------------------------------
    console.log("\n--- Section 3: Teacher Notice Confirmation ('Seen') ---");

    const notif = await prisma.notification.create({
      data: {
        userId: adminUser.id,
        kind: "SCHEDULE_CHANGE",
        title: "Schedule Update",
        body: "Physics moved to 5:00 PM (was 4:00 PM)",
      },
    });
    createdNotificationIds.push(notif.id);

    assert(notif.readAt === null, "New notification has readAt = null initially");

    const seenTime = new Date();
    const updatedNotif = await prisma.notification.update({
      where: { id: notif.id },
      data: { readAt: seenTime },
    });

    assert(updatedNotif.readAt !== null, "Acknowledged notification has valid readAt timestamp");
    assert(
      Math.abs(new Date(updatedNotif.readAt!).getTime() - seenTime.getTime()) < 1000,
      "readAt timestamp matches acknowledgment time"
    );

    // -------------------------------------------------------------------------
    // TEST SECTION 4: Routine Analytics Aggregation
    // -------------------------------------------------------------------------
    console.log("\n--- Section 4: Routine Analytics Aggregation ---");

    const dbDate = toDhakaDbDate(TEST_DATE);

    // Session 1: Conducted Class - Teacher A, Batch 1
    const s1 = await prisma.classSession.create({
      data: {
        kind: "CLASS",
        teacherId: testTeacherA.id,
        batchId: testBatch1.id,
        subjectName: "Physics",
        lectureLabel: "L-01",
        date: dbDate,
        startTime: "15:00",
        status: "CONDUCTED",
      },
    });
    createdSessionIds.push(s1.id);

    // Session 2: Scheduled Class - Teacher A, Batch 2
    const s2 = await prisma.classSession.create({
      data: {
        kind: "CLASS",
        teacherId: testTeacherA.id,
        batchId: testBatch2.id,
        subjectName: "Chemistry",
        lectureLabel: "L-02",
        date: dbDate,
        startTime: "16:30",
        status: "SCHEDULED",
      },
    });
    createdSessionIds.push(s2.id);

    // Session 3: Cancelled Class - Teacher A, Batch 1
    const s3 = await prisma.classSession.create({
      data: {
        kind: "CLASS",
        teacherId: testTeacherA.id,
        batchId: testBatch1.id,
        subjectName: "Physics",
        date: dbDate,
        startTime: "18:00",
        status: "CANCELLED",
        changeReason: "Teacher Sick",
      },
    });
    createdSessionIds.push(s3.id);

    // Session 4: Exam Duty (remunerated) - Teacher B
    const s4 = await prisma.classSession.create({
      data: {
        kind: "EXAM_DUTY",
        teacherId: testTeacherB.id,
        date: dbDate,
        startTime: "10:00",
        status: "CONDUCTED",
        payAmount: 650,
      },
    });
    createdSessionIds.push(s4.id);

    // Session 5: Exam Duty (Needs Amount) - Teacher B
    const s5 = await prisma.classSession.create({
      data: {
        kind: "EXAM_DUTY",
        teacherId: testTeacherB.id,
        date: dbDate,
        startTime: "12:00",
        status: "SCHEDULED",
        payAmount: null, // Needs amount
      },
    });
    createdSessionIds.push(s5.id);

    // Execute Analytics Query for the test date
    const reportRes = await getRoutineAnalyticsAction({
      startDate: TEST_DATE,
      endDate: TEST_DATE,
    });

    assert(reportRes.success === true, "getRoutineAnalyticsAction returns success: true");
    assert(reportRes.data !== undefined, "Report data payload is populated");

    const summary = reportRes.data!.summary;
    assert(summary.totalSessions === 5, `Total sessions is 5 (got ${summary.totalSessions})`);
    assert(summary.conductedClasses === 2, `Conducted classes is 2 (got ${summary.conductedClasses})`);
    assert(summary.examDutiesCount === 2, `Exam duties count is 2 (got ${summary.examDutiesCount})`);
    assert(summary.examDutiesPay === 650, `Exam duties pay is 650 (got ${summary.examDutiesPay})`);
    assert(summary.cancelledCount === 1, `Cancelled count is 1 (got ${summary.cancelledCount})`);
    assert(summary.cancellationRate === 20, `Cancellation rate is 20% (got ${summary.cancellationRate}%)`);

    // Verify Teacher x Batch Matrix
    const teacherBatchRows = reportRes.data!.teacherBatchMatrix;
    assert(teacherBatchRows.length === 2, `Teacher A has 2 batch groups (got ${teacherBatchRows.length})`);

    const b1Row = teacherBatchRows.find((r) => r.batchId === testBatch1.id);
    assert(b1Row !== undefined, "Batch 1 row exists in teacherBatchMatrix");
    assert(b1Row?.conductedCount === 1, `Batch 1 conducted count is 1 (got ${b1Row?.conductedCount})`);
    assert(b1Row?.cancelledCount === 1, `Batch 1 cancelled count is 1 (got ${b1Row?.cancelledCount})`);
    assert(b1Row?.totalCount === 2, `Batch 1 total count is 2 (got ${b1Row?.totalCount})`);
    assert(b1Row?.subjects.includes("Physics") === true, "Batch 1 records Physics subject");

    const b2Row = teacherBatchRows.find((r) => r.batchId === testBatch2.id);
    assert(b2Row !== undefined, "Batch 2 row exists in teacherBatchMatrix");
    assert(b2Row?.scheduledCount === 1, `Batch 2 scheduled count is 1 (got ${b2Row?.scheduledCount})`);
    assert(b2Row?.totalCount === 1, `Batch 2 total count is 1 (got ${b2Row?.totalCount})`);
    assert(b2Row?.subjects.includes("Chemistry") === true, "Batch 2 records Chemistry subject");

    // Verify Exam Duty Totals
    const dutyRows = reportRes.data!.teacherDuties;
    assert(dutyRows.length === 1, `Teacher B has 1 duty summary row (got ${dutyRows.length})`);
    const teacherBRow = dutyRows[0];
    assert(teacherBRow.teacherId === testTeacherB.id, "Duty summary matches Teacher B");
    assert(teacherBRow.totalDuties === 2, `Total duties is 2 (got ${teacherBRow.totalDuties})`);
    assert(teacherBRow.totalPay === 650, `Total duty pay is 650 (got ${teacherBRow.totalPay})`);
    assert(teacherBRow.pendingAmountCount === 1, `Needs amount count is 1 (got ${teacherBRow.pendingAmountCount})`);

    // Verify Cancellation Analysis
    const cancelAnalysis = reportRes.data!.cancellationAnalysis;
    assert(cancelAnalysis.cancelledSessions.length === 1, "Exactly 1 cancelled session logged");
    assert(cancelAnalysis.cancelledSessions[0].reason === "Teacher Sick", "Logged reason is 'Teacher Sick'");
    assert(cancelAnalysis.cancelledSessions[0].status === "CANCELLED", "Status is CANCELLED");

    const sickReason = cancelAnalysis.byReason.find((r) => r.reason === "Teacher Sick");
    assert(sickReason !== undefined, "Reason 'Teacher Sick' found in frequency list");
    assert(sickReason?.count === 1, "Reason count is 1");
    assert(sickReason?.percentage === 100, "Reason percentage is 100%");

    // Verify Teacher filter
    const teacherFilterRes = await getRoutineAnalyticsAction({
      startDate: TEST_DATE,
      endDate: TEST_DATE,
      teacherId: testTeacherB.id,
    });
    assert(teacherFilterRes.data!.summary.totalSessions === 2, "Teacher B filter returns 2 sessions");
    assert(teacherFilterRes.data!.teacherBatchMatrix.length === 0, "Teacher B has 0 class matrix rows (duties only)");

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP & ZERO DATA LOSS VERIFICATION
    // -------------------------------------------------------------------------
    console.log("\n--- Cleaning up temporary test fixtures ---");

    if (createdSessionIds.length > 0) {
      await prisma.sessionChangeLog.deleteMany({
        where: { sessionId: { in: createdSessionIds } },
      });
      await prisma.classSession.deleteMany({
        where: { id: { in: createdSessionIds } },
      });
      console.log(`Deleted ${createdSessionIds.length} test sessions`);
    }

    if (createdNotificationIds.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: createdNotificationIds } },
      });
      console.log(`Deleted ${createdNotificationIds.length} test notifications`);
    }

    if (createdNotificationLogIds.length > 0) {
      await prisma.notificationLog.deleteMany({
        where: { id: { in: createdNotificationLogIds } },
      });
      console.log(`Deleted ${createdNotificationLogIds.length} test notification logs`);
    }

    const [finalTeachers, finalStudents, finalBatches, finalUsers, finalLogs] =
      await Promise.all([
        prisma.teacher.count(),
        prisma.student.count(),
        prisma.batch.count(),
        prisma.user.count(),
        prisma.teacherClassLog.count(),
      ]);

    console.log(`Final DB State: ${finalTeachers} teachers, ${finalStudents} students, ${finalBatches} batches, ${finalUsers} users, ${finalLogs} logs`);

    assert(finalTeachers === initialTeachers, "Zero data loss: Teacher count identical");
    assert(finalStudents === initialStudents, "Zero data loss: Student count identical");
    assert(finalBatches === initialBatches, "Zero data loss: Batch count identical");
    assert(finalUsers === initialUsers, "Zero data loss: User count identical");
    assert(finalLogs === initialLogs, "Zero data loss: TeacherClassLog count identical");
  }

  console.log("\n=================================================");
  console.log(`  PHASE 7 RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
