import { describeSetSource, type Study } from "./types";
import type { EvaluatedSet } from "./evaluate";
import type { ExportTable } from "@/lib/export/table";

/**
 * A study's sets as one exportable table -- fed to the same ExportButton
 * every other page uses, so a study's summary gets the same citation,
 * dataset hash and CSV/JSON/Markdown formats as a keyness table or a QCQL
 * result, for free.
 */
export function buildStudySetsTable(
  study: Study,
  evaluated: ReadonlyMap<string, EvaluatedSet>,
): ExportTable {
  const rows = study.sets.map((set) => {
    const result = evaluated.get(set.id);
    return [
      set.label,
      describeSetSource(set, study.sets),
      result?.error ? `error: ${result.error}` : (result?.keys.size ?? 0),
      result?.error ? "" : (result?.verseCount ?? 0),
      set.note,
    ];
  });

  return {
    slug: `study-${study.title}`,
    meta: {
      title: `Study: ${study.title}`,
      provenance: study.notes ? [{ label: "notes", value: study.notes }] : undefined,
    },
    columns: [
      { key: "set", label: "set" },
      { key: "definition", label: "definition" },
      { key: "matches", label: "matches" },
      { key: "verses", label: "verses" },
      { key: "note", label: "note" },
    ],
    rows,
  };
}
