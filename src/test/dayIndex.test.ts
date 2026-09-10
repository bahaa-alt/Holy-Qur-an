import { describe, expect, it } from "vitest";
import { daysSinceEpoch } from "@/lib/dailyPick/dayIndex";

describe("daysSinceEpoch", () => {
  it("is stable within the same UTC day", () => {
    const morning = new Date("2026-03-15T00:00:01Z");
    const night = new Date("2026-03-15T23:59:59Z");
    expect(daysSinceEpoch(morning)).toBe(daysSinceEpoch(night));
  });

  it("changes exactly at UTC midnight", () => {
    const beforeMidnight = new Date("2026-03-15T23:59:59.999Z");
    const atMidnight = new Date("2026-03-16T00:00:00.000Z");
    expect(daysSinceEpoch(atMidnight)).toBe(daysSinceEpoch(beforeMidnight) + 1);
  });

  it("is monotonically increasing", () => {
    const a = daysSinceEpoch(new Date("2026-01-01T00:00:00Z"));
    const b = daysSinceEpoch(new Date("2026-06-01T00:00:00Z"));
    expect(b).toBeGreaterThan(a);
  });

  it("is 0 at the Unix epoch", () => {
    expect(daysSinceEpoch(new Date("1970-01-01T00:00:00Z"))).toBe(0);
  });
});
