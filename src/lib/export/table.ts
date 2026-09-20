import { datasetLabel } from "@/lib/citation/buildCitation";
import { csvEscape } from "./formatters";

/**
 * A self-describing export of any table this app can show.
 *
 * WHY THIS EXISTS ALONGSIDE formatters.ts. That module exports occurrence
 * rows -- one fixed shape, with its columns baked in. It serves the ayah
 * explorer on root, word and topic pages and should keep doing so. But a
 * keyness table, a QCQL result and a grammar facet are not occurrence
 * rows, and a researcher needs to take those away too. Rather than write a
 * bespoke CSV per page (the grammar page and the compare tool had already
 * started down that road), this describes ANY table and formats it.
 *
 * SELF-DESCRIBING IS THE POINT. A bare CSV of numbers is a spreadsheet; a
 * researcher who opens it six months later cannot tell which query
 * produced it, from which build of the corpus, or how to cite it. Every
 * export here carries that in its metadata: the query or scope, the
 * dataset version and hash, the DOI-bearing citation, the URL that
 * reproduces the view, and when it was taken.
 */

export interface ExportColumn {
  key: string;
  label: string;
}

export interface ExportMeta {
  /** what this table is, e.g. "QCQL results" or "Keyness: Medinan" */
  title: string;
  /** the URL that reproduces this exact view */
  url?: string;
  /** what produced the rows: the query, the scope, the filters */
  provenance?: { label: string; value: string }[];
  /** the full citation line, built by lib/citation/buildCitation */
  citation?: string;
  /** dataset version and hash from manifest.json */
  datasetVersion?: string;
  datasetHash?: string;
  generatedAt?: Date;
}

export interface ExportTable {
  /** short machine name used in the filename, e.g. "keyness-medinan" */
  slug: string;
  meta: ExportMeta;
  columns: ExportColumn[];
  /** one array per row, aligned to `columns` */
  rows: (string | number)[][];
}

export type TableFormat = "csv" | "json" | "markdown";

function metaPairs(meta: ExportMeta): [string, string][] {
  const pairs: [string, string][] = [["title", meta.title]];
  for (const p of meta.provenance ?? []) pairs.push([p.label, p.value]);
  if (meta.datasetVersion) pairs.push(["dataset", datasetLabel(meta.datasetVersion)]);
  if (meta.datasetHash) pairs.push(["dataset hash", meta.datasetHash]);
  if (meta.url) pairs.push(["url", meta.url]);
  if (meta.citation) pairs.push(["cite as", meta.citation]);
  pairs.push(["generated", (meta.generatedAt ?? new Date()).toISOString()]);
  return pairs;
}

/**
 * CSV with the metadata as leading `#` comment lines.
 *
 * Comment lines are not part of RFC 4180, and the trade is deliberate:
 * pandas reads them with `comment="#"`, R with `comment.char="#"`, and a
 * spreadsheet shows them as a few text rows above the header -- which is
 * ugly but harmless, and far better than a file that cannot say where it
 * came from. The data itself is strict RFC 4180, CRLF and all.
 */
export function tableToCsv(table: ExportTable): string {
  const comments = metaPairs(table.meta).map(
    ([k, v]) => `# ${k}: ${String(v).replace(/[\r\n]+/g, " ")}`,
  );
  const header = table.columns.map((c) => csvEscape(c.label)).join(",");
  const body = table.rows.map((row) => row.map(csvEscape).join(","));
  return [...comments, header, ...body].join("\r\n");
}

/** JSON with the rows as objects keyed by column, which is what a script wants. */
export function tableToJson(table: ExportTable): string {
  const meta = {
    ...table.meta,
    generatedAt: (table.meta.generatedAt ?? new Date()).toISOString(),
  };
  const rows = table.rows.map((row) =>
    Object.fromEntries(table.columns.map((c, i) => [c.key, row[i] ?? ""])),
  );
  return JSON.stringify({ meta, columns: table.columns, rows }, null, 2);
}

/** Escapes a cell for a Markdown pipe table. */
function mdCell(value: string | number): string {
  return String(value)
    .replace(/\|/g, "\\|")
    .replace(/[\r\n]+/g, " ");
}

export function tableToMarkdown(table: ExportTable): string {
  const meta = metaPairs(table.meta)
    .filter(([k]) => k !== "title")
    .map(([k, v]) => `- **${k}:** ${v}`)
    .join("\n");
  const header = `| ${table.columns.map((c) => mdCell(c.label)).join(" | ")} |`;
  const rule = `| ${table.columns.map(() => "---").join(" | ")} |`;
  const body = table.rows.map((row) => `| ${row.map(mdCell).join(" | ")} |`).join("\n");
  return `# ${table.meta.title}\n\n${meta}\n\n${header}\n${rule}\n${body}\n`;
}

export function formatTable(table: ExportTable, format: TableFormat): string {
  switch (format) {
    case "csv":
      return tableToCsv(table);
    case "json":
      return tableToJson(table);
    case "markdown":
      return tableToMarkdown(table);
  }
}

export function tableMimeType(format: TableFormat): string {
  switch (format) {
    case "csv":
      return "text/csv;charset=utf-8";
    case "json":
      return "application/json;charset=utf-8";
    case "markdown":
      return "text/markdown;charset=utf-8";
  }
}

export function tableExtension(format: TableFormat): string {
  return format === "markdown" ? "md" : format;
}

/** `<slug>-YYYY-MM-DD.<ext>`, with anything filesystem-hostile stripped. */
export function tableFilename(table: ExportTable, format: TableFormat, now = new Date()): string {
  const slug = table.slug.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "") || "export";
  return `${slug}-${now.toISOString().slice(0, 10)}.${tableExtension(format)}`;
}
