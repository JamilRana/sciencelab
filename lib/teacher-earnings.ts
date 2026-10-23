/**
 * Teacher Earnings Calculation Service
 *
 * Single Source of Truth for calculating teacher earnings across ScienceLab.
 * Formula: (classes + notebook + other) * effectivePerClass + dutyAmount
 *
 * Edge cases handled:
 * 1. Legacy logs where log.perClass === 0 fall back safely to teacher.perClass.
 * 2. Exam invigilation duty pay (dutyAmount) is added directly to total earnings.
 * 3. Nullable / undefined values default safely to 0.
 */

export interface TeacherLogLike {
  classes?: number | null;
  notebook?: number | null;
  other?: number | null;
  perClass?: number | null;
  dutyAmount?: number | null;
}

export interface TeacherPaymentLike {
  amount?: number | null;
}

/**
 * Calculates the total earned amount for a single teacher class log.
 *
 * @param log The class log record
 * @param fallbackTeacherPerClass Optional fallback rate from Teacher.perClass if log.perClass is 0 or unset
 */
export function earnedAmount(
  log: TeacherLogLike,
  fallbackTeacherPerClass: number = 0
): number {
  const classes = Number(log.classes) || 0;
  const notebook = Number(log.notebook) || 0;
  const other = Number(log.other) || 0;
  const dutyAmount = Number(log.dutyAmount) || 0;

  // Use snapshot rate on log if set (> 0); otherwise fall back to teacher's profile rate
  const logRate = Number(log.perClass) || 0;
  const effectiveRate = logRate > 0 ? logRate : (fallbackTeacherPerClass || 0);

  const regularEarnings = (classes + notebook + other) * effectiveRate;
  return regularEarnings + dutyAmount;
}

/**
 * Calculates aggregated financial totals for a teacher across multiple logs and payments.
 */
export function calculateTeacherEarningsSummary(
  logs: TeacherLogLike[],
  payments: TeacherPaymentLike[] = [],
  fallbackTeacherPerClass: number = 0
): {
  totalClasses: number;
  totalNotebooks: number;
  totalOthers: number;
  totalCountedSessions: number;
  totalDutyAmount: number;
  totalEarned: number;
  totalPaid: number;
  dueAmount: number;
} {
  let totalClasses = 0;
  let totalNotebooks = 0;
  let totalOthers = 0;
  let totalDutyAmount = 0;
  let totalEarned = 0;

  for (const log of logs) {
    const c = Number(log.classes) || 0;
    const n = Number(log.notebook) || 0;
    const o = Number(log.other) || 0;
    const d = Number(log.dutyAmount) || 0;

    totalClasses += c;
    totalNotebooks += n;
    totalOthers += o;
    totalDutyAmount += d;
    totalEarned += earnedAmount(log, fallbackTeacherPerClass);
  }

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const dueAmount = Math.max(0, totalEarned - totalPaid);

  return {
    totalClasses,
    totalNotebooks,
    totalOthers,
    totalCountedSessions: totalClasses + totalNotebooks + totalOthers,
    totalDutyAmount,
    totalEarned,
    totalPaid,
    dueAmount,
  };
}
