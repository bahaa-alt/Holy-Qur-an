import { useT } from "@/lib/i18n/LanguageContext";
import type { ConjugationTableData } from "@/lib/root/conjugation";
import type { RowFilters } from "@/lib/root/occurrences";

export function ConjugationTable({
  tables,
  onSelectForm,
}: {
  tables: ConjugationTableData[];
  onSelectForm: (filters: RowFilters) => void;
}) {
  const t = useT();

  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">{t.conjugationTable.heading}</h2>
      <p className="mt-1 text-xs text-muted">{t.conjugationTable.subtitle}</p>

      <div className="mt-4 space-y-6">
        {tables.map((table) => (
          <div key={table.verbForm}>
            <h3 className="arabic-ui text-left text-sm font-semibold text-accent">
              {t.conjugationTable.form(table.verbForm)}
              <span className="ms-2 text-xs font-normal text-muted">
                {t.conjugationTable.occurrencesCount(table.total)}
              </span>
            </h3>
            <div className="mt-2 space-y-3">
              {table.rows.map((row) => (
                <div key={row.aspect}>
                  <div className="text-xs font-medium text-muted">{t.categories[row.aspect]}</div>
                  <div className="mt-1 flex flex-wrap gap-x-6 gap-y-2">
                    {row.cells.map((cell) => (
                      <div key={cell.pgn ?? "none"} className="min-w-0">
                        <div className="text-xs text-muted">{cell.pgnLabel}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {cell.forms.map((f) => (
                            <button
                              key={`${f.formKey}|${f.mood ?? ""}`}
                              type="button"
                              onClick={() => onSelectForm({ lemmaKey: f.lemmaKey, formKey: f.formKey })}
                              className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
                            >
                              <span>{f.form}</span>
                              <span className="text-xs text-muted">{f.count.toLocaleString()}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
