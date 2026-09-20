import { describe, expect, it } from "vitest";
import {
  formatTable,
  tableExtension,
  tableFilename,
  tableMimeType,
  tableToCsv,
  tableToJson,
  tableToMarkdown,
  type ExportTable,
} from "@/lib/export/table";

const table: ExportTable = {
  slug: "keyness-medinan",
  meta: {
    title: "Keyness: Medinan",
    url: "https://example.org/insights/?scope=medinan",
    provenance: [
      { label: "scope", value: "medinan" },
      { label: "reference", value: "the rest of the Qur'an" },
    ],
    citation: "Qur'anic Root & Word Research. Keyness medinan. DOI 10.5281/zenodo.22855798.",
    datasetVersion: "1.3.0",
    datasetHash: "a1b2c3d",
    generatedAt: new Date("2026-09-20T10:00:00.000Z"),
  },
  columns: [
    { key: "root", label: "root" },
    { key: "g2", label: "log_likelihood_g2" },
  ],
  rows: [
    ["أله", 576.6],
    ["نفق", 115.5],
  ],
};

describe("tableToCsv", () => {
  it("carries the provenance as comment lines above strict RFC 4180 data", () => {
    const csv = tableToCsv(table);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("# title: Keyness: Medinan");
    expect(lines).toContain("# scope: medinan");
    expect(lines).toContain("# dataset: v1.3.0");
    expect(lines).toContain("# dataset hash: a1b2c3d");
    expect(lines).toContain("# generated: 2026-09-20T10:00:00.000Z");
    // The data itself starts at the header and is not commented.
    const header = lines.findIndex((l) => l === "root,log_likelihood_g2");
    expect(header).toBeGreaterThan(0);
    expect(lines.slice(header + 1)).toEqual(["أله,576.6", "نفق,115.5"]);
  });

  it("uses CRLF, as RFC 4180 and Excel expect", () => {
    expect(tableToCsv(table)).toContain("\r\n");
  });

  it("escapes a cell containing a comma, a quote or a newline", () => {
    const csv = tableToCsv({
      ...table,
      rows: [['say "yes", then', 1]],
    });
    expect(csv).toContain('"say ""yes"", then",1');
  });

  it("never lets a metadata newline break the comment block", () => {
    const csv = tableToCsv({
      ...table,
      meta: { ...table.meta, provenance: [{ label: "query", value: "line one\nline two" }] },
    });
    expect(csv).toContain("# query: line one line two");
  });
});

describe("tableToJson", () => {
  it("keys the rows by column, which is what a script wants", () => {
    const parsed = JSON.parse(tableToJson(table));
    expect(parsed.rows).toEqual([
      { root: "أله", g2: 576.6 },
      { root: "نفق", g2: 115.5 },
    ]);
    expect(parsed.meta.datasetHash).toBe("a1b2c3d");
    expect(parsed.meta.citation).toMatch(/DOI 10\.5281/);
    expect(parsed.meta.generatedAt).toBe("2026-09-20T10:00:00.000Z");
    expect(parsed.columns).toHaveLength(2);
  });
});

describe("tableToMarkdown", () => {
  it("writes a heading, the provenance, and a pipe table", () => {
    const md = tableToMarkdown(table);
    expect(md).toMatch(/^# Keyness: Medinan\n/);
    expect(md).toContain("- **scope:** medinan");
    expect(md).toContain("| root | log_likelihood_g2 |");
    expect(md).toContain("| --- | --- |");
    expect(md).toContain("| أله | 576.6 |");
    // The title is the heading, so it is not repeated in the metadata list.
    expect(md).not.toContain("- **title:**");
  });

  it("escapes a pipe inside a cell rather than breaking the table", () => {
    const md = tableToMarkdown({ ...table, rows: [["a|b", 1]] });
    expect(md).toContain("| a\\|b | 1 |");
  });
});

describe("filenames and types", () => {
  it("dates the file and keeps the slug filesystem-safe", () => {
    const at = new Date("2026-09-20T10:00:00.000Z");
    expect(tableFilename(table, "csv", at)).toBe("keyness-medinan-2026-09-20.csv");
    expect(tableFilename({ ...table, slug: "keyness: surah/12" }, "json", at)).toBe(
      "keyness-surah-12-2026-09-20.json",
    );
    expect(tableFilename({ ...table, slug: "///" }, "csv", at)).toBe("export-2026-09-20.csv");
  });

  it("maps each format to its extension and media type", () => {
    expect(tableExtension("markdown")).toBe("md");
    expect(tableExtension("csv")).toBe("csv");
    expect(tableMimeType("json")).toBe("application/json;charset=utf-8");
    expect(tableMimeType("markdown")).toBe("text/markdown;charset=utf-8");
  });

  it("formatTable dispatches to each formatter", () => {
    expect(formatTable(table, "csv")).toBe(tableToCsv(table));
    expect(formatTable(table, "json")).toBe(tableToJson(table));
    expect(formatTable(table, "markdown")).toBe(tableToMarkdown(table));
  });
});
