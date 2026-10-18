"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth-guard";

export async function getSpecialBatchDetailsAction(batchId: number) {
  try {
    const sessionUser = await requireRole(["ADMIN", "STAFF", "TEACHER"]);
    const isAdmin = sessionUser.role === "ADMIN";

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        program: {
          include: {
            subjects: {
              orderBy: { sortOrder: "asc" },
            },
            batches: {
              select: { id: true, name: true, code: true, classId: true },
            },
          },
        },
        students: {
          where: { active: true },
          orderBy: { roll: "asc" },
          include: {
            school: true,
            studentSubjects: {
              where: { isOptional: true },
              include: { subject: true },
            },
            courseFees: {
              include: {
                payments: {
                  orderBy: { paymentDate: "desc" },
                },
              },
            },
          },
        },
      },
    });

    if (!batch || !batch.programId || !batch.program) {
      return {
        success: false,
        error: "Special batch or associated program not found.",
        data: null,
      };
    }

    const programId = batch.programId;

    // Fetch batch-relevant exams (either assigned specifically to this batch, or program-wide)
    const exams = await prisma.specialExam.findMany({
      where: {
        programId,
        OR: [{ batchId: null }, { batchId: batch.id }],
      },
      include: {
        subjects: {
          include: {
            programSubject: true,
            teacher: { select: { id: true, name: true } },
            _count: { select: { marks: true } },
          },
        },
      },
      orderBy: { examDate: "desc" },
    });

    // Fetch batch-relevant compilations
    const compilations = await prisma.compiledMarksheet.findMany({
      where: {
        programId,
        OR: [{ batchId: null }, { batchId: batch.id }],
      },
      include: {
        exams: {
          include: {
            specialExam: {
              select: {
                id: true,
                title: true,
                lectureNo: true,
                lectureLabel: true,
                subjects: { select: { totalMax: true } },
              },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enriched students
    const studentsWithMetrics = batch.students.map((st) => {
      const courseFee = st.courseFees.find((cf) => cf.programId === programId);
      const totalPaid = courseFee
        ? courseFee.payments.reduce((sum, p) => sum + p.amount, 0)
        : 0;
      const agreedFee = courseFee?.agreedFee ?? null;
      const due = agreedFee !== null ? Math.max(0, agreedFee - totalPaid) : 0;
      const optionalSubject = st.studentSubjects[0]?.subject || null;

      return {
        id: st.id,
        name: st.name,
        roll: st.roll,
        fullRoll: batch.code * 100 + st.roll,
        mobile: st.mobile,
        homeMobile: st.homeMobile,
        gender: st.gender,
        schoolName: st.school?.name || "N/A",
        optionalSubject: optionalSubject
          ? { id: optionalSubject.id, name: optionalSubject.name }
          : null,
        agreedFee,
        totalPaid,
        due,
        paymentsCount: courseFee?.payments.length || 0,
        courseFeeId: courseFee?.id || null,
        notes: courseFee?.notes || "",
        payments: courseFee?.payments || [],
      };
    });

    // Aggregates & KPIs
    const totalStudents = studentsWithMetrics.length;
    const studentsWithOptional = studentsWithMetrics.filter(
      (s) => s.optionalSubject !== null
    ).length;
    const optionalCoveragePercent =
      totalStudents > 0
        ? Math.round((studentsWithOptional / totalStudents) * 100)
        : 0;

    const modelTestsCount = exams.filter((e) => e.kind === "MODEL_TEST").length;
    const classTestsCount = exams.filter((e) => e.kind !== "MODEL_TEST").length;

    const feeAgreed = studentsWithMetrics.reduce(
      (sum, s) => sum + (s.agreedFee || 0),
      0
    );
    const feePaid = studentsWithMetrics.reduce(
      (sum, s) => sum + (s.totalPaid || 0),
      0
    );
    const feeDue = Math.max(0, feeAgreed - feePaid);
    const feeCollectionRate =
      feeAgreed > 0 ? Math.round((feePaid / feeAgreed) * 100) : 0;

    const enrichedCompilations = compilations.map((item) => {
      const totalPossibleMarks = item.exams.reduce((sum, e) => {
        const subTotal = e.specialExam.subjects.reduce(
          (sSum, s) => sSum + s.totalMax,
          0
        );
        return sum + subTotal;
      }, 0);

      return {
        ...item,
        examCount: item.exams.length,
        totalPossibleMarks,
      };
    });

    return {
      success: true,
      data: {
        batch: {
          id: batch.id,
          name: batch.name,
          code: batch.code,
          classId: batch.classId,
          programId: batch.programId,
        },
        program: {
          id: batch.program.id,
          name: batch.program.name,
          code: batch.program.code,
          category: batch.program.category,
          year: batch.program.year,
          subjects: batch.program.subjects,
          allBatches: batch.program.batches,
        },
        kpis: {
          totalStudents,
          studentsWithOptional,
          optionalCoveragePercent,
          totalExams: exams.length,
          modelTestsCount,
          classTestsCount,
          totalCompilations: compilations.length,
          feeAgreed,
          feePaid,
          feeDue,
          feeCollectionRate,
        },
        students: studentsWithMetrics,
        exams,
        compilations: enrichedCompilations,
        isAdmin,
      },
    };
  } catch (error) {
    console.error("Error fetching special batch details:", error);
    return {
      success: false,
      error: "Failed to load special batch details",
      data: null,
    };
  }
}
