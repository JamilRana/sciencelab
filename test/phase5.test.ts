import { prisma } from "../lib/prisma";
import {
  normalizeBdPhone,
  buildWhatsAppLink,
  formatTeacherDailyDigest,
  shouldSendImmediateTeacherNotice,
  sendInAppNotification,
  runDailyDigestJob,
  runPlanningReminderJob,
  notifySessionChange,
} from "../lib/notifications";
import {
  todayDhaka,
  tomorrowDhaka,
  addDaysDhaka,
  toDhakaDbDate,
  formatDhakaDate,
} from "../lib/dhaka-time";
import {
  getInAppNotificationsAction,
  markNotificationReadAction,
  getNotificationLogsAction,
  getTeacherDigestWhatsAppUrlAction,
  logWhatsAppSentAction,
} from "../app/actions/notifications";

// Enable mock transport for email sending in test environment
(globalThis as any).__TEST_SMTP_MOCK__ = true;

// Mock test session user for server actions
(globalThis as any).__TEST_SESSION_USER__ = {
  id: 1,
  username: "admin",
  name: "Admin User",
  role: "ADMIN",
};

async function runTests() {
  console.log("=================================================");
  console.log("  PHASE 5 TEST SUITE: NOTIFICATIONS & CRON JOBS  ");
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

  // -------------------------------------------------------------------
  // Test 1: Phone Normalization and WhatsApp Link Generation
  // -------------------------------------------------------------------
  console.log("Test 1: Phone normalization & WhatsApp link builder...");
  {
    const p1 = normalizeBdPhone("01712345678");
    assert(p1.isValid, "01712345678 should be valid BD number");
    assert(p1.e164 === "+8801712345678", `E164 should be +8801712345678, got ${p1.e164}`);
    assert(p1.waNumber === "8801712345678", `WhatsApp digits should be 8801712345678, got ${p1.waNumber}`);

    const p2 = normalizeBdPhone("+8801812345678");
    assert(p2.isValid, "+8801812345678 should be valid");
    assert(p2.waNumber === "8801812345678", "WhatsApp digits correct for prefixed +88018");

    const p3 = normalizeBdPhone("01234567890"); // Invalid operator 012
    assert(!p3.isValid, "Operator 012 should be rejected as invalid BD operator");

    const p4 = normalizeBdPhone("123");
    assert(!p4.isValid, "Short number should be rejected");

    const link = buildWhatsAppLink("01712345678", "Sci-Lab Routine Notice");
    assert(
      link === "https://wa.me/8801712345678?text=Sci-Lab%20Routine%20Notice",
      `WhatsApp URL should match wa.me format, got: ${link}`
    );
  }

  // -------------------------------------------------------------------
  // Test 2: Daily Digest Message Template (Spec Section 9)
  // -------------------------------------------------------------------
  console.log("\nTest 2: Spec Section 9 Daily Digest Message Formatting...");
  {
    const targetDate = "2026-10-25"; // A Sunday
    const mockSessions = [
      {
        id: 101,
        kind: "CLASS",
        subjectName: "Physics",
        batch: { name: "Batch 2620 (SSC Boys)" },
        startTime: "16:00",
        room: "101",
      },
      {
        id: 102,
        kind: "CLASS",
        subjectName: "Chemistry",
        batch: { name: "Batch 2610 (SSC Girls)" },
        startTime: "18:00",
        room: null,
      },
      {
        id: 103,
        kind: "EXAM_DUTY",
        startTime: "10:00",
        specialExam: { title: "Model Test 2" },
      },
    ];

    const { text, sessionCount } = formatTeacherDailyDigest(targetDate, mockSessions);

    assert(sessionCount === 3, "Session count should be 3");
    assert(text.includes("Sci-Lab — Your schedule for"), "Header should match Sci-Lab format");
    assert(text.includes("1) 10:00 AM — Exam duty — Model Test 2"), "Chronological order: 10:00 AM exam duty first");
    assert(text.includes("2) 4:00 PM — Physics — Batch 2620 (SSC Boys) (Room 101)"), "Class with room formatted properly");
    assert(text.includes("3) 6:00 PM — Chemistry — Batch 2610 (SSC Girls)"), "Class without room formatted properly");
    assert(text.includes("Reply to the office for any change."), "Footer instructions present");
  }

  // -------------------------------------------------------------------
  // Test 3: Daily Digest Job Execution & Deduplication
  // -------------------------------------------------------------------
  console.log("\nTest 3: Daily Digest Job & Deduplication...");
  {
    const teacher = await prisma.teacher.findFirst();
    const batch = await prisma.batch.findFirst();
    const testTomorrow = addDaysDhaka(todayDhaka(), 1);

    if (teacher && batch) {
      // Create a test session for tomorrow
      const testSession = await prisma.classSession.create({
        data: {
          kind: "CLASS",
          subjectName: "Phase 5 Test Subject",
          teacherId: teacher.id,
          batchId: batch.id,
          date: toDhakaDbDate(testTomorrow),
          startTime: "14:00",
          endTime: "15:30",
          room: "303",
          status: "SCHEDULED",
        },
      });

      // Run daily digest job for testTomorrow
      const run1 = await runDailyDigestJob({ forDate: testTomorrow });
      assert(run1.success, "First digest job run should succeed");
      assert(run1.processedTeachers >= 1, `Processed at least 1 teacher (got ${run1.processedTeachers})`);

      // Verify JobRun record created
      const jobRunEntry = await prisma.jobRun.findUnique({
        where: { id: run1.jobRunId },
      });
      assert(jobRunEntry !== null, "JobRun record should exist in database");
      assert(jobRunEntry?.status === "SUCCESS", "JobRun status should be SUCCESS");

      // Verify NotificationLog entry created
      const digestLog = await prisma.notificationLog.findFirst({
        where: {
          teacherId: teacher.id,
          forDate: testTomorrow,
          kind: "DAILY_DIGEST",
        },
      });
      assert(digestLog !== null, "NotificationLog entry should exist for teacher digest");

      // Run second time (deduplication check)
      const run2 = await runDailyDigestJob({ forDate: testTomorrow });
      assert(run2.success, "Second digest job run should succeed");
      assert(
        run2.skippedEmails >= 1 || run2.sentEmails === 0,
        "Second run should skip already delivered emails via dedupeKey"
      );

      // Clean up test session
      await prisma.classSession.delete({ where: { id: testSession.id } });
      if (digestLog) {
        await prisma.notificationLog.delete({ where: { id: digestLog.id } });
      }
      await prisma.jobRun.delete({ where: { id: run1.jobRunId } });
      await prisma.jobRun.delete({ where: { id: run2.jobRunId } });
    }
  }

  // -------------------------------------------------------------------
  // Test 4: Immediate Change Rules & Student Notices
  // -------------------------------------------------------------------
  console.log("\nTest 4: Immediate Change Notice Rules & Student Alerts...");
  {
    const today = todayDhaka();
    const tomorrow = tomorrowDhaka();
    const farFuture = addDaysDhaka(today, 10);

    // Rule: Today's changes are always immediate
    const shouldSendToday = await shouldSendImmediateTeacherNotice(1, today);
    assert(shouldSendToday === true, "Today's changes must always trigger immediate notice");

    // Rule: Far future dates do not trigger immediate noise
    const shouldSendFarFuture = await shouldSendImmediateTeacherNotice(1, farFuture);
    assert(shouldSendFarFuture === false, "Far future edits should not spam immediate notices");

    // Test Student In-App Notice Collapsing
    const user = await prisma.user.findFirst();
    if (user) {
      const sessionId = 999999;
      const dedupeKey = `student:${user.id}:session:${sessionId}`;

      // First change: Reschedule
      await sendInAppNotification({
        userId: user.id,
        kind: "SCHEDULE_CHANGE",
        title: "Class Rescheduled: Physics",
        body: "Physics class rescheduled to tomorrow 4:00 PM",
        dedupeKey,
      });

      const notif1 = await prisma.notification.findUnique({
        where: { dedupeKey },
      });
      assert(notif1 !== null, "Student in-app notification created");
      assert(Boolean(notif1?.title.includes("Physics")), "Notification title correct");

      // Second change to same session collapses and updates text
      await sendInAppNotification({
        userId: user.id,
        kind: "SCHEDULE_CHANGE",
        title: "Class Rescheduled: Physics (Updated)",
        body: "Physics class moved to tomorrow 5:00 PM (was 4:00 PM)",
        dedupeKey,
      });

      const notif2 = await prisma.notification.findUnique({
        where: { dedupeKey },
      });
      assert(notif2?.id === notif1?.id, "Collapsing: same notification ID updated");
      assert(Boolean(notif2?.title.includes("(Updated)")), "Title updated to latest state");
      assert(notif2?.readAt === null, "Notification reset to unread on subsequent edit");

      // Clean up test notification
      await prisma.notification.delete({ where: { id: notif1!.id } });
    }
  }

  // -------------------------------------------------------------------
  // Test 5: In-App Bell Actions & WhatsApp Dispatch
  // -------------------------------------------------------------------
  console.log("\nTest 5: In-App Bell Server Actions & WhatsApp Dispatch...");
  {
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (adminUser) {
      // Create a test in-app notification
      const testNotif = await prisma.notification.create({
        data: {
          userId: adminUser.id,
          kind: "DAILY_DIGEST",
          title: "Phase 5 In-App Bell Test",
          body: "Verification of live in-app notification querying",
        },
      });

      // Query via Server Action
      (globalThis as any).__TEST_SESSION_USER__ = {
        id: adminUser.id,
        role: "ADMIN",
        name: adminUser.name,
      };

      const inAppRes = await getInAppNotificationsAction(10);
      assert(inAppRes.success, "getInAppNotificationsAction should succeed");
      assert(inAppRes.data.length > 0, "Should return user notifications");
      assert((inAppRes.unreadCount ?? 0) >= 1, "Should report at least 1 unread notification");

      // Mark as read
      const markRes = await markNotificationReadAction(testNotif.id);
      assert(markRes.success, "markNotificationReadAction should succeed");

      const updated = await prisma.notification.findUnique({ where: { id: testNotif.id } });
      assert(updated?.readAt !== null, "readAt should now be timestamped");

      // WhatsApp link action test
      const teacher = await prisma.teacher.findFirst();
      if (teacher) {
        // Test logWhatsAppSentAction
        const logRes = await logWhatsAppSentAction(teacher.id, tomorrowDhaka());
        assert(logRes.success, "logWhatsAppSentAction should create delivery log");

        // Query notification logs
        const logsRes = await getNotificationLogsAction({ channel: "WHATSAPP_LINK" });
        assert(logsRes.success, "getNotificationLogsAction should return logs");
        assert(logsRes.data.some((l: any) => l.teacherId === teacher.id), "Logged WhatsApp record found");

        // Clean up
        if (logRes.data) {
          await prisma.notificationLog.delete({ where: { id: logRes.data.id } });
        }
      }

      // Planning reminder job test
      const planRes = await runPlanningReminderJob();
      assert(planRes.success, "Planning reminder job should execute successfully");

      // Clean up test notification
      await prisma.notification.delete({ where: { id: testNotif.id } });
    }
  }

  console.log("\n-------------------------------------------------");
  console.log(`Phase 5 Test Results: ${passed} passed, ${failed} failed`);
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
