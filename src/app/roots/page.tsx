import { readIndex } from "@/lib/data/serverData";
import { RootsBrowser } from "@/components/root/RootsBrowser";

export const metadata = { title: "Browse all roots" };

export default function RootsPage() {
  const index = readIndex();
  const roots = index.roots.map((r) => ({ ar: r.ar, key: r.key, count: r.count }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-ink">Browse all roots</h1>
      <p className="mt-1 text-sm text-muted">
        {roots.length.toLocaleString()} Qur&apos;anic roots, grouped alphabetically.
      </p>
      <div className="mt-6">
        <RootsBrowser roots={roots} />
      </div>
    </div>
  );
}
