# Special Batch Module (SSC & Junior) — Implementation Plan

*Science Lab Coaching Center Management System · Extension of the existing Next.js 14 / Prisma / NextAuth system*

## 1. Purpose and scope

The existing system (as described in the system documentation) is built around regular students, monthly tuition receipts and month-based exams. The SSC-2026 and Junior School-2026 workbooks describe **special batches** that work differently:

- A **one-time course fee**, paid in one or several installments.
- Four kinds of exam: **class test, pre-model test, model test**, and the board result.
- **Signature sheets, attendance sheets, marksheets** and merit lists printed for each exam.
- **Teacher cost** tracked per lecture, with a notebook check (khata) count.
- Separate **Boys and Girls** sections inside each program.

This plan adds those capabilities as an extension of the current system. **Everything is configurable in the app.** No data is imported from the workbooks; they serve only as requirements.

## 2. What the workbooks showed

| Area | Observation |
| :-- | :-- |
| Students | SSC-2026: 46 boys and 59 girls. Junior School-2026: 20 boys and 49 girls. Fields: roll, name, mobile, school, amount, due. |
| Roll numbers | Rolls follow `batch code × 100 + serial` (SSC boys 262006, SSC girls 261001, Junior boys 268201, Junior girls 268101). The existing `roll.ts` already produces these when batch codes are 2620, 2610, 2682 and 2681. |
| Course fee | One fee per student with varying amounts, paid over time. |
| Exams | Class test: one mark per subject and lecture (e.g. "English 1st \[L3\]"). Pre-model: objective only. Model test: written + objective, grade points, GPA, rank. Combined papers (Bangla 1st + 2nd, English 1st + 2nd). |
| Paper work | Signature sheet (roll, name, subject, mark, signature), attendance sheet (written / MCQ columns), marksheet, per-student result message. |
| Teacher cost | A teacher-by-lecture grid with khata and payment rows, plus an expense list (teacher, lecture + batch, amount, khata). |
| Reference data | About 14 feeder schools and a subject-to-teacher map. |
| Routine | Date-wise class and exam schedule for boys and girls, plus a syllabus sheet. |

## 3. Confirmed decisions

| Topic | Decision |
| :-- | :-- |
| Course fee | Record the **amount paid** per payment. The **agreed amount** is only a free-text comment on the student's fee record. **No due is calculated.** |
| Grading | Percentage of subject marks → grade point: ≥80% = 5 (A+), ≥70% = 4 (A), ≥60% = 3.5 (A-), ≥50% = 3 (B), ≥40% = 2 (C), ≥33% = 1 (D), below 33% = 0 (F). Stored as an editable table. |
| Pass rule | GPA calculation is **dynamic**. A fail in the **optional** subject does not affect the pass result. A program may have no optional subject. |
| Ranking | Rank by **GPA, then total marks**. Ties on both share a rank and the next rank skips (1, 1, 3). |
| Teacher payment | **Fully dynamic** (see section 7). |
| Golden group | Does not exist. Not built. |
| Data | No import. All data is entered through the app. |

| Optional subject bonus | **Confirmed Board Standard:** `max(0, obtained GP − 2)`. Points above 2.0 add directly to compulsory GP sum. An optional fail (F) never fails the student. |

## 4. Gap analysis against the existing system

| Need | Reuse | Add |
| :-- | :-- | :-- |
| Students, schools, batches, rolls | Student, School, Batch, `roll.ts` | Program, section (Boys/Girls) on Batch |
| Course fee in installments | Receipt print and archive pages | CoursePayment and StudentCourseFee (existing Receipt is month-based and stays untouched) |
| Exams and marks | Exam, ExamSubject, Mark | Exam kind, program link, per-component maximums, absent flag, combined-paper groups |
| Grades and ranking | `calculateResults.ts` | New configurable result engine (also fixes the first-subject-only bug) |
| Teacher cost | TeacherClassLog, TeacherPayment, Expense | Program tag, per-program-subject rate rules |
| Printing | Existing print pages | Signature, attendance, marksheet, merit list, result sheet templates |

All schema changes are **additive** (new tables and nullable columns). Existing tables and data are not migrated or altered.

## 5. Data model additions

### 5.1 Program and subjects

| Entity | Fields |
| :-- | :-- |
| **Program** | id, name (e.g. SSC-2026), year, classLevel, gradeScaleId, resultRuleId, active |
| **Batch** (extend) | programId (nullable), section (BOYS / GIRLS) |
| **ProgramSubject** | id, programId, name, code (e.g. B1, E1, Math), combinedGroup (e.g. Bangla, English), sortOrder, canBeOptional |
| **StudentSubject** | id, studentId, programSubjectId, role (OPTIONAL). Only students with an optional subject have a row. |

### 5.2 Course fee

