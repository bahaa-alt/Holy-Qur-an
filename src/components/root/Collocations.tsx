import Link from "next/link";
import { SaveButton } from "@/components/notes/SaveButton";

export interface CollocationRow {
  ar: string;
  count: number;
}

export function Collocations({ rows }: { rows: CollocationRow[] }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="text-sm font-medium text-ink">Co-occurring roots</h2>
      <p className="mt-1 text-xs text-muted">
        Roots most distinctively associated with this one -- ranked by how much more often they share a verse
        with it than their individual frequencies would predict, not just raw frequency.
      </p>
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
