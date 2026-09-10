"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import { SaveButton } from "@/components/notes/SaveButton";
import { CopyTextButton } from "@/components/export/CopyTextButton";

export interface CollocationRow {
  ar: string;
  count: number;
}

function buildMarkdown(rows: readonly CollocationRow[]): string {
  return rows.map((r) => `- [${r.ar}](/root/${encodeURIComponent(r.ar)}/) (${r.count})`).join("\n");
}

export function Collocations({ rows }: { rows: CollocationRow[] }) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-ink">{t.collocations.heading}</h2>
        <CopyTextButton text={buildMarkdown(rows)} />
      </div>
      <p className="mt-1 text-xs text-muted">{t.collocations.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {rows.map((r) => (
          <div
            key={r.ar}
            className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-ink"
          >
            <Link
              href={`/root/${encodeURIComponent(r.ar)}/`}
              className="arabic-ui inline-flex items-center gap-1.5 hover:text-accent"
            >
              <span>{r.ar}</span>
              <span className="text-xs text-muted">{r.count.toLocaleString()}</span>
            </Link>
            <SaveButton id={`root:${r.ar}`} kind="root" label={r.ar} href={`/root/${encodeURIComponent(r.ar)}/`} compact />
          </div>
        ))}
      </div>
    </div>
  );
}