| Entity | Fields |
| :-- | :-- |
| **StudentCourseFee** | id, studentId, programId (unique together), agreedNote (free text comment) |
| **CoursePayment** | id, studentId, programId, amount, paidOn, method, receiptNo (unique), note, createdBy |

Total paid = sum of a student's payments. Reports show collected amounts only, and the agreed note is displayed beside them for reference.

### 5.3 Exams and marks

| Entity | Fields |
| :-- | :-- |
| **Exam** (extend) | programId (nullable), kind (CLASS\_TEST / PRE\_MODEL / MODEL\_TEST / OTHER), title, examDate, lectureLabel (nullable) |
| **ExamSubject** (extend) | programSubjectId (nullable), maxWritten, maxObjective, maxSingle (one-mark tests), combinedGroup (nullable) |
| **Mark** (extend) | absent (boolean). A single-mark test stores its value in `written`. |
| **GradeScale** | id, name |
| **GradeStep** | id, gradeScaleId, minPercent, gradePoint, letter |
| **ResultRule** | id, name, failGpa (default 0), optionalBonusMode (SUBTRACT\_FROM\_GP), optionalBonusValue (default 2), gpaCap (default 5), decimals, requireEachPaperPass, tieBreaker (TOTAL) |

### 5.4 Teacher cost

| Entity | Fields |
| :-- | :-- |
| **TeacherRate** | id, teacherId, programSubjectId (nullable), rateType (PER\_LECTURE / PER\_CLASS / FLAT), amount, effectiveFrom |
| **TeacherClassLog** (extend) | programId, programSubjectId, lectureLabel. The existing `notebook` field is reused as the khata count. |
| **TeacherPayment / Expense** (extend) | programId (nullable) |

### 5.5 Routine (optional, Phase 6)

| Entity | Fields |
| :-- | :-- |
| **ScheduleEntry** | id, programId, section, date, subject, lectureLabel, teacherId, examNote |

## 6. Result engine specification

**Inputs:** the batch roster, marks for the exam, the grade scale, the result rule and each student's optional subject (if any).

**Steps for each student:**

