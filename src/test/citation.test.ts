import { describe, expect, it } from "vitest";
import { buildCitation } from "@/lib/citation/buildCitation";
import { CONCEPT_DOI, VERSION_DOI } from "@/lib/citation/doi";
import type { ManifestFile } from "@/lib/data/types";

const manifest: Pick<ManifestFile, "version" | "builtAt" | "hash" | "reading"> = {
  version: "1.3.0",
  builtAt: "2026-01-01T00:00:00.000Z",
  hash: "a1b2c3d",
  reading: {
    transmission: "Hafs 'an 'Asim",
    transmissionAr: "حفص عن عاصم",
    edition: "1924 Cairo edition (Uthmani orthography)",
    verseNumbering: "Kufan",
    verseNumberingAr: "العدد الكوفي",
  },
};
const accessedOn = new Date("2026-09-09T12:00:00.000Z");

describe("buildCitation", () => {
  it("formats a root citation", () => {
    expect(
      buildCitation(
        { kind: "root", label: "كتب" },
        manifest,
        "https://example.com/root/كتب/",
        accessedOn,
      ),
    ).toBe(
      "Qur'anic Root & Word Research. Root كتب. Text: Hafs 'an 'Asim, Kufan numbering. " +
        "Dataset v1.3.0 (built January 1, 2026, hash a1b2c3d). " +
        `DOI ${VERSION_DOI}. ` +
        "Accessed September 9, 2026. https://example.com/root/كتب/",
    );
  });

  it("formats a word citation", () => {
    expect(
      buildCitation(
        { kind: "word", label: "كِتاب" },
        manifest,
        "https://example.com/word/42/",
        accessedOn,
      ),
    ).toBe(
      "Qur'anic Root & Word Research. Word كِتاب. Text: Hafs 'an 'Asim, Kufan numbering. " +
        "Dataset v1.3.0 (built January 1, 2026, hash a1b2c3d). " +
        `DOI ${VERSION_DOI}. ` +
        "Accessed September 9, 2026. https://example.com/word/42/",
    );
  });
});

describe("the DOIs a citation depends on", () => {
  it("cites the VERSION doi, never the concept one", () => {
    // A citation exists so a reader can check the claim. The concept DOI
    // resolves to whatever is newest, so a footnote carrying it would
    // silently start pointing at a different build than the one the count
    // came from -- the exact failure a DOI is supposed to prevent.
    const cite = buildCitation(
      { kind: "root", label: "كتب" },
      manifest,
      "https://example.com/",
      accessedOn,
    );
    expect(cite).toContain(VERSION_DOI);
    expect(cite).not.toContain(CONCEPT_DOI);
  });

  it("keeps the two DOIs distinct and well-formed", () => {
    for (const doi of [CONCEPT_DOI, VERSION_DOI]) {
      expect(doi).toMatch(/^10\.5281\/zenodo\.\d+$/);
    }
    expect(CONCEPT_DOI).not.toBe(VERSION_DOI);
  });
});
