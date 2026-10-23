# Class Routine, Notifications & Auto Class Logging — Implementation Plan

*Science Lab Coaching Center Management System · Extension of the existing Next.js / Prisma / NextAuth application on Vercel (Neon PostgreSQL)*

## 1. Purpose

Add a **class routine** for every batch (by subject and teacher) so that:

- Admin/Staff can plan, assign, reassign, reschedule and cancel classes, including changes for tomorrow.
- Teachers are notified about **tomorrow's classes at 7 PM** (email, in-app, and a staff-assisted WhatsApp link), and immediately when a change affects them.
- Teachers, students and staff can **see the scheduled classes**.
- Students receive **in-app notices** when a class changes.
- Each day's classes are **added to the teacher's class log at the end of that day**, with a staff/admin override. Exam invigilation duty is paid at its **own amount**.

## 2. Confirmed decisions

| Topic | Decision |
| :-- | :-- |
| Class counting | Automatic at the end of the day; Admin/Staff can adjust afterwards |
| Hosting | Vercel (plan not yet confirmed: Hobby or Pro) |
| WhatsApp | No business account. Launch with email + in-app + a staff-assisted `wa.me` click-to-send link. Official API later |
| Schedule pattern | No fixed holidays, no fixed number of classes per day. Staff plan day by day; a weekly repeat is only a helper |
| Exam duty | Teacher may come only for invigilation. It is paid a **different, non-fixed amount** set per duty |
| Visibility | Staff see everything; teachers see their own classes (plus read-only batch routines); students see their batch schedule |
| Student notices | In-app notice on reschedule, cancel, extra class, time or teacher change |
| Time zone | All logic in Asia/Dhaka (UTC+6, no daylight saving) |

## 3. Current state of the code (relevant findings)

| Area | Finding | Consequence |
| :-- | :-- | :-- |
| Server actions | Most actions have no role check; `/api` routes are excluded from the middleware matcher and several are unguarded | Phase 0 must add a shared guard before routine actions are built |
| Email | `nodemailer` is installed but unused | Email driver is new code, no new dependency |
| Scheduling | No cron, no `vercel.json` | Add jobs and a secured job route |
| Notifications | `NotificationsMenu` shows hard-coded sample items | Replace with a real notification table |
| Class log | `TeacherClassLog` stores `classes`, `notebook`, `other`, `perClass`, `paid` per teacher per date; earnings are `(classes + notebook + other) × perClass`, calculated in several places | Duty amount needs its own column and every earnings calculation must include it |
| Time zone | No Dhaka date handling anywhere | Add one shared date helper |
| Contact data | Teachers have `mobile` and `email`; students may link to a user via `userId` | Teachers are reachable; only students with accounts get in-app notices |

## 4. Architecture overview

**Sessions are the source of truth.** A `ClassSession` is one dated class or duty. Notifications, the agenda views and the day-close job all read sessions. The weekly `RoutineSlot` is an optional template that only *creates* sessions; editing a template never overwrites a session that was changed by hand.

```
RoutineSlot (optional repeat) ──generates──▶ ClassSession ◀── staff create / change
                                              │
          ┌──────────────────────────────────┼───────────────────────┐
          ▼                                   ▼                                   ▼
   Notifications                      Agenda / schedule views             Day-close job
 (teacher + student)                (teacher, student, staff)       (adds to TeacherClassLog)
```

**Jobs (all protected by a secret and idempotent):**

| Job | Time (Dhaka) | Time (UTC) | Purpose |
| :-- | :-- | :-- | :-- |
| Daily digest | 19:00 | 13:00 | Send tomorrow's schedule to each teacher |
| Day close | 00:05 | 18:05 | Count all uncounted sessions dated before today |
| Planning reminder (optional) | 17:30 | 11:30 | Warn staff if tomorrow has no sessions |

Vercel cron runs in UTC only. On the Hobby plan each job can run once a day and may fire anywhere within its scheduled hour, so the 19:00 digest could arrive between 19:00 and 19:59. For exact timing use Vercel Pro, or call the same secured route at 13:00 UTC from a free external scheduler such as cron-job.org. The day-close job tolerates the Hobby delay because it only needs to run after midnight.

