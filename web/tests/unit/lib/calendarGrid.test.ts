import { describe, it, expect } from "vitest";
import { buildMonthGrid } from "@/lib/calendarGrid";

describe("buildMonthGrid", () => {
  it("matches the reference screenshot for July 2026 (starts on Wednesday)", () => {
    const weeks = buildMonthGrid(2026, 7);
    expect(weeks[0]).toEqual([
      null,
      null,
      { day: 1, iso: "2026-07-01" },
      { day: 2, iso: "2026-07-02" },
      { day: 3, iso: "2026-07-03" },
      { day: 4, iso: "2026-07-04" },
      { day: 5, iso: "2026-07-05" },
    ]);
  });

  it("every week has exactly 7 cells", () => {
    const weeks = buildMonthGrid(2026, 7);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it("includes all 31 days of July with no gaps", () => {
    const weeks = buildMonthGrid(2026, 7);
    const days = weeks.flat().filter((c) => c !== null).map((c) => c!.day);
    expect(days).toEqual(Array.from({ length: 31 }, (_, i) => i + 1));
  });
});
