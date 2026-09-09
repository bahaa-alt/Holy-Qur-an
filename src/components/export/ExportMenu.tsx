"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { fileExtensionFor, formatRows, mimeTypeFor, type ExportFormat } from "@/lib/export/formatters";
import type { OccurrenceRow } from "@/lib/data/types";

const FORMATS: { format: ExportFormat; label: string; icon: typeof FileJson }[] = [
  { format: "csv", label: "CSV", icon: FileSpreadsheet },
  { format: "json", label: "JSON", icon: FileJson },
  { format: "markdown", label: "Markdown", icon: FileText },
  { format: "txt", label: "Text", icon: FileText },
];

export function ExportMenu({
  filenameBase,
  resolveRows,
}: {
  filenameBase: string;
  resolveRows: () => Promise<OccurrenceRow[]>;
}) {
  const [loading, setLoading] = useState<ExportFormat | null>(null);

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
        <Download size={13} /> Export:
      </span>
      {FORMATS.map(({ format, label, icon: Icon }) => (
        <button
          key={format}
          type="button"
          disabled={loading !== null}
          onClick={() => handleExport(format)}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {loading === format ? <Loader2 size={13} className="animate-spin" /> : <Icon size={13} />}
          {label}
        </button>
      ))}
    </div>
  );
}