A small `JobRun` table records each run (job, target date, started, finished, status, summary) so missed or failed runs are visible and the next run catches up.

## 5. Data model (all additive)

Existing tables and rows are not migrated or rewritten. New columns have defaults or are nullable.

### 5.1 ClassSession (new)

| Field | Notes |
| :-- | :-- |
| id |  |
| kind | CLASS, EXAM\_DUTY, EXTRA |
| batchId | Required for classes; optional for exam duty |
| programId | Optional; set for special-batch classes |
| subjectName | Text; blank for exam duty |
| programSubjectId | Optional link for special programs |
| lectureLabel | Optional (e.g. L-12) |
| teacherId | Required |
| date | Calendar date in Dhaka (`@db.Date`) |
| startTime / endTime | `HH:mm` strings; end time optional |
| room | Optional |
| specialExamId / examId | Optional exam link for EXAM\_DUTY |
| status | SCHEDULED, CONDUCTED, CANCELLED, RESCHEDULED |
| payAmount | For EXAM\_DUTY: the amount for this duty (null until set) |
| routineSlotId | Set when generated from a template |
| originalSessionId | Set on the new session created by a reschedule |
| changeReason | Free text |
| countedLogId / countedAt | Set by the day-close job (idempotency) |
| createdById / updatedById, timestamps |  |

Indexes: `(date)`, `(teacherId, date)`, `(batchId, date)`.

### 5.2 Supporting tables (new)

| Table | Fields |
| :-- | :-- |
| **RoutineSlot** | id, batchId, subjectName, programSubjectId?, teacherId, weekday, startTime, endTime?, room?, validFrom, validTo?, active |
| **SessionChangeLog** | id, sessionId, action (CREATE / UPDATE / REASSIGN / RESCHEDULE / CANCEL / ADJUST / COUNT), before (JSON), after (JSON), reason, byUserId, at |
| **Notification** (in-app) | id, userId, kind, title, body, href, sessionId?, dedupeKey (unique), createdAt, readAt |
| **NotificationLog** (delivery) | id, teacherId, channel (EMAIL / IN\_APP / WHATSAPP\_LINK), kind (DAILY\_DIGEST / ASSIGN / CHANGE / CANCEL), forDate, status (PENDING / SENT / FAILED / SKIPPED), providerMessageId, error, attempts, sentAt, dedupeKey (unique) |
| **JobRun** | id, job, forDate, startedAt, finishedAt, status, summary |

### 5.3 Existing tables (extended)

| Table | New columns |
| :-- | :-- |
| **Teacher** | `notifyEmail` (default true), `whatsappNumber` (optional, defaults to `mobile`) |
| **TeacherClassLog** | `source` (MANUAL default / AUTO), `dutyAmount` (default 0), `autoKey` (nullable, unique) |

`autoKey` is `teacherId:date:programId-or-0`. It lets the day-close job find or create exactly one automatic row per teacher, per date, per program, so a second run adds nothing. Each auto row snapshots the rate used in `perClass`: the teacher's program rate (`TeacherRate.lectureRate`) when one exists, otherwise `Teacher.perClass`.

## 6. Business rules

**Sessions and changes**

1. Any number of sessions per day. Warn on overlapping times for the same teacher or the same batch; Admin can override.
2. **Assign:** fill a session with no teacher, or create an EXTRA class.
3. **Reassign:** change the teacher. The old teacher gets a cancel notice, the new teacher an assign notice.
4. **Reschedule:** the original becomes RESCHEDULED (kept for history, never counted). A new SCHEDULED session is created with `originalSessionId`. Both teacher and students are notified.
5. **Cancel:** status CANCELLED with a reason; never counted.
6. Every change writes a `SessionChangeLog` row.
7. Past dates can be edited only by Admin/Staff and follow the month-lock rule (section 9).

**Notifications**

1. At 19:00 each teacher with at least one session tomorrow receives **one digest** listing every class and duty (batch, subject, time, room, exam name for duty). Teachers with nothing receive nothing.
2. A change made **before** the digest is sent for tomorrow appears in the digest only.
3. A change made **after** the digest, or for today, sends an **immediate change notice** to the affected teacher(s).
4. Whether the digest was already sent is read from `NotificationLog` (kind DAILY\_DIGEST, status SENT, `forDate`).
5. Duplicate sends are blocked by `dedupeKey` (digest: `teacherId:forDate:channel:DAILY_DIGEST`).
6. Students: a reschedule, cancel, extra class, or time/teacher change creates one in-app `Notification` per student user in the batch. Repeated edits to the same session collapse into one notice (same `dedupeKey`, text updated). Exam duty creates no student notice.

