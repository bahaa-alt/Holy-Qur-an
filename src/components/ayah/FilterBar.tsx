import { CATEGORY_LABELS } from "@/lib/data/types";
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
  const hasFilters = Boolean(filters.cat || filters.lemmaKey || filters.formKey || filters.surah);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filters.cat ?? ""}
        onChange={(e) => onChange({ ...filters, cat: (e.target.value || undefined) as Cat | undefined })}
        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
      >
        <option value="">All categories</option>
        {options.categories.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>

      <select
        value={filters.lemmaKey ?? ""}
        onChange={(e) => onChange({ ...filters, lemmaKey: e.target.value || undefined })}
        className="arabic-ui rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
      >
        <option value="">All lemmas</option>
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
        <option value="">All surahs</option>
        {options.surahs.map((s) => (
          <option key={s.n} value={s.n}>
            {s.n}. {s.label}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button type="button" onClick={() => onChange({})} className="text-xs text-accent hover:text-accent-strong">
          Clear filters
        </button>
      )}

      <span className="ms-auto text-xs text-muted">{resultCount.toLocaleString()} occurrences</span>
    </div>
  );
}
