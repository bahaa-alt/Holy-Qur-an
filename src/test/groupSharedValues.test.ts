import { describe, expect, it } from "vitest";
import { groupSharedValues } from "../../scripts/lib/build-abjad";

describe("groupSharedValues", () => {
  it("drops a value with only a single member", () => {
    const result = groupSharedValues([{ form: "اب", value: 3, count: 5 }], 8);
    expect(result).toEqual([]);
  });

  it("keeps a small shared group untouched (output sorted by form, not count)", () => {
    const entries = [
      { form: "جد", value: 7, count: 1 },
      { form: "ز", value: 7, count: 3 },
    ];
    const result = groupSharedValues(entries, 8);
    expect(result).toEqual([
      { form: "جد", value: 7, count: 1 },
      { form: "ز", value: 7, count: 3 },
    ]);
  });

  it("caps a large group at maxPerValue, keeping only the most-frequent forms", () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      form: String.fromCharCode(0x0621 + i), // 10 distinct one-letter forms
      value: 42,
      count: i + 1, // form index 9 has the highest count (10)
    }));
    const result = groupSharedValues(entries, 3);
    expect(result).toHaveLength(3);
    // the 3 kept are whichever had the highest counts (8, 9, 10) -- the
    // low-count forms (1..7) are dropped. Final order is by form, not count.
    expect(result.map((r) => r.count).sort((a, b) => a - b)).toEqual([8, 9, 10]);
  });

  it("breaks ties deterministically by form when counts are equal", () => {
    const entries = [
      { form: "ب", value: 5, count: 2 },
      { form: "ا", value: 5, count: 2 },
    ];
    const result = groupSharedValues(entries, 8);
    expect(result.map((r) => r.form)).toEqual(["ا", "ب"]);
  });

  it("sorts the final output by value ascending across groups", () => {
    const entries = [
      { form: "أ", value: 20, count: 1 },
      { form: "ب", value: 20, count: 1 },
      { form: "ج", value: 5, count: 1 },
      { form: "د", value: 5, count: 1 },
    ];
    const result = groupSharedValues(entries, 8);
    expect(result.map((r) => r.value)).toEqual([5, 5, 20, 20]);
  });
});
