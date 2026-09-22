"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { getManifest } from "@/lib/data/loader";
import { buildCitation, type CitationSubject } from "@/lib/citation/buildCitation";
import { CiteMenu } from "@/components/citation/CiteMenu";
import {
  formatTable,
  tableFilename,
  tableMimeType,
  type ExportTable,
  type TableFormat,
} from "@/lib/export/table";
import { absoluteUrl } from "@/lib/site";
import { useT } from "@/lib/i18n/LanguageContext";

const FORMATS: { format: TableFormat; icon: typeof FileJson }[] = [
  { format: "csv", icon: FileSpreadsheet },
  { format: "json", icon: FileJson },
  { format: "markdown", icon: FileText },
];

/**
 * Export any table, with the metadata that makes it citable.
 *
 * The caller supplies the rows and what produced them; this fills in the
 * dataset version and hash from manifest.json and the citation from
 * lib/citation, so no page has to remember to. The manifest is fetched on
 * the first export rather than on mount: a reader who never exports
 * should not pay for it, and it is 3 KB and already cached for most.
 *
 * `path` is the app-relative path that reproduces the view, including its
 * query string (e.g. `/query/?q=...`). It is resolved against the site's
 * canonical origin rather than read from `window.location`, for the
 * reason CiteMenu gives: a preview, a mirror and `next dev` are all the
 * wrong address to put in a footnote.
 */
export function ExportButton({
  resolve,
  subject,
  path,
}: {
  /** built lazily, so a page with expensive rows only pays on click */
  resolve: () => ExportTable | Promise<ExportTable>;
  subject: CitationSubject;
  path: string;
}) {
  const t = useT();
  const [busy, setBusy] = useState<TableFormat | null>(null);

  async function build(): Promise<{ table: ExportTable; citation: string }> {
    const [table, manifest] = await Promise.all([resolve(), getManifest()]);
    const url = absoluteUrl(path);
    const citation = buildCitation(subject, manifest, url);
    return {
      table: {
        ...table,
        meta: {
          ...table.meta,
          url,
          citation,
          datasetVersion: manifest.version,
          datasetHash: manifest.hash,
          generatedAt: new Date(),
        },
      },
      citation,
    };
  }

  async function download(format: TableFormat) {
    setBusy(format);
    try {
      const { table } = await build();
      const blob = new Blob([formatTable(table, format)], { type: tableMimeType(format) });
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = tableFilename(table, format);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
    } finally {
      setBusy(null);
    }
  }

  const labels: Record<TableFormat, string> = {
    csv: t.exportMenu.csv,
    json: t.exportMenu.json,
    markdown: t.exportMenu.markdown,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <Download size={13} /> {t.exportMenu.exportLabel}
      </span>
      {FORMATS.map(({ format, icon: Icon }) => (
        <button
          key={format}
          type="button"
          onClick={() => void download(format)}
          disabled={busy !== null}
          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {busy === format ? <Loader2 size={12} className="animate-spin" /> : <Icon size={12} />}
          {labels[format]}
        </button>
      ))}
      <CiteMenu subject={subject} path={path} />
    </div>
  );
}
