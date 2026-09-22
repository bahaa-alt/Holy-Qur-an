import { describe, expect, it } from "vitest";
import { CORPUS_CSV_HEADER_COLUMNS } from "../../scripts/lib/build-corpus-export";
import {
  buildCodebookJson,
  buildCorpusColumnsCsv,
  CORPUS_CSV_COLUMNS,
  DATA_FILES,
} from "../../scripts/lib/build-codebook";

describe("CORPUS_CSV_COLUMNS", () => {
  it("names and orders match build-corpus-export.ts's actual CSV header exactly", () => {
    // The one invariant that matters most: this codebook describes corpus.csv
    // as it is actually written, not as it was when the codebook was drafted.
    expect(CORPUS_CSV_COLUMNS.map((c) => c.name)).toEqual([...CORPUS_CSV_HEADER_COLUMNS]);
  });

  it("gives every enum column a non-empty `values` list, and no other column one", () => {
    for (const col of CORPUS_CSV_COLUMNS) {
      if (col.type === "enum") {
        expect(col.values).toBeDefined();
        expect(col.values!.length).toBeGreaterThan(0);
      } else {
        expect(col.values).toBeUndefined();
      }
    }
  });

  it("gives every column a non-empty description", () => {
    for (const col of CORPUS_CSV_COLUMNS) {
      expect(col.description.length).toBeGreaterThan(0);
    }
  });
});

describe("DATA_FILES", () => {
  it("has no duplicate paths", () => {
    const paths = DATA_FILES.map((f) => f.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("gives every entry a type and a non-empty description", () => {
    for (const file of DATA_FILES) {
      expect(file.type.length).toBeGreaterThan(0);
      expect(file.description.length).toBeGreaterThan(0);
    }
  });
});

describe("buildCodebookJson", () => {
  it("carries the row count through and includes both tables", () => {
    const codebook = buildCodebookJson(77_429);
    expect(codebook.corpusCsv.rowCount).toBe(77_429);
    expect(codebook.corpusCsv.columns).toBe(CORPUS_CSV_COLUMNS);
    expect(codebook.dataFiles).toBe(DATA_FILES);
    expect(() => new Date(codebook.generatedAt).toISOString()).not.toThrow();
  });
});

describe("buildCorpusColumnsCsv", () => {
  it("emits one data row per column, plus a header, as valid CSV", () => {
    const csv = buildCorpusColumnsCsv();
    const lines = csv.trim().split("\r\n");
    expect(lines[0]).toBe("name,type,nullable,values,description");
    expect(lines.length).toBe(CORPUS_CSV_COLUMNS.length + 1);
  });

  it("pipe-joins an enum column's values into a single quoted field", () => {
    const csv = buildCorpusColumnsCsv();
    expect(csv).toContain("meccan|medinan");
  });

  it("quotes a field containing a comma (a description mentioning a tag list)", () => {
    const csv = buildCorpusColumnsCsv();
    // Every description here is written in prose and several contain commas;
    // RFC 4180 requires such a field to be wrapped in quotes.
    expect(csv).toMatch(/"[^"]*,[^"]*"/);
  });
});
