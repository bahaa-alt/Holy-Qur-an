import { CATEGORY_LABELS } from "@/lib/data/types";
import type { OccurrenceRow } from "@/lib/data/types";

const CSV_COLUMNS = [
  "surah",
  "ayah",
  "surah_name_en",
  "surah_name_ar",
  "word_index",
  "form",
  "lemma",
  "root",
  "category",
  "tags",
  "verse_uthmani",
  "translation",
] as const;

/** Escapes a single CSV field per RFC 4180 (quote if it contains a comma, quote, or newline). */
export function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowToCsvValues(row: OccurrenceRow): (string | number)[] {
  return [
    row.surah,
    row.ayah,
    row.surahNameEn,
    row.surahNameAr,
    row.wordIndex,
    row.form,
    row.lemma,
    row.root ?? "",
    CATEGORY_LABELS[row.category],
    row.tags,
    row.verseUthmani,
    row.translation,
  ];
}

export function toCSV(rows: readonly OccurrenceRow[]): string {
  const lines = [CSV_COLUMNS.join(",")];
  for (const row of rows) {
    lines.push(rowToCsvValues(row).map(csvEscape).join(","));
  }
  // CRLF is the RFC 4180 convention and keeps Excel happy.
  return lines.join("\r\n");
}

export function toJSON(rows: readonly OccurrenceRow[]): string {
  return JSON.stringify(rows, null, 2);
}

export function toMarkdown(rows: readonly OccurrenceRow[]): string {
  const sections = rows.map((row) => {
    const ref = `${row.surah}:${row.ayah}`;
    const heading = `### ${ref} — ${row.surahNameAr} (${row.surahNameEn})`;
    const verseQuote = row.verseUthmani
      .split("\n")
      .map((l) => `> ${l}`)
      .join("\n");
    const translationQuote = `> ${row.translation}`;
    const meta = `*${row.form}* — ${row.lemma}${row.root ? ` (root ${row.root})` : ""}, ${CATEGORY_LABELS[row.category]}`;
    return `${heading}\n\n${verseQuote}\n>\n${translationQuote}\n\n${meta}`;
  });
  return sections.join("\n\n---\n\n");
}

export function toPlainText(rows: readonly OccurrenceRow[]): string {
  return rows
    .map((row) => {
      const ref = `${row.surah}:${row.ayah}`;
      return `${ref}\n${row.verseUthmani}\n${row.translation}`;
    })
    .join("\n\n");
}

export type ExportFormat = "csv" | "json" | "markdown" | "txt";

export function formatRows(rows: readonly OccurrenceRow[], format: ExportFormat): string {
  switch (format) {
    case "csv":
      return toCSV(rows);
    case "json":
      return toJSON(rows);
    case "markdown":
      return toMarkdown(rows);
    case "txt":
      return toPlainText(rows);
  }
}

export function mimeTypeFor(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return "text/csv;charset=utf-8";
    case "json":
      return "application/json;charset=utf-8";
    case "markdown":
      return "text/markdown;charset=utf-8";
    case "txt":
      return "text/plain;charset=utf-8";
  }
}

export function fileExtensionFor(format: ExportFormat): string {
  switch (format) {
    case "csv":
      return "csv";
    case "json":
      return "json";
    case "markdown":
      return "md";
    case "txt":
      return "txt";
  }
}