1. Start from the **batch roster**, not the first subject's marks. An absent or unmarked student is never dropped.
2. For each subject, total = written + objective (or the single mark). Absent counts as 0 marks.
3. For combined papers, add the papers in the same group and grade the **combined total against the combined maximum**. Optionally also require each paper to pass (`requireEachPaperPass`).
4. Grade point = highest grade step where percentage ≥ minPercent.
5. Split subjects into **compulsory** and **optional** (the student's optional subject, if any).
6. **Fail** if any compulsory subject has grade point 0. An optional subject never causes a fail.
7. If the student passed: GPA = (sum of compulsory grade points + optional bonus) ÷ number of compulsory subjects, capped at `gpaCap`. Optional bonus = max(0, optional GP − `optionalBonusValue`), default 2.
8. If the student failed: GPA = `failGpa` (default 0.00).
9. Total marks = sum of all subjects' marks (the optional subject included).
10. **Rank** by GPA (high to low), then total marks (high to low). Equal GPA and total share a rank, then skip (1, 1, 3). Failed students are ranked after passed students.

**Worked example (default settings):** 8 compulsory subjects with grade points summing to 38, and an optional subject with GP 4. Bonus = 4 − 2 = 2. GPA = (38 + 2) ÷ 8 = 5.00 (cap applies). If the optional subject were F, the bonus would be 0 and the student would still pass.

**Existing bug fixed:** `calculateResults.ts` currently builds the student list from `subjects[0].marks`. The new engine builds it from the roster.

**Grade scale seed:** the seven steps in section 3, editable in settings and assignable per program.

## 7. Teacher cost model (dynamic)

| Rate type | Calculation |
| :-- | :-- |
| Per lecture | Number of lectures taken × amount |
| Per class | Number of classes × amount |
| Flat | One fixed amount for the period |
| Manual override | Any log entry can carry its own amount instead of the rate |

- Rates are set per teacher, optionally per program subject, with an effective date so old logs keep their old rate.
- The **lecture-payment matrix** (teacher × lecture L1…Ln) replaces the `cost` sheet: each cell shows classes held, khata count and amount paid.
- Creating a payment and its matching expense happens in a single `prisma.$transaction`, which also fixes the existing integrity gap.
- Program profit and loss = course payments collected − expenses tagged to the program.

## 8. Screens by role

### Admin (full access)

- **Programs:** create and edit programs, sections and batch codes, program subjects, grade scale and result rule.
- **Program dashboard:** students by section, collected amount, expenses, net, recent payments.
- **Course payments:** student search, add payment, payment history, receipt print, daily collection list.
- **Exams:** create from kind templates, set maximums per subject, schedule.
- **Marks entry grid:** columns adapt to the exam kind (single mark, objective only, written + objective). Keyboard navigation, live validation against maximums, absent toggle.
- **Results:** merit list with GPA, total, rank and pass/fail, per section or combined.
- **Teacher cost:** rate setup, lecture-payment matrix, khata, payments.
- **Print center:** all documents in section 9.

### Staff

Same as Admin for students, payments, exams and marks, **except** program profit and loss, teacher rates and teacher payments (consistent with the existing hidden-finance rule).

### Teacher

Assigned subjects' marks entry and results view, own class log and payments (existing behavior, extended to program subjects).

### Student

Own result, marksheet and payment history (amount paid per payment, no due shown).

## 9. Print documents

All documents are A4, print-friendly, support Bangla text, and are filtered by program, section and exam.

| Document | Contents |
| :-- | :-- |
| **Signature sheet** | Program and exam header, subject, maximum mark, date; rows: serial, roll, name, mark, signature. One sheet per section. |
| **Attendance sheet** | Rows: roll, name, signature; written and MCQ columns for the exam hall. |
| **Marksheet** | Per student: each subject with written, objective, total, grade point and letter, then GPA, total, rank and result. |
| **Merit list / result sheet** | Ranked table with serial, roll, name, total, GPA, grade and result. |
| **Class test sheet** | Student by subject-and-lecture grid with totals. |
| **Guardian result message** | Editable template with placeholders (name, exam, marks, GPA, rank). Output as copyable text and CSV. Sending SMS is out of scope. |
| **Payment receipt** | Per payment: receipt number, date, amount, method, student and program. |

## 10. Permissions (proposed, confirm)

| Action | Admin | Staff | Teacher | Student |
| :-- | :-: | :-: | :-: | :-: |
| Programs, grade scale, result rule | Yes | View | No | No |
| Course payments | Full | Create / edit | No | View own |
| Exams and schedules | Full | Full | View assigned | View own |
| Marks entry | Full | Full | Assigned subjects | No |
| Results | Full | Full | View | View own |
| Teacher rates and payments | Full | No | View own | No |
| Program profit and loss | Full | No | No | No |
| Print center | Full | Full | Marks and results only | Own marksheet |

## 11. Implementation phases

| Phase | Size | Deliverables | Acceptance check |
| :-- | :-: | :-- | :-- |
| **1. Program foundation** | M | Program, sections on Batch, ProgramSubject, StudentSubject, grade scale and result rule settings | A program with Boys and Girls batches generates rolls like 262006; optional subject can be assigned per student |
| **2. Course payments** | M | StudentCourseFee, CoursePayment, payment entry, history, receipts, daily collection and program totals | Multiple payments per student; totals match; agreed note shown; no due calculated |
| **3. Exams and results** | L | Exam kinds, per-component maximums, adaptive marks grid, result engine, merit list | Test cases in section 12 pass; absent students stay on the list |
| **4. Print documents** | M | Signature, attendance, marksheet, merit list, class test sheet, guardian message | All documents print cleanly on A4 with Bangla text |
| **5. Teacher cost** | M | TeacherRate, lecture-payment matrix, khata, transactional payment and expense, program P&L | Payment and expense are created together or not at all; rates apply by effective date |
| **6. Routine (optional)** | S | ScheduleEntry, routine and syllabus screen, printable schedule | Section-wise routine prints correctly |

In every phase the new screens use the app's existing design direction (slate/zinc, indigo accent, light and dark mode) and a single shared data table, and load data with server actions using Prisma `include` rather than sequential client fetches.

## 12. Testing plan

**Result engine unit tests**

- All-pass student, one failed compulsory subject (GPA 0), failed optional subject only (still passes).
- Program with no optional subject.
- Optional bonus at each GP value (0 to 5) with the default rule.
- GPA cap at 5.00.
- Combined papers (Bangla and English) with and without per-paper pass.
- Absent student in one subject and in all subjects.
- Tie on GPA broken by total; tie on both gives 1, 1, 3.
- Grade boundary values: 33%, 40%, 50%, 60%, 70%, 80% exactly.

**Other checks**

- Marks validation rejects values above the maximum.
- Payment and expense transaction rolls back on failure.
- Role permissions match section 10 on every route and action.
- Print layouts for 20, 50 and 100 students.

## 13. Risks and mitigations

| Risk | Mitigation |
| :-- | :-- |
| Rules differ between SSC and Junior | Grade scale and result rule are per program, so no code change is needed |
| Optional-subject bonus rule unclear | Editable setting with the default GP − 2; confirm before Phase 3 |
| Combined-paper and fail rules vary | `requireEachPaperPass` and `failGpa` are settings |
| Large print volumes | Paginated templates and a print preview before printing |
| Existing flows affected | Additive schema only; new routes under a program section; existing pages untouched |

## 14. Decision status

All architectural and business decisions—including the official Bangladesh Education Board grading standard (`GP − 2` optional bonus, compulsory pass rule, and GPA ranking)—are confirmed and locked. Ready for execution.
