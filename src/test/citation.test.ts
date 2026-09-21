import { describe, expect, it } from "vitest";
import { buildCitation, datasetLabel } from "@/lib/citation/buildCitation";
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

describe("datasetLabel", () => {
  it("does not double the v that manifest.json already carries", () => {
    // Regression: every citation the app produced read "Dataset vv1",
    // because manifest.version is "v1" and the citation prefixed a "v".
    expect(datasetLabel("v1")).toBe("v1");
    expect(datasetLabel("V2")).toBe("v2");
    expect(datasetLabel("1.3.0")).toBe("v1.3.0");
  });
});

describe("buildCitation", () => {
  it("prints the dataset version once, whether or not it starts with v", () => {
    expect(
      buildCitation(
        { kind: "root", label: "كتب" },
        { ...manifest, version: "v1" },
        "https://x/",
        accessedOn,
      ),
    ).toContain("Dataset v1 (built");
  });

  it("labels the newer citation subjects", () => {
    const cite = (kind: Parameters<typeof buildCitation>[0]["kind"], label: string) =>
      buildCitation({ kind, label }, manifest, "https://x/", accessedOn);
    expect(cite("query", "[PASS]")).toContain("Query [PASS].");
    expect(cite("keyness", "medinan")).toContain("Keyness medinan.");
    expect(cite("grammar", "Jussive")).toContain("Grammar filter Jussive.");
    expect(cite("rhyme", "quran")).toContain("Rhyme quran.");
    expect(cite("collocations", "أمن")).toContain("Collocations أمن.");
    expect(cite("cooccurrence", "أمن")).toContain("Cooccurrence أمن.");
    expect(cite("formulas", "quran")).toContain("Formulas quran.");
  });

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
