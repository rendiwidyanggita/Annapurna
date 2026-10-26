/**
 * Utility: WIB (UTC+7) Date Range Converter for Reports & Aggregations
 *
 * In Indonesia, business dates are evaluated in Western Indonesia Time (WIB / UTC+7).
 * To query Postgres timestamps stored in UTC, we construct the range in WIB (00:00:00.000 to 23:59:59.999)
 * and convert to UTC Dates.
 */

export type DateRangePreset =
  | "today"
  | "7d"
  | "30d"
  | "this_month"
  | "last_month"
  | "custom";

export interface WibDateRangeResult {
  startUtc: Date;
  endUtc: Date;
  startDateStr: string; // YYYY-MM-DD in WIB
  endDateStr: string;   // YYYY-MM-DD in WIB
}

/**
 * Returns current date components formatted in WIB (UTC+7)
 */
export function getNowWib(): Date {
  const now = new Date();
  // Return a Date representing current instant
  return now;
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/**
 * Given a Date or current time, extracts YYYY, MM, DD in WIB timezone
 */
export function getWibYmd(date: Date = new Date()): { year: number; month: number; day: number } {
  // WIB is UTC+7
  const utcMs = date.getTime();
  const wibMs = utcMs + 7 * 60 * 60 * 1000;
  const wibDate = new Date(wibMs);
  return {
    year: wibDate.getUTCFullYear(),
    month: wibDate.getUTCMonth() + 1, // 1-indexed
    day: wibDate.getUTCDate(),
  };
}

/**
 * Formats a WIB YMD object to string "YYYY-MM-DD"
 */
export function formatWibYmd(ymd: { year: number; month: number; day: number }): string {
  return `${ymd.year}-${pad2(ymd.month)}-${pad2(ymd.day)}`;
}

/**
 * Converts a "YYYY-MM-DD" string in WIB to:
 * - Start of day (00:00:00.000 WIB) => UTC Date
 * - End of day (23:59:59.999 WIB) => UTC Date
 */
export function wibDayToUtcRange(dateStr: string): { startUtc: Date; endUtc: Date } {
  const parts = dateStr.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid date format for WIB: ${dateStr}. Expected YYYY-MM-DD.`);
  }
  const [year, month, day] = parts;

  // 00:00:00.000 WIB = 17:00:00.000 UTC of previous day
  // Using ISO string with +07:00 offset ensures exact UTC conversion
  const startIso = `${year}-${pad2(month)}-${pad2(day)}T00:00:00.000+07:00`;
  const endIso = `${year}-${pad2(month)}-${pad2(day)}T23:59:59.999+07:00`;

  return {
    startUtc: new Date(startIso),
    endUtc: new Date(endIso),
  };
}

/**
 * Computes startUtc and endUtc for presets or custom date range in WIB
 */
export function getWibDateRange(
  preset: DateRangePreset = "today",
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date()
): WibDateRangeResult {
  const nowYmd = getWibYmd(referenceDate);
  const todayStr = formatWibYmd(nowYmd);

  if (preset === "custom") {
    if (!customStart || !customEnd) {
      throw new Error("Both customStart and customEnd are required when preset is 'custom'.");
    }
    const startRange = wibDayToUtcRange(customStart);
    const endRange = wibDayToUtcRange(customEnd);

    if (startRange.startUtc > endRange.endUtc) {
      throw new Error("customStart must be less than or equal to customEnd.");
    }

    return {
      startUtc: startRange.startUtc,
      endUtc: endRange.endUtc,
      startDateStr: customStart,
      endDateStr: customEnd,
    };
  }

  if (preset === "today") {
    const range = wibDayToUtcRange(todayStr);
    return {
      startUtc: range.startUtc,
      endUtc: range.endUtc,
      startDateStr: todayStr,
      endDateStr: todayStr,
    };
  }

  if (preset === "7d") {
    // Last 7 days including today (e.g. today minus 6 days)
    const refUtc = referenceDate.getTime() + 7 * 60 * 60 * 1000;
    const pastWibDate = new Date(refUtc - 6 * 24 * 60 * 60 * 1000);
    const startYmd = {
      year: pastWibDate.getUTCFullYear(),
      month: pastWibDate.getUTCMonth() + 1,
      day: pastWibDate.getUTCDate(),
    };
    const startDateStr = formatWibYmd(startYmd);
    return {
      startUtc: wibDayToUtcRange(startDateStr).startUtc,
      endUtc: wibDayToUtcRange(todayStr).endUtc,
      startDateStr,
      endDateStr: todayStr,
    };
  }

  if (preset === "30d") {
    // Last 30 days including today
    const refUtc = referenceDate.getTime() + 7 * 60 * 60 * 1000;
    const pastWibDate = new Date(refUtc - 29 * 24 * 60 * 60 * 1000);
    const startYmd = {
      year: pastWibDate.getUTCFullYear(),
      month: pastWibDate.getUTCMonth() + 1,
      day: pastWibDate.getUTCDate(),
    };
    const startDateStr = formatWibYmd(startYmd);
    return {
      startUtc: wibDayToUtcRange(startDateStr).startUtc,
      endUtc: wibDayToUtcRange(todayStr).endUtc,
      startDateStr,
      endDateStr: todayStr,
    };
  }

  if (preset === "this_month") {
    const startDateStr = `${nowYmd.year}-${pad2(nowYmd.month)}-01`;
    // Find last day of current month in WIB
    const nextMonth = nowYmd.month === 12 ? 1 : nowYmd.month + 1;
    const nextMonthYear = nowYmd.month === 12 ? nowYmd.year + 1 : nowYmd.year;
    const lastDayOfMonth = new Date(Date.UTC(nextMonthYear, nextMonth - 1, 0)).getUTCDate();
    const endDateStr = `${nowYmd.year}-${pad2(nowYmd.month)}-${pad2(lastDayOfMonth)}`;

    return {
      startUtc: wibDayToUtcRange(startDateStr).startUtc,
      endUtc: wibDayToUtcRange(endDateStr).endUtc,
      startDateStr,
      endDateStr,
    };
  }

  if (preset === "last_month") {
    const lastMonth = nowYmd.month === 1 ? 12 : nowYmd.month - 1;
    const lastMonthYear = nowYmd.month === 1 ? nowYmd.year - 1 : nowYmd.year;
    const lastDay = new Date(Date.UTC(nowYmd.year, nowYmd.month - 1, 0)).getUTCDate();
    const startDateStr = `${lastMonthYear}-${pad2(lastMonth)}-01`;
    const endDateStr = `${lastMonthYear}-${pad2(lastMonth)}-${pad2(lastDay)}`;

    return {
      startUtc: wibDayToUtcRange(startDateStr).startUtc,
      endUtc: wibDayToUtcRange(endDateStr).endUtc,
      startDateStr,
      endDateStr,
    };
  }

  throw new Error(`Unsupported preset: ${preset}`);
}
