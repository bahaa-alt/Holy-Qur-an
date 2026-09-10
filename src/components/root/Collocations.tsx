import Link from "next/link";

export interface CollocationRow {
  ar: string;
  count: number;
}

export function Collocations({ rows }: { rows: CollocationRow[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">Co-occurring roots</h2>
      <p className="mt-1 text-xs text-muted">
        Roots that most often share a verse with this one -- a rough guide to its semantic field.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {rows.map((r) => (
          <Link
            key={r.ar}
            href={`/root/${encodeURIComponent(r.ar)}/`}
            className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
          >
            <span>{r.ar}</span>
            <span className="text-xs text-muted">{r.count.toLocaleString()}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
