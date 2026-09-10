"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { fileExtensionFor, formatRows, mimeTypeFor, type ExportFormat } from "@/lib/export/formatters";
import { useT } from "@/lib/i18n/LanguageContext";
import type { OccurrenceRow } from "@/lib/data/types";

const FORMAT_ICONS: { format: ExportFormat; icon: typeof FileJson }[] = [
  { format: "csv", icon: FileSpreadsheet },
  { format: "json", icon: FileJson },
  { format: "markdown", icon: FileText },
  { format: "txt", icon: FileText },
];

export function ExportMenu({
  filenameBase,
  resolveRows,
}: {
  filenameBase: string;
  resolveRows: () => Promise<OccurrenceRow[]>;
}) {
  const t = useT();
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const formatLabels: Record<ExportFormat, string> = {
    csv: t.exportMenu.csv,
    json: t.exportMenu.json,
    markdown: t.exportMenu.markdown,
    txt: t.exportMenu.text,
  };

  async function handleExport(format: ExportFormat) {
    setLoading(format);
    try {
      const rows = await resolveRows();
      const content = formatRows(rows, format);
      const blob = new Blob([content], { type: mimeTypeFor(format) });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `${filenameBase}-${date}.${fileExtensionFor(format)}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <Download size={13} /> {t.exportMenu.exportLabel}
      </span>
      {FORMAT_ICONS.map(({ format, icon: Icon }) => (
        <button
          key={format}
          type="button"
          disabled={loading !== null}
          onClick={() => handleExport(format)}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {loading === format ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
          {formatLabels[format]}
        </button>
      ))}
    </div>
  );
}
