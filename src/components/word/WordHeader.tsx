import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/data/types";
import type { Cat } from "@/lib/data/types";

export function WordHeader({
  lemma,
  root,
  cat,
  count,
  formCount,
}: {
  lemma: string;
  root: string | null;
  cat: Cat;
  count: number;
  formCount: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">Lemma</p>
      <p className="arabic-ui mt-1 text-left text-4xl font-semibold text-ink sm:text-5xl">{lemma}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">
          {CATEGORY_LABELS[cat]}
        </span>
        {root && (
          <Link
            href={`/root/${encodeURIComponent(root)}/`}
            className="arabic-ui rounded-full border border-border px-2.5 py-1 text-sm text-accent hover:border-accent"
          >
            root: {root}
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
        <div>
          <div className="text-xl font-semibold text-ink sm:text-2xl">{count.toLocaleString()}</div>
          <div className="text-xs text-muted">Occurrences</div>
        </div>
        <div>
          <div className="text-xl font-semibold text-ink sm:text-2xl">{formCount.toLocaleString()}</div>
          <div className="text-xs text-muted">Surface forms</div>
        </div>
      </div>
    </div>
  );
}
