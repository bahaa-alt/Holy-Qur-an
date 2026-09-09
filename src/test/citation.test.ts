import { describe, expect, it } from "vitest";
import { buildCitation } from "@/lib/citation/buildCitation";
import type { ManifestFile } from "@/lib/data/types";

const manifest: Pick<ManifestFile, "version" | "builtAt" | "hash"> = {
  version: "1.3.0",
  builtAt: "2026-01-01T00:00:00.000Z",
  hash: "a1b2c3d",
};
const accessedOn = new Date("2026-09-09T12:00:00.000Z");

describe("buildCitation", () => {
  it("formats a root citation", () => {
    expect(buildCitation({ kind: "root", label: "كتب" }, manifest, "https://example.com/root/كتب/", accessedOn)).toBe(
      "Qur'anic Root & Word Research. Root كتب. Dataset v1.3.0 (built January 1, 2026, hash a1b2c3d). " +
        "Accessed September 9, 2026. https://example.com/root/كتب/",
    );
  });

  it("formats a word citation", () => {
    expect(
      buildCitation({ kind: "word", label: "كِتاب" }, manifest, "https://example.com/word/42/", accessedOn),
    ).toBe(
      "Qur'anic Root & Word Research. Word كِتاب. Dataset v1.3.0 (built January 1, 2026, hash a1b2c3d). " +
        "Accessed September 9, 2026. https://example.com/word/42/",
    );
  });
});