**Counting and pay**

1. The day-close job processes every non-cancelled, non-rescheduled, uncounted session dated before today (Dhaka). It sets status CONDUCTED and `countedLogId`.
2. CLASS and EXTRA sessions add 1 to `classes` on the teacher's auto row. Rate = the row's snapshot `perClass`.
3. EXAM\_DUTY sessions add their `payAmount` to `dutyAmount`. A duty with no amount is **not** counted as zero: it stays uncounted and appears in a "needs amount" list until set, then is counted on the next run or on demand.
4. The khata (notebook) count stays manual.
5. Earnings everywhere = `(classes + notebook + other) × perClass + dutyAmount`.

## 7. Screens and access

| Screen | Admin | Staff | Teacher | Student |
| :-- | :-: | :-: | :-: | :-: |
| Day planner (create / change sessions) | Yes | Yes | No | No |
| Tomorrow board (reassign, reschedule, cancel, notify) | Yes | Yes | No | No |
| Weekly repeat templates | Yes | Yes | No | No |
| Printable batch routine | Yes | Yes | View | Own batch |
| Teacher agenda (today, tomorrow, week) | Yes | Yes | Own | No |
| Batch schedule (read-only) | Yes | Yes | Yes | Own batch |
| Notification log and job status | Yes | Yes | No | No |
| Day close and class-log adjustments | Yes | Yes | No | No |
| Needs-amount list and duty amounts | Yes | Yes (confirm) | Own earnings only | No |
| In-app bell | Yes | Yes | Yes | Yes |

Teacher mobile numbers, pay amounts and the notification log are never shown to students. Teachers see other teachers' names on batch routines but not their contact details.

New permission keys in `lib/permissions.ts`: `routine:view`, `routine:edit`, `sessions:create`, `sessions:edit`, `sessions:cancel`, `notifications:view_log`, `duty:set_amount`, `classlog:adjust`.

## 8. Phase-by-phase plan

Sizes: S = small, M = medium, L = large. Phases 5 and 6 are independent of each other and can be built in either order once Phase 4 is done.

### Phase 0 — Prerequisites and hardening (M)

**Goal:** a safe base for every routine action and job route.

**Tasks**

1. Rotate the Neon database password and `NEXTAUTH_SECRET` (the old `.env` is in git history); add `.env` and `*.xlsx` to `.gitignore`.
2. Replace the hard-coded default password with a random one shown once.
3. Create a shared `requireRole(roles)` helper and call it at the top of **every** server action and API route. Remove password hashes from `getUsersAction`. Add auth to `/api/students` and the exam routes.
4. Re-check the `active` flag in the NextAuth JWT callback.
5. Create `lib/dhaka-time.ts`: `todayDhaka()`, `tomorrowDhaka()`, `toDhakaDate()`, `formatDhaka()`, and midnight-boundary-safe helpers. All routine code uses only these.
6. Add `CRON_SECRET` and a `requireJobSecret()` helper for job routes.
7. Add the new permission keys.

**Acceptance:** a logged-in student cannot call any admin action; unauthenticated requests to `/api/students` return 401; date helper tests pass at 23:59, 00:00 and 00:01 Dhaka time.

### Phase 1 — Data model and session core (M)

**Goal:** the tables and a tested service layer.

**Tasks**

1. Add `ClassSession`, `RoutineSlot`, `SessionChangeLog`, `Notification`, `NotificationLog`, `JobRun`, and the new `Teacher` and `TeacherClassLog` columns (all additive).
2. Write `lib/sessions.ts`: create, update, reassign, reschedule, cancel; each in a single transaction with its `SessionChangeLog` row.
3. Write conflict detection (same teacher or batch overlapping times) returning warnings, not errors.
4. Write `lib/teacher-earnings.ts` with one `earnedAmount(log)` function (formula in 6, rule 5).

