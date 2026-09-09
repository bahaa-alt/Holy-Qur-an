import { readIndex } from "@/lib/data/serverData";
import { CompareView } from "@/components/compare/CompareView";

export const metadata = { title: "Compare roots" };

export default function ComparePage() {
  const index = readIndex();
  const roots = index.roots.map((r) => ({ ar: r.ar, key: r.key, count: r.count, glossShort: r.glossShort }));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Compare roots</h1>
        <p className="mt-1 text-sm text-muted">
          Pick up to three roots to compare their occurrence counts and category breakdowns side by side.
        </p>
      </div>
      <CompareView roots={roots} />
    </div>
  );
}
