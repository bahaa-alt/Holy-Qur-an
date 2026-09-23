import { describe, expect, it } from "vitest";
import {
  buildBibTeX,
  buildCitation,
  buildCslJson,
  buildRIS,
  citationKey,
  datasetLabel,
} from "@/lib/citation/buildCitation";
import { CONCEPT_DOI, VERSION_DOI, VERSION_TAG } from "@/lib/citation/doi";
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
    expect(cite("verseSimilarity", "quran")).toContain("Verse similarity quran.");
    expect(cite("patterns", "quran")).toContain("Patterns quran.");
    expect(cite("letters", "quran")).toContain("Letter frequency quran.");
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

describe("buildBibTeX", () => {
  it("emits a @software entry with the version DOI and tag", () => {
    const bib = buildBibTeX({ kind: "verse", label: "1:2" }, manifest, "https://example.com/v/1:2/");
    expect(bib).toMatch(/^@software\{[^,]+,\n/);
    expect(bib).toContain(`doi          = {${VERSION_DOI}}`);
    expect(bib).toContain(`version      = {${VERSION_TAG}}`);
    expect(bib).toContain("url          = {https://example.com/v/1:2/}");
    expect(bib.trim().endsWith("}")).toBe(true);
  });

  it("escapes BibTeX special characters in the title", () => {
    const bib = buildBibTeX({ kind: "query", label: "[root=a & b]" }, manifest, "https://x/");
    expect(bib).toContain("\\&");
    expect(bib).not.toMatch(/title\s*=\s*\{[^}]*[^\\]&/);
  });
});

describe("buildRIS", () => {
  it("opens with TY and closes with ER, one field per line", () => {
    const ris = buildRIS({ kind: "root", label: "كتب" }, manifest, "https://example.com/root/كتب/");
    const lines = ris.split("\n").filter((l) => l !== "");
    expect(lines[0]).toBe("TY  - COMP");
    expect(lines[lines.length - 1]).toBe("ER  - ");
    expect(ris).toContain(`DO  - ${VERSION_DOI}`);
    expect(ris).toContain("UR  - https://example.com/root/كتب/");
  });
});

describe("buildCslJson", () => {
  it("produces a one-item array valid CSL-JSON parses back correctly", () => {
    const json = buildCslJson({ kind: "surah", label: "2" }, manifest, "https://example.com/surah/2/");
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
    const [entry] = parsed;
    expect(entry.type).toBe("software");
    expect(entry.DOI).toBe(VERSION_DOI);
    expect(entry.URL).toBe("https://example.com/surah/2/");
    expect(entry.issued["date-parts"]).toEqual([[2026, 1, 1]]);
    expect(entry.author).toEqual([{ given: "Bahaa" }]);
  });
});

describe("citationKey", () => {
  it("produces an ASCII-only, non-empty key even for an Arabic label", () => {
    const key = citationKey({ kind: "root", label: "كتب" }, 2026);
    expect(key).toMatch(/^[a-z0-9-]+$/);
    expect(key.startsWith("bahaa2026-qrr-")).toBe(true);
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
