/**
 * Dhaka Timezone Utility Library (UTC+6)
 *
 * Bangladesh Standard Time (BST) is UTC+6 with NO Daylight Saving Time.
 * All scheduling, class sessions, notifications, and day-close jobs in ScienceLab
 * must operate in Asia/Dhaka time.
 */

const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;

export interface DhakaDateParts {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  dateString: string; // YYYY-MM-DD
}

export const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

export const MONTH_NAMES_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const WEEKDAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAY_NAMES_FULL = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];

/**
 * Returns the 3-letter short month name in Dhaka time (e.g. "Oct").
 */
export function getDhakaMonthShort(date: Date | string = new Date()): string {
  const parts = getDhakaParts(
    typeof date === "string" ? new Date(date.includes("T") ? date : date + "T00:00:00Z") : date
  );
  return MONTH_NAMES_SHORT[parts.month - 1];
}

/**
 * Returns the exact current date/time decomposed into Dhaka components.
 * Independent of the host server's local timezone (e.g. Vercel UTC).
 */
export function getDhakaParts(date: Date = new Date()): DhakaDateParts {
  const dhakaTimeMs = date.getTime() + DHAKA_OFFSET_MS;
  const d = new Date(dhakaTimeMs);

  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const hour = d.getUTCHours();
  const minute = d.getUTCMinutes();
  const second = d.getUTCSeconds();
  const dayOfWeek = d.getUTCDay();

  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const dateString = `${year}-${mm}-${dd}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dayOfWeek,
    dateString,
  };
}

/**
 * Returns today's calendar date in Dhaka as "YYYY-MM-DD".
 */
export function todayDhaka(now: Date = new Date()): string {
  return getDhakaParts(now).dateString;
}

/**
 * Returns tomorrow's calendar date in Dhaka as "YYYY-MM-DD".
 */
export function tomorrowDhaka(now: Date = new Date()): string {
  const parts = getDhakaParts(now);
  return addDaysDhaka(parts.dateString, 1);
}

/**
 * Normalizes any Date or date string to a "YYYY-MM-DD" string in Dhaka time.
 */
export function toDhakaDateString(date: Date | string): string {
  if (typeof date === "string") {
    // If already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    return getDhakaParts(new Date(date)).dateString;
  }
  return getDhakaParts(date).dateString;
}

/**
 * Safely adds or subtracts days from a "YYYY-MM-DD" calendar date.
 */
export function addDaysDhaka(dateString: string, days: number): string {
  const [y, m, d] = dateString.split("-").map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d + days));
  const year = utcDate.getUTCFullYear();
  const month = String(utcDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utcDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Converts a "YYYY-MM-DD" string into a UTC-midnight Date object.
 * This guarantees safe storage in PostgreSQL @db.Date or DateTime columns
 * without timezone boundary shifting.
 */
export function toDhakaDbDate(dateString: string): Date {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/**
 * Reads a Date from database back to "YYYY-MM-DD".
 */
export function fromDhakaDbDate(dbDate: Date): string {
  const year = dbDate.getUTCFullYear();
  const month = String(dbDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dbDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns the day of week (0 = Sunday, 6 = Saturday) for a "YYYY-MM-DD" date.
 */
export function getDhakaDayOfWeek(dateString: string): number {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Returns the 3-letter month abbreviation ('Jan', 'Feb', etc.) for a date string.
 * Aligns with the ScienceLab legacy month standard.
 */
export function getDhakaMonthAbbr(dateString: string): string {
  const [, m] = dateString.split("-").map(Number);
  return MONTH_NAMES_SHORT[m - 1] || "";
}

/**
 * Returns the start ("YYYY-MM-01") and end date ("YYYY-MM-DD") of the month in Dhaka.
 */
export function getDhakaMonthRange(dateString: string = todayDhaka()): { startDate: string; endDate: string } {
  const [y, m] = dateString.split("-").map(Number);
  const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const endDate = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { startDate, endDate };
}

/**
 * Checks whether the current time in Dhaka is at or past 7:00 PM (19:00:00).
 */
export function isPast7PmDhaka(now: Date = new Date()): boolean {
  const { hour } = getDhakaParts(now);
  return hour >= 19;
}

/**
 * Formats a 24-hour time string "HH:mm" into 12-hour format (e.g. "4:00 PM", "10:30 AM").
 */
export function formatTime12h(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24 || "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr.padStart(2, "0");
  if (isNaN(h)) return time24;

  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  h = h ? h : 12; // 0 becomes 12
  return `${h}:${m} ${ampm}`;
}

/**
 * Returns an array of 7 consecutive dates ("YYYY-MM-DD") representing the full week containing dateString.
 * By default in Bangladesh, academic weeks begin on Saturday.
 */
export function getDhakaWeekDates(
  dateString: string = todayDhaka(),
  weekStart: "saturday" | "sunday" = "saturday"
): { startDate: string; endDate: string; dates: string[] } {
  const dayOfWeek = getDhakaDayOfWeek(dateString); // 0 = Sun ... 6 = Sat
  let offsetToStart = 0;
  if (weekStart === "saturday") {
    // If today is Sat (6), offset is 0. If Sun (0), offset is -1. If Mon (1), offset is -2 ...
    offsetToStart = dayOfWeek === 6 ? 0 : -(dayOfWeek + 1);
  } else {
    // Sunday start: If today is Sun (0), offset is 0. Mon is -1 ...
    offsetToStart = -dayOfWeek;
  }

  const startDate = addDaysDhaka(dateString, offsetToStart);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    dates.push(addDaysDhaka(startDate, i));
  }

  return {
    startDate,
    endDate: dates[6],
    dates,
  };
}

/**
 * Formats a "YYYY-MM-DD" date string for UI and messages.
 *
 * Example styles:
 * - "digest": "Sat, 25 Oct" (spec Section 9 daily digest format)
 * - "short": "25 Oct"
 * - "medium": "Sat, 25 Oct 2026"
 * - "full": "Saturday, 25 October 2026"
 * - "weekday": "Saturday"
 */
export function formatDhakaDate(
  dateString: string,
  style: "digest" | "short" | "medium" | "full" | "weekday" = "digest"
): string {
  const [y, m, d] = dateString.split("-").map(Number);
  if (!y || !m || !d) return dateString;

  const dayOfWeek = getDhakaDayOfWeek(dateString);
  const monthAbbr = MONTH_NAMES_SHORT[m - 1];
  const monthFull = MONTH_NAMES_FULL[m - 1];
  const weekdayShort = WEEKDAY_NAMES_SHORT[dayOfWeek];
  const weekdayFull = WEEKDAY_NAMES_FULL[dayOfWeek];

  switch (style) {
    case "digest":
      return `${weekdayShort}, ${d} ${monthAbbr}`;
    case "short":
      return `${d} ${monthAbbr}`;
    case "medium":
      return `${weekdayShort}, ${d} ${monthAbbr} ${y}`;
    case "full":
      return `${weekdayFull}, ${d} ${monthFull} ${y}`;
    case "weekday":
      return weekdayFull;
    default:
      return `${weekdayShort}, ${d} ${monthAbbr}`;
  }
}
