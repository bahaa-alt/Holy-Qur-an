"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/LanguageContext";
import { SearchBox } from "@/components/search/SearchBox";
import { RandomRootLink } from "@/components/root/RandomRootLink";
import { DailyWidget } from "@/components/home/DailyWidget";

interface TopRoot {
  ar: string;
  count: number;
}

export function HomeContent({
  topRoots,
  allRootNames,
  totalRootCount,
}: {
  topRoots: TopRoot[];
  allRootNames: string[];
  totalRootCount: number;
}) {
  const t = useT();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:py-20">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-ink sm:text-4xl">{t.home.title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">{t.home.subtitle}</p>
      </div>

      <div className="mt-8">
        <SearchBox autoFocus />
      </div>

      <DailyWidget />

      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted">{t.home.mostFrequentRoots}</h2>
          <RandomRootLink roots={allRootNames} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {topRoots.map((r) => (
            <Link
              key={r.ar}
              href={`/root/${encodeURIComponent(r.ar)}/`}
              className="arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent"
            >
              <span>{r.ar}</span>
              <span className="text-xs text-muted">{r.count.toLocaleString()}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <Link href="/roots/" className="text-sm text-accent hover:text-accent-strong">
          {t.home.browseAllRoots(totalRootCount)}
        </Link>
      </div>
    </div>
  );
}
