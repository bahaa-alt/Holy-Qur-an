import Link from "next/link";
import { SearchBox } from "@/components/search/SearchBox";
import { RandomRootLink } from "@/components/root/RandomRootLink";
import { readIndex } from "@/lib/data/serverData";

export default function Home() {
  const index = readIndex();
  const topRoots = [...index.roots].sort((a, b) => b.count - a.count).slice(0, 30);
  const allRootNames = index.roots.map((r) => r.ar);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-ink sm:text-4xl">Qur&apos;anic Root &amp; Word Research</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Search by Arabic root, exact word, or English translation. Explore every derived form and every
          occurrence, free and offline, with no accounts and no servers.
        </p>
      </div>

      <div className="mt-8">
        <SearchBox autoFocus />
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">Most frequent roots</h2>
          <RandomRootLink roots={allRootNames} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {topRoots.map((r) => (
            <Link
              key={r.ar}
              href={`/root/${encodeURIComponent(r.ar)}/`}
              className="arabic-ui rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
            >
              {r.ar}
              <span className="ms-1.5 text-xs text-muted">{r.count.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/roots/" className="text-sm text-accent hover:text-accent-strong">
          Browse all {index.roots.length.toLocaleString()} roots →
        </Link>
      </div>
    </div>
  );
}
