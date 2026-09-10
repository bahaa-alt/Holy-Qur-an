"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage, useT } from "@/lib/i18n/LanguageContext";

export function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  const t = useT();
  const { lang } = useLanguage();
  // "Previous" points toward reading-start, "Next" toward reading-end --
  // that's visually left→right in LTR but right→left in RTL, so the chevron
  // directions swap along with the language rather than staying fixed.
  const PrevIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  const NextIcon = lang === "ar" ? ChevronLeft : ChevronRight;

  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-4 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted"
      >
        <PrevIcon size={14} /> {t.pagination.prev}
      </button>
      <span className="text-muted">{t.pagination.pageOf(page, pageCount)}</span>
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-muted"
      >
        {t.pagination.next} <NextIcon size={14} />
      </button>
    </div>
  );
}
