import assert from "assert";
import {
  getDhakaParts,
  todayDhaka,
  tomorrowDhaka,
  toDhakaDateString,
  addDaysDhaka,
  toDhakaDbDate,
  fromDhakaDbDate,
  getDhakaDayOfWeek,
  getDhakaMonthAbbr,
  isPast7PmDhaka,
  formatTime12h,
  formatDhakaDate,
} from "../lib/dhaka-time";
import { requireJobSecret, requireAuth, requireApiAuth } from "../lib/auth-guard";
import { hasPermission, getPermissions, Permission } from "../lib/permissions";

console.log("=== RUNNING PHASE 0 TESTS ===\n");

// -------------------------------------------------------------
// TEST 1: Dhaka Timezone Boundary Tests (23:59, 00:00, 00:01)
// -------------------------------------------------------------
console.log("-> Test 1: Dhaka Timezone Boundary Tests");

// 23:59:59 Dhaka time on 2026-10-21 corresponds to 17:59:59 UTC on 2026-10-21
const d2359 = new Date(Date.UTC(2026, 9, 21, 17, 59, 59));
const parts2359 = getDhakaParts(d2359);
assert.strictEqual(parts2359.dateString, "2026-10-21");
assert.strictEqual(parts2359.hour, 23);
assert.strictEqual(parts2359.minute, 59);
assert.strictEqual(parts2359.second, 59);
assert.strictEqual(todayDhaka(d2359), "2026-10-21");
assert.strictEqual(tomorrowDhaka(d2359), "2026-10-22");
assert.strictEqual(isPast7PmDhaka(d2359), true);
console.log("   ✓ 23:59:59 Dhaka time verified (Date: 2026-10-21)");

// 00:00:00 Dhaka time on 2026-10-22 corresponds to 18:00:00 UTC on 2026-10-21 (UTC rollover!)
const d0000 = new Date(Date.UTC(2026, 9, 21, 18, 0, 0));
const parts0000 = getDhakaParts(d0000);
assert.strictEqual(parts0000.dateString, "2026-10-22");
assert.strictEqual(parts0000.hour, 0);
assert.strictEqual(parts0000.minute, 0);
assert.strictEqual(parts0000.second, 0);
assert.strictEqual(todayDhaka(d0000), "2026-10-22");
assert.strictEqual(tomorrowDhaka(d0000), "2026-10-23");
assert.strictEqual(isPast7PmDhaka(d0000), false);
console.log("   ✓ 00:00:00 Dhaka time verified (Date: 2026-10-22, rolled over from 18:00 UTC)");

// 00:00:01 Dhaka time on 2026-10-22 corresponds to 18:00:01 UTC on 2026-10-21
const d0001 = new Date(Date.UTC(2026, 9, 21, 18, 0, 1));
const parts0001 = getDhakaParts(d0001);
assert.strictEqual(parts0001.dateString, "2026-10-22");
assert.strictEqual(parts0001.hour, 0);
assert.strictEqual(parts0001.minute, 0);
assert.strictEqual(parts0001.second, 1);
assert.strictEqual(todayDhaka(d0001), "2026-10-22");
assert.strictEqual(tomorrowDhaka(d0001), "2026-10-23");
console.log("   ✓ 00:00:01 Dhaka time verified (Date: 2026-10-22)");

// 18:59:59 vs 19:00:00 (7 PM digest threshold)
const d1859 = new Date(Date.UTC(2026, 9, 21, 12, 59, 59));
const d1900 = new Date(Date.UTC(2026, 9, 21, 13, 0, 0));
assert.strictEqual(isPast7PmDhaka(d1859), false);
assert.strictEqual(isPast7PmDhaka(d1900), true);
console.log("   ✓ 7:00 PM (19:00) Dhaka digest trigger verified");

// -------------------------------------------------------------
// TEST 2: Date Formatting and Database Serialization
// -------------------------------------------------------------
console.log("-> Test 2: Date Formatting and DB Serialization");

const dbDate = toDhakaDbDate("2026-10-25");
assert.strictEqual(dbDate.toISOString(), "2026-10-25T00:00:00.000Z");
assert.strictEqual(fromDhakaDbDate(dbDate), "2026-10-25");

assert.strictEqual(formatTime12h("16:00"), "4:00 PM");
assert.strictEqual(formatTime12h("09:30"), "9:30 AM");
assert.strictEqual(formatTime12h("12:00"), "12:00 PM");
assert.strictEqual(formatTime12h("00:00"), "12:00 AM");