**Acceptance:** unit tests cover every change type, conflict detection, and earnings with and without duty amounts. Existing data and pages are untouched.

### Phase 2 — Day planner and repeat helper (M)

**Goal:** staff can plan any day quickly.

**Tasks**

1. **Day planner** page: choose a date, see sessions grouped by batch or by teacher, add a session (kind, batch, subject, teacher, start/end, room, lecture label), edit, delete.
2. **Exam duty form:** teacher, exam (optional), time, pay amount (optional).
3. **Copy tools:** copy yesterday, copy the same weekday last week, copy selected sessions to another date.
4. **Weekly repeat templates:** create `RoutineSlot` rows and a "Generate sessions for the next 14 days" action that skips dates where a session for that slot already exists or was changed.
5. Conflict warnings shown inline before saving.
6. Planning banner on the staff dashboard when tomorrow has no sessions.

**Acceptance:** staff can plan a full day in under 3 minutes; generating twice creates no duplicates; edited sessions are never overwritten by generation.

### Phase 3 — Change flows and audit (M)

**Goal:** safe same-day and next-day changes.

**Tasks**

1. **Tomorrow board:** list of tomorrow's sessions with actions Reassign, Reschedule, Cancel, Add extra, Set duty amount.
2. Dialogs collect the reason; reschedule collects new date and time and shows conflicts.
3. Session detail drawer with its full change history.
4. Server rules: only Admin/Staff; past-date edits follow the month-lock rule.
5. Each change function returns the list of affected teachers and students for Phase 5 to notify.

**Acceptance:** reschedule keeps the original as RESCHEDULED and links the new session; reassign leaves a history row with before and after; no change can bypass the role check.

### Phase 4 — Visibility (M)

**Goal:** everyone sees the schedule they should.

**Tasks**

1. **Teacher agenda** (today, tomorrow, this week) with status labels.
2. **Teacher batch view:** read-only routine by batch.
3. **Student schedule** on the student dashboard: today, tomorrow, week, with Rescheduled and Cancelled labels and the new time.
4. **Printable routine** per batch and per day (A4, Bangla-capable font).
5. Role-based data shaping on the server (students never receive teacher contact or pay data).

**Acceptance:** a student sees only their batch; a teacher sees their own sessions with other teachers' names only; print output fits A4 for a 12-session day.

### Phase 5 — Notifications (L)

**Goal:** reliable teacher and student notices.

**Tasks**

1. **Channel interface** `sendNotification(channel, recipient, payload)` with drivers: EMAIL (nodemailer with a free-tier provider or SMTP), IN\_APP, WHATSAPP\_LINK.
2. **In-app bell:** replace the sample items in `NotificationsMenu` with the `Notification` table; unread count, mark read, link to the session.
3. **Digest job** route (19:00 Dhaka): builds one message per teacher for tomorrow, writes `NotificationLog`, sends email, writes the in-app notice, records `JobRun`. Retries failures up to 3 times and marks the rest FAILED.
4. **Immediate change notices** triggered by the Phase 3 change results (rules 3–5 in section 6).
5. **WhatsApp link button:** on the Tomorrow board, "Send via WhatsApp" per teacher opens `wa.me/<number>?text=<message>` with the digest text pre-filled, and logs the click as WHATSAPP\_LINK. A "WhatsApp all" list steps staff through each teacher.
6. **Student in-app notices** for the triggers in section 6, one per student user, with collapsing of repeated edits.
7. **Notification log page:** filter by date, teacher, channel, status; retry failed.
8. **Planning reminder** (optional) to staff at 17:30.
9. Teacher notification settings: email on/off, WhatsApp number, number format normalised to `+8801…`.

**Acceptance:** running the digest job twice sends one message per teacher; a change after 19:00 sends one immediate notice; a failed email shows FAILED with the error and can be retried; a student in a rescheduled batch sees one notice.

### Phase 6 — Day close, duty pay and adjustments (L)

**Goal:** accurate, automatic class logs.

**Tasks**

