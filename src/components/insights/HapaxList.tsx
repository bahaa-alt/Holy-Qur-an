"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getIndex } from "@/lib/data/loader";
import { getHapaxLemmas, getHapaxRoots } from "@/lib/insights/hapax";
import { normalize } from "@/lib/arabic/normalize";
import { rootHref, wordHref } from "@/lib/search/suggest";
import { useT } from "@/lib/i18n/LanguageContext";
import type { IndexFile } from "@/lib/data/types";

const CHIP_CLASS =
  "arabic-ui inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-ink transition-colors hover:border-accent hover:text-accent";

/**
 * The full list behind InsightsFile.hapaxRootCount/hapaxLemmaCount --
 * every root, or every exact word, occurring exactly once anywhere in
 * the Qur'an, each linking to its own page. Computed entirely
 * client-side from the already-fetched index.json (see hapax.ts), same
 * "no new data file" approach as this app's other reuse-what's-already-
 * loaded features.
 */
export function HapaxList({ kind }: { kind: "root" | "lemma" }) {
  const t = useT();
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    getIndex().then((i) => {
      if (!cancelled) setIndex(i);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hapaxRoots = useMemo(() => (index ? getHapaxRoots(index) : []), [index]);
  const hapaxLemmas = useMemo(() => (index ? getHapaxLemmas(index) : []), [index]);

  const q = normalize(query.trim());
  const filteredRoots = q === "" ? hapaxRoots : hapaxRoots.filter((r) => r.key.includes(q));
  const filteredLemmas = q === "" ? hapaxLemmas : hapaxLemmas.filter((l) => l.key.includes(q));
  const isEmpty = kind === "root" ? filteredRoots.length === 0 : filteredLemmas.length === 0;

  if (!index) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Loader2 size={14} className="animate-spin" /> {t.common.loading}
      </p>
    );
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t.insightsPage.hapaxFilterPlaceholder}
        className="w-full max-w-xs rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none"
      />

      {isEmpty ? (
        <p className="mt-3 text-sm text-muted">{t.insightsPage.hapaxNoMatch(query)}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {kind === "root"
            ? filteredRoots.map((r) => (
                <Link key={r.ar} href={rootHref(r.ar)} className={CHIP_CLASS}>
                  {r.ar}
                </Link>
              ))
            : filteredLemmas.map((l) => (
                <Link key={l.wordIdx} href={wordHref(l.wordIdx)} className={CHIP_CLASS}>
                  {l.lemma}
                </Link>
              ))}
        </div>
      )}
    </div>
  );
}