assert.strictEqual(formatDhakaDate("2026-10-25", "digest"), "Sun, 25 Oct");
assert.strictEqual(formatDhakaDate("2026-10-25", "short"), "25 Oct");
assert.strictEqual(formatDhakaDate("2026-10-25", "full"), "Sunday, 25 October 2026");
assert.strictEqual(getDhakaMonthAbbr("2026-10-25"), "Oct");

assert.strictEqual(addDaysDhaka("2026-10-31", 1), "2026-11-01");
assert.strictEqual(addDaysDhaka("2026-02-28", 1), "2026-03-01");
console.log("   ✓ DB serialization and month/weekday formatting verified");

// -------------------------------------------------------------
// TEST 3: CRON_SECRET & requireJobSecret Security
// -------------------------------------------------------------
console.log("-> Test 3: CRON_SECRET & requireJobSecret Security");

const cronSecret = process.env.CRON_SECRET || "test-secret-value-12345";
process.env.CRON_SECRET = cronSecret;

// Test valid Authorization: Bearer
const reqValidBearer = new Request("http://localhost/api/jobs/daily-digest", {
  headers: { authorization: `Bearer ${cronSecret}` },
});
assert.strictEqual(requireJobSecret(reqValidBearer).authorized, true);

// Test valid x-cron-secret header
const reqValidHeader = new Request("http://localhost/api/jobs/daily-digest", {
  headers: { "x-cron-secret": cronSecret },
});
assert.strictEqual(requireJobSecret(reqValidHeader).authorized, true);

// Test valid URL query key
const reqValidQuery = new Request(`http://localhost/api/jobs/daily-digest?key=${cronSecret}`);
assert.strictEqual(requireJobSecret(reqValidQuery).authorized, true);

// Test invalid secret returns 401
const reqInvalid = new Request("http://localhost/api/jobs/daily-digest", {
  headers: { authorization: "Bearer wrong-secret" },
});
const invalidRes = requireJobSecret(reqInvalid);
assert.strictEqual(invalidRes.authorized, false);
assert.strictEqual(invalidRes.errorResponse?.status, 401);

// Test missing secret returns 401
const reqMissing = new Request("http://localhost/api/jobs/daily-digest");
const missingRes = requireJobSecret(reqMissing);
assert.strictEqual(missingRes.authorized, false);
assert.strictEqual(missingRes.errorResponse?.status, 401);
console.log("   ✓ requireJobSecret correctly validates token via headers & query params, rejecting unauthorized callers");

// -------------------------------------------------------------
// TEST 4: New Permission Keys Verification
// -------------------------------------------------------------
console.log("-> Test 4: Permissions System Verification");

const newKeys: Permission[] = [
  "routine:view",
  "routine:edit",
  "sessions:create",
  "sessions:edit",
  "sessions:cancel",
  "notifications:view_log",
  "duty:set_amount",
  "classlog:adjust",
];

// Admin has all new keys
for (const key of newKeys) {
  assert.strictEqual(hasPermission("ADMIN", key), true, `Admin should have ${key}`);
}

// Staff has scheduling keys, but NOT financial keys
assert.strictEqual(hasPermission("STAFF", "routine:view"), true);
assert.strictEqual(hasPermission("STAFF", "routine:edit"), true);
assert.strictEqual(hasPermission("STAFF", "sessions:create"), true);
assert.strictEqual(hasPermission("STAFF", "sessions:edit"), true);
assert.strictEqual(hasPermission("STAFF", "sessions:cancel"), true);
assert.strictEqual(hasPermission("STAFF", "notifications:view_log"), true);
assert.strictEqual(hasPermission("STAFF", "duty:set_amount"), false);
assert.strictEqual(hasPermission("STAFF", "classlog:adjust"), false);

// Teachers and Students can only view routine
assert.strictEqual(hasPermission("TEACHER", "routine:view"), true);
assert.strictEqual(hasPermission("TEACHER", "routine:edit"), false);
assert.strictEqual(hasPermission("STUDENT", "routine:view"), true);
assert.strictEqual(hasPermission("STUDENT", "routine:edit"), false);
assert.strictEqual(hasPermission("STUDENT", "sessions:create"), false);

console.log("   ✓ All 8 routine, session, duty, and notification permission keys properly assigned and restricted");

console.log("\n=== ALL PHASE 0 TESTS PASSED SUCCESSFULLY! ===");