1. **Day-close job** route (00:05 Dhaka): selects uncounted SCHEDULED sessions dated before today; groups by teacher, date and program; upserts the auto `TeacherClassLog` row by `autoKey`; increments `classes` or `dutyAmount`; sets `countedLogId` and CONDUCTED; all in one transaction per teacher-day.
2. **Catch-up:** if earlier days were missed, the job processes every uncounted past session, not just yesterday's.
3. **"Close day now"** button for staff to count the current day early.
4. **Needs-amount list** for duties with no amount, with a quick amount form.
5. **Adjustments:** mark "not held" (reverses the count), change a session's teacher after counting (moves the credit), edit counts on an auto row, add a manual entry. Every adjustment writes a change-log row with a reason.
6. **Month lock:** a teacher-month is locked when a `TeacherPayment` exists for it; edits then require Admin.
7. **Pay formula update:** switch every earnings calculation to `earnedAmount(log)`, including teacher analytics, teacher payments, the dashboard, the teacher payment receipt, and the teacher-route pages.
8. Class-log screens show source (AUTO or MANUAL) and the duty amount.

**Acceptance:** running the job twice changes nothing; cancelled and rescheduled sessions are never counted; a duty with no amount is listed and not counted; totals for old logs (no duty amount) are unchanged; a locked month rejects a Staff edit.

### Phase 7 — Optional extensions (S–M)

- Official **WhatsApp Cloud API** driver when a business account is available (approved utility template, opt-in, per-message cost).
- Web push notifications for installed apps.
- Teacher confirmation ("Seen") on a change notice.
- Reports: classes per teacher per batch, duty totals, cancellation counts.

## 9. Message templates

**Daily digest (email / WhatsApp text)**

```
Sci-Lab — Your schedule for Sat, 25 Oct
1) 4:00 PM — Physics — Batch 2620 (SSC Boys)
2) 6:00 PM — Chemistry — Batch 2610 (SSC Girls)
3) 10:00 AM — Exam duty — Model Test 2
Reply to the office for any change.
```

**Change notice (teacher):** `Update: Physics, Batch 2620 moved to Sun 26 Oct, 4:00 PM (was Sat 25 Oct, 5:00 PM). Reason: <reason>`

**Student in-app:** `Physics class rescheduled to Sun 26 Oct, 4:00 PM (was Sat 25 Oct, 5:00 PM).`

## 10. Testing plan

| Area | Tests |
| :-- | :-- |
| Date helper | Midnight, 23:59, 00:01 Dhaka; UTC rollover |
| Sessions | Create, reassign, reschedule chain, cancel, conflict warnings |
| Generation | Template generates once; edited sessions are preserved |
| Digest | One per teacher; none when empty; dedupe on a second run |
| Change notices | Before vs after digest; today vs tomorrow |
| Day close | Idempotent; catch-up; cancelled and rescheduled excluded; duty without amount held back |
| Pay | `earnedAmount` with and without duty; old logs unchanged |
| Permissions | Student and Teacher blocked from every Admin/Staff action and job route |
| Visibility | Student receives no teacher contact or pay data |
| Month lock | Staff blocked, Admin allowed |

Use a separate test database. A one-week **pilot with one batch** is recommended before enabling every batch.

## 11. Risks and mitigations

| Risk | Mitigation |
| :-- | :-- |
| Hobby cron fires up to 59 minutes late | Use an external scheduler or Pro for the 19:00 digest |
| Staff forget to plan tomorrow | Dashboard banner and 17:30 reminder |
| Pay errors from auto-counting | Cancelled and rescheduled excluded, audit trail, adjustments, month lock |
| Earnings calculated in many places | One `earnedAmount` function replaces all copies, with tests |
| Email provider limits or spam filtering | Log every send; retry; show FAILED in the log |
| Students without accounts get no in-app notice | Check the number of student accounts; staff can use the WhatsApp link for urgent changes |
| Unguarded actions today | Phase 0 is mandatory before anything else |
| Duplicate sends or counts | Unique `dedupeKey` and `autoKey`, plus idempotent jobs |

## 12. Items to confirm

1. Hosting plan (Hobby or Pro) so the 19:00 digest timing approach can be fixed.
2. Whether Staff may set exam-duty amounts, or only Admin.
3. Email provider choice (free-tier service or the center's own SMTP).
4. How many students currently have login accounts, since only they receive in-app notices.
5. Whether overlapping times for the same teacher should be a warning (planned default) or a hard block.
