"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import type { Cat } from "@/lib/data/types";

export function WordHeader({
  lemma,
  root,
  cat,
  count,
  formCount,
  actions,
}: {
  lemma: string;
  root: string | null;
  cat: Cat;
  count: number;
  formCount: number;
  actions?: ReactNode;
}) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{t.wordHeader.lemmaLabel}</p>
          <p className="arabic-ui mt-1 text-left text-4xl font-semibold text-ink sm:text-5xl">{lemma}</p>
        </div>
        {actions}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">{t.categories[cat]}</span>
        {root && (
          <Link
            href={`/root/${encodeURIComponent(root)}/`}
            className="arabic-ui rounded-full border border-border px-2.5 py-1 text-sm text-accent hover:border-accent"
          >
            {t.wordHeader.rootPrefix(root)}
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
        <div>
          <div className="text-xl font-semibold text-ink sm:text-2xl">{count.toLocaleString()}</div>
          <div className="text-xs text-muted">{t.wordHeader.occurrences}</div>
        </div>
        <div>
          <div className="text-xl font-semibold text-ink sm:text-2xl">{formCount.toLocaleString()}</div>
          <div className="text-xs text-muted">{t.wordHeader.surfaceForms}</div>
        </div>
      </div>
    </div>
  );
}
