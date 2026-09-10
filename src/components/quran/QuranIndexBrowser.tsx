"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { normalize } from "@/lib/arabic/normalize";
import { useT } from "@/lib/i18n/LanguageContext";
import type { SurahMeta } from "@/lib/data/types";

export function QuranIndexBrowser({ surahs }: { surahs: SurahMeta[] }) {
  const t = useT();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (q === "") return surahs;
    const qAr = normalize(q);
    const qLower = q.toLowerCase();
    return surahs.filter(
      (s) =>
        normalize(s.nameAr).includes(qAr) ||
        s.nameEn.toLowerCase().includes(qLower) ||
        s.translit.toLowerCase().includes(qLower) ||
        String(s.n) === q,
    );
  }, [query, surahs]);

  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5">
        <Search size={16} className="text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.quran.filterPlaceholder}
          className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-muted">{t.quran.noMatch(query)}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((s) => (
            <Link
              key={s.n}
              href={`/surah/${s.n}/`}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-xs font-medium text-muted">
                {s.n}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">
                  {s.translit} — {s.nameEn}
                </span>
                <span className="block text-xs text-muted">
                  {s.type === "meccan" ? t.quran.meccan : t.quran.medinan} · {t.quran.versesCount(s.ayahs)}
                </span>
              </span>
              <span className="arabic-ui shrink-0 text-lg text-ink">{s.nameAr}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
