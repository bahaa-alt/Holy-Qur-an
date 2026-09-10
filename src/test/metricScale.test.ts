import { describe, expect, it } from "vitest";
import { metricBarPct } from "@/lib/insights/metricScale";

describe("metricBarPct", () => {
  it("scales the max value in a set to 100", () => {
    expect(metricBarPct(10, [0, 5, 10])).toBe(100);
  });

  it("scales the min value in a set down to the floor (2), not 0", () => {
    expect(metricBarPct(0, [0, 5, 10])).toBe(2);
  });

  it("handles negative values correctly (PMI can be negative)", () => {
    const values = [-2, 0, 4];
    // range = 4 - (-2) = 6; (-2 - -2)/6 = 0 -> floored to 2
    expect(metricBarPct(-2, values)).toBe(2);
    // (0 - -2)/6 = 1/3 -> ~33.33
    expect(metricBarPct(0, values)).toBeCloseTo((1 / 3) * 100, 5);
    // (4 - -2)/6 = 1 -> 100
    expect(metricBarPct(4, values)).toBe(100);
  });

  it("falls back to the floor for a set where every value is identical (zero range)", () => {
    expect(metricBarPct(7, [7, 7, 7])).toBe(2);
  });
});
