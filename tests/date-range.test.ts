import { describe, it, expect } from "bun:test";
import {
  wibDayToUtcRange,
  getWibDateRange,
  getWibYmd,
  formatWibYmd,
} from "../src/lib/date-range";
import { reportFilterSchema } from "../src/schemas/report-filter";

describe("Date Range Utility (WIB to UTC) Test Suite", () => {
  it("should convert WIB 2026-10-26 day boundary to UTC with exact 7 hours offset", () => {
    const range = wibDayToUtcRange("2026-10-26");

    // 2026-10-26 00:00:00.000 WIB is 2026-10-25 17:00:00.000 UTC
    expect(range.startUtc.toISOString()).toBe("2026-10-25T17:00:00.000Z");

    // 2026-10-26 23:59:59.999 WIB is 2026-10-26 16:59:59.999 UTC
    expect(range.endUtc.toISOString()).toBe("2026-10-26T16:59:59.999Z");
  });

  it("should format WIB YMD accurately", () => {
    // 2026-10-25 18:00:00 UTC is already 2026-10-26 01:00:00 WIB
    const utcDate = new Date("2026-10-25T18:00:00Z");
    const ymd = getWibYmd(utcDate);
    expect(formatWibYmd(ymd)).toBe("2026-10-26");
  });

  it("should calculate 'today' preset matching reference date in WIB", () => {
    const ref = new Date("2026-10-26T03:00:00Z"); // 10:00 WIB on Oct 26
    const res = getWibDateRange("today", undefined, undefined, ref);
    expect(res.startDateStr).toBe("2026-10-26");
    expect(res.endDateStr).toBe("2026-10-26");
    expect(res.startUtc.toISOString()).toBe("2026-10-25T17:00:00.000Z");
    expect(res.endUtc.toISOString()).toBe("2026-10-26T16:59:59.999Z");
  });

  it("should calculate '7d' preset with 7 days coverage", () => {
    const ref = new Date("2026-10-26T03:00:00Z");
    const res = getWibDateRange("7d", undefined, undefined, ref);
    expect(res.startDateStr).toBe("2026-10-20");
    expect(res.endDateStr).toBe("2026-10-26");
  });

  it("should calculate 'this_month' preset spanning full month in WIB", () => {
    const ref = new Date("2026-10-26T03:00:00Z");
    const res = getWibDateRange("this_month", undefined, undefined, ref);
    expect(res.startDateStr).toBe("2026-10-01");
    expect(res.endDateStr).toBe("2026-10-31");
  });

  it("should calculate 'last_month' preset for September 2026", () => {
    const ref = new Date("2026-10-26T03:00:00Z");
    const res = getWibDateRange("last_month", undefined, undefined, ref);
    expect(res.startDateStr).toBe("2026-09-01");
    expect(res.endDateStr).toBe("2026-09-30");
  });

  it("should support custom valid range", () => {
    const res = getWibDateRange("custom", "2026-01-01", "2026-01-10");
    expect(res.startDateStr).toBe("2026-01-01");
    expect(res.endDateStr).toBe("2026-01-10");
  });

  it("should reject custom range when start > end", () => {
    expect(() => getWibDateRange("custom", "2026-02-01", "2026-01-01")).toThrow(
      /customStart must be less than or equal to customEnd/
    );
  });
});

describe("Report Filter Schema Validation", () => {
  it("should accept valid default filter", () => {
    const parsed = reportFilterSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.preset).toBe("30d");
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.limit).toBe(50);
    }
  });

  it("should reject custom preset missing dates", () => {
    const parsed = reportFilterSchema.safeParse({ preset: "custom" });
    expect(parsed.success).toBe(false);
  });

  it("should reject range over 366 days", () => {
    const parsed = reportFilterSchema.safeParse({
      preset: "custom",
      startDate: "2025-01-01",
      endDate: "2026-02-01", // > 366 days
    });
    expect(parsed.success).toBe(false);
  });
});
