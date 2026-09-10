"use client";

import { useT } from "@/lib/i18n/LanguageContext";
import type { Cat } from "@/lib/data/types";
import type { RowFilters } from "@/lib/root/occurrences";

export interface FilterOptions {
  categories: Cat[];
  lemmas: { key: string; lemma: string }[];
  surahs: { n: number; label: string }[];
}

export function FilterBar({
  filters,
  options,
  onChange,
  resultCount,
}: {
  filters: RowFilters;
  options: FilterOptions;
  onChange: (filters: RowFilters) => void;
  resultCount: number;
}) {
  const t = useT();
  const hasFilters = Boolean(filters.cat || filters.lemmaKey || filters.formKey || filters.surah);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.cat ?? ""}
        onChange={(e) => onChange({ ...filters, cat: (e.target.value || undefined) as Cat | undefined })}
        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
      >
        <option value="">{t.filterBar.allCategories}</option>
        {options.categories.map((c) => (
          <option key={c} value={c}>
            {t.categories[c]}
          </option>
        ))}
      </select>

      <select
        value={filters.lemmaKey ?? ""}
        onChange={(e) => onChange({ ...filters, lemmaKey: e.target.value || undefined })}
        className="arabic-ui rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
      >
        <option value="">{t.filterBar.allLemmas}</option>
        {options.lemmas.map((l) => (
          <option key={l.key} value={l.key}>
            {l.lemma}
          </option>
        ))}
      </select>

      <select
        value={filters.surah ?? ""}
        onChange={(e) => onChange({ ...filters, surah: e.target.value ? Number(e.target.value) : undefined })}
        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
      >
        <option value="">{t.filterBar.allSurahs}</option>
        {options.surahs.map((s) => (
          <option key={s.n} value={s.n}>
            {s.n}. {s.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button type="button" onClick={() => onChange({})} className="text-xs text-accent hover:text-accent-strong">
          {t.filterBar.clearFilters}
        </button>
      )}

      <span className="ms-auto text-xs text-muted">{t.filterBar.occurrencesCount(resultCount)}</span>
    </div>
  );
}
